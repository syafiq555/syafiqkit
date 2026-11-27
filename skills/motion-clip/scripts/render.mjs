import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extname, join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { availableParallelism, tmpdir } from 'node:os';

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

const ZONES = {
  tiktok: {
    label: 'TikTok (TikTok Ads In-Feed safe zone template, standard LTR)',
    bands: [
      { name: 'top 240 px (tabs, search)', x0: 0, y0: 0, x1: 1080, y1: 240 },
      { name: 'bottom 660 px (caption, sound, call to action)', x0: 0, y0: 1260, x1: 1080, y1: 1920 },
      { name: 'left 120 px', x0: 0, y0: 0, x1: 120, y1: 1920 },
      { name: 'right 120 px', x0: 960, y0: 0, x1: 1080, y1: 1920 },
      { name: 'action buttons (x 780 to 960, from y 840)', x0: 780, y0: 840, x1: 960, y1: 1260 },
    ],
  },
  'instagram-reels': {
    label: 'Instagram Reels (Meta: 14% top, 35% bottom, 6% sides)',
    bands: [
      { name: 'top 14% (269 px)', x0: 0, y0: 0, x1: 1080, y1: 269 },
      { name: 'bottom 35% (672 px)', x0: 0, y0: 1248, x1: 1080, y1: 1920 },
      { name: 'left 6% (65 px)', x0: 0, y0: 0, x1: 65, y1: 1920 },
      { name: 'right 6% (65 px)', x0: 1015, y0: 0, x1: 1080, y1: 1920 },
    ],
  },
  'youtube-shorts': {
    label: 'YouTube Shorts (Google universal vertical video ad safe zone)',
    bands: [
      { name: 'top 288 px', x0: 0, y0: 0, x1: 1080, y1: 288 },
      { name: 'bottom 672 px', x0: 0, y0: 1248, x1: 1080, y1: 1920 },
      { name: 'left 48 px', x0: 0, y0: 0, x1: 48, y1: 1920 },
      { name: 'right 192 px', x0: 888, y0: 0, x1: 1080, y1: 1920 },
    ],
  },
};

const root = dirname(fileURLToPath(import.meta.url));
const [, , mode = 'video', fullW = '1080', fullH = '1920', outArg, ...rest] = process.argv;
const draft = mode === 'draft';
const even = (n) => 2 * Math.round(n / 4);
const w = draft ? String(even(+fullW)) : fullW, h = draft ? String(even(+fullH)) : fullH;
const out = outArg ?? { cues: 'cues.json', board: 'out/storyboard.md', draft: `out/draft_${fullW}x${fullH}.mp4` }[mode] ?? 'out/clip_9x16.mp4';
const FPS = +(process.env.FPS || (draft ? 15 : 30));
const DUR = +(process.env.DUR || 20);
const FILM = process.env.FILM || 'film.html';
const WORKERS = +(process.env.WORKERS || Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))));
const PRESET = process.env.PRESET || '';
const APP_STORE_SIZES = ['886x1920', '1920x886', '1080x1920', '1920x1080', '750x1334', '1334x750', '1200x1600', '1600x1200', '900x1200', '1200x900'];
const STORE_PRESETS = ['app-store', 'google-play'];
if (PRESET && !STORE_PRESETS.includes(PRESET) && !ZONES[PRESET]) die(`PRESET must be one of ${[...STORE_PRESETS, ...Object.keys(ZONES)].join(', ')}, got "${PRESET}"`);
const zoneScale = { x: +fullW / 1080, y: +fullH / 1920 };
const zones = ZONES[PRESET] && Math.abs(+fullH / +fullW - 16 / 9) < 0.02
  ? ZONES[PRESET].bands.map((b) => ({ ...b, x0: b.x0 * zoneScale.x, x1: b.x1 * zoneScale.x, y0: b.y0 * zoneScale.y, y1: b.y1 * zoneScale.y }))
  : null;
if (ZONES[PRESET] && !zones && ['check', 'review'].includes(mode)) console.error(`PRESET=${PRESET} describes a 9:16 screen, so its UI bands are not checked at ${fullW}x${fullH}`);
const STATIC_MAX = process.env.STATIC_MAX === undefined || process.env.STATIC_MAX === '' ? 2 : +process.env.STATIC_MAX;
if (!(STATIC_MAX >= 0)) die(`STATIC_MAX must be a number of seconds (0 turns the stillness check off), got "${process.env.STATIC_MAX}"`);
if (PRESET === 'app-store' && mode === 'video' && !APP_STORE_SIZES.includes(`${w}x${h}`)) die(`an App Store preview must be one of ${APP_STORE_SIZES.join(', ')}; got ${w}x${h} (886 1920 for current iPhones)`);
if (PRESET === 'app-store' && FPS > 30) die(`an App Store preview runs at most 30 fps, got FPS=${FPS}`);
const types = {
  '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.json': 'application/json', '.js': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
};

const MODES = ['video', 'draft', 'stills', 'cues', 'check', 'board', 'review', 'verify'];
if (!MODES.includes(mode)) die(`mode must be one of ${MODES.join(', ')}, got "${mode}"`);
if (!Number.isInteger(+fullW) || !Number.isInteger(+fullH) || +fullW <= 0 || +fullH <= 0) die(`width and height must be positive integers, got ${fullW} ${fullH}`);
if (!(FPS > 0) || !(DUR > 0) || !Number.isFinite(FPS * DUR)) die(`FPS and DUR must be positive numbers, got FPS=${process.env.FPS ?? '(default)'} DUR=${process.env.DUR ?? '(default)'}`);
if ((mode === 'video' || draft) && (!Number.isInteger(WORKERS) || WORKERS < 1)) die(`WORKERS must be a whole number of 1 or more, got ${process.env.WORKERS}`);
if (mode === 'video' && (+w % 2 || +h % 2)) die(`video needs even dimensions for yuv420p, got ${w}x${h}`);
const stillTimes = rest.map(Number);
if (mode === 'stills' && (!stillTimes.length || stillTimes.some(Number.isNaN))) die(`still times must be numbers, got: ${rest.join(' ') || '(none)'}`);

if (mode === 'verify') {
  if (!outArg) die('verify needs the finished video: node render.mjs verify 1080 1920 out/clip_9x16_music.mp4');
  const file = resolve(root, outArg);
  if (!existsSync(file)) die(`no such video: ${outArg}`);
  const errors = [], warnings = [], passed = [];
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,nb_frames,r_frame_rate,duration:format=duration,size', '-of', 'json', file], { encoding: 'utf8' });
  if (probe.error) die(`could not run ffprobe: ${probe.error.message}`);
  const info = JSON.parse(probe.stdout || '{}');
  const video = (info.streams || []).find((s) => s.codec_type === 'video');
  const audio = (info.streams || []).find((s) => s.codec_type === 'audio');
  const duration = +info.format?.duration;
  if (!video) die(`${outArg} has no video stream`);
  if (!(duration > 0)) die(`ffprobe could not read the length of ${outArg}: the file is damaged or not finished writing`);
  if (`${video.width}x${video.height}` !== `${fullW}x${fullH}`) errors.push(`the video is ${video.width}x${video.height}, not the ${fullW}x${fullH} asked for`);
  else passed.push(`${video.width}x${video.height}, ${duration.toFixed(2)} s, ${(+info.format.size / 1048576).toFixed(1)} MB`);
  let expected = process.env.DUR ? +process.env.DUR : null;
  const from = process.env.DUR ? 'DUR' : 'cues.json';
  if (expected == null && existsSync(resolve(root, 'cues.json'))) {
    try { expected = +JSON.parse(await readFile(resolve(root, 'cues.json'), 'utf8')).duration || null; }
    catch { warnings.push('cues.json could not be read, so the length was not compared: run "node render.mjs cues" again, or pass DUR=<seconds>'); }
  }
  if (expected != null) {
    if (Math.abs(duration - expected) > 0.15) errors.push(`the video runs ${duration.toFixed(2)} s but the film is ${expected} s (from ${from}): ${duration < expected ? 'a render or mux stopped early (a mux chained with ";" after a failed render does this)' : 'the video is longer than the film (a mux without -shortest, or a render with a different DUR)'}, or ${from} belongs to another cut (pass DUR=<seconds>)`);
    else passed.push(`length matches the film (${expected} s, from ${from})`);
  } else if (!existsSync(resolve(root, 'cues.json'))) warnings.push('no cues.json and no DUR, so the length was not compared to the film');
  const yavgName = `verify-yavg-${process.pid}.txt`;
  const yavgFile = join(tmpdir(), yavgName);
  const scan = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file,
    '-vf', `blackdetect=d=0.1:pix_th=0.10,freezedetect=n=-60dB:d=2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=${yavgName}`,
    ...(audio ? ['-af', 'silencedetect=noise=-80dB:d=0.02,ebur128=peak=true'] : []), '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: tmpdir() });
  if (scan.error) die(`could not run ffmpeg: ${scan.error.message}`);
  const log = scan.stderr || '';
  if (scan.status !== 0) {
    spawnSync('rm', ['-f', yavgFile]);
    die(`ffmpeg could not scan ${outArg} (exit ${scan.status}), so nothing was checked:\n${log.trim().split('\n').slice(-4).join('\n')}`);
  }
  const blacks = [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  if (blacks.length) warnings.push(`black picture at ${blacks.slice(0, 5).map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)} s`).join(', ')}: fine for a planned fade, otherwise a frame failed to draw`);
  else passed.push('no black stretches');
  const freezes = [];
  let freezeAt = null;
  for (const m of log.matchAll(/freeze_(start|duration): ([\d.]+)/g)) {
    if (m[1] === 'start') freezeAt = +m[2];
    else if (freezeAt != null) { freezes.push([freezeAt, +m[2]]); freezeAt = null; }
  }
  if (freezeAt != null) freezes.push([freezeAt, duration - freezeAt]);
  if (freezes.length) warnings.push(`the picture stands still for ${freezes.slice(0, 5).map(([a, d]) => `${d.toFixed(1)} s from ${a.toFixed(2)} s`).join(', ')}: a feed viewer reads a still frame as a stalled video, so keep something moving`);
  else passed.push('no frozen stretches of 2 s or more');
  const yavg = existsSync(yavgFile) ? [...(await readFile(yavgFile, 'utf8')).matchAll(/pts_time:([\d.]+)\s+lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) => [+m[1], +m[2]]) : [];
  const decodedTo = yavg.length ? yavg[yavg.length - 1][0] : 0;
  const damaged = /Decoding error|partial file|Invalid NAL|corrupt|Error while decoding/i.exec(log);
  if (yavg.length && decodedTo < duration - 0.5) errors.push(`only the first ${decodedTo.toFixed(1)} s of ${duration.toFixed(1)} s could be decoded${damaged ? ` (ffmpeg: "${damaged[0]}")` : ''}: the file is truncated or damaged, though its header claims the full length; render or copy it again`);
  else if (damaged) warnings.push(`ffmpeg reported "${damaged[0]}" while decoding: play the file through once before sending it`);
  spawnSync('rm', ['-f', yavgFile]);
  const flashes = [];
  for (let i = 1; i < yavg.length - 1; i++) {
    const [, a] = yavg[i - 1], [t, b] = yavg[i], [, c] = yavg[i + 1];
    if (Math.abs(b - a) > 30 && Math.abs(b - c) > 30 && Math.abs(a - c) < 12 && Math.sign(b - a) === Math.sign(b - c)) flashes.push(t);
    else if (i < yavg.length - 2) {
      const [, d] = yavg[i + 2];
      if (Math.abs(b - a) > 30 && Math.abs(c - a) > 30 && Math.abs(a - d) < 12 && Math.sign(b - a) === Math.sign(c - a)) { flashes.push(t); i++; }
    }
  }
  if (!yavg.length) warnings.push('frame brightness not measured, so single-frame flashes were not checked');
  else if (flashes.length) errors.push(`${flashes.length} single-frame flash${flashes.length > 1 ? 'es' : ''} at ${flashes.slice(0, 6).map((t) => t.toFixed(2)).join(', ')} s: one frame much brighter or darker than both neighbours is a draw glitch, not motion`);
  else passed.push(`no single-frame flashes across ${yavg.length} frames`);
  if (!audio) (existsSync(resolve(root, process.env.AUDIO || 'score.wav')) ? warnings : passed).push('no sound track: mux score.wav in (section 5) unless this is the silent version');
  else {
    const silences = [];
    let open = null;
    for (const m of log.matchAll(/silence_(start|end): (-?[\d.]+)/g)) {
      if (m[1] === 'start') open = +m[2];
      else if (open != null) { silences.push([open, +m[2]]); open = null; }
    }
    if (open != null) silences.push([open, duration]);
    const inner = silences.filter(([a, b]) => a > 0.05 && b < duration - 0.05);
    const audioLength = +audio.duration;
    if (audioLength > 0 && audioLength < duration - 0.15) warnings.push(`the sound track runs ${audioLength.toFixed(2)} s against ${duration.toFixed(2)} s of picture, so the last ${(duration - audioLength).toFixed(1)} s are silent: mux with -shortest from a full-length score.wav`);
    for (const [a, b] of silences.filter(([a, b]) => (a <= 0.05 || b >= duration - 0.05) && b - a > 0.3)) warnings.push(`silent ${a <= 0.05 ? 'opening' : 'ending'}, ${a.toFixed(1)}-${b.toFixed(1)} s: meant, or did the music start late or stop early?`);
    const musicBed = process.env.VOICE_ONLY !== '1' && existsSync(resolve(root, process.env.AUDIO || 'score.wav'));
    const pauseFrom = musicBed ? 1 : 0.12;
    const dropouts = inner.filter(([a, b]) => b - a < pauseFrom || (musicBed && b - a <= 1));
    const pauses = musicBed ? [] : inner.filter(([a, b]) => b - a >= 0.12 && b - a <= 1);
    const gaps = inner.filter(([a, b]) => b - a > 1);
    if (dropouts.length) errors.push(`${dropouts.length} audio dropout${dropouts.length > 1 ? 's' : ''} (${musicBed ? 'digital silence of 20 ms to 1 s with sound on both sides, under a music bed that should never stop' : 'digital silence of 20 to 120 ms with sound on both sides, shorter than any spoken pause'}) at ${dropouts.slice(0, 5).map(([a, b]) => `${a.toFixed(2)} s for ${Math.round((b - a) * 1000)} ms`).join(', ')}: a cut or mux clipped the sound`);
    else passed.push('no audio dropouts');
    if (pauses.length) warnings.push(`digital silence ${pauses.slice(0, 5).map(([a, b]) => `at ${a.toFixed(2)} s for ${Math.round((b - a) * 1000)} ms`).join(', ')}: normal between voice lines with no music under them (Kokoro leaves 0.15 to 0.4 s of exact silence), a clipped sound if a music bed should be playing`);
    if (gaps.length) warnings.push(`total silence ${gaps.slice(0, 4).map(([a, b]) => `${a.toFixed(1)}-${b.toFixed(1)} s`).join(', ')}: meant as a pause, or a missing line?`);
    const summary = log.slice(log.lastIndexOf('Summary'));
    const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
    const peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
    if (Number.isFinite(lufs)) {
      const line = `finished sound: ${lufs} LUFS integrated, true peak ${Number.isFinite(peak) ? `${peak} dBTP` : 'unknown'}`;
      const off = Math.abs(lufs + 14) > 1.5 || !Number.isFinite(peak) || peak > -1;
      (off ? warnings : passed).push(off ? `${line}; aim for about -14 LUFS with the peak under -1 dBTP` : line);
    } else warnings.push('finished loudness not measured: ffmpeg printed no ebur128 summary');
  }
  console.log(`verify ${outArg}`);
  for (const p of passed) console.log(`ok     ${p}`);
  for (const x of warnings) console.log(`warn   ${x}`);
  for (const e of errors) console.log(`error  ${e}`);
  console.log('Measured, not heard: a person still has to listen to it.');
  process.exit(errors.length ? 1 : 0);
}

if (mode === 'review' && !existsSync(new URL('./review-page.mjs', import.meta.url))) die('review needs review-page.mjs beside render.mjs: copy it from the plugin\'s skills/_shared/scripts/');
const { chromium } = loadPlaywright();

const TEXT_HOOK = () => {
  const q = new URLSearchParams(location.search);
  const W = +(q.get('w') || 1080), H = +(q.get('h') || 1920);
  window.__textLog = null;
  for (const name of ['fillText', 'strokeText']) {
    const orig = CanvasRenderingContext2D.prototype[name];
    CanvasRenderingContext2D.prototype[name] = function (text, x, y, ...more) {
      const log = window.__textLog;
      const str = String(text);
      if (log && this.canvas.width === W && this.canvas.height === H && str.trim() && this.globalAlpha > 0.05) {
        const m = this.measureText(str);
        const k = more[0] != null && m.width > more[0] ? more[0] / m.width : 1;
        const l = x - m.actualBoundingBoxLeft * k, r = x + m.actualBoundingBoxRight * k;
        const t = y - m.actualBoundingBoxAscent, b = y + m.actualBoundingBoxDescent;
        const T = this.getTransform();
        const pts = [[l, t], [r, t], [l, b], [r, b]].map(([px, py]) => [T.a * px + T.c * py + T.e, T.b * px + T.d * py + T.f]);
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        log.push({ text: str, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
      }
      return orig.call(this, text, x, y, ...more);
    };
  }
};

function productMoment() {
  const s = window.STORY;
  const name = s.lockup && String(s.lockup.name || '').trim().toLowerCase();
  const named = name && s.hook.find((x) => String(x.text).toLowerCase().includes(name));
  const seen = [];
  if (s.screens.length) seen.push({ at: +s.device.enter, what: s.frame === 'none' ? 'the first picture' : `the ${s.frame}` });
  if (s.photos.length) seen.push({ at: Math.min(...s.photos.map((p) => +p.from)), what: 'the first full-frame photo' });
  if (s.lockup) seen.push({ at: +s.lockup.at, what: 'the logo' });
  if (named) seen.push({ at: +named.in, what: 'its name in the hook' });
  return { first: seen.sort((a, b) => a.at - b.at)[0] || null, pictures: s.screens.length + s.photos.length > 0 };
}

function productLine(p, by) {
  if (!p.pictures) return { late: false, line: `no product pictures, so the ${by} s rule falls to the hook: ${p.first && p.first.what === 'its name in the hook' ? `it names the product at ${p.first.at.toFixed(1)} s` : 'name the product there if this is a promo, not a logo reveal'}` };
  const late = p.first.at > by;
  return { late, line: `the product first shows at ${p.first.at.toFixed(1)} s (${p.first.what})${late ? `; ${by === 10 ? 'Google Play asks for the app within the first 10 s' : 'bring it in by 3 s, or name it in the hook, before viewers scroll on'}` : ''}` };
}

function onScreenText() {
  const s = window.STORY;
  const plain = (rows) => rows.map((r) => (Array.isArray(r) ? r[0] : r)).join(' ');
  const items = [];
  s.hook.forEach((x) => { if (x.out != null) items.push({ what: 'hook', text: String(x.text), from: +x.in, to: +x.out }); });
  s.captions.forEach((c) => { if (c.out != null) items.push({ what: 'caption', text: plain(c.rows), from: +c.in, to: +c.out }); });
  s.photos.forEach((p) => { if (p.rows) items.push({ what: 'photo caption', text: plain(p.rows), from: +p.from + 0.35, to: +p.to }); });
  const per = s.subtitles ? s.subtitles.words || 3 : 0;
  if (per) spoken.forEach((words) => {
    const groups = subtitleGroups(words, per);
    groups.forEach((group, k) => {
      const next = groups[k + 1];
      items.push({ what: 'subtitle', text: group.map((x) => x.text).join(' '), from: group[0].start - 0.05, to: next ? next[0].start - 0.05 : group[group.length - 1].end + 0.4 });
    });
  });
  const pace = spoken.filter((words) => words.length > 1).map((words) => ({
    text: words.map((x) => x.text).join(' '), from: words[0].start, perSecond: words.length / (words[words.length - 1].end - words[0].start),
  }));
  const all = [...s.hook.map((x) => x.text), ...s.captions.map((c) => plain(c.rows)), ...s.voice.map((v) => v.text),
    s.lockup ? `${s.lockup.name || ''} ${s.lockup.line || ''}` : '', s.stat ? `${s.stat.prefix || ''}${s.stat.value}${s.stat.suffix || ''} ${s.stat.label || ''}` : ''].join('\n');
  return { items, pace, all, backdrops: s.backdrops.length, device: s.screens.length ? { enter: +s.device.enter, leave: +s.device.leave } : null };
}

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
  const pageErrors = [];
  const filmWarnings = [];
  const workerWarnings = [];
  const story = process.env.STORY ? `&story=${encodeURIComponent(process.env.STORY)}` : '';
  const openPage = async (first) => {
    const page = await browser.newPage({ viewport: { width: +w, height: +h } });
    if (first && zones && mode === 'check') await page.addInitScript(TEXT_HOOK);
    page.on('pageerror', (e) => { pageErrors.push(e.message); console.error('page error:', e.message); });
    page.on('console', (m) => {
      if (m.type() !== 'warning' || m.text().includes('GL Driver Message')) return;
      if (first) { filmWarnings.push(m.text()); console.error('film:', m.text()); }
      else if (!filmWarnings.includes(m.text())) workerWarnings.push(m.text());
    });
    if (first) page.on('response', (r) => { if (r.status() >= 400) { filmWarnings.push(`${r.status()} ${r.url()}`); console.error(`${r.status()} ${r.url()}`); } });
    await page.goto(`http://127.0.0.1:${port}/${FILM}?w=${w}&h=${h}${story}${draft ? '&draft=1' : ''}`);
    let readyTimer;
    await Promise.race([
      page.evaluate(() => window.ready),
      new Promise((_, no) => { readyTimer = setTimeout(() => no(new Error('the film was not ready after 60 s: check the story file and the page errors above')), 60000); }),
    ]).finally(() => clearTimeout(readyTimer));
    return page;
  };
  const page = await openPage(true);
  const canvas = page.locator('canvas').first();

  if (mode === 'cues') {
    const cues = await page.evaluate(() => window.cues);
    if (!cues) throw new Error('the film defines no window.cues');
    await mkdir(dirname(resolve(root, out)), { recursive: true });
    await writeFile(resolve(root, out), JSON.stringify(cues, null, 2) + '\n');
  } else if (mode === 'board') {
    const rows = await page.evaluate(() => {
      const s = window.STORY;
      const words = (rows) => rows.map((r) => (Array.isArray(r) ? r[0] : r)).join(' ');
      const span = (a, b) => (b == null ? `${(+a).toFixed(1)}` : `${(+a).toFixed(1)}-${(+b).toFixed(1)}`);
      const list = [];
      s.backdrops.forEach((b) => list.push([+b.from, span(b.from, b.to), 'Background', `${b.name || b.file}${b.depth ? ' (moves in depth)' : ''}`]));
      if (s.hook.length) list.push([+s.hook[0].in, span(s.hook[0].in, Math.max(...s.hook.map((x) => x.out ?? 0))), 'Hook', s.hook.map((x) => x.text).join(' ')]);
      if (s.screens.length) list.push([+s.device.enter, span(s.device.enter, s.device.leave), `${s.frame === 'none' ? 'Picture' : s.frame} on screen`, s.screens.map((x) => x.name).join(', ')]);
      s.screens.forEach((x, i) => { if (i) list.push([+x.from, span(x.from), 'Cut to', `${x.name} (${x.via || 'push'})`]); });
      s.photos.forEach((p) => list.push([+p.from, span(p.from, p.to), 'Photo', `${p.file}${p.rows ? `: ${words(p.rows)}` : ''}`]));
      s.taps.forEach((x) => list.push([+x.at, span(x.at), 'Tap', `at ${x.to.map((v) => v.toFixed(2)).join(', ')} of the screen`]));
      s.captions.forEach((c) => list.push([+c.in, span(c.in, c.out), 'Caption', words(c.rows)]));
      s.voice.forEach((v) => list.push([+v.at, span(v.at), 'Voice', v.text]));
      if (s.number) list.push([+s.number.from, span(s.number.from, s.number.to), 'Number', `${s.number.count} cards become "${s.number.pillText}"`]);
      if (s.stat) list.push([+s.stat.at, span(s.stat.at, s.stat.out), 'Number', `${s.stat.prefix || ''}${s.stat.value}${s.stat.suffix || ''} ${s.stat.label || ''}${s.stat.source ? ` (source: ${s.stat.source})` : ''}`]);
      if (s.lockup) list.push([+s.lockup.at, span(s.lockup.at, s.duration), 'Logo and call to action', `${s.lockup.name}${s.lockup.line ? `: ${s.lockup.line}` : ''}`]);
      return { duration: s.duration, subtitles: !!s.subtitles, rows: list.sort((a, b) => a[0] - b[0]).map((r) => r.slice(1)) };
    });
    const cell = (x) => String(x).replace(/\|/g, '/').replace(/\n/g, ' ');
    const product = productLine(await page.evaluate(productMoment), PRESET === 'google-play' ? 10 : 3);
    const md = [
      `# Storyboard (${rows.duration} s${rows.subtitles ? ', spoken words shown as captions' : ''})`, '',
      `${product.late ? '**Late:** ' : ''}${product.line[0].toUpperCase()}${product.line.slice(1)}.`, '',
      '| Time (s) | Beat | What the viewer sees or hears |', '|---|---|---|',
      ...rows.rows.map((r) => `| ${r.map(cell).join(' | ')} |`), '',
    ].join('\n');
    await mkdir(dirname(resolve(root, out)), { recursive: true });
    await writeFile(resolve(root, out), md);
    console.log(md);
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
    const drawnText = new Map();
    const pass = async (order, scan) => {
      const shots = new Map();
      for (const t of order) {
        const boxes = await page.evaluate(async ({ t, record }) => {
          if (record) window.__textLog = [];
          await window.seek(t);
          const log = window.__textLog;
          window.__textLog = null;
          return log;
        }, { t, record: scan && !!zones });
        if (boxes) drawnText.set(t, boxes);
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
    else if (STATIC_MAX > 0) {
      const sorted = [...times].sort((a, b) => a - b);
      const still = [];
      const near = [];
      for (let i = 1, start = 0; i <= sorted.length; i++) {
        if (i < sorted.length && first.get(sorted[i]) === first.get(sorted[start])) continue;
        const span = sorted[i - 1] - sorted[start];
        if (span >= STATIC_MAX - 1e-6) still.push([sorted[start], sorted[i - 1]]);
        else if (span > 0 && span >= STATIC_MAX - 0.5 - 1e-6) near.push([sorted[start], sorted[i - 1]]);
        start = i;
      }
      const hashAt = async (t) => { await page.evaluate((t) => window.seek(t), t); return createHash('sha256').update(await canvas.screenshot()).digest('hex'); };
      const edge = async (inside, outside, h) => {
        let a = inside, b = outside;
        for (let k = 0; k < 5; k++) {
          const mid = (a + b) / 2;
          if (await hashAt(mid) === h) a = mid; else b = mid;
        }
        return a;
      };
      for (const [a, b] of near) {
        const h = first.get(a);
        const from = a > 0 ? await edge(a, Math.max(0, a - 0.5), h) : a;
        const to = b < length - 1e-6 ? await edge(b, Math.min(length, b + 0.5), h) : b;
        if (to - from >= STATIC_MAX - 0.02) still.push([from, to]);
      }
      still.sort((x, y) => x[0] - y[0]);
      if (still.length) errors.push(`nothing moves from ${still.slice(0, 5).map(([a, b]) => `${a.toFixed(1)} to ${b.toFixed(1)} s`).join(', ')} (sampled every 0.5 s): a feed viewer reads a held frame as a stalled video, so give that stretch a slow drift (a camera keyframe, ambient light, or the end card's own motion); STATIC_MAX=0 turns this off`);
      else passed.push(`something moves at least every ${STATIC_MAX} s`);
    }
    const zoneHits = [];
    if (zones) {
      const chrome = await page.evaluate(() => [window.STORY.statusTime ?? '9:41', (window.STORY.browser && window.STORY.browser.url) || ''].filter(Boolean));
      const tol = 8 * zoneScale.x;
      const near = (a, b) => ['x0', 'y0', 'x1', 'y1'].every((k) => Math.abs(a[k] - b[k]) < tol);
      const bandOf = (b) => zones.find((z) => b.x0 < z.x1 && b.x1 > z.x0 && b.y0 < z.y1 && b.y1 > z.y0);
      const byText = new Map();
      for (const t of [...drawnText.keys()].sort((a, b) => a - b)) {
        for (const box of drawnText.get(t)) {
          if (chrome.includes(box.text) || box.text.startsWith('missing: ') || box.y1 - box.y0 < 12 * zoneScale.y) continue;
          if (!byText.has(box.text)) byText.set(box.text, []);
          byText.get(box.text).push({ t, box });
        }
      }
      for (const [text, seen] of byText) {
        const inBand = seen.filter((s) => bandOf(s.box));
        if (!inBand.length) continue;
        let hit = inBand.find((s) => seen.some((o) => o !== s && Math.abs(o.t - s.t) <= 0.51 && near(o.box, s.box)));
        if (!hit && inBand.length >= 3 && bandOf(seen[seen.length - 1].box)) hit = inBand[0];
        if (!hit) {
          for (const s of inBand) {
            for (const dt of [-0.15, 0.15]) {
              const at = s.t + dt;
              if (at < 0 || at > length) continue;
              const probe = await page.evaluate(async (t) => { window.__textLog = []; await window.seek(t); const log = window.__textLog; window.__textLog = null; return log; }, at);
              if ((probe || []).some((b) => b.text === text && near(b, s.box))) { hit = s; break; }
            }
            if (hit) break;
          }
        }
        if (hit) zoneHits.push({ text, t: hit.t, band: bandOf(hit.box).name, box: { ...hit.box } });
      }
      zoneHits.sort((a, b) => a.t - b.t || a.box.y0 - b.box.y0 || a.box.x0 - b.box.x0);
      for (let i = 0; i < zoneHits.length; i++) {
        const a = zoneHits[i];
        const parts = [{ x: a.box.x0, text: a.text }];
        for (let j = i + 1; j < zoneHits.length; j++) {
          const b = zoneHits[j];
          const sameLine = b.t === a.t && b.band === a.band && Math.min(a.box.y1, b.box.y1) - Math.max(a.box.y0, b.box.y0) > 0.4 * Math.min(a.box.y1 - a.box.y0, b.box.y1 - b.box.y0);
          if (!sameLine) continue;
          parts.push({ x: b.box.x0, text: b.text });
          a.box = { x0: Math.min(a.box.x0, b.box.x0), y0: Math.min(a.box.y0, b.box.y0), x1: Math.max(a.box.x1, b.box.x1), y1: Math.max(a.box.y1, b.box.y1) };
          zoneHits.splice(j--, 1);
        }
        a.text = parts.sort((p, q) => p.x - q.x).map((p) => p.text).join(' ');
        a.box = Object.fromEntries(['x0', 'y0', 'x1', 'y1'].map((k) => [k, Math.round(a.box[k])]));
      }
      if (zoneHits.length) {
        errors.push(`${zoneHits.length} piece${zoneHits.length > 1 ? 's' : ''} of text ${zoneHits.length > 1 ? 'sit' : 'sits'} under ${ZONES[PRESET].label} UI, where the app's own buttons and caption cover them:`);
        for (const z of zoneHits.slice(0, 8)) errors.push(`  "${z.text.slice(0, 50)}" at ${z.t.toFixed(1)} s, in the ${z.band} (y ${z.box.y0} to ${z.box.y1}, x ${z.box.x0} to ${z.box.x1}): move it, e.g. subtitles: { y } or the caption's row position`);
        if (zoneHits.length > 8) errors.push(`  ${zoneHits.length - 8} more`);
      } else if (byText.size) passed.push(`all ${byText.size} pieces of text clear ${ZONES[PRESET].label} UI`);
      else warnings.push(`no drawn text was seen, so ${PRESET}'s UI bands were not checked (does the film draw text with fillText?)`);
    }
    flat.sort((a, b) => a - b);
    if (flat.length) warnings.push(`one flat colour at ${flat.slice(0, 6).join(', ')}${flat.length > 6 ? ', ...' : ''} s: if that is not meant, nothing was drawn there`);
    await page.evaluate(() => window.seek(0));
    if (await flatNow()) warnings.push('frame 0 is one flat colour, and WhatsApp, Chat and most feeds use the first frame as the thumbnail, so the shared clip looks blank: show the logo or headline from t = 0 (an `opening` logo, hook lines with `in` below 0)');
    else passed.push('frame 0 shows something, so the shared thumbnail is not blank');
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
    const extras = await page.evaluate(() => ({
      words: window.STORY.subtitles ? (window.STORY.subtitles.file || 'assets/voice/words.json') : null,
      depths: window.STORY.backdrops.map((b, i) => (b.depth ? { name: b.name || b.file, ok: !!img[`depth${i}`] } : null)).filter(Boolean),
    }));
    if (extras.words) {
      const wordsFile = resolve(root, extras.words);
      const spokenFiles = voice.map((v) => resolve(root, v.file)).filter(existsSync);
      if (!existsSync(wordsFile)) errors.push(`subtitles are on but ${extras.words} does not exist: run words.py after voice.mjs`);
      else if (spokenFiles.some((f) => statSync(f).mtimeMs > statSync(wordsFile).mtimeMs)) errors.push(`${extras.words} is older than a voice file, so the captions follow an old recording: run words.py again`);
      else if (JSON.parse(await readFile(wordsFile, 'utf8')).map((l) => l.text).join('\n') !== voice.map((v) => v.text).join('\n')) errors.push(`${extras.words} does not match the story's voice lines: run voice.mjs, then words.py`);
      else passed.push(`${extras.words} matches the voice lines`);
    }
    for (const d of extras.depths) if (!d.ok) warnings.push(`backdrop ${d.name} asks for depth but has no depth map, so it draws flat: run depth.py on it`);
    const text = await page.evaluate(onScreenText);
    const brief = text.items.filter((x) => {
      const shown = x.to - x.from, words = x.text.split(/\s+/).filter(Boolean).length;
      return shown < (x.what === 'subtitle' ? 5 / 6 : Math.max(5 / 6, 0.3 * words)) || x.text.length / shown > 20;
    });
    for (const x of brief.slice(0, 6)) {
      const shown = x.to - x.from, fast = x.text.length / shown > 20;
      const fix = x.what !== 'subtitle' ? 'hold it longer or cut words' : fast ? 'the voice is too fast for its words: slow it or cut words' : 'show more words at a time, e.g. subtitles: { words: 5 }';
      warnings.push(`${x.what} "${x.text}" is on screen ${shown.toFixed(2)} s from ${x.from.toFixed(2)} s, ${fast ? `${(x.text.length / shown).toFixed(0)} characters a second against a limit of 20` : `under the ${x.what === 'subtitle' ? '5/6 s' : '5/6 s and 0.3 s a word'} needed to read it`}: ${fix}`);
    }
    if (brief.length > 6) warnings.push(`${brief.length - 6} more pieces of text are too short to read`);
    if (text.items.length && !brief.length) passed.push(`all ${text.items.length} pieces of text stay up long enough to read`);
    if (!text.pace.length) {
      for (const v of voice.filter((v) => existsSync(resolve(root, v.file)))) {
        const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', resolve(root, v.file)], { encoding: 'utf8' });
        const seconds = Number(probe.stdout);
        if (probe.error || !(seconds > 0)) { warnings.push(`voice pace not measured: ffprobe could not read ${v.file}${probe.error ? ' (is ffprobe on PATH?)' : ''}`); break; }
        const words = v.text.split(/\s+/).filter(Boolean).length;
        if (words > 1) text.pace.push({ from: +v.at, perSecond: words / seconds });
      }
    }
    for (const p of text.pace) {
      if (p.perSecond > 3) warnings.push(`voice line at ${p.from.toFixed(2)} s runs ${p.perSecond.toFixed(1)} words a second, faster than the 160-180 a minute subtitles are written for: cut words, or slow the voice (VOICE_SPEED below 1 works for Kokoro only)`);
    }
    const product = productLine(await page.evaluate(productMoment), PRESET === 'google-play' ? 10 : 3);
    (product.late ? warnings : passed).push(product.line);
    if (PRESET === 'app-store') {
      if (!APP_STORE_SIZES.includes(`${w}x${h}`)) warnings.push(`an App Store preview must be one of ${APP_STORE_SIZES.join(', ')}; this check ran at ${w}x${h}`);
      if (text.backdrops) errors.push('App Review 2.3.4 allows only screen captures of the app, with narration and overlays: remove the backdrops for the App Store cut');
      if (length < 15 || length > 30) errors.push(`an App Store preview runs 15 to 30 s; this film is ${length} s`);
      if (!text.device || !(text.device.enter <= 5 && 5 < text.device.leave)) warnings.push('the App Store shows the frame at 5 s as the cover until the preview plays, and the product is not on screen then: move device.enter before 5 s');
      const price = /((?<![a-z])(RM|US\$|S\$)|[$€£¥])[ \t]?\d[\d.,]*|\d[\d.,]*[ \t]?(USD|MYR|EUR|GBP|SGD)\b|\/[ \t]?(mo|month|yr|year)\b/i.exec(text.all);
      if (price) warnings.push(`the App Store bans specific prices in a preview, and the story says "${price[0]}"`);
      const dated = /\b(20[2-3]\d|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|jun(e)?|jul(y)?|aug(ust)?|sept?(ember)?|oct(ober)?|nov(ember)?|dec(ember)?|new for|coming soon|this (spring|summer|autumn|fall|winter))\b/i.exec(text.all);
      if (dated) warnings.push(`the App Store asks for no dates or seasonal lines in a preview, and the story says "${dated[0]}"`);
    }
    if (PRESET === 'google-play') {
      if (length > 30) warnings.push(`Google Play plays only the first 30 s inline, muted; this film is ${length} s`);
      const banned = /\b(best|download now)\b/i.exec(text.all);
      if (banned) warnings.push(`Google Play asks preview videos to avoid "${banned[0]}"`);
    }
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
    await mkdir(join(root, 'out'), { recursive: true });
    await writeFile(join(root, `out/check_${w}x${h}.json`), JSON.stringify({ size: `${w}x${h}`, preset: PRESET || null, passed, warnings, errors, zoneHits, at: new Date().toLocaleString('sv') }, null, 2) + '\n');
    if (errors.length) process.exitCode = 1;
  } else if (mode === 'review') {
    let reviewPage;
    try { ({ reviewPage } = await import(new URL('./review-page.mjs', import.meta.url))); }
    catch (e) { throw new Error(e.code === 'ERR_MODULE_NOT_FOUND' ? 'review needs review-page.mjs beside render.mjs: copy it from the plugin\'s skills/_shared/scripts/' : `review-page.mjs failed to load: ${e.message}`); }
    const beats = await page.evaluate(() => {
      const s = window.STORY;
      const words = (rows) => rows.map((r) => (Array.isArray(r) ? r[0] : r)).join(' ');
      const settle = (a, b) => (b == null ? +a + 0.45 : +a + Math.min(0.9, (b - a) / 2));
      const list = [];
      const hookOut = s.hook.length ? Math.max(...s.hook.map((x) => (x.out != null ? +x.out : +x.in + 2))) : 0;
      if (s.hook.length) list.push({ at: +s.hook[0].in, t: settle(Math.max(0, Math.max(...s.hook.map((x) => +x.in))), hookOut), until: hookOut, label: 'Hook', detail: s.hook.map((x) => x.text).join(' ') });
      s.captions.forEach((c) => list.push({ at: +c.in, t: settle(c.in, c.out), until: c.out, label: 'Caption', detail: words(c.rows) }));
      s.photos.forEach((p) => list.push({ at: +p.from, t: settle(p.from, p.to), until: p.to, label: 'Photo', detail: p.rows ? words(p.rows) : p.file }));
      s.screens.forEach((x, i) => { if (i) list.push({ at: +x.from, t: +x.from + 0.6, until: +x.from + 0.6, label: 'Cut', detail: x.name }); });
      if (s.number) list.push({ at: +s.number.from, t: settle(s.number.from, s.number.to), until: s.number.to, label: 'Number', detail: s.number.pillText });
      if (s.stat) list.push({ at: +s.stat.at, t: Math.min(+s.stat.out - 0.1, +s.stat.at + (s.stat.count ?? 0.9) + 0.4), until: s.stat.out, label: 'Number', detail: `${s.stat.prefix || ''}${s.stat.value}${s.stat.suffix || ''} ${s.stat.label || ''}` });
      if (s.lockup) list.push({ at: +s.lockup.at, t: Math.min(s.duration - 0.05, +s.lockup.at + 1.2), until: s.duration, label: 'Logo and call to action', detail: `${s.lockup.name || ''}${s.lockup.line ? `: ${s.lockup.line}` : ''}` });
      const voice = (window.cues && window.cues.voice) || [];
      for (const b of list) b.voice = voice.filter((v) => v.at >= b.at - 0.05 && v.at < (b.until ?? b.at + 1)).map((v) => v.text).join(' ');
      for (const v of voice) if (!list.some((b) => Math.abs(b.t - (v.at + 0.6)) < 0.8)) list.push({ at: v.at, t: v.at + 0.6, label: 'Voice line', detail: '', voice: v.text });
      const kept = [];
      for (const b of list.sort((a, b) => a.t - b.t)) if (!kept.length || b.t - kept[kept.length - 1].t > 0.25) kept.push(b);
      return { duration: s.duration, beats: kept };
    });
    const shrink = 405 / +w;
    const items = [];
    for (const [i, b] of beats.beats.entries()) {
      const t = Math.min(Math.max(0, b.t), beats.duration - 0.05);
      const img = await page.evaluate(async ({ t, k }) => {
        await window.seek(t);
        const src = document.querySelector('canvas');
        const c = document.createElement('canvas');
        c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.82);
      }, { t, k: shrink });
      items.push({ n: i + 1, when: `${t.toFixed(1)} s`, t, label: b.label, detail: [b.detail, b.voice && `Voice: "${b.voice}"`].filter(Boolean).join('  ·  '), img, issues: [] });
    }
    const checkFile = join(root, `out/check_${w}x${h}.json`);
    const notes = [];
    if (existsSync(checkFile)) {
      let res;
      try { res = JSON.parse(await readFile(checkFile, 'utf8')); } catch { res = null; }
      if (!res || !Array.isArray(res.passed) || !Array.isArray(res.errors) || !Array.isArray(res.warnings)) res = { passed: [], errors: [`out/check_${w}x${h}.json could not be read: run check again`], warnings: [], zoneHits: [], at: '' };
      if ((res.preset || '') !== PRESET) notes.push({ level: 'warn', text: `the last check ran with PRESET=${res.preset || '(none)'} and this page with PRESET=${PRESET || '(none)'}, so its UI-band results may not match the shaded areas: run check again with the same PRESET` });
      for (const z of res.zoneHits || []) {
        const card = [...items].reverse().find((it) => it.t <= z.t + 0.6) || items[0];
        if (card) card.issues.push({ level: 'error', text: `"${z.text.slice(0, 40)}" sits in the ${z.band}` });
      }
      for (const e of res.errors.filter((x) => !x.startsWith('  ') && !/pieces? of text sits? under/.test(x))) notes.push({ level: 'error', text: e });
      for (const x of res.warnings) notes.push({ level: 'warn', text: x });
      if (res.passed.length) notes.push({ level: 'ok', text: `${res.passed.length} checks passed${res.at ? ` (check run ${String(res.at).slice(0, 16).replace('T', ' ')})` : ''}` });
    } else notes.push({ level: 'warn', text: `no check results yet: run "node render.mjs check ${w} ${h}" first so they show here` });
    const target = resolve(root, outArg || `out/review_${w}x${h}.html`);
    await mkdir(dirname(target), { recursive: true });
    const name = root.split(sep).pop();
    await writeFile(target, reviewPage({ title: `${name} (${w}x${h})`, subtitle: `${items.length} beats, ${beats.duration} s. Type a note under any frame, then Copy change list and paste it back.`, frame: { w: +w, h: +h }, items, notes, zones, zonesLabel: zones ? `${ZONES[PRESET].label.split(' (')[0]} UI areas` : undefined }));
    console.log(`review page: ${target}`);
  } else if (mode === 'stills') {
    await mkdir(join(root, 'out/stills'), { recursive: true });
    for (const t of stillTimes) {
      await page.evaluate((t) => window.seek(t), t);
      await canvas.screenshot({ path: join(root, `out/stills/${w}x${h}_${t.toFixed(2).padStart(5, '0')}.png`) });
    }
  } else {
    const target = resolve(root, out);
    await mkdir(dirname(target), { recursive: true });
    const draftSound = draft && resolve(root, process.env.AUDIO || 'score.wav');
    const sound = draftSound && existsSync(draftSound) ? ['-i', draftSound, '-map', '0:v', '-map', '1:a', '-af', 'apad', '-c:a', 'aac', '-b:a', '128k', '-shortest'] : [];
    if (draft) console.error(sound.length ? `draft carries ${draftSound.slice(root.length + 1)}` : 'draft is silent: no score.wav yet');
    ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', `${FPS}`, '-i', '-', ...sound,
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv',
      '-c:v', 'libx264', ...(PRESET === 'app-store' ? ['-b:v', '11M', '-maxrate', '12M', '-bufsize', '24M', '-profile:v', 'high', '-level', '4.0'] : ['-crf', '16']), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
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
    const pages = [page, ...await Promise.all(Array.from({ length: Math.min(WORKERS, frames) - 1 }, () => openPage(false)))];
    const frameAt = async (worker, t) => {
      await worker.evaluate((t) => window.seek(t), t);
      return worker.locator('canvas').first().screenshot();
    };
    if (pages.length > 1) {
      const probes = [...new Set([...Array.from({ length: Math.ceil(frames / FPS / 2) }, (_, i) => i * 2), (frames - 1) / FPS])];
      const drawn = await Promise.all(pages.map(async (worker) => {
        const hashes = [];
        for (const t of probes) hashes.push(createHash('sha256').update(await frameAt(worker, t)).digest('hex'));
        return hashes;
      }));
      const odd = drawn.findIndex((hashes) => hashes.some((x, j) => x !== drawn[0][j]));
      if (odd > 0) throw new Error(`render page ${odd + 1} drew ${probes.filter((_, j) => drawn[odd][j] !== drawn[0][j]).join(', ')} s differently from the first page, so its frames would not match: render again, or with WORKERS=1`);
    }
    const shots = Array.from({ length: frames }, () => { let resolve; const ready = new Promise((r) => { resolve = r; }); return { ready, resolve }; });
    let written = 0;
    const waiting = [];
    const capture = async (worker, k) => {
      for (let f = k; f < frames; f += pages.length) {
        while (f >= written + 2 * pages.length) await new Promise((r) => waiting.push(r));
        if (ffClosed) throw new Error(await ffFailure());
        const unexplained = workerWarnings.filter((x) => !filmWarnings.includes(x));
        if (unexplained.length) throw new Error(`a render page warned where the first one did not, so its frames may not match (${[...new Set(unexplained)].join('; ')}): render again, or with WORKERS=1`);
        shots[f].resolve(await frameAt(worker, f / FPS));
      }
    };
    const write = async () => {
      for (let f = 0; f < frames; f++) {
        const png = await shots[f].ready;
        shots[f] = null;
        if (ffClosed) throw new Error(await ffFailure());
        if (!ff.stdin.write(png)) await Promise.race([new Promise((r) => ff.stdin.once('drain', r)), ffDone]);
        written = f + 1;
        waiting.splice(0).forEach((r) => r());
      }
    };
    await Promise.all([write(), ...pages.map(capture)]);
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
