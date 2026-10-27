import argparse
import glob
import html
import json
import os
import re

ap = argparse.ArgumentParser(description='Render an offline question-and-answer understanding guide.')
ap.add_argument('work', help='work folder holding guide.json, rows.json, qa-<n>.json and verified-*.json')
ap.add_argument('--out', help='output HTML path (default: <work>/../guide.html)')
ap.add_argument('--only', help='comma-separated topic numbers, for rendering a sample')
args = ap.parse_args()

B = os.path.abspath(args.work)
OUT = args.out or os.path.join(os.path.dirname(B), 'guide-sample.html' if args.only else 'guide.html')
ONLY = [int(x) for x in args.only.split(',')] if args.only else None

def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


cfg = load(os.path.join(B, 'guide.json'))
rows = load(os.path.join(B, 'rows.json')) if os.path.exists(os.path.join(B, 'rows.json')) else []
for r in rows:
    r['report'] = int(r['report'])
byid = {r['id']: r for r in rows}
verified = {}
for vf in sorted(glob.glob(os.path.join(glob.escape(B), 'verified-*.json')), key=lambda p: (p.endswith('verified-overrides.json'), p)):
    for cid, rec in load(vf).items():
        verified.setdefault(cid, {}).update(rec)
topics = []
qa_files = [p for p in glob.glob(os.path.join(glob.escape(B), 'qa-*.json')) if re.fullmatch(r'qa-\d+\.json', os.path.basename(p))]
for p in sorted(qa_files, key=lambda p: int(re.search(r'\d+', os.path.basename(p)).group(0))):
    t = load(p)
    if ONLY is None or t['n'] in ONLY:
        topics.append(t)

SOURCES = {int(s['n']): s for s in cfg['sources']}
REPORTS = {n: (s['name'], os.path.join(B, s['file'])) for n, s in SOURCES.items()}
AGENT = {str(n): s.get('short', s['name']) for n, s in SOURCES.items()}
SHORT = {int(k): v for k, v in cfg.get('topic_short', {}).items()}
L = {'goal': 'What the business wants', 'why': 'Why it matters to us', 'also': 'Also in the sources',
     'feeds': 'Later, this helps you decide:', 'proof': 'Show proof, and what each source says',
     'positions': 'What each source says', 'code': 'Checked in our code or live pages', 'report': "A source's view, not a rule"}
L.update(cfg.get('labels', {}))
L.setdefault('agree', 'Sources agree')
L.setdefault('split', 'Sources disagree')
STATE = {
    'agree': (L['agree'], 'agree'),
    'split': (L['split'], 'split'),
    'unsettled': ('Not known yet', 'unsettled'),
}
CHECKED = [
    ({'not_confirmed'}, 'Could not be confirmed', 'Part could not be confirmed', 'unsettled'),
    ({'report', 'differs'}, "A source's view", "Partly a source's view", 'split'),
    ({'confirmed', 'code'}, 'Checked against the rule or our system', 'Checked against the rule or our system', 'agree'),
]
KNOWN = set().union(*(k for k, *_ in CHECKED))
UPCOMING = {d.split()[0]: d for d in cfg.get('upcoming', []) if d.strip()}
AGENT_RE = re.compile(r"(^|[.!?]\s+)?\bAgent ([0-9]+)(['’]s)?\b")
VSTATE = {
    'confirmed': ('Checked against the source', 'ok'),
    'differs': ('Source words it differently', 'warn'),
    'not_confirmed': ('Could not confirm', 'bad'),
    'code': (L['code'], 'ok'),
    'report': (L['report'], 'info'),
}

e = lambda s: html.escape(str(s or ''))


def named(s):
    def swap(m):
        lead = m.group(1)
        article = 'The' if lead is not None else 'the'
        return f"{lead or ''}{article} {AGENT.get(m.group(2), 'source ' + m.group(2))} report{m.group(3) or ''}"
    return AGENT_RE.sub(swap, str(s or ''))


t_ = lambda s: e(named(s))
URLRE = re.compile(r'https?://[^\s)"<>`,;]+')


def linkify(s):
    out, last = [], 0
    for m in URLRE.finditer(s):
        u = m.group(0).rstrip('.:')
        out.append(e(s[last:m.start()]))
        out.append(f'<a href="{e(u)}" target="_blank" rel="noopener">{e(u)}</a>')
        last = m.start() + len(u)
    out.append(e(s[last:]))
    return ''.join(out)


def uq(s):
    s = str(s or '').strip()
    while len(s) > 1 and s[0] in '"“' and s[-1] in '"”':
        s = s[1:-1].strip()
    return s


def firstline(v):
    m = re.search(r'\d+', str(v or ''))
    return int(m.group(0)) if m else None


def topic_name(t):
    return SHORT.get(t['n'], t['title'])


def src_ref(rid):
    r = byid.get(rid)
    if not r:
        return ''
    n, ln = r['report'], firstline(r.get('line'))
    agent = e(AGENT.get(str(n), f'Source {n}'))
    if not ln:
        return agent
    return f'<a href="#ref" class="lineref" data-r="{n}" data-l="{ln}">{agent}, line {ln}</a>'


def proof(t, q):
    claims = {c['id']: c for c in t.get('claims', [])}
    items = []
    for cid in q.get('claims', []):
        c = claims.get(cid)
        if not c:
            raise KeyError(f'topic {t["n"]}: question claim {cid} is not in the topic claims list')
        v = verified.get(cid, {})
        label, tone = VSTATE.get(v.get('status'), ('Not checked yet', 'bad'))
        quote = v.get('quote') or c.get('quote')
        url = v.get('url') or c.get('url')
        note = v.get('note')
        refs = ' · '.join(x for x in (src_ref(r) for r in c.get('rows', [])) if x)
        link = ''
        if url:
            link = f'<a href="{e(url)}" target="_blank" rel="noopener">Open the source</a>' if url.startswith('http') else f'<code>{e(url)}</code>'
        items.append(f'''<li><p class="says">{t_(c["says"])}</p>
<span class="mark {tone}">{e(label)}</span>
{f'<blockquote>{e(uq(quote))}</blockquote>' if quote else ''}
{f'<p class="note">{t_(note)}</p>' if note else ''}
<p class="src">{link}{" · " if link and refs else ""}{refs}</p></li>''')
    return '<ul class="proof">' + ''.join(items) + '</ul>'


def diagram(d):
    if not d:
        return ''
    steps = '<li class="arr" aria-hidden="true">\u2193</li>'.join(f'<li class="box">{t_(s)}</li>' for s in d['steps'])
    return f'<figure class="flow"><ol>{steps}</ol><figcaption>{t_(d.get("caption"))}</figcaption></figure>'


def checked_chip(q):
    statuses = {verified.get(c, {}).get('status') for c in q.get('claims', [])}
    if not statuses:
        return ''
    if statuses - KNOWN:
        statuses = (statuses & KNOWN) | {'not_confirmed'}
    for kinds, whole, part, cls in CHECKED:
        if statuses & kinds:
            return f'<span class="state {cls} chk">{e(whole if statuses <= kinds else part)}</span>'
    return ''


def recall_box(prev, heading):
    if not (prev and prev.get('recall')):
        return ''
    return f'''<div class="recall"><p class="k">{e(heading)} {e(topic_name(prev))}</p>
<p class="rq">{t_(prev["recall"]["q"])}</p>
<p class="hint">Answer it in your head first. Nothing is scored.</p>
<details><summary>Show the answer</summary><p>{t_(prev["recall"]["a"])}</p></details></div>'''


def topic_view(t, i, total, prev):
    qs = []
    for j, q in enumerate(t['questions'], 1):
        slabel, scls = STATE.get(q.get('state'), ('', ''))
        reps = ''.join(f'<li><b>{e(AGENT.get(str(k), k))}:</b> {t_(v)}</li>' for k, v in q.get('reports', {}).items())
        qs.append(f'''<section class="q" id="t{t["n"]}-q{j}">
<h3><span class="qn" title="Topic {i}, question {j}">{i}.{j}</span> {t_(q["q"])}</h3>
<p class="chips"><span class="state {scls}">{e(slabel)}</span>{checked_chip(q)}</p>
<p class="ans">{t_(q["answer"])}</p>
<details class="more"><summary>{e(L['proof'])}</summary>
<p class="k">{e(L['positions'])}</p><ul class="reps">{reps}</ul>
{proof(t, q)}
</details></section>''')
    recall = recall_box(prev, 'Before we start, from')
    also = ''.join(f'<li>{t_(a)}</li>' for a in t.get('also', []))
    why = re.sub(r'^why it matters to us:\s*', '', t.get('why', ''), flags=re.I)
    goal = t.get('goal') or t.get('business_wants', '')
    feeds = ''.join(f'<li>{e(UPCOMING.get(f, f))}</li>' for f in t.get('feeds', []))
    return f'''<article class="view topic" id="t{t["n"]}" data-n="{t["n"]}" hidden>
<header class="th"><p class="step">Topic {i} of {total}</p><button class="listen" type="button">Listen</button><h2>{e(topic_name(t))}</h2></header>
{recall}
{f'<p class="wants"><span class="k">{e(L["goal"])}</span> {t_(goal)}</p>' if goal else ''}
{diagram(t.get("diagram"))}
{''.join(qs)}
{f'<p class="why"><span class="k">{e(L["why"])}</span> {t_(why)}</p>' if why else ''}
{f'<div class="also"><p class="k">{e(L["also"])}</p><ul>{also}</ul></div>' if also else ''}
{f'<div class="feeds"><p class="k">{e(L["feeds"])}</p><ul>{feeds}</ul></div>' if feeds else ''}
</article>'''


def start_view():
    items = ''.join(f'<li><a href="#t{t["n"]}" class="tl" data-n="{t["n"]}"><span class="tnum">{i}</span><span class="ttl">{e(topic_name(t))}</span><span class="tst" data-n="{t["n"]}">Not read</span></a></li>' for i, t in enumerate(topics, 1))
    return f'''<article class="view" id="start">
<h1>{e(cfg['title'])}</h1>
{''.join(f'<p class="lead">{e(p)}</p>' for p in cfg.get('intro', []))}
<p class="lead">{len(topics)} topics, a few questions each. The proof is one tap away. Read one topic, then stop if you like: the page remembers where you were.</p>
<p class="small">Each answer carries two tags: whether the sources agree, and what was actually checked (the rule itself or our own system, or only a source's view). Questions are numbered like 3.2 (topic 3, question 2), so you can point to one when you ask about it. "Later" puts a topic back at the top of this list.</p>
<ol class="tlist">{items}</ol>
<p class="lead"><a href="#t{topics[0]["n"] if topics else 1}" class="primary">Start with topic 1</a></p>
<p class="small">No decisions are asked here. <a href="#ref">Reference</a> holds every finding and the original sources.</p>
</article>'''


def takeaway_item(t):
    cls, label = ('agree', 'Settled') if t.get('status') == 'settled' else ('split', 'Still contested')
    return f'<li><span class="tag {cls}">{label}</span> <b>{e(topic_name(t))}:</b> {t_(t.get("takeaway", ""))}</li>'


def end_view():
    takeaways = ''.join(takeaway_item(t) for t in topics)
    decs = ''.join(f'<li>{e(d)}</li>' for d in cfg.get('upcoming', []))
    return f'''<article class="view" id="end" hidden>
{recall_box(topics[-1] if topics else None, 'One last check, from')}
<h2>What you now know</h2>
<p class="small" id="pending"></p>
<ul class="takeaways">{takeaways}</ul>
{f'<h3>The decisions that come next</h3><p class="small">Only once every topic is clear. Nothing to answer here.</p><ul class="decs">{decs}</ul>' if decs else ''}
</article>'''


def rowli(r):
    q = f'<p class="rq2">{e(uq(r["quote"]))}</p>' if r.get('quote') else ''
    url = r.get('url') or ''
    link = linkify(url) if url and not url.lower().startswith('none') else ''
    return f'<li class="row"><p><b>{e(r["id"])}</b> <span class="rt">{e(r["type"])}</span> {e(r["point"])}</p>{q}<p class="src">{src_ref(r["id"])}{" · " + link if link else ""}</p></li>'


def ref_view():
    parts = ['<article class="view" id="ref" hidden><h2>Reference</h2><p class="small">Every finding from the sources, and the sources themselves. Use search to find one.</p>',
             '<label class="search"><span>Find a finding</span><input type="search" id="q" autocomplete="off"></label><p id="qcount" class="small" aria-live="polite"></p>']
    for n, (name, _) in REPORTS.items():
        rr = [r for r in rows if r['report'] == n]
        parts.append(f'<details class="rep" data-rep="{n}"><summary>{e(name)}: <span class="cnt">{len(rr)}</span> findings</summary><ul class="rows">' + ''.join(rowli(r) for r in rr) + '</ul></details>')
    parts.append('<h3>The original sources</h3>')
    for n, (name, f) in REPORTS.items():
        lines = open(f, encoding='utf-8').read().split('\n')
        parts.append(f'<details class="orig" id="rep{n}"><summary>{e(name)}</summary><div class="srcrep">' + ''.join(f'<p id="r{n}-L{k}"><span>{k}</span>{linkify(l)}</p>' for k, l in enumerate(lines, 1)) + '</div></details>')
    parts.append('</article>')
    return ''.join(parts)


CSS = '''
:root{--bg:#faf6ec;--card:#fffdf7;--fg:#24221d;--mut:#5d584c;--line:#a9a290;--acc:#1d4fb8;--ok:#1f6b2a;--warn:#8a4b00;--bad:#9b1c1c;--hl:#f3e3a6;--fs:18px}
@media (prefers-color-scheme:dark){:root{--bg:#1e1f22;--card:#27292d;--fg:#e9e7e1;--mut:#b4b0a6;--line:#73767d;--acc:#9cb8ff;--ok:#8fd19a;--warn:#f0b56b;--bad:#ff9d94;--hl:#4a4226}}
*{box-sizing:border-box}
html{scroll-padding-top:16px}
body{margin:0;background:var(--bg);color:var(--fg);font:var(--fs)/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow-wrap:anywhere}
main{max-width:40rem;margin:0 auto;padding:24px 20px 120px}
h1{font-size:1.6rem;line-height:1.3;margin:8px 0 16px}
h2{font-size:1.5rem;line-height:1.3;margin:4px 0 16px}
h3{font-size:1.15rem;line-height:1.35;margin:0 0 6px}
p{margin:0 0 12px;max-width:66ch}
a{color:var(--acc)}
.k{display:block;font-size:.85rem;font-weight:600;color:var(--mut);margin-bottom:2px}
.small{font-size:.9rem;color:var(--mut)}
.lead{font-size:1.05rem}
.th{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;margin-bottom:12px}
.th h2{flex:1 1 100%;margin:0}.th .step{flex:1}
.step{margin:0;font-size:.9rem;color:var(--mut)}
button,.btn{font:inherit;font-size:1rem;min-height:44px;padding:8px 16px;border-radius:10px;border:2px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.listen{min-height:40px;padding:4px 14px;font-size:.95rem}
.q{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:14px 16px 6px;margin:0 0 12px}
.qn{color:var(--mut);font-weight:600;margin-right:4px}
.state{display:inline-block;font-size:.8rem;font-weight:600;padding:0 8px;border-radius:999px;border:2px solid currentColor;white-space:nowrap}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.chk{border-style:dashed}
.state.agree{color:var(--ok)}.state.split{color:var(--warn)}.state.unsettled{color:var(--bad)}
.ans{font-size:1.05rem;margin-bottom:8px}
details.more>summary{cursor:pointer;color:var(--acc);font-size:.95rem;min-height:44px;display:flex;align-items:center}
.reps{font-size:.95rem;color:var(--mut);list-style:none;padding:0;margin:0 0 4px}.reps li{padding:1px 0}.reps b{color:var(--fg);font-weight:600}
ul.proof{list-style:none;padding:0;margin:8px 0 0}
ul.proof li{border-top:1px solid var(--line);padding:12px 0}
.says{font-weight:600;margin-bottom:6px}
.mark{display:inline-block;font-size:.85rem;font-weight:600;margin-bottom:6px}
.mark.ok{color:var(--ok)}.mark.warn{color:var(--warn)}.mark.bad{color:var(--bad)}.mark.info{color:var(--mut)}
.mark:before{content:"";display:inline-block;width:.6em;height:.6em;border-radius:50%;background:currentColor;margin-right:6px}
blockquote{margin:6px 0;padding:6px 12px;border-left:3px solid var(--line);font-size:.95rem}
.note,.src{font-size:.9rem;color:var(--mut)}
.wants,.why{margin:14px 0}
.recall{border:2px dashed var(--line);border-radius:12px;padding:12px 16px;margin:0 0 16px}
.rq{font-weight:600}.hint{font-size:.9rem;color:var(--mut)}
.recall summary{cursor:pointer;color:var(--acc);min-height:44px;display:flex;align-items:center}
figure.flow{margin:8px 0 18px}
figure.flow ol{list-style:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:0;margin:0}
figure.flow li.box{background:var(--card);border:2px solid var(--line);border-radius:10px;padding:6px 12px;font-size:.95rem}
figure.flow li.arr{color:var(--mut);font-weight:700;padding-left:18px;line-height:1.2}
figcaption{font-size:.9rem;color:var(--mut);margin-top:6px}
.also ul{margin:4px 0 12px;padding-left:20px}.also li{margin-bottom:4px}
.feeds{font-size:.9rem;color:var(--mut)}.feeds ul{margin:4px 0 12px;padding-left:20px}
.tlist{list-style:none;padding:0;margin:16px 0}
.tlist a{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;margin-bottom:8px;background:var(--card);border:2px solid var(--line);border-radius:12px;color:var(--fg);text-decoration:none}
.tnum{font-weight:700;color:var(--mut);width:1.2em}.ttl{flex:1;font-weight:600}
.tst{font-size:.85rem;color:var(--mut)}.tst.done{color:var(--ok)}.tst.back{color:var(--warn)}
.primary{display:inline-flex;align-items:center;min-height:48px;padding:8px 20px;border-radius:10px;background:var(--acc);color:var(--bg);font-weight:600;text-decoration:none}
.takeaways{list-style:none;padding:0}.takeaways li{padding:10px 0;border-top:1px solid var(--line)}
.tag{font-size:.85rem;font-weight:600;padding:0 8px;border-radius:999px;border:2px solid currentColor}.tag.agree{color:var(--ok)}.tag.split{color:var(--warn)}
footer.bar{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:2px solid var(--line);z-index:5}
footer.bar .in{max-width:40rem;margin:0 auto;padding:10px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
footer.bar .sp{flex:1}
footer.bar .next{background:var(--acc);color:var(--bg);border-color:var(--acc);font-weight:600}
footer.bar .home{border:none;background:none;color:var(--acc);padding:8px 4px}
.got[aria-pressed=true]{border-color:var(--ok);color:var(--ok)}.back[aria-pressed=true]{border-color:var(--warn);color:var(--warn)}
.search{display:flex;flex-direction:column;gap:4px;margin:8px 0}
.search input{font:inherit;font-size:1rem;min-height:44px;padding:8px 12px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg)}
details.rep,details.orig{border-top:1px solid var(--line);padding:8px 0}
details.rep>summary,details.orig>summary{cursor:pointer;font-weight:600;padding:10px 0}
ul.rows{list-style:none;padding:0}li.row{padding:10px 0;border-top:1px dashed var(--line)}
li.row p{margin-bottom:4px}.rt{font-size:.8rem;color:var(--mut)}.rq2{font-style:italic;font-size:.95rem}
.nomatch{display:none}
.srcrep p{margin:0;padding:2px 0 2px 3.2em;text-indent:-3.2em;font-size:.9rem;white-space:pre-wrap;max-width:none}
.srcrep p span{display:inline-block;width:3em;color:var(--mut);text-indent:0}
.srcrep p.hl{background:var(--hl)}
code{font-size:.9em}
@media (max-width:600px){:root{--fs:17px}main{padding:16px 14px 140px}footer.bar .in{padding:8px 12px}}
'''

JS = '''
const KEY=GUIDE_KEY;const st=JSON.parse(localStorage.getItem(KEY)||'{"topics":{}}');st.topics=st.topics||{};
const save=()=>localStorage.setItem(KEY,JSON.stringify(st));
const views=[...document.querySelectorAll('.view')];const order=TOPICS.map(n=>'t'+n);
function current(){return (location.hash||'').slice(1)}
st.scroll=st.scroll||{};let shown=null,fresh=false,saveT;
window.addEventListener('scroll',()=>{if(!shown)return;st.scroll[shown]=window.scrollY;clearTimeout(saveT);saveT=setTimeout(save,300)},{passive:true});
function show(id){const v=document.getElementById(id)?id:'start';
 if(st.from&&(!document.getElementById(st.from)||order.includes(v)))st.from=null;shown=null;
 views.forEach(x=>x.hidden=x.id!==v);
 const i=order.indexOf(v);bar.hidden=v==='start';
 [got,back,next].forEach(b=>b.hidden=i<0);backto.hidden=!(i<0&&st.from&&st.from!==v);
 if(i>=0){st.last=v;const n=TOPICS[i];const s=st.topics[n];
  got.setAttribute('aria-pressed',s==='done');back.setAttribute('aria-pressed',s==='back');
  next.textContent=i<order.length-1?'Next':'Finish';next.dataset.to=i<order.length-1?order[i+1]:'end';}
 if(v==='end'){const left=TOPICS.filter(n=>st.topics[n]!=='done').map(n=>document.querySelector('.tst[data-n="'+n+'"]').closest('a').querySelector('.ttl').textContent);
  document.getElementById('pending').textContent=left.length?'Not marked Got it yet: '+left.join(', ')+'.':'Every topic is marked Got it.'}
 paint();save();const y=fresh?0:(st.scroll[v]||0);fresh=false;shown=v;window.scrollTo(0,y)}
function paint(){document.querySelectorAll('.tst').forEach(x=>{const s=st.topics[x.dataset.n];x.textContent=s==='done'?'Got it':s==='back'?'Later':'Not read';x.className='tst'+(s==='done'?' done':s==='back'?' back':'')});
 const list=document.querySelector('.tlist');if(list){const items=[...list.children];items.sort((a,b)=>rank(a)-rank(b));items.forEach(x=>list.appendChild(x))}}
function rank(li){const n=li.querySelector('a').dataset.n;const s=st.topics[n];return (s==='back'?0:s==='done'?2:1)*100+TOPICS.indexOf(+n)}
const bar=document.getElementById('bar'),got=document.getElementById('got'),back=document.getElementById('back'),next=document.getElementById('next'),backto=document.getElementById('backto');
function mark(v){const i=order.indexOf(current());if(i<0)return;const n=TOPICS[i];st.topics[n]=st.topics[n]===v?undefined:v;st.scroll[current()]=window.scrollY;save();shown=null;show(current())}
got.onclick=()=>mark('done');back.onclick=()=>mark('back');next.onclick=()=>{fresh=true;location.hash=next.dataset.to};
backto.onclick=()=>{const f=st.from;st.from=null;location.hash=f};
window.addEventListener('hashchange',()=>show(current()));
if(!location.hash&&st.last&&document.getElementById(st.last))location.hash=st.last;else show(current());
document.querySelectorAll('.listen').forEach(b=>b.onclick=()=>{const s=window.speechSynthesis;if(!s)return;if(s.speaking){s.cancel();b.textContent='Listen';return}
 const v=b.closest('.view');const parts=[v.querySelector('h2').textContent];v.querySelectorAll('.q').forEach(q=>{parts.push(q.querySelector('h3').textContent.replace(/^\\s*\\d+\\.\\d+\\s*/,''));q.querySelectorAll('.chips .state').forEach(c=>parts.push(c.textContent));parts.push(q.querySelector('.ans').textContent)});
 const w=v.querySelector('.why');if(w)parts.push(w.textContent);const u=new SpeechSynthesisUtterance(parts.join('. '));u.rate=.95;u.onend=()=>b.textContent='Listen';b.textContent='Stop';s.speak(u)});
document.addEventListener('toggle',ev=>{const d=ev.target;if(d.matches&&d.matches('details.more')&&d.open)d.closest('.view').querySelectorAll('details.more').forEach(o=>{if(o!==d)o.open=false})},true);
document.addEventListener('click',ev=>{const a=ev.target.closest('a.lineref');if(!a)return;ev.preventDefault();const n=a.dataset.r,l=a.dataset.l;
 if(order.includes(current()))st.from=current();save();location.hash='ref';setTimeout(()=>{const d=document.getElementById('rep'+n);d.open=true;const p=document.getElementById('r'+n+'-L'+l);document.querySelectorAll('.srcrep p.hl').forEach(x=>x.classList.remove('hl'));if(p){p.classList.add('hl');p.scrollIntoView({block:'center'})}},30)});
const q=document.getElementById('q');let t;q&&q.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{const v=q.value.trim().toLowerCase();let total=0;
 document.querySelectorAll('details.rep').forEach(d=>{let c=0;d.querySelectorAll('li.row').forEach(li=>{const m=!v||li.textContent.toLowerCase().includes(v);li.classList.toggle('nomatch',!m);if(m)c++});d.querySelector('.cnt').textContent=v?c+' of '+d.querySelectorAll('li.row').length:d.querySelectorAll('li.row').length;d.open=!!v&&c>0;total+=c});
 document.getElementById('qcount').textContent=v?(total?total+' findings match "'+q.value.trim()+'"':'No finding matches "'+q.value.trim()+'". Try a shorter word.'):''},150)});
'''


def main():
    nums = [t['n'] for t in topics]
    previous = [None] + topics
    body = [start_view()]
    body += [topic_view(t, i, len(topics), previous[i - 1]) for i, t in enumerate(topics, 1)]
    body += [end_view(), ref_view()]
    footer = '''<footer class="bar" id="bar" hidden><div class="in">
<a class="home" href="#start">All topics</a><span class="sp"></span>
<button id="backto" class="next" type="button" hidden>Back to where I was</button>
<button id="got" class="got" type="button" aria-pressed="false">Got it</button>
<button id="back" class="back" type="button" aria-pressed="false" title="Come back to this topic later">Later</button>
<button id="next" class="next" type="button">Next</button></div></footer>'''
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(cfg['title'])}</title><style>{CSS}</style></head><body><main>{''.join(body)}</main>{footer}
<script>const TOPICS={json.dumps(nums)};const GUIDE_KEY={json.dumps(cfg.get('storage_key', 'guide-' + re.sub(r'[^a-z0-9]+', '-', cfg['title'].lower())))};{JS}</script></body></html>'''
    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(doc)
    print('wrote', OUT, os.path.getsize(OUT), 'topics', nums)


main()
