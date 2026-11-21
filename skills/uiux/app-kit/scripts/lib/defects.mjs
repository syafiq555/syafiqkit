// Page-side defect measurement for check-render.mjs. Each export is serialised into the page by
// Page.eval, so it must stay self-contained (no imports, no outer-scope references).

export const HIDE_DEV_OVERLAYS_CSS = '#herd-ai-root, #herd-ai-host, #herd-pill, [data-herd-pill] { display: none !important; }';

// Runs before the page's own scripts: remembers every element that gets a click listener, since a
// computed cursor cannot say whether a div is clickable. Delegated listeners (React's root, jQuery's
// document) are invisible to this and are covered only by the markup cues in `defects`.
export const CLICK_HOOK = `(() => {
  const els = window.__uiuxClickEls = [];
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, ...rest) {
    try { if ((type === 'click' || type === 'pointerup') && this instanceof Element && els.length < 8000) els.push(this); } catch (e) {}
    return add.call(this, type, ...rest);
  };
})();`;

export function darkSupport() {
  const out = { media: false, colorScheme: false, classBased: false };
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta && /dark/.test(meta.content)) out.colorScheme = true;
  if (/dark/.test(getComputedStyle(document.documentElement).colorScheme || '')) out.colorScheme = true;
  const walk = (rules) => {
    for (const r of rules) {
      try {
        if (r.media && /prefers-color-scheme:\s*dark/.test(r.media.mediaText)) out.media = true;
        else if (r.selectorText && /(^|[\s,])\.dark\b|\[data-(bs-)?theme=["']?dark|\.theme-dark|\.dark-mode/.test(r.selectorText)) out.classBased = true;
        if (r.cssRules) walk(r.cssRules);
      } catch (e) {}
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch (e) {} }
  return out;
}

export function defects(opts) {
  const findings = [];
  // clientWidth, not innerWidth: a phone emulation widens innerWidth to the content when the page overflows
  const vw = document.documentElement.clientWidth || innerWidth;
  const vh = Math.min(innerHeight, document.documentElement.clientHeight || innerHeight);
  const phase = opts.phase || 'all';
  const mobile = vw <= 430;
  const scope = opts.selector ? [...document.querySelectorAll(opts.selector)] : null;
  const inScope = (el) => !scope || scope.some((r) => r.contains(el));
  const csCache = new Map();
  const cs = (el) => { let c = csCache.get(el); if (!c) { c = getComputedStyle(el); csCache.set(el, c); } return c; };
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|META|LINK|TITLE|OPTION|DATALIST)$/;

  const sel = (el) => {
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && parts.length < 4 && e !== document.documentElement; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id) { parts.unshift(s + '#' + CSS.escape(e.id)); break; }
      const c = [...e.classList].filter((x) => !/[:\[\]\/\\!]/.test(x)).slice(0, 2);
      if (c.length) s += '.' + c.join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const snip = (s, n = 40) => { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '...' : s; };
  const seen = new Set();
  const add = (id, level, el, message, fix, extra) => {
    const selector = typeof el === 'string' ? el : sel(el);
    const key = id + '|' + selector + '|' + (extra || message.slice(0, 40));
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ id, level, selector, message, fix });
  };

  const opCache = new Map();
  const effOp = (el) => {
    if (!el || el.nodeType !== 1) return 1;
    let v = opCache.get(el);
    if (v === undefined) { v = (parseFloat(cs(el).opacity) || 0) * effOp(el.parentElement); opCache.set(el, v); }
    return v;
  };
  const isVisible = (el) => {
    const c = cs(el);
    if (c.display === 'none' || c.visibility === 'hidden' || c.visibility === 'collapse') return false;
    if (effOp(el) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  // the part of an element a visitor can see: its box clipped by every overflow-clipping ancestor
  const visibleRect = (el) => {
    const r = el.getBoundingClientRect();
    let l = r.left, t = r.top, rr = r.right, b = r.bottom;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const c = cs(a);
      if (c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect();
      if (c.overflowX !== 'visible') { l = Math.max(l, ar.left); rr = Math.min(rr, ar.right); }
      if (c.overflowY !== 'visible') { t = Math.max(t, ar.top); b = Math.min(b, ar.bottom); }
    }
    return { left: l, top: t, right: rr, bottom: b, width: rr - l, height: b - t };
  };

  // colour parsing: computed colours are rgb()/rgba() almost always; anything else goes through a canvas
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const g = cvs.getContext('2d', { willReadFrequently: true });
  const pcache = new Map();
  const parse = (str) => {
    if (pcache.has(str)) return pcache.get(str);
    let out;
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(str);
    if (m) out = [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4]];
    else {
      g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = str; g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data; out = [d[0], d[1], d[2], d[3] / 255];
    }
    pcache.set(str, out);
    return out;
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const canvasColour = (() => {
    const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;background:Canvas;';
    document.body.appendChild(d); const c = parse(getComputedStyle(d).backgroundColor); d.remove(); return c;
  })();

  // the colour actually painted behind an element, or why it cannot be known
  const backdrop = (el, rect) => {
    const layers = [];
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const chain = [];
    let stop = null;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const c = cs(e);
      chain.push(e);
      if (c.backgroundImage !== 'none') return { unknown: 'a background image or gradient on ' + sel(e) };
      const bc = parse(c.backgroundColor);
      if (bc[3] > 0) { layers.push(bc); if (bc[3] >= 0.99) { stop = e; break; } }
    }
    // media or tinted layers positioned behind the text without being its ancestors
    const inChain = new Set(chain);
    for (const a of chain) {
      if (a.children.length > 80) continue;
      for (const k of a.children) {
        if (inChain.has(k) || SKIP.test(k.tagName)) continue;
        const kc = cs(k);
        if (kc.position !== 'absolute' && kc.position !== 'fixed') continue;
        if (kc.display === 'none' || kc.visibility === 'hidden') continue;
        const kr = k.getBoundingClientRect();
        if (cx < kr.left || cx > kr.right || cy < kr.top || cy > kr.bottom) continue;
        if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(k.tagName) || kc.backgroundImage !== 'none') {
          return { unknown: 'a picture or gradient (' + sel(k) + ') behind it' };
        }
      }
      if (a === stop) break;
    }
    let base = stop ? null : canvasColour;
    let out = base ? base.slice(0, 3) : [0, 0, 0];
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (i === layers.length - 1 && stop) { out = l.slice(0, 3); continue; }
      out = [0, 1, 2].map((k) => l[k] * l[3] + out[k] * (1 - l[3]));
    }
    return { colour: out };
  };

  // ---- text nodes ----
  const texts = [];
  if (phase === 'all') {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n && texts.length < 7000; n = walker.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const el = n.parentElement;
      if (!el || SKIP.test(el.tagName) || !inScope(el) || !isVisible(el)) continue;
      range.selectNodeContents(n);
      const rr = range.getBoundingClientRect();
      if (rr.width < 1 || rr.height < 1) continue;
      texts.push({ node: n, el, rect: rr });
    }
  }

  // ---- em dash ----
  if (phase === 'all') {
    for (const t of texts) {
      if (t.node.nodeValue.includes(String.fromCharCode(8212))) add('em-dash', 'FAIL', t.el, 'Visible text contains an em dash: "' + snip(t.node.nodeValue, 60) + '"', 'Replace with a hyphen, a colon, brackets, or "Name (CODE)"; an empty cell shows "-".');
    }
    for (const el of document.querySelectorAll('[placeholder]')) {
      if (inScope(el) && isVisible(el) && (el.getAttribute('placeholder') || '').includes(String.fromCharCode(8212))) add('em-dash', 'FAIL', el, 'Placeholder contains an em dash.', 'Replace with a hyphen or colon.');
    }
    let pseudo = 0;
    for (const el of document.body.querySelectorAll('*')) {
      if (el.childElementCount > 0 || SKIP.test(el.tagName) || pseudo > 1500 || !inScope(el)) continue;
      pseudo++;
      for (const p of ['::before', '::after']) {
        const content = getComputedStyle(el, p).content;
        if (content && content.includes(String.fromCharCode(8212)) && isVisible(el)) add('em-dash', 'FAIL', el, 'A ' + p + ' pseudo-element renders an em dash.', 'Replace the content with a hyphen or remove it.');
      }
    }
  }

  // ---- contrast ----
  if (phase === 'all') {
    const done = new Set();
    for (const t of texts) {
      const el = t.el;
      if (done.has(el)) continue;
      done.add(el);
      if (el.closest(':disabled, [aria-disabled="true"]')) continue;
      const c = cs(el);
      if (c.webkitTextFillColor && /rgba\(.*,\s*0\)$/.test(c.webkitTextFillColor)) { if (c.webkitBackgroundClip === 'text' || c.backgroundClip === 'text') add('contrast', 'WARN', el, 'Gradient-filled text: contrast cannot be measured. "' + snip(t.node.nodeValue) + '"', 'Check it by eye against its backdrop, or use a solid colour.'); continue; }
      const fg = parse(c.color);
      if (fg[3] === 0) continue;
      const bd = backdrop(el, t.rect);
      if (bd.unknown) { add('contrast', 'WARN', el, 'Cannot measure contrast: ' + bd.unknown + '. "' + snip(t.node.nodeValue) + '"', 'Put the text on a solid scrim or panel, or check the worst spot by eye.', 'unk'); continue; }
      const a = fg[3] * effOp(el);
      const eff = [0, 1, 2].map((k) => fg[k] * a + bd.colour[k] * (1 - a));
      const r = ratio(eff, bd.colour);
      const size = parseFloat(c.fontSize), bold = parseInt(c.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (r < need) add('contrast', 'FAIL', el, r.toFixed(2) + ':1 against ' + hex(bd.colour) + ' (text ' + hex(eff) + ', ' + Math.round(size) + 'px' + (bold ? ' bold' : '') + '), needs ' + need + ':1. "' + snip(t.node.nodeValue) + '"', 'Darken the text or lighten the surface to reach ' + need + ':1; pick a token pair that passes rather than a one-off colour.');
    }
  }

  // ---- truncation and clipping ----
  if (phase === 'all') {
    const owners = new Set();
    const hiddenBelow = new Map();
    for (const t of texts) {
      const tr = t.rect;
      if (tr.width < 3 || tr.height < 3) continue;
      let hop = 0;
      for (let a = t.el; a && a !== document.body && a !== document.documentElement && hop < 8; a = a.parentElement, hop++) {
        const c = cs(a);
        if (/auto|scroll/.test(c.overflowX + ' ' + c.overflowY)) break;
        const clipX = c.overflowX === 'hidden' || c.overflowX === 'clip';
        const clipY = c.overflowY === 'hidden' || c.overflowY === 'clip';
        if (!clipX && !clipY) continue;
        const ar = a.getBoundingClientRect();
        if (ar.width <= 3 || ar.height <= 3) break;
        const box = { l: ar.left + (parseFloat(c.borderLeftWidth) || 0), t: ar.top + (parseFloat(c.borderTopWidth) || 0), r: ar.right - (parseFloat(c.borderRightWidth) || 0), b: ar.bottom - (parseFloat(c.borderBottomWidth) || 0) };
        const vTol = Math.max(4, tr.height * 0.2);
        const cutX = clipX && (tr.right > box.r + 2 || tr.left < box.l - 2);
        const cutY = clipY && (tr.bottom > box.b + vTol || tr.top < box.t - vTol);
        if (!cutX && !cutY) continue;
        const iw = Math.max(0, Math.min(tr.right, box.r) - Math.max(tr.left, box.l));
        const ih = Math.max(0, Math.min(tr.bottom, box.b) - Math.max(tr.top, box.t));
        const frac = (iw * ih) / (tr.width * tr.height);
        const clampProp = c.getPropertyValue('-webkit-line-clamp');
        const deliberate = c.textOverflow === 'ellipsis' || cs(t.el).textOverflow === 'ellipsis' || (clampProp && clampProp !== 'none');
        // text wholly outside the box is a collapsed panel or an off-canvas slide, unless the box still
        // shows other text of its own and the hidden part sits below it (a fixed height cutting lines off)
        if (frac < 0.03) {
          if (cutY && !cutX && !deliberate && tr.top >= box.b - 2) hiddenBelow.set(a, { box, sample: t.node.nodeValue });
          break;
        }
        const key = sel(a);
        if (owners.has(key)) break;
        const named = !!(t.el.closest('[title], [aria-label]') && a.contains(t.el.closest('[title], [aria-label]')) || a.getAttribute('title') || a.getAttribute('aria-label'));
        if (deliberate) {
          if (!named) { owners.add(key); add('truncated', 'WARN', a, 'Text is shortened with an ellipsis and has no title or aria-label to read it in full: "' + snip(t.node.nodeValue, 50) + '"', 'Add a title (or a way to expand) so the full text is reachable, or give the box room.'); }
          break;
        }
        const carousel = !cutY && a.scrollWidth > a.clientWidth + 2 && a.children.length >= 3;
        if (carousel) break;
        owners.add(key);
        add('clipped-text', 'FAIL', a, 'Text is cut off by overflow:' + (cutX ? 'hidden on the x axis' : 'hidden on the y axis') + ' (' + Math.round(frac * 100) + '% visible): "' + snip(t.node.nodeValue, 50) + '"', 'Let the box grow (min-height / no fixed height), wrap the text, or use ellipsis with a title if shortening is intended.');
        break;
      }
    }
    for (const [a, h] of hiddenBelow) {
      const key = sel(a);
      if (owners.has(key)) continue;
      const showsOwnText = texts.some((t) => a.contains(t.el) && t.rect.bottom <= h.box.b + 2 && t.rect.top >= h.box.t - 2 && t.rect.right <= h.box.r + 2);
      if (showsOwnText) add('clipped-text', 'FAIL', a, 'Text below the visible area is cut off by this box\'s fixed height and overflow:hidden: "' + snip(h.sample, 50) + '"', 'Let the box grow (min-height / no fixed height), or use line-clamp with a title if shortening is intended.');
    }
  }

  // ---- interactive elements ----
  const INTERACTIVE = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], summary, [onclick]';
  const interactives = [];
  for (const el of document.body.querySelectorAll(INTERACTIVE)) {
    if (interactives.length >= 500) break;
    if (!inScope(el) || !isVisible(el) || cs(el).pointerEvents === 'none') continue;
    const er = el.getBoundingClientRect();
    if (er.width <= 2 || er.height <= 2) continue;
    interactives.push(el);
  }

  // an open dialog, drawer or backdrop legitimately covers the page behind it
  const MODAL = '[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"], [class*="modal"], [class*="Modal"], [class*="drawer"], [class*="Drawer"], [class*="backdrop"], [class*="overlay"], [class*="popover"], [class*="dropdown"], [class*="toast"]';
  if (phase === 'all') {
    for (const d of document.body.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]')) {
      const dr = d.getBoundingClientRect();
      if (isVisible(d) && dr.width >= 200 && dr.height >= 100) {
        add('modal-open', 'WARN', d, 'A dialog is open over the page at load ("' + snip(d.getAttribute('aria-label') || d.innerText, 50) + '"): the screenshots show it and the page behind it is only partly checked.', 'Dismiss it first (or sign in with a state that has it dismissed) and run the check again.');
        break;
      }
    }
  }
  // overlap and covered-by: what a visitor would actually hit at the centre of each control
  const hitTest = (label) => {
    for (const el of interactives) {
      const vr = visibleRect(el);
      const r = { left: Math.max(vr.left, 0), top: Math.max(vr.top, 0), right: Math.min(vr.right, vw), bottom: Math.min(vr.bottom, vh) };
      if (r.right - r.left < 4 || r.bottom - r.top < 4) continue;
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
      const lab = hit.closest('label');
      if (lab && lab.control === el) continue;
      if (hit.closest(MODAL) && !el.closest(MODAL)) continue;
      let fixed = false;
      for (let p = hit; p && p !== document.documentElement; p = p.parentElement) { const pos = cs(p).position; if (pos === 'fixed' || pos === 'sticky') { fixed = true; break; } }
      add('covered', fixed ? 'FAIL' : 'WARN', el, (fixed ? 'A fixed or sticky element (' + sel(hit) + ') covers this control ' : 'Another element (' + sel(hit) + ') sits on top of this control ') + label + ': "' + snip(el.innerText || el.value || el.getAttribute('aria-label')) + '"', fixed ? 'Add scroll padding or offset so the bar never lies over a control, or move the control.' : 'Fix the stacking order or layout so the control is reachable.', 'cover');
    }
  };
  if (phase === 'hit') hitTest(opts.label || 'at the bottom of the page');

  if (phase === 'all') {
    hitTest('at the top of the page');

    const textEls = new Map();
    for (const t of texts) {
      const prev = textEls.get(t.el);
      if (!prev) textEls.set(t.el, { left: t.rect.left, top: t.rect.top, right: t.rect.right, bottom: t.rect.bottom });
      else { prev.left = Math.min(prev.left, t.rect.left); prev.top = Math.min(prev.top, t.rect.top); prev.right = Math.max(prev.right, t.rect.right); prev.bottom = Math.max(prev.bottom, t.rect.bottom); }
    }
    const shownText = new Map();
    for (const [T, tr] of textEls) {
      const vr = visibleRect(T);
      const s = { left: Math.max(tr.left, vr.left), top: Math.max(tr.top, vr.top), right: Math.min(tr.right, vr.right), bottom: Math.min(tr.bottom, vr.bottom) };
      if (s.right - s.left > 4 && s.bottom - s.top > 4) shownText.set(T, s);
    }
    const overlapOf = (a, b) => ({ w: Math.min(a.right, b.right) - Math.max(a.left, b.left), h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) });
    const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    let pairs = 0;
    for (let i = 0; i < interactives.length && pairs < 40; i++) {
      const A = interactives[i];
      if (/^(checkbox|radio)$/.test(A.type || '') && effOp(A) < 0.2) continue;
      const ar = visibleRect(A);
      if (ar.width <= 4 || ar.height <= 4) continue;
      const aPos = cs(A).position;
      if (!own(A) && A.childElementCount === 0 && (aPos === 'absolute' || aPos === 'fixed') && !A.matches('input, select, textarea')) continue;
      for (let j = i + 1; j < interactives.length; j++) {
        const B = interactives[j];
        if (A.contains(B) || B.contains(A) || !!A.closest(MODAL) !== !!B.closest(MODAL)) continue;
        const bPos = cs(B).position;
        if (!own(B) && B.childElementCount === 0 && (bPos === 'absolute' || bPos === 'fixed') && !B.matches('input, select, textarea')) continue;
        const br = visibleRect(B);
        if (br.width <= 4 || br.height <= 4) continue;
        const o = overlapOf(ar, br);
        if (o.w > 4 && o.h > 4) {
          if (A.closest('label') && A.closest('label') === B.closest('label')) continue;
          // an icon button inside a text field (show password, clear, picker) overlays it by design
          const field = (e) => e.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select');
          const within = (inner, outer) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
          if ((field(A) && within(br, ar)) || (field(B) && within(ar, br))) continue; pairs++; add('overlap', 'FAIL', A, 'Overlaps another control (' + sel(B) + ') by ' + Math.round(o.w) + 'x' + Math.round(o.h) + 'px: "' + snip(A.innerText || A.value) + '" / "' + snip(B.innerText || B.value) + '"', 'Give the controls their own space (gap, wrap, or stack at this width).'); }
      }
      for (const [T, tr] of shownText) {
        if (A.contains(T) || T.contains(A) || !!A.closest(MODAL) !== !!T.closest(MODAL)) continue;
        if (T.tagName === 'LABEL' || T.closest('label') === A.closest('label') && A.closest('label')) continue;
        if (interactives.includes(T)) continue;
        if (cs(T).pointerEvents === 'none') continue;
        const o = overlapOf(ar, tr);
        if (o.w > 4 && o.h > 4) {
          const tPos = cs(T).position;
          const contained = tr.left >= ar.left - 1 && tr.right <= ar.right + 1 && tr.top >= ar.top - 1 && tr.bottom <= ar.bottom + 1;
          if (contained && (tPos === 'absolute' || tPos === 'fixed') && !own(A)) continue;
          pairs++;
          add('overlap', 'WARN', A, 'Control overlaps text (' + sel(T) + ') by ' + Math.round(o.w) + 'x' + Math.round(o.h) + 'px: "' + snip(A.innerText || A.value) + '" / "' + snip(T.innerText) + '"', 'Separate them: gap, wrap, or reflow at this width.');
          if (pairs >= 40) break;
        }
      }
    }

    // ---- tap targets ----
    if (mobile) {
      for (const el of interactives) {
        if (el.matches('input[type="checkbox"], input[type="radio"]') && el.closest('label')) { const lr = el.closest('label').getBoundingClientRect(); if (lr.width >= 44 && lr.height >= 24) continue; }
        const vis = visibleRect(el);
        if (vis.width <= 4 || vis.height <= 4) continue;
        const c = cs(el);
        if (c.display === 'inline' && el.tagName === 'A') {
          const p = el.parentElement;
          if (p && [...p.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim().length > 3)) continue;
        }
        const r = el.getBoundingClientRect();
        const w = Math.round(r.width), h = Math.round(r.height);
        if (Math.min(w, h) < 24) add('tap-target', 'FAIL', el, 'Tap target ' + w + 'x' + h + 'px is under the 24x24 WCAG 2.2 minimum: "' + snip(el.innerText || el.value || el.getAttribute('aria-label')) + '"', 'Pad it to at least 44x44 (min-h / min-w or padding), keeping the glyph size.');
        else if (Math.min(w, h) < 44) add('tap-target', 'WARN', el, 'Tap target ' + w + 'x' + h + 'px is under 44x44: "' + snip(el.innerText || el.value || el.getAttribute('aria-label')) + '"', 'Pad it to 44x44 for thumbs.');
      }
    }

    // ---- cursor ----
    const clickable = new Set();
    for (const el of document.body.querySelectorAll('button, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], summary, label[for], [onclick], [wire\\:click], [x-on\\:click], [\\@click], [v-on\\:click], [data-bs-toggle], [data-toggle]')) clickable.add(el);
    for (const el of document.body.querySelectorAll('label')) if (el.querySelector('input, select, textarea') && !el.querySelector('select, textarea')) clickable.add(el);
    for (const el of (window.__uiuxClickEls || [])) {
      if (!el.isConnected || el === document.body || el === document.documentElement || !(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.width >= vw * 0.95 && r.height >= vh * 0.9) continue;
      clickable.add(el);
    }
    for (const el of clickable) {
      if (!inScope(el) || !isVisible(el)) continue;
      if (el.matches(':disabled, [aria-disabled="true"], [disabled]')) continue;
      if (el.matches('label') && el.querySelector('input[type="hidden"]')) continue;
      const cur = cs(el).cursor;
      if (cur === 'pointer') continue;
      if (!/^(default|auto|text)/.test(cur)) continue;
      const strong = el.matches('button, a[href]');
      add('cursor', strong ? 'FAIL' : 'WARN', el, 'Clickable ' + el.tagName.toLowerCase() + ' shows a "' + cur + '" cursor: "' + snip(el.innerText || el.value || el.getAttribute('aria-label')) + '"', 'Add cursor-pointer (once, on the shared button/link atom, not per page).');
    }

    // ---- sibling consistency ----
    const sig = (el) => el.tagName + '.' + [...el.classList].filter((x) => !/^(is-|has-|active|selected|current|open|show|hover|focus|disabled)/.test(x)).sort().join('.');
    const tidy = (n) => Math.round(n);
    for (const p of document.body.querySelectorAll('*')) {
      if (p.childElementCount < 3 || p.childElementCount > 300 || SKIP.test(p.tagName)) continue;
      if (/^(TBODY|THEAD|TFOOT|TR|SELECT|DATALIST|COLGROUP)$/.test(p.tagName)) continue;
      if (!inScope(p) || !isVisible(p) || p.closest('svg')) continue;
      const kids = [...p.children].filter((k) => !/^(SCRIPT|STYLE|BR|TEMPLATE|OPTION|SOURCE|COL|TR|TD|TH)$/.test(k.tagName) && isVisible(k) && !/^(absolute|fixed)$/.test(cs(k).position));
      if (kids.length < 3) continue;
      // a run is consecutive siblings sharing one signature, so gaps never span unrelated content between them
      const groups = [];
      let cur = [], curSig = null;
      for (const k of kids) { const s = sig(k); if (s === curSig) cur.push(k); else { if (cur.length >= 3) groups.push([curSig, cur]); cur = [k]; curSig = s; } }
      if (cur.length >= 3) groups.push([curSig, cur]);
      for (const [s, members] of groups) {
        const items = members.map((k) => ({ k, r: k.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
        const rows = [];
        for (const it of items) {
          const row = rows.find((rw) => Math.min(rw.bottom, it.r.bottom) - Math.max(rw.top, it.r.top) > 0.5 * Math.min(rw.minH, it.r.height));
          if (row) { row.items.push(it); row.top = Math.min(row.top, it.r.top); row.bottom = Math.max(row.bottom, it.r.bottom); row.minH = Math.min(row.minH, it.r.height); }
          else rows.push({ items: [it], top: it.r.top, bottom: it.r.bottom, minH: it.r.height });
        }
        const label = sig(members[0]).toLowerCase() + ' in ' + sel(p);
        const odd = (list, f, med) => list.reduce((best, x) => (Math.abs(f(x) - med) > Math.abs(f(best) - med) ? x : best), list[0]);
        const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
        for (const row of rows) {
          if (row.items.length < 2) continue;
          const hs = row.items.map((x) => x.r.height);
          if (Math.max(...hs) - Math.min(...hs) > 4) {
            const med = median(hs);
            const o = odd(row.items, (x) => x.r.height, med);
            add('sibling-size', 'WARN', p, 'Siblings in a row have uneven heights (' + tidy(Math.min(...hs)) + ' to ' + tidy(Math.max(...hs)) + 'px) in ' + label + '; odd one out: ' + sel(o.k) + ' (' + tidy(o.r.height) + 'px vs ' + tidy(med) + 'px)', 'Stretch the row (align-items: stretch / grid) or give the items one fixed height, so the row reads as one band.', s);
          } else {
            const tops = row.items.map((x) => x.r.top);
            if (Math.max(...tops) - Math.min(...tops) > 2) { const med = median(tops); const o = odd(row.items, (x) => x.r.top, med); add('sibling-align', 'WARN', p, 'Top edges differ by ' + tidy(Math.max(...tops) - Math.min(...tops)) + 'px in a row of ' + label + '; odd one out: ' + sel(o.k), 'Align the row (align-items: start or center for all) or remove the stray margin on that item.', s + 'top'); }
          }
          if (row.items.length >= 3) {
            const sorted = [...row.items].sort((a, b) => a.r.left - b.r.left);
            const gaps = []; for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i].r.left - sorted[i - 1].r.right);
            if (Math.max(...gaps) - Math.min(...gaps) > 4) add('uneven-gap', 'WARN', p, 'Horizontal gaps between siblings differ (' + gaps.map(tidy).join(', ') + 'px) in ' + label, 'Use one gap token on the container instead of per-item margins.', s + 'hgap');
          }
        }
        if (rows.length >= 2) {
          const clusters = [];
          for (const it of [...items].sort((a, b) => a.r.left - b.r.left)) {
            const cl = clusters.find((c) => Math.abs(c.x - it.r.left) <= 2);
            if (cl) cl.items.push(it); else clusters.push({ x: it.r.left, items: [it] });
          }
          outer: for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
            const d = Math.abs(clusters[i].x - clusters[j].x);
            if (d > 2 && d <= 14) { const small = clusters[i].items.length <= clusters[j].items.length ? clusters[i] : clusters[j]; add('sibling-align', 'WARN', p, 'Left edges are off by ' + tidy(d) + 'px in ' + label + '; odd one out: ' + sel(small.items[0].k), 'Make the items share one column grid / the same padding so edges line up.', s + 'left'); break outer; }
          }
          if (rows.length >= 3) {
            const gaps = []; for (let i = 1; i < rows.length; i++) gaps.push(rows[i].top - rows[i - 1].bottom);
            if (Math.max(...gaps) - Math.min(...gaps) > 4) add('uneven-gap', 'WARN', p, 'Vertical gaps between siblings differ (' + gaps.map(tidy).join(', ') + 'px) in ' + label, 'Use one gap token on the container instead of per-item margins.', s + 'vgap');
          }
        }
      }
    }

    // ---- card in card ----
    const shadowShown = (v) => v && v !== 'none' && /\d/.test(v.replace(/rgba\([^)]*,\s*0\)/g, ''));
    const boxed = (el) => {
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON|IMG|SVG|CANVAS|VIDEO|TABLE|TR|TD|TH|HTML|BODY)$/i.test(el.tagName)) return false;
      const c = cs(el);
      const border = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(c['border' + s + 'Width']) > 0 && c['border' + s + 'Style'] !== 'none' && parse(c['border' + s + 'Color'])[3] > 0.02);
      if (!border && !shadowShown(c.boxShadow)) return false;
      return ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some((k) => parseFloat(c['border' + k + 'Radius']) >= 2);
    };
    const cardCache = new Map();
    const isCard = (el) => { if (!cardCache.has(el)) cardCache.set(el, el.getBoundingClientRect().width > 120 && boxed(el)); return cardCache.get(el); };
    for (const el of document.body.querySelectorAll('div, section, article, li, aside, form, fieldset, details, a, p')) {
      if (!inScope(el) || !isVisible(el) || !isCard(el)) continue;
      if (/^(absolute|fixed)$/.test(cs(el).position)) continue;
      let anc = el.parentElement;
      for (let hop = 0; anc && hop < 2; anc = anc.parentElement, hop++) {
        if (anc === document.body) break;
        if (isCard(anc)) { add('card-in-card', 'WARN', el, 'A bordered or shadowed rounded box sits inside another (' + sel(anc) + '): box in a box.', 'Drop the inner border/shadow (use spacing or a background tint) so one surface carries one frame.'); break; }
      }
    }

    // ---- horizontal overflow ----
    const de = document.documentElement;
    const clipped = (el) => { for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) { const c = cs(a); if (c.position === 'fixed') return true; if (a !== document.body && (c.overflowX !== 'visible')) return true; } return false; };
    if (de.scrollWidth > vw + 1) {
      const offenders = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (SKIP.test(el.tagName) || !isVisible(el) || cs(el).position === 'fixed' || clipped(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) offenders.push({ el, over: Math.max(r.right - vw, -r.left) });
        if (offenders.length > 400) break;
      }
      if (!offenders.length) {
        for (const el of document.body.querySelectorAll('*')) {
          if (SKIP.test(el.tagName) || cs(el).position === 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (r.width + r.height > 0 && (r.right > vw + 1 || r.left < -1)) offenders.push({ el, over: Math.max(r.right - vw, -r.left), escaped: cs(el).position === 'absolute' });
          if (offenders.length > 400) break;
        }
      }
      offenders.sort((a, b) => b.over - a.over);
      const named =offenders.filter((o, i) => !offenders.some((p) => p !== o && o.el.contains(p.el) && p.over >= o.over - 1)).slice(0, 4);
      add('h-overflow', 'FAIL', 'document', 'The page scrolls sideways at ' + vw + 'px: content is ' + (de.scrollWidth - vw) + 'px wider than the screen. Widest: ' + (named.map((o) => sel(o.el) + ' (+' + Math.round(o.over) + 'px' + (o.escaped ? ', position:absolute escaping a scroll box that is not positioned' : '') + ')').join('; ') || 'unknown'), 'Find the fixed width / nowrap / min-width that exceeds the container; let it wrap or scroll inside its own box.');
    } else {
      for (const [T, tr] of (typeof textEls !== 'undefined' ? textEls : [])) {
        if (tr.left < vw - 2 && tr.right > vw + 2 && !clipped(T) && cs(T).overflowX === 'visible' && cs(T).position !== 'fixed') add('h-overflow', 'FAIL', T, 'Text runs past the right edge of the screen (hidden by overflow-x on html/body): "' + snip(T.innerText) + '"', 'The page is wider than the screen and the overflow is hidden, so the content is cut. Fix the width instead of hiding the scroll.');
      }
    }
    if (mobile && !document.querySelector('meta[name="viewport"]')) add('viewport-meta', 'WARN', 'document', 'No <meta name="viewport">: phones lay the page out at 980px and shrink it.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.');
  }

  return findings;
}
