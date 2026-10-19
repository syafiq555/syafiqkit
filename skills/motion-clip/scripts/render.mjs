import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

if (!['video', 'stills', 'cues', 'check'].includes(mode)) die(`mode must be "video", "stills", "cues" or "check", got "${mode}"`);
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
  const pageErrors = [];
  const filmWarnings = [];
  page.on('pageerror', (e) => { pageErrors.push(e.message); console.error('page error:', e.message); });
  page.on('console', (m) => { if (m.type() === 'warning') { filmWarnings.push(m.text()); console.error('film:', m.text()); } });
  page.on('response', (r) => { if (r.status() >= 400) { filmWarnings.push(`${r.status()} ${r.url()}`); console.error(`${r.status()} ${r.url()}`); } });
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
  } else if (mode === 'check') {
    const errors = [];
    const warnings = [];
    const passed = [];
    const filmDuration = await page.evaluate(() => window.cues?.duration);
    const length = process.env.DUR || !(filmDuration > 0) ? DUR : filmDuration;
    const times = [];
    for (let t = 0; t < length - 1e-6; t += 0.5) times.push(Math.round(t * 1000) / 1000);
    times.push(Math.round((length - 1 / FPS) * 1000) / 1000);
    const shuffled = (list, seed) => {
      const a = [...list];
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const flatNow = () => page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const x = c.getContext('2d');
      x.drawImage(document.querySelector('canvas'), 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data;
      for (let i = 4; i < d.length; i += 4) if (Math.abs(d[i] - d[0]) + Math.abs(d[i + 1] - d[1]) + Math.abs(d[i + 2] - d[2]) > 6) return false;
      return true;
    });
    const flat = [];
    const pass = async (order, scan) => {
      const shots = new Map();
      for (const t of order) {
        await page.evaluate((t) => window.seek(t), t);
        shots.set(t, createHash('sha256').update(await canvas.screenshot()).digest('hex'));
        if (scan && t >= 0.5 && await flatNow()) flat.push(t);
      }
      return shots;
    };
    const first = await pass(shuffled(times, 1), true);
    const second = await pass(shuffled(times, 2), false);
    const changed = times.filter((t) => first.get(t) !== second.get(t));
    if (changed.length) errors.push(`${changed.length} of ${times.length} frames drew differently the second time (${changed.slice(0, 6).join(', ')}${changed.length > 6 ? ', ...' : ''} s): something in the draw depends on more than t (a random number, a clock, state kept between frames)`);
    else passed.push(`${times.length} frames drawn twice, in two shuffled orders: same t, same picture`);
    if (new Set(times.map((t) => first.get(t))).size === 1) errors.push('every frame is the same picture: nothing in the film changes with t');
    flat.sort((a, b) => a - b);
    if (flat.length) warnings.push(`one flat colour at ${flat.slice(0, 6).join(', ')}${flat.length > 6 ? ', ...' : ''} s: if that is not meant, nothing was drawn there`);
    const fonts = await page.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d');
      const width = (font) => { c.font = font; return c.measureText('Hamburgefonstiv 0123').width; };
      return Object.entries(window.STORY.fonts).filter(([, f]) => f && f.family && !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(f.family)).map(([role, f]) => ({
        role, family: f.family,
        found: ['monospace', 'serif'].some((fallback) => width(`${f.weight} 40px "${f.family}", ${fallback}`) !== width(`${f.weight} 40px ${fallback}`)),
      }));
    });
    for (const f of fonts) {
      if (f.found) passed.push(`${f.role} font "${f.family}" is available`);
      else warnings.push(`${f.role} font "${f.family}" is not on this machine and has no file: the browser draws a fallback font instead; give it a file`);
    }
    const voice = (await page.evaluate(() => window.cues?.voice)) || [];
    const unspoken = voice.filter((v) => !existsSync(resolve(root, v.file)));
    if (unspoken.length) errors.push(`${unspoken.length} of ${voice.length} voice lines have no file yet (${unspoken.map((v) => v.file).join(', ')}): write the cues and run voice.mjs`);
    else if (voice.length) passed.push(`all ${voice.length} voice lines have a file`);
    const audio = resolve(root, process.env.AUDIO || 'score.wav');
    if (existsSync(audio)) {
      const meter = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', audio, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr ?? '';
      const summary = meter.slice(meter.lastIndexOf('Summary'));
      const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
      const peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
      if (!Number.isFinite(lufs)) warnings.push(`could not measure ${audio}: is ffmpeg on the PATH and the file a sound?`);
      else {
        const line = `${audio.slice(root.length + 1)}: ${lufs} LUFS integrated, true peak ${Number.isFinite(peak) ? `${peak} dBTP` : 'unknown'}`;
        if (Math.abs(lufs + 14) > 1.5 || peak > -1) warnings.push(`${line}; aim for about -14 LUFS with the peak under -1 dBTP (run the loudnorm step)`);
        else passed.push(line);
      }
    }
    errors.unshift(...[...new Set(pageErrors)].map((e) => `page error: ${e}`));
    warnings.unshift(...new Set(filmWarnings));
    console.log(`check ${w}x${h}, ${length} s`);
    for (const p of passed) console.log(`ok     ${p}`);
    for (const x of warnings) console.log(`warn   ${x}`);
    for (const e of errors) console.log(`error  ${e}`);
    if (errors.length) process.exitCode = 1;
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
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv',
      '-c:v', 'libx264', '-crf', '16', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-movflags', '+faststart', target], { stdio: ['pipe', 'inherit', 'inherit'] });
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
