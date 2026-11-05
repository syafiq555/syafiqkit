// node render.cjs <html> <out.png> <width> <height> [transparent: 1]
// PLAYWRIGHT_DIR: a project root whose node_modules has playwright or @playwright/test.
const path = require('path');
const { pathToFileURL } = require('url');
const searchPaths = [process.env.PLAYWRIGHT_DIR, process.cwd(), __dirname].filter(Boolean);
const resolvePw = () => {
  for (const name of ['playwright', '@playwright/test']) {
    try { return require.resolve(name, { paths: searchPaths }); } catch {}
  }
  return null;
};
const pw = resolvePw();
if (!pw) { console.error('Playwright not found. Set PLAYWRIGHT_DIR to a project root that has playwright installed.'); process.exit(1); }
const { chromium } = require(pw);
const [html, out, w, h, transparent] = process.argv.slice(2);
if (!html || !out || !w || !h) { console.error('usage: node render.cjs <html> <out.png> <width> <height> [1]'); process.exit(1); }
const isTransparent = transparent === '1';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
  const missing = [], errors = [];
  page.on('requestfailed', (r) => missing.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400) missing.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(html)).href + (isTransparent ? '?transparent' : ''));
  const state = await page.waitForFunction(() => document.body.dataset.ready || (!window.STILL && 'static'), null, { timeout: 15000 })
    .then((r) => r.jsonValue()).catch(() => 'timeout');
  if (state === 'error') errors.push(await page.evaluate(() => document.body.dataset.error));
  if (state === 'timeout') errors.push('the page never finished building (15 s)');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.complete || new Promise((r) => { i.onload = i.onerror = r; }))));
  const { broken, placeholders, size } = await page.evaluate(() => ({
    broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')),
    placeholders: document.querySelectorAll('.slice.missing').length,
    size: window.STILL ? [window.STILL.width, window.STILL.height] : null,
  }));
  if (placeholders) console.warn(`warning: ${placeholders} card(s) have no src and render as "missing" boxes`);
  if (size && (size[0] !== +w || size[1] !== +h)) console.warn(`warning: STILL is ${size[0]}x${size[1]} but you rendered ${w}x${h}`);
  await page.screenshot({ path: out, omitBackground: isTransparent });
  await browser.close();
  if (errors.length) { console.error('Page error:', errors.join(' | ')); process.exit(1); }
  if (broken.length || missing.length) { console.error('Could not load:', [...new Set([...broken, ...missing])].join(', ')); process.exit(1); }
  console.log('wrote', out);
})();
