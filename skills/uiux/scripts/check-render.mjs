#!/usr/bin/env node
// check-render: measure a rendered screen (app or public page) for the visible defects a screenshot read misses.
//
//   node check-render.mjs <url | file.html> [--out DIR] [--widths 375,768,1280] [--scheme light|dark|both]
//                         [--storage-state auth.json] [--selector css] [--allow id,id] [--json]
//
// Widths default to 320,375,768,1280. Scheme defaults to both when the page has a dark theme, else light.
// Exit code 1 when any FAIL is not in --allow, else 0 (2 for a usage or load error). Node 22+, no npm.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { Browser, sleep } from '../app-kit/scripts/lib/cdp.mjs';
import { defects, darkSupport, HIDE_DEV_OVERLAYS_CSS, CLICK_HOOK } from '../app-kit/scripts/lib/defects.mjs';

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf('--' + name); if (i === -1) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const has = (name) => { const i = args.indexOf('--' + name); if (i === -1) return false; args.splice(i, 1); return true; };
const asJson = has('json');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = resolve(flag('out', join(tmpdir(), 'uiux-check', stamp)));
const widths = flag('widths', '320,375,768,1280').split(',').map(Number).filter(Boolean);
const schemeArg = flag('scheme', 'both');
const storagePath = flag('storage-state', '');
const selector = flag('selector', '');
const allow = flag('allow', '').split(',').map((s) => s.trim()).filter(Boolean);
const target = args[0];
if (!target || target.startsWith('--') || !widths.length || !['light', 'dark', 'both'].includes(schemeArg)) {
  console.error('usage: node check-render.mjs <url | file.html> [--out DIR] [--widths 375,768,1280] [--scheme light|dark|both] [--storage-state file] [--selector css] [--allow id,id] [--json]');
  process.exit(2);
}
let url = target;
if (!/^(https?|file):/i.test(target)) {
  if (!existsSync(resolve(target))) { console.error('No such file: ' + resolve(target)); process.exit(2); }
  url = pathToFileURL(resolve(target)).href;
}
const HEIGHT = { 320: 568, 375: 812, 390: 844, 414: 896, 768: 1024, 1024: 768, 1280: 800, 1440: 900 };
const CAP = 30;

mkdirSync(outDir, { recursive: true });
const browser = await Browser.launch({ extraArgs: ['--ignore-certificate-errors'] });
if (storagePath) {
  if (!existsSync(storagePath)) { console.error('No such storage state: ' + storagePath); await browser.close(); process.exit(2); }
  const n = await browser.useStorageState(JSON.parse(readFileSync(storagePath, 'utf8')));
  if (!n) console.error('Storage state holds no cookies or localStorage; the page opens signed out.');
}

const runs = [];
let dark = null;
let loadError = null;

async function run(width, scheme) {
  const height = HEIGHT[width] || Math.round(width * 0.625);
  const page = await browser.newPage({ width, height, dsf: 1, mobile: width < 600, scheme });
  const tag = `w${width}-${scheme}`;
  try {
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: CLICK_HOOK });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(HIDE_DEV_OVERLAYS_CSS)}; document.documentElement.appendChild(s); });` });
    await page.goto(url, { timeoutMs: 30000, settleMs: 700 });
    await page.eval('document.fonts && document.fonts.ready.then(() => true)').catch(() => {});
    const title = await page.eval('document.title').catch(() => '');
    const finalUrl = await page.eval('location.href').catch(() => url);
    const status = await page.eval(`(performance.getEntriesByType('navigation')[0] || {}).responseStatus || 0`).catch(() => 0);
    if (status >= 400) console.error(`HTTP ${status} at ${width}/${scheme}: this is an error page, not the screen you meant to check.`);
    const loginRe = /\/(wp-)?(login|sign[-_]?in|log-in|auth\/login)(\.php|\/|\?|#|$)/i;
    if (loginRe.test(finalUrl) && !loginRe.test(url)) { console.error(`Redirected to a sign-in page (${finalUrl}) at ${width}/${scheme}: this measured the login screen. Pass --storage-state <saved login> for this host.`); loadError = loadError || new Error('redirected to sign-in: ' + finalUrl); }
    if (dark === null) dark = await page.eval(darkSupport).catch(() => ({}));
    if (scheme === 'dark' && dark.classBased && !dark.media) await page.eval(`document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.setAttribute('data-bs-theme', 'dark');`).catch(() => {});
    // walk the page so lazy images and scroll reveals have fired before measuring
    const total = await page.eval('Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)').catch(() => height);
    for (let y = height; y < Math.min(total, height * 14); y += height) { await page.eval(`window.scrollTo(0, ${y})`).catch(() => {}); await sleep(120); }
    await page.eval('window.scrollTo(0, 0)').catch(() => {});
    await sleep(500);
    const pageHeight = await page.eval('Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)').catch(() => height);
    let found = await page.eval(defects, { selector, phase: 'all' });
    if (pageHeight > height + 40) {
      await page.eval('window.scrollTo(0, document.documentElement.scrollHeight)').catch(() => {});
      await sleep(350);
      const moved = await page.eval('window.scrollY').catch(() => 0);
      if (moved > 20) found = found.concat(await page.eval(defects, { selector, phase: 'hit', label: 'at the bottom of the page' }).catch(() => []));
      await page.eval('window.scrollTo(0, 0)').catch(() => {});
      await sleep(250);
    }
    const top = join(outDir, `${tag}-top.png`), full = join(outDir, `${tag}-full.png`);
    await page.screenshot({ path: top, format: 'png' });
    await page.screenshot({ path: full, format: 'png', fullPage: true });
    const counts = {};
    for (const f of found) { (counts[f.id] ||= { FAIL: 0, WARN: 0 })[f.level]++; f.width = width; f.scheme = scheme; }
    const shown = [], per = {};
    for (const f of found) { per[f.id + f.level] = (per[f.id + f.level] || 0) + 1; if (per[f.id + f.level] <= CAP) shown.push(f); }
    runs.push({ width, scheme, title, url: finalUrl, status, pageHeight, screenshots: { top, full }, counts, findings: shown, omitted: found.length - shown.length, consoleErrors: page.consoleErrors.length });
  } catch (e) {
    if (!runs.length) loadError = e;
    runs.push({ width, scheme, error: String(e.message || e), findings: [], counts: {} });
  } finally { await page.close(); }
}

try {
  if (schemeArg !== 'dark') for (const w of widths) await run(w, 'light');
  if (!loadError) {
    const wantDark = schemeArg === 'dark' || (schemeArg === 'both' && dark && (dark.media || dark.colorScheme || dark.classBased));
    if (wantDark) for (const w of widths) await run(w, 'dark');
  }
} finally { await browser.close(); }

if (loadError) { console.error('Could not load ' + url + ': ' + loadError.message); process.exit(2); }

const all = runs.flatMap((r) => r.findings);
const failing = all.filter((f) => f.level === 'FAIL' && !allow.includes(f.id));
const errored = runs.filter((r) => r.error);
const exitCode = failing.length ? 1 : errored.length ? 2 : 0;
const report = { url, at: new Date().toISOString(), outDir, widths, schemes: [...new Set(runs.map((r) => r.scheme))], darkTheme: dark, allow, selector: selector || null, exit: exitCode, runs };
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));

if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`check-render ${url}  (${report.schemes.join('+')}; ${widths.join(', ')}px)`);
  const ids = [...new Set(all.map((f) => f.id))].sort();
  const pad = (s, n) => String(s).padEnd(n);
  console.log('\n' + pad('id', 16) + pad('level', 7) + pad('width/scheme', 18) + 'count');
  for (const r of runs) {
    if (r.error) { console.log(pad('error', 16) + pad('', 7) + pad(r.width + '/' + r.scheme, 18) + r.error); continue; }
    for (const id of Object.keys(r.counts).sort()) for (const lvl of ['FAIL', 'WARN']) if (r.counts[id][lvl]) console.log(pad(id, 16) + pad(lvl + (lvl === 'FAIL' && allow.includes(id) ? '*' : ''), 7) + pad(r.width + '/' + r.scheme, 18) + r.counts[id][lvl]);
  }
  console.log('\nFindings (first per id and level):');
  for (const id of ids) for (const lvl of ['FAIL', 'WARN']) {
    const hit = all.find((f) => f.id === id && f.level === lvl);
    if (hit) console.log(`  [${lvl}] ${id} @${hit.width}/${hit.scheme} ${hit.selector}\n         ${hit.message}\n         fix: ${hit.fix}`);
  }
  console.log('\nScreenshots:');
  for (const r of runs) if (r.screenshots) console.log('  ' + r.screenshots.top + '\n  ' + r.screenshots.full);
  console.log('\nreport: ' + join(outDir, 'report.json'));
  const warns = all.filter((f) => f.level === 'WARN' && !allow.includes(f.id));
  const warnNote = warns.length ? `; ${warns.length} WARN to fix or name as exemptions (ids: ${[...new Set(warns.map((f) => f.id))].join(', ')})` : '';
  const errNote = errored.length ? `; INCOMPLETE: ${errored.length} run(s) errored (${errored.map((r) => r.width + '/' + r.scheme).join(', ')}), so those widths were not checked` : '';
  console.log((failing.length ? `FAIL: ${failing.length} finding(s) not allowed (ids: ${[...new Set(failing.map((f) => f.id))].join(', ')})` : errored.length ? 'NOT CHECKED IN FULL: 0 FAIL in the runs that completed' : 'PASS: 0 FAIL' + (allow.length ? ' (allowed: ' + allow.join(', ') + ')' : '')) + errNote + warnNote);
}
process.exit(exitCode);
