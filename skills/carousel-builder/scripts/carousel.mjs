// Carousel builder: HTML slides to platform-sized JPEGs, then measured checks.
// Library: import {build, slide, PRESETS} from '../carousel.mjs' in a post's build.mjs.
// CLI:     node carousel.mjs check <slides.html> [preset] [--rules rules.json]
//          node carousel.mjs review <slides.html> [preset] [--rules rules.json]   (also writes review.html)
//          node carousel.mjs copy <post.txt> [--rules rules.json]
// PLAYWRIGHT_DIR: a project root whose node_modules has playwright or @playwright/test.
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
import {fileURLToPath, pathToFileURL} from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const PRESETS = {
  tiktok: {
    label: 'TikTok photo post / video, 9:16 (TikTok Ads In-Feed safe zone template)',
    w: 1080, h: 1920, pad: 60, minCap: 28,
    safe: {top: 240, bottom: 660, right: 300, left: 120, rightTop: 120},
    bands: [
      {name: 'top 240 px (tabs, search)', x0: 0, y0: 0, x1: 1080, y1: 240},
      {name: 'bottom 660 px (caption, sound, call to action)', x0: 0, y0: 1260, x1: 1080, y1: 1920},
      {name: 'left 120 px', x0: 0, y0: 0, x1: 120, y1: 1920},
      {name: 'right 120 px', x0: 960, y0: 0, x1: 1080, y1: 1920},
      {name: 'action buttons (x 780 to 960, from y 840)', x0: 780, y0: 840, x1: 960, y1: 1260},
    ],
  },
  'youtube-shorts': {
    label: 'YouTube Shorts, 9:16 (Google universal vertical video ad safe zone)',
    w: 1080, h: 1920, pad: 60, minCap: 28,
    safe: {top: 288, bottom: 672, right: 192, left: 48},
    bands: [
      {name: 'top 288 px', x0: 0, y0: 0, x1: 1080, y1: 288},
      {name: 'bottom 672 px', x0: 0, y0: 1248, x1: 1080, y1: 1920},
      {name: 'left 48 px', x0: 0, y0: 0, x1: 48, y1: 1920},
      {name: 'right 192 px', x0: 888, y0: 0, x1: 1080, y1: 1920},
    ],
  },
  'instagram-reels': {
    label: 'Instagram Reels / Stories, 9:16 (Meta: 14% top, 35% bottom, 6% sides)',
    w: 1080, h: 1920, pad: 65, minCap: 28,
    safe: {top: 269, bottom: 672, right: 65, left: 65},
    bands: [
      {name: 'top 14% (269 px)', x0: 0, y0: 0, x1: 1080, y1: 269},
      {name: 'bottom 35% (672 px)', x0: 0, y0: 1248, x1: 1080, y1: 1920},
      {name: 'left 6% (65 px)', x0: 0, y0: 0, x1: 65, y1: 1920},
      {name: 'right 6% (65 px)', x0: 1015, y0: 0, x1: 1080, y1: 1920},
    ],
  },
  'instagram-carousel': {
    label: 'Instagram feed carousel, 4:5 (3:4 profile grid trims about 34 px a side)',
    w: 1080, h: 1350, pad: 60, minCap: 28,
    safe: {top: 0, bottom: 80, right: 60, left: 60},
    bands: [
      {name: 'left 60 px (grid crop plus margin)', x0: 0, y0: 0, x1: 60, y1: 1350},
      {name: 'right 60 px (grid crop plus margin)', x0: 1020, y0: 0, x1: 1080, y1: 1350},
    ],
  },
};

const presetVars = (p) => `:root{--w:${p.w}px;--h:${p.h}px;--pad:${p.pad}px;--safe-top:${p.safe.top}px;--safe-bottom:${p.safe.bottom}px;--safe-right:${p.safe.right}px;--safe-left:${p.safe.left}px;--safe-right-top:${p.safe.rightTop ?? p.safe.right}px}`;

// Layout atoms. Every colour and font comes from the brand sheet's custom properties:
// --brand-25..900 (main ramp), --ink-50..900 (text and neutrals), --solid (badges, CTA),
// --font-display, --font-body, --shadow-rgb (r,g,b of the shadow tint). Positions come from the preset (safe-zone aware).
export const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#888;font-family:var(--font-body);color:var(--ink-900)}
.slide{position:relative;width:var(--w);height:var(--h);overflow:hidden;background:var(--brand-25);margin:0 0 40px 0}
.slide.dark{background:var(--brand-800);color:#fff}
.bar{position:absolute;top:calc(var(--safe-top) + 20px);left:max(var(--pad),var(--safe-left));width:calc(var(--w) - max(var(--pad),var(--safe-left)) - max(var(--pad),var(--safe-right-top)));display:flex;justify-content:space-between;align-items:center}
.logo{font-family:var(--font-display);font-weight:800;font-size:44px;letter-spacing:-0.5px;color:var(--ink-900)}
.logo i{font-style:normal;color:var(--brand-500)}
.dark .logo{color:#fff}
.logo-tile{background:#fff;border-radius:28px;padding:14px 26px;display:flex;align-items:center;box-shadow:0 6px 18px rgba(var(--shadow-rgb,0,0,0),.10)}
.logo-tile img{height:84px;display:block}
.count{font-family:var(--font-display);font-weight:700;font-size:44px;color:var(--brand-700);background:var(--brand-100);padding:8px 30px;border-radius:999px}
.dark .count{background:rgba(255,255,255,.14);color:#fff}
.body{position:absolute;top:calc(var(--safe-top) + 150px);bottom:var(--safe-bottom);left:max(var(--pad),var(--safe-left));width:calc(var(--w) - max(var(--pad),var(--safe-left)) - max(var(--pad),var(--safe-right)));display:flex;flex-direction:column;justify-content:center;gap:48px}
h1{font-family:var(--font-display);font-weight:800;font-size:96px;line-height:1.08;letter-spacing:-2px}
h2{font-family:var(--font-display);font-weight:800;font-size:92px;line-height:1.1;letter-spacing:-1.5px}
.lead{font-size:56px;line-height:1.3;color:var(--ink-600);font-weight:400}
.dark .lead{color:var(--brand-100)}
.accent{color:var(--brand-700)}
.dark .accent{color:var(--brand-300)}
.num{font-family:var(--font-display);font-weight:800;font-size:44px;width:96px;height:96px;border-radius:50%;background:var(--solid);color:#fff;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border:3px solid var(--brand-200);border-radius:48px;padding:72px 64px;box-shadow:0 18px 40px rgba(var(--shadow-rgb,0,0,0),.08)}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:24px}
.row.st{flex-direction:column;align-items:flex-start;gap:4px}
.k{font-size:46px;color:var(--ink-500)}
.v{font-family:var(--font-display);font-weight:800;font-size:68px}
.chip{display:inline-block;font-family:var(--font-display);font-weight:700;font-size:44px;padding:16px 36px;border-radius:999px;background:var(--brand-100);color:var(--brand-800);margin:0 16px 16px 0;text-wrap:balance}
.chip.alt{background:var(--ink-100);color:var(--ink-600)}
.note{font-size:44px;color:var(--ink-500)}
.dark .note{color:var(--brand-200)}
.hint{font-family:var(--font-display);font-weight:700;font-size:40px;color:var(--brand-300)}
.cta{font-family:var(--font-display);font-weight:800;font-size:46px;background:var(--solid);color:#fff;padding:26px 44px;border-radius:999px;display:inline-block;align-self:flex-start}
.shot{border-radius:56px;border:3px solid var(--brand-200);background:#fff;overflow:hidden;box-shadow:0 18px 40px rgba(var(--shadow-rgb,0,0,0),.12);position:relative}
.shot img{display:block;width:100%}
`;

// One slide with the brand bar (mark on the left, n/total on the right) and a centred body.
export const slide = (n, total, inner, {cls = '', mark = '<div class="logo">Brand<i>.</i></div>'} = {}) => `
<section class="slide ${cls}">
  <div class="bar">${mark}<div class="count">${n}/${total}</div></div>
  <div class="body">${inner}</div>
</section>`;

export const page = ({brand = '', css = '', preset = 'tiktok', slides}) => {
  const p = PRESETS[preset];
  if (!p) throw new Error(`unknown preset "${preset}" (have: ${Object.keys(PRESETS).join(', ')})`);
  const importRe = /@import\s+(url\([^)]*\)|"[^"]*"|'[^']*')[^;\n]*;?/g;
  const imports = [...(brand.match(importRe) || []), ...(css.match(importRe) || [])].map((i) => i.replace(/;?$/, ';')).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${imports}
${presetVars(p)}
${brand.replace(importRe, '')}
${BASE_CSS}
${css.replace(importRe, '')}
</style></head><body>${slides.join('')}</body></html>`;
};

const chromium = () => {
  const req = createRequire(import.meta.url);
  const paths = [process.env.PLAYWRIGHT_DIR, process.cwd(), here].filter(Boolean);
  for (const name of ['playwright', '@playwright/test']) {
    try { return req(req.resolve(name, {paths})).chromium; } catch {}
  }
  console.error('Playwright not found. Set PLAYWRIGHT_DIR to a project root that has playwright installed.');
  process.exit(1);
};

// Runs in the page. Measures every visible text run (and any [data-message] image) per slide.
export function copyFails(text, {banned = [], rules = {}}) {
  const out = [];
  if (rules.dashes !== false && /[–—]/.test(text)) out.push('em or en dash');
  if (rules.emoji !== false && /\p{Extended_Pictographic}/u.test(text.replace(/[©®™]/g, ''))) out.push('emoji');
  for (const w of banned.filter(Boolean)) {
    const re = new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}])`, 'iu');
    if (re.test(text)) out.push(`banned word "${w}"`);
  }
  return out;
}

function measure({preset, banned, rules, copyFailsSrc}) {
  const px = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
  const rgba = (c) => {
    const m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [r, g, b, a]; }
    if (!c || c === 'transparent') return null;
    px.clearRect(0, 0, 1, 1); px.fillStyle = c; px.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = px.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const opacityOf = (el) => { let o = 1; for (let a = el; a; a = a.parentElement) o *= +getComputedStyle(a).opacity; return o; };
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]));
  const backdrop = (el) => {
    const layers = [];
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.backgroundImage !== 'none') return null;
      const c = rgba(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    return layers.reduceRight((under, top) => over(top, under), [255, 255, 255]);
  };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const boxOf = (el, s) => {
    for (let a = el; a && a !== s; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if ((rgba(cs.backgroundColor) || [0, 0, 0, 0])[3] > 0 || parseFloat(cs.borderTopWidth) > 0) return a;
    }
    return null;
  };
  const scaleOf = (el) => (el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1);
  const generic = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'inherit']);
  const ctx = document.createElement('canvas').getContext('2d');
  const capCache = new Map(), famCache = new Map();
  const capRatio = (cs) => {
    const key = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    if (!capCache.has(key)) { ctx.font = key; capCache.set(key, ctx.measureText('H').actualBoundingBoxAscent / 100); }
    return capCache.get(key);
  };
  const weightCovers = (range, w) => {
    const [lo, hi = lo] = String(range).split(/\s+/).map((x) => (x === 'normal' ? 400 : x === 'bold' ? 700 : +x));
    return w >= lo && w <= hi;
  };
  const familyOk = (fam, weight) => {
    const key = fam + '|' + weight;
    if (famCache.has(key)) return famCache.get(key);
    const faces = [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === fam);
    const loaded = faces.filter((f) => f.status === 'loaded');
    let ok = loaded.length > 0 && (+weight < 600 || loaded.some((f) => weightCovers(f.weight, +weight) || String(f.weight).split(/\s+/).some((w) => +w >= 600)));
    if (!ok && !faces.length) {
      ok = ['monospace', 'serif'].some((g) => {
        ctx.font = `${weight} 72px ${g}`; const a = ctx.measureText('mmmmmmmmmmlli WQ').width;
        ctx.font = `${weight} 72px "${fam}", ${g}`; const b = ctx.measureText('mmmmmmmmmmlli WQ').width;
        return Math.abs(a - b) > 0.5;
      });
    }
    famCache.set(key, ok);
    return ok;
  };
  const copyFails = (0, eval)(`(${copyFailsSrc})`);
  const results = [];
  [...document.querySelectorAll('.slide')].forEach((s, si) => {
    const sr = s.getBoundingClientRect();
    const fails = [];
    const seen = new Set();
    const add = (check, text, r) => {
      const k = check + '|' + text;
      if (seen.has(k)) return; seen.add(k);
      fails.push({check, text: text.slice(0, 60), box: r && {x: Math.round(r.left - sr.left), y: Math.round(r.top - sr.top), w: Math.round(r.width), h: Math.round(r.height)}});
    };
    const inBand = (r) => preset.bands.find((b) => {
      const x0 = r.left - sr.left, y0 = r.top - sr.top, x1 = x0 + r.width, y1 = y0 + r.height;
      return x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > b.y0;
    });
    const clippers = (el) => {
      const out = [];
      for (let a = el; a; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.display !== 'inline' && (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) out.push(a);
        if (a === s) break;
      }
      return out;
    };
    const copy = (text, r) => copyFails(text, {banned, rules}).forEach((c) => add(c, text, r));
    const visible = (el) => el.checkVisibility({opacityProperty: true, visibilityProperty: true}) && !el.closest('[data-check-skip]');
    const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const el = n.parentElement, cs = getComputedStyle(el);
      if (!visible(el)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1);
      if (!rects.length) continue;
      const box = boxOf(el, s), br = box && box.getBoundingClientRect();
      for (const r of rects) {
        const band = inBand(r);
        if (band) add(`safe zone: ${band.name}`, text, r);
        for (const c of clippers(el)) {
          const cr = c.getBoundingClientRect(), x0 = cr.left + c.clientLeft, y0 = cr.top + c.clientTop;
          if (r.left < x0 - 1 || r.top < y0 - 1 || r.right > x0 + c.clientWidth + 1 || r.bottom > y0 + c.clientHeight + 1) { add('clipped', text, r); break; }
        }
        if (br && (r.left < br.left - 1 || r.right > br.right + 1 || r.top < br.top - 1 || r.bottom > br.bottom + 1)) add('spills out of its box', text, r);
      }
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth) add('clipped (ellipsis)', text, rects[0]);
      const cap = parseFloat(cs.fontSize) * capRatio(cs) * scaleOf(el);
      if (cap < preset.minCap) add(`cap height ${cap.toFixed(1)} px < ${preset.minCap}`, text, rects[0]);
      const fam = cs.fontFamily.split(',')[0].trim().replace(/["']/g, '');
      if (!generic.has(fam.toLowerCase()) && !fam.startsWith('-') && fam !== 'BlinkMacSystemFont' && !familyOk(fam, cs.fontWeight)) add(`font "${fam}" ${cs.fontWeight} did not load (fallback or faked bold rendered)`, text, rects[0]);
      copy(text, rects[0]);
      const fg = rgba(cs.color), bg = backdrop(el);
      if (fg) fg[3] *= opacityOf(el);
      if (fg && bg && !el.closest('.logo, .logo-tile, [data-logo]')) {
        const ratio = contrast(over(fg, bg), bg), need = cap >= 40 ? 3 : 4.5;
        if (ratio < need) add(`contrast ${ratio.toFixed(2)}:1 < ${need}:1`, text, rects[0]);
      }
    }
    const isBlock = (e) => getComputedStyle(e).display !== 'inline';
    for (const e of [s, ...s.querySelectorAll('*')].filter(visible)) {
      const leaf = isBlock(e) && ![...e.querySelectorAll('*')].some(isBlock);
      const parts = [leaf && !e.querySelector('[data-check-skip]') ? e.innerText : '', getComputedStyle(e, '::before').content, getComputedStyle(e, '::after').content, e.getAttribute('alt') || '', e.getAttribute('title') || '']
        .map((t) => (t === 'none' || t === 'normal' ? '' : t.replace(/^"|"$/g, '')));
      const text = parts.join(' ').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      copy(text, e.getBoundingClientRect());
    }
    s.querySelectorAll('img').forEach((img) => {
      if (visible(img) && !(img.complete && img.naturalWidth)) add('image did not load', img.getAttribute('src') || 'image', img.getBoundingClientRect());
    });
    s.querySelectorAll('[data-message]').forEach((img) => {
      const r = img.getBoundingClientRect();
      const band = inBand(r);
      if (band) add(`safe zone: ${band.name}`, img.getAttribute('alt') || img.getAttribute('src') || 'image', r);
    });
    results.push({slide: si + 1, fails});
  });
  return results;
}

function overlay({preset, boxes, index}) {
  const s = document.querySelectorAll('.slide')[index];
  const mk = (css) => { const d = document.createElement('div'); d.setAttribute('data-overlay', ''); d.style.cssText = 'position:absolute;pointer-events:none;z-index:99999;' + css; s.appendChild(d); };
  preset.bands.forEach((b) => mk(`left:${b.x0}px;top:${b.y0}px;width:${b.x1 - b.x0}px;height:${b.y1 - b.y0}px;background:rgba(255,0,0,.12)`));
  boxes.forEach((b) => mk(`left:${b.x - 4}px;top:${b.y - 4}px;width:${b.w + 8}px;height:${b.h + 8}px;border:6px solid #f00`));
}

const report = (results, preset) => {
  const bad = results.filter((r) => r.fails.length);
  if (!bad.length) { console.log(`checks passed: ${results.length} slides, ${PRESETS[preset].label}`); return true; }
  console.log(`checks FAILED on ${bad.length} of ${results.length} slides (${PRESETS[preset].label}):`);
  for (const r of bad) for (const f of r.fails) console.log(`  slide ${r.slide}: ${f.check}: "${f.text}"${f.box ? ` at x ${f.box.x} y ${f.box.y} (${f.box.w}x${f.box.h})` : ''}`);
  return false;
};

const presetOf = (name) => {
  if (!PRESETS[name]) { console.error(`unknown preset "${name}" (have: ${Object.keys(PRESETS).join(', ')})`); process.exit(2); }
  return PRESETS[name];
};

async function open(htmlPath, p) {
  const b = await chromium().launch();
  const pg = await b.newPage({viewport: {width: p.w, height: p.h}, deviceScaleFactor: 1});
  const failed = [];
  pg.on('requestfailed', (r) => failed.push(r.url()));
  pg.on('response', (r) => { if (r.status() >= 400) failed.push(r.url()); });
  await pg.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'networkidle'});
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(800);
  if (failed.length) { console.log('FAILED to load (build fails):\n  ' + failed.join('\n  ')); process.exitCode = 1; }
  return {b, pg};
}

async function checkAndMark(pg, dir, preset, banned, rules) {
  const p = PRESETS[preset];
  for (const f of fs.readdirSync(dir)) if (/^check-\d+\.png$/.test(f)) fs.unlinkSync(path.join(dir, f));
  const results = await pg.evaluate(measure, {preset: p, banned, rules, copyFailsSrc: copyFails.toString()});
  const ok = report(results, preset);
  if (!ok) {
    const els = await pg.locator('.slide').all();
    for (const r of results.filter((x) => x.fails.length)) {
      await pg.evaluate(overlay, {preset: p, boxes: r.fails.map((f) => f.box).filter(Boolean), index: r.slide - 1});
      const out = path.join(dir, `check-${String(r.slide).padStart(2, '0')}.png`);
      await els[r.slide - 1].screenshot({path: out});
      console.log(`  marked: ${out}`);
    }
    process.exitCode = 1;
  }
  return {ok, results};
}

// Writes <dir>/review.html: every slide as a numbered card with its check results and a note box,
// the caption check when post.txt sits beside the slides, and a button that copies the notes as one change list.
async function writeReview(pg, dir, results, preset, banned, rules) {
  let reviewPage;
  try { ({reviewPage} = await import(new URL('./review-page.mjs', import.meta.url))); }
  catch (e) {
    console.log(e.code === 'ERR_MODULE_NOT_FOUND'
      ? 'review page skipped: copy review-page.mjs (the plugin\'s skills/_shared/scripts/) beside carousel.mjs to get review.html'
      : `review page skipped: review-page.mjs failed to load: ${e.message}`);
    return null;
  }
  await pg.evaluate(() => document.querySelectorAll('[data-overlay]').forEach((e) => e.remove()));
  const p = PRESETS[preset];
  const els = await pg.locator('.slide').all();
  if (!els.length) { console.log('review page skipped: the page has no .slide elements'); return null; }
  const items = [];
  for (let i = 0; i < els.length; i++) {
    const jpg = await els[i].screenshot({type: 'jpeg', quality: 78});
    const fails = results[i]?.fails || [];
    const heading = await els[i].evaluate((s) => (s.querySelector('h1, h2, .lead')?.innerText || '').replace(/\s+/g, ' ').trim());
    items.push({n: i + 1, label: `Slide ${i + 1}`, detail: heading, img: `data:image/jpeg;base64,${jpg.toString('base64')}`,
      issues: fails.length ? fails.map((f) => ({level: 'error', text: `${f.check}: "${f.text}"`})) : [{level: 'ok', text: 'checks passed'}]});
  }
  const notes = [{level: results.some((r) => r.fails.length) ? 'error' : 'ok', text: `${results.filter((r) => !r.fails.length).length} of ${results.length} slides pass the ${p.label} checks`}];
  const post = path.join(dir, 'post.txt');
  if (fs.existsSync(post)) {
    const lines = fs.readFileSync(post, 'utf8').split('\n');
    const copy = lines.flatMap((l, k) => copyFails(l, {banned, rules}).map((c) => `post.txt line ${k + 1}: ${c}: "${l.trim().slice(0, 50)}"`));
    notes.push(...(copy.length ? copy.map((text) => ({level: 'error', text})) : [{level: 'ok', text: 'post.txt passes the copy check'}]));
  }
  const out = path.join(dir, 'review.html');
  fs.writeFileSync(out, reviewPage({title: path.basename(path.resolve(dir)), subtitle: `${els.length} slides, ${p.label}. Type a note under any slide, then Copy change list and paste it back.`, frame: {w: p.w, h: p.h}, items, notes, zones: p.bands, zonesLabel: `${p.label.split(/[,(]/)[0].trim()} UI areas`}));
  console.log(`review page: ${out}`);
  return out;
}

// Writes <dir>/slides.html, renders every .slide to slide-NN.jpg, then checks.
// A failed check sets exit code 1 and writes check-NN.png with bands tinted and offenders boxed.
export async function build({dir, slides, brand = '', css = '', preset = 'tiktok', banned = [], rules = {}, quality = 92}) {
  const p = presetOf(preset);
  fs.mkdirSync(dir, {recursive: true});
  const htmlPath = path.join(dir, 'slides.html');
  fs.writeFileSync(htmlPath, page({brand, css, preset, slides}));
  const {b, pg} = await open(htmlPath, p);
  const els = await pg.locator('.slide').all();
  for (let i = 0; i < els.length; i++) {
    await els[i].screenshot({path: path.join(dir, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality});
  }
  console.log(`rendered ${els.length} slides to ${dir}`);
  const res = await checkAndMark(pg, dir, preset, banned, rules);
  try { await writeReview(pg, dir, res.results, preset, banned, rules); }
  catch (e) { console.log(`review page skipped: ${e.message}`); }
  await b.close();
  return res;
}

export async function check({html, preset = 'tiktok', banned = [], rules = {}, review = false}) {
  const {b, pg} = await open(html, presetOf(preset));
  const dir = path.dirname(path.resolve(html));
  const res = await checkAndMark(pg, dir, preset, banned, rules);
  if (review) {
    let out = null;
    try { out = await writeReview(pg, dir, res.results, preset, banned, rules); }
    catch (e) { console.log(`review page failed: ${e.message}`); }
    if (!out) process.exitCode = 1;
  }
  await b.close();
  return res;
}

export function checkCopy({file, banned = [], rules = {}}) {
  const text = fs.readFileSync(file, 'utf8'), lines = text.split('\n');
  const perLine = lines.flatMap((l, i) => copyFails(l, {banned, rules}).map((c) => ({c, at: `line ${i + 1}`, l})));
  const across = copyFails(text.replace(/\s+/g, ' '), {banned, rules}).filter((c) => !perLine.some((p) => p.c === c)).map((c) => ({c, at: 'across lines', l: ''}));
  const fails = [...perLine, ...across].map(({c, at, l}) => `  ${at}: ${c}${l ? `: "${l.trim().slice(0, 60)}"` : ''}`);
  if (!fails.length) { console.log(`copy passed: ${file}`); return true; }
  console.log(`copy FAILED: ${file}\n${fails.join('\n')}`);
  process.exitCode = 1;
  return false;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const usage = 'usage: node carousel.mjs check <slides.html> [preset] [--rules rules.json]\n       node carousel.mjs review <slides.html> [preset] [--rules rules.json]\n       node carousel.mjs copy <post.txt> [--rules rules.json]';
  const [cmd, file, ...rest] = process.argv.slice(2);
  const ri = rest.indexOf('--rules');
  if (!['check', 'review', 'copy'].includes(cmd) || !file || (ri >= 0 && !rest[ri + 1])) { console.error(usage); process.exit(2); }
  const cfg = ri >= 0 ? JSON.parse(fs.readFileSync(rest[ri + 1], 'utf8')) : {};
  const opts = {banned: cfg.banned || [], rules: {dashes: cfg.dashes, emoji: cfg.emoji}};
  if (cmd === 'copy') checkCopy({file, ...opts});
  else await check({html: file, preset: rest.find((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1)) || 'tiktok', review: cmd === 'review', ...opts});
}
