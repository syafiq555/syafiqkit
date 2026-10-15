import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const die = (msg) => { console.error(msg); process.exit(1); };

function loadPlaywright() {
  const bases = [process.env.PLAYWRIGHT_DIR, process.cwd()].filter(Boolean);
  for (const base of bases) {
    try {
      return createRequire(join(base, 'package.json'))('playwright');
    } catch {}
  }
  die('playwright not found: run from a folder that has it installed, or set PLAYWRIGHT_DIR to one.');
}
const { chromium } = loadPlaywright();

const root = dirname(fileURLToPath(import.meta.url));
const [, , mode = 'video', w = '1080', h = '1920', outArg, ...rest] = process.argv;
const out = outArg ?? (mode === 'cues' ? 'cues.json' : 'out/clip_9x16.mp4');
const FPS = +(process.env.FPS || 30);
const DUR = +(process.env.DUR || 20);
const FILM = process.env.FILM || 'film.html';
const types = {
  '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.json': 'application/json', '.js': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
};

if (!['video', 'stills', 'cues'].includes(mode)) die(`mode must be "video", "stills" or "cues", got "${mode}"`);
if (!Number.isInteger(+w) || !Number.isInteger(+h) || +w <= 0 || +h <= 0) die(`width and height must be positive integers, got ${w} ${h}`);
if (!(FPS > 0) || !(DUR > 0) || !Number.isFinite(FPS * DUR)) die(`FPS and DUR must be positive numbers, got FPS=${process.env.FPS} DUR=${process.env.DUR}`);
if (mode === 'video' && (+w % 2 || +h % 2)) die(`video needs even dimensions for yuv420p, got ${w}x${h}`);
const stillTimes = rest.map(Number);
if (mode === 'stills' && (!stillTimes.length || stillTimes.some(Number.isNaN))) die(`still times must be numbers, got: ${rest.join(' ') || '(none)'}`);

const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const port = server.address().port;

let browser;
let ff;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'warning') console.error('film:', m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) console.error(`${r.status()} ${r.url()}`); });
  const story = process.env.STORY ? `&story=${encodeURIComponent(process.env.STORY)}` : '';
  await page.goto(`http://127.0.0.1:${port}/${FILM}?w=${w}&h=${h}${story}`);
  let readyTimer;
  await Promise.race([
    page.evaluate(() => window.ready),
    new Promise((_, no) => { readyTimer = setTimeout(() => no(new Error('the film was not ready after 60 s: check the story file and the page errors above')), 60000); }),
  ]).finally(() => clearTimeout(readyTimer));
  const canvas = page.locator('canvas').first();

  if (mode === 'cues') {
    const cues = await page.evaluate(() => window.cues);
    if (!cues) throw new Error('the film defines no window.cues');
    await mkdir(dirname(resolve(root, out)), { recursive: true });
    await writeFile(resolve(root, out), JSON.stringify(cues, null, 2) + '\n');
  } else if (mode === 'stills') {
    await mkdir(join(root, 'out/stills'), { recursive: true });
    for (const t of stillTimes) {
      await page.evaluate((t) => window.seek(t), t);
      await canvas.screenshot({ path: join(root, `out/stills/${w}x${h}_${t.toFixed(2).padStart(5, '0')}.png`) });
    }
  } else {
    const target = resolve(root, out);
    await mkdir(dirname(target), { recursive: true });
    ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', `${FPS}`, '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', target], { stdio: ['pipe', 'inherit', 'inherit'] });
    let spawnError = null;
    let ffClosed = false;
    const ffDone = new Promise((r) => {
      ff.on('error', (e) => { spawnError = e; ffClosed = true; r(-1); });
      ff.on('close', (c) => { ffClosed = true; r(c); });
    });
    ff.stdin.on('error', () => {});
    const ffFailure = async () => {
      const code = await ffDone;
      return spawnError ? `could not run ffmpeg: ${spawnError.message}` : `ffmpeg exited ${code} before the last frame was written`;
    };
    const filmDuration = await page.evaluate(() => window.cues?.duration);
    const frames = Math.round(FPS * (process.env.DUR || !(filmDuration > 0) ? DUR : filmDuration));
    for (let f = 0; f < frames; f++) {
      if (ffClosed) throw new Error(await ffFailure());
      await page.evaluate((t) => window.seek(t), f / FPS);
      const png = await canvas.screenshot();
      if (!ff.stdin.write(png)) await Promise.race([new Promise((r) => ff.stdin.once('drain', r)), ffDone]);
    }
    ff.stdin.end();
    const code = await ffDone;
    if (spawnError || code !== 0) throw new Error(spawnError ? await ffFailure() : `ffmpeg exited ${code}`);
  }
} finally {
  if (ff && ff.exitCode === null) ff.kill();
  if (browser) await browser.close().catch(() => {});
  server.closeAllConnections?.();
  server.close();
}
