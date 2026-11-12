"""Edit someone else's .docx with every change in red, touching only the bytes changed.

Import from a per-revision script:

    import sys; sys.path.insert(0, '<this folder>')
    from redline import Doc
    d = Doc(src)
    d.replace(d.one('unique sentence'), 'old words', 'new words')
    d.insert_after(anchor, d.clone(template, [('new text', 0)]))
    d.delete(d.one('a sentence to strike'))
    d.save(out)

Lookups (one, all_) search the paragraphs present when the file was opened, so a
paragraph this run inserts is never matched by a later lookup.
"""
import copy
import zipfile

from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'
RED = 'FF0000'
RPR_ORDER = ['rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline', 'shadow',
             'emboss', 'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern',
             'position', 'sz', 'szCs', 'highlight', 'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs',
             'em', 'lang', 'eastAsianLayout', 'specVanish', 'oMath']


def q(tag):
    return '{%s}%s' % (W, tag)


def ptext(p):
    return ''.join(t.text or '' for t in p.iter(q('t')))


def runs(p):
    return [r for r in p.iter(q('r')) if r.find(q('t')) is not None]


def red(r, strike=False):
    rpr = r.find(q('rPr'))
    if rpr is None:
        rpr = etree.Element(q('rPr'))
        r.insert(0, rpr)
    for c in rpr.findall(q('color')):
        rpr.remove(c)
    etree.SubElement(rpr, q('color')).set(q('val'), RED)
    if strike and rpr.find(q('strike')) is None:
        etree.SubElement(rpr, q('strike'))
    kids = sorted(rpr, key=lambda c: RPR_ORDER.index(etree.QName(c).localname) if etree.QName(c).localname in RPR_ORDER else 99)
    for c in list(rpr):
        rpr.remove(c)
    for c in kids:
        rpr.append(c)
    return r


def settext(r, text):
    ts = r.findall(q('t'))
    assert len(ts) == 1, 'run with several texts'
    ts[0].text = text
    ts[0].set(XML_SPACE, 'preserve')
    return r


class Doc:
    def __init__(self, path, part='word/document.xml'):
        self.zip = zipfile.ZipFile(path)
        self.part = part
        self.root = etree.fromstring(self.zip.read(part))
        self.paras = list(self.root.iter(q('p')))
        self.log = []

    def red_runs(self):
        """Runs already coloured red: the owner's own notes. Ask before marking yours the same colour."""
        return [ptext_run(r) for r in self.root.iter(q('r')) if _is_red(r)]

    def one(self, sub):
        hits = [p for p in self.paras if sub in ptext(p)]
        assert len(hits) == 1, f'{len(hits)} hits for: {sub[:70]}'
        return hits[0]

    def all_(self, sub, n):
        hits = [p for p in self.paras if sub in ptext(p)]
        assert len(hits) == n, f'{len(hits)} hits (want {n}) for: {sub[:70]}'
        return hits

    def replace(self, p, old, new):
        rs = runs(p)
        for r in rs:
            assert len(r.findall(q('t'))) == 1, 'run with several texts'
        texts = [r.find(q('t')).text or '' for r in rs]
        full = ''.join(texts)
        i = full.find(old)
        assert i >= 0 and full.count(old) == 1, f'replace target not unique: {old[:60]}'
        j = i + len(old)
        pos, hit = 0, []
        for r, t in zip(rs, texts):
            a, b = pos, pos + len(t)
            pos = b
            if a < j and b > i:
                hit.append((r, t, a))
        r0, t0, a0 = hit[0]
        rn, tn, an = hit[-1]
        pre, post = t0[:i - a0], tn[j - an:]
        pieces = []
        if pre:
            pieces.append(settext(copy.deepcopy(r0), pre))
        pieces.append(red(settext(copy.deepcopy(r0), new)))
        if post:
            pieces.append(settext(copy.deepcopy(rn), post))
        for piece in pieces:
            r0.addprevious(piece)
        for r, _, _ in hit:
            r.getparent().remove(r)
        self.log.append(f'replace: {old[:50]!r}')

    def delete(self, p):
        self.log.append(f'delete: {ptext(p)[:60]!r}')
        for r in runs(p):
            red(r, strike=True)

    def clone(self, template, parts):
        """A new paragraph with template's paragraph and list formatting; parts are (text, index of the template run whose look it takes)."""
        src_runs = runs(template)
        new = copy.deepcopy(template)
        for child in list(new):
            if child.tag != q('pPr'):
                new.remove(child)
        for text, ri in parts:
            r = copy.deepcopy(src_runs[ri])
            for child in list(r):
                if child.tag != q('rPr'):
                    r.remove(child)
            t = etree.SubElement(r, q('t'))
            t.text = text
            t.set(XML_SPACE, 'preserve')
            new.append(red(r))
        return new

    def insert_after(self, anchor, *newps):
        for np_ in reversed(newps):
            anchor.addnext(np_)
        for np_ in newps:
            self.log.append(f'insert: {ptext(np_)[:60]!r}')

    def save(self, out):
        with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
            for item in self.zip.infolist():
                data = self.zip.read(item.filename)
                if item.filename == self.part:
                    data = etree.tostring(self.root, xml_declaration=True, encoding='UTF-8', standalone=True)
                z.writestr(item, data)
        return self.log


def _is_red(r):
    c = r.find(q('rPr') + '/' + q('color'))
    return c is not None and c.get(q('val'), '').upper() == RED


def ptext_run(r):
    return ''.join(t.text or '' for t in r.iter(q('t')))
