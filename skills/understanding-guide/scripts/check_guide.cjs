// Usage: node check_guide.cjs <guide.html> [outdir]
// Run it from a folder whose node_modules has playwright (or @playwright/test, or playwright-core).
// Uses the installed Google Chrome (channel: 'chrome'), so no browser download is needed.
// Exits 1 when a view overflows, a line runs past 80 characters, the page throws, or a behaviour check fails.
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

if (!process.argv[2]) {
  console.error('Usage: node check_guide.cjs <guide.html> [outdir]');
  process.exit(2);
}

function loadPlaywright() {
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
    try { return require(require.resolve(name, { paths: [process.cwd()] })); } catch {}
  }
  console.error('Playwright not found from ' + process.cwd() + '. Run from a folder with it in node_modules.');
  process.exit(2);
}

const MAX_CHARS = 80;
const pw = loadPlaywright();
const file = pathToFileURL(path.resolve(process.argv[2])).href;
const out = path.resolve(process.argv[3] || 'guide-shots');
fs.mkdirSync(out, { recursive: true });

const probe = () => {
  const v = [...document.querySelectorAll('.view')].find(x => !x.hidden);
  const overflow = [...document.querySelectorAll('body *')].filter(el => el.offsetParent && el.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length;
  let maxChars = 0;
  for (const p of v ? v.querySelectorAll('.ans, .lead, .why, .wants, .says') : []) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const lines = new Map();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.length; i++) {
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
        const rect = r.getClientRects()[0];
        if (rect) { const k = Math.round(rect.top); lines.set(k, (lines.get(k) || 0) + 1); }
      }
    }
    for (const c of lines.values()) maxChars = Math.max(maxChars, c);
  }
  return { id: v && v.id, height: v ? Math.round(v.getBoundingClientRect().height) : 0, overflow, maxChars };
};

(async () => {
  const res = { views: {}, errors: [], failures: [] };
  let b;
  try {
    try { b = await pw.chromium.launch({ channel: 'chrome' }); }
    catch (err) { throw new Error('Could not start Google Chrome (channel: chrome). Install Chrome or change the channel. ' + err.message); }

    for (const scheme of ['dark', 'light']) for (const [w, h] of [[375, 812], [768, 1024], [1280, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
      const p = await ctx.newPage(); p.on('pageerror', e => res.errors.push(e.message));
      await p.goto(file + '#start'); await p.waitForTimeout(100);
      const ids = await p.$$eval('.view', vs => vs.map(v => v.id));
      for (const id of ids) {
        await p.goto(file + '#' + id); await p.waitForTimeout(80);
        await p.screenshot({ path: `${out}/${id}-${scheme}-${w}.png` });
        res.views[`${id}-${scheme}-${w}`] = await p.evaluate(probe);
      }
      await ctx.close();
    }

    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
    const p = await ctx.newPage(); p.on('pageerror', e => res.errors.push(e.message));
    await p.goto(file + '#start');
    const links = await p.$$eval('.tlist a', as => as.map(a => ({ href: a.getAttribute('href'), title: a.querySelector('.ttl').textContent })));
    if (links.length > 1) {
      const last = links[links.length - 1];
      await p.goto(file + last.href); await p.click('#back'); await p.goto(file + '#start'); await p.waitForTimeout(80);
      res.laterFirst = (await p.$eval('.tlist li:first-child .ttl', x => x.textContent)) === last.title ? 'Later' : 'not first';
      await p.evaluate(() => localStorage.clear());
    }
    await p.goto(file + '#ref'); await p.fill('#q', 'zzzqqqxx'); await p.waitForTimeout(300);
    res.emptySearch = await p.textContent('#qcount');

    const topicWithLink = await p.$$eval('.topic', ts => (ts.find(t => t.querySelector('details.more a.lineref')) || {}).id).catch(() => null);
    if (topicWithLink) {
      await p.goto(file + '#' + topicWithLink); await p.waitForTimeout(80);
      const d = p.locator('.view:not([hidden]) details.more:has(a.lineref)').first();
      await d.evaluate(x => x.open = true);
      await d.locator('a.lineref').first().click(); await p.waitForTimeout(300);
      res.lineLink = await p.evaluate(() => ({ hash: location.hash, highlighted: document.querySelectorAll('.srcrep p.hl').length }));
    }
  } catch (err) {
    res.errors.push('check aborted: ' + err.message);
  } finally {
    if (b) await b.close();
    const views = Object.entries(res.views);
    res.overflowViews = views.filter(([, v]) => v.overflow > 0).map(([k]) => k);
    res.longLineViews = views.filter(([, v]) => v.maxChars > MAX_CHARS).map(([k, v]) => `${k} (${v.maxChars})`);
    if (res.overflowViews.length) res.failures.push('views overflow sideways');
    if (res.longLineViews.length) res.failures.push(`lines over ${MAX_CHARS} characters`);
    if (res.errors.length) res.failures.push('page or check errors');
    if (res.laterFirst !== undefined && res.laterFirst !== 'Later') res.failures.push('"Later" topic did not sort first');
    if (!/^No finding matches/.test(res.emptySearch || '')) res.failures.push('empty search shows no message');
    if (res.lineLink && res.lineLink.highlighted !== 1) res.failures.push('source-line link did not highlight its line');
    console.log(JSON.stringify(res, null, 1));
    process.exitCode = res.failures.length ? 1 : 0;
  }
})();
