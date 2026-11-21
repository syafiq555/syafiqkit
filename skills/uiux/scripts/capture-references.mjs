#!/usr/bin/env node
// capture-references: screenshot live reference pages (other products' home, listing or product pages) as a visitor sees them,
// for the case-study leg of design research. Text fetches of shop and admin sites come back empty because the page is built
// in the browser; this renders it, clears cookie banners and sign-up pop-ups, and writes one contact sheet to compare.
//
//   node capture-references.mjs <name=url | url> ... [--product] [--out DIR] [--widths 390,1280] [--scroll 800] [--wait 6000]
//
// --product  treat each url as a shop's home and open one of its product pages: a Shopify shop's /products.json first,
//            else the first link on the home page that looks like a product (/products/, /product/, /p/, -i123.html).
// Writes <name>-<width>.png (top of page), <name>-<width>-scroll.png with --scroll, and index.html (every shot side by side)
// to --out (default a temp folder). Node 22+, no npm; Chrome, Edge or a Playwright Chromium (CHROME_PATH overrides).
// Sites behind bot walls (Cloudflare "Just a moment", Akamai "Access Denied") show as such in the shot: say so, never infer.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Browser, sleep } from '../app-kit/scripts/lib/cdp.mjs';

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf('--' + name); if (i === -1) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const has = (name) => { const i = args.indexOf('--' + name); if (i === -1) return false; args.splice(i, 1); return true; };
const product = has('product');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = resolve(flag('out', join(tmpdir(), 'uiux-references', stamp)));
const widths = flag('widths', '390,1280').split(',').map(Number).filter(Boolean);
const scroll = Number(flag('scroll', '0')) || 0;
const waitMs = Number(flag('wait', '6000')) || 6000;
const targets = args.filter((a) => !a.startsWith('--')).map((a, i) => {
  const m = a.match(/^([\w.-]+)=(https?:\/\/.+)$/);
  if (m) return { name: m[1], url: m[2] };
  if (/^https?:\/\//.test(a)) return { name: new URL(a).hostname.replace(/^www\./, '').split('.')[0] || 'site' + i, url: a };
  return null;
}).filter(Boolean);
if (!targets.length || !widths.length) {
  console.error('usage: node capture-references.mjs <name=url | url> ... [--product] [--out DIR] [--widths 390,1280] [--scroll 800] [--wait 6000]');
  process.exit(2);
}

const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PRODUCT_LINK = /\/products?\/[^/?#]+|\/p\/[^/?#]+|-i\d+(?:-s\d+)?\.html|-i\.\d+\.\d+/;

// Clears what covers the page for a first-time visitor: consent and newsletter dialogs, app banners, chat launchers.
const CLEAR = `(() => {
  const words = /^(accept( all)?( cookies)?|allow all|agree|i agree|got it|ok|close|no thanks|not now|stay in this website|continue to site|dismiss)$/i;
  for (const el of document.querySelectorAll('button, a, [role=button]')) {
    const t = (el.innerText || el.getAttribute('aria-label') || '').trim();
    if (t && t.length < 40 && words.test(t)) { try { el.click(); } catch (e) {} }
  }
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if ((s.position === 'fixed' || s.position === 'sticky' && s.zIndex > 100) && parseInt(s.zIndex || 0, 10) >= 10) {
      const r = el.getBoundingClientRect();
      if (r.width > innerWidth * 0.5 && r.height > innerHeight * 0.3) el.remove();
    }
  }
  document.documentElement.style.overflow = 'auto';
  document.body.style.overflow = 'auto';
  return true;
})()`;

async function open(browser, url, width) {
  const mobile = width < 600;
  const page = await browser.newPage({ width, height: mobile ? 844 : 900, dsf: 1, mobile });
  await page.send('Network.enable').catch(() => {});
  await page.send('Network.setUserAgentOverride', { userAgent: mobile ? PHONE_UA : DESKTOP_UA }).catch(() => {});
  await page.goto(url, { timeoutMs: 30000, settleMs: waitMs });
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }).catch(() => {});
  for (let i = 0; i < 2; i++) { await page.eval(CLEAR).catch(() => {}); await sleep(700); }
  return page;
}

async function findProduct(browser, home) {
  const origin = new URL(home).origin;
  const page = await browser.newPage({ width: 1280, height: 900 });
  try {
    await page.goto(origin + '/products.json?limit=10', { timeoutMs: 20000, settleMs: 300 });
    const json = await page.eval('(() => { try { return JSON.parse(document.body.innerText); } catch (e) { return null; } })()');
    const list = json?.products || [];
    const pick = list.find((p) => (p.images || []).length > 2) || list[0];
    if (pick?.handle) return origin + '/products/' + pick.handle;
  } catch {} finally { await page.close(); }
  const p2 = await open(browser, home, 1280);
  try {
    await p2.wheel(2400);
    await sleep(800);
    const hrefs = await p2.eval('[...document.querySelectorAll("a[href]")].map((a) => a.href)');
    return (hrefs || []).find((h) => h.startsWith(origin) && PRODUCT_LINK.test(new URL(h).pathname + new URL(h).search)) || null;
  } finally { await p2.close(); }
}

mkdirSync(outDir, { recursive: true });
const browser = await Browser.launch();
const rows = [];
for (const t of targets) {
  let url = t.url;
  if (product) {
    url = await findProduct(browser, t.url).catch(() => null);
    if (!url) { console.log(`${t.name}: no product page found from ${t.url}`); rows.push({ ...t, shots: [], note: 'no product page found' }); continue; }
  }
  const shots = [];
  for (const w of widths) {
    let page;
    try {
      page = await open(browser, url, w);
      const title = await page.eval('document.title').catch(() => '');
      const top = join(outDir, `${t.name}-${w}.png`);
      await page.screenshot({ path: top, format: 'png' });
      shots.push({ w, file: top });
      if (scroll) {
        await page.wheel(scroll);
        await sleep(900);
        const s = join(outDir, `${t.name}-${w}-scroll.png`);
        await page.screenshot({ path: s, format: 'png' });
        shots.push({ w, file: s, scrolled: true });
      }
      console.log(`${t.name} ${w}px  ${title}  ${url}`);
    } catch (e) {
      console.log(`${t.name} ${w}px  FAILED: ${String(e.message).split('\n')[0]}`);
    } finally { if (page) await page.close(); }
  }
  rows.push({ ...t, url, shots });
}
await browser.close();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const html = `<!doctype html><meta charset="utf-8"><title>Reference captures</title>
<style>body{font:14px system-ui;margin:24px;background:#f6f6f4}section{margin-bottom:40px}h2{font-size:16px;margin:0 0 4px}
a{color:#555;font-size:12px;word-break:break-all}.row{display:flex;gap:16px;align-items:flex-start;margin-top:8px;overflow-x:auto}
figure{margin:0;flex:none}img{display:block;border:1px solid #ddd;background:#fff}figcaption{font-size:12px;color:#666}</style>
${rows.map((r) => `<section><h2>${esc(r.name)}</h2><a href="${esc(r.url)}">${esc(r.url)}</a>${r.note ? `<p>${esc(r.note)}</p>` : ''}<div class="row">${r.shots.map((s) => `<figure><img src="${esc(s.file.split('/').pop())}" width="${s.w < 600 ? 300 : 640}"><figcaption>${s.w}px${s.scrolled ? ', scrolled' : ''}</figcaption></figure>`).join('')}</div></section>`).join('\n')}`;
writeFileSync(join(outDir, 'index.html'), html);
console.log('\n' + join(outDir, 'index.html'));
