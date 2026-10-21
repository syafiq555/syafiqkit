import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
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
const [, , mode = 'video', fullW = '1080', fullH = '1920', outArg, ...rest] = process.argv;
const draft = mode === 'draft';
const even = (n) => 2 * Math.round(n / 4);
const w = draft ? String(even(+fullW)) : fullW, h = draft ? String(even(+fullH)) : fullH;
const out = outArg ?? { cues: 'cues.json', board: 'out/storyboard.md', draft: `out/draft_${fullW}x${fullH}.mp4` }[mode] ?? 'out/clip_9x16.mp4';
const FPS = +(process.env.FPS || (draft ? 15 : 30));
const DUR = +(process.env.DUR || 20);
const FILM = process.env.FILM || 'film.html';
const PRESET = process.env.PRESET || '';
const APP_STORE_SIZES = ['886x1920', '1920x886', '1080x1920', '1920x1080', '750x1334', '1334x750', '1200x1600', '1600x1200', '900x1200', '1200x900'];
if (PRESET && !['app-store', 'google-play'].includes(PRESET)) die(`PRESET must be "app-store" or "google-play", got "${PRESET}"`);
if (PRESET === 'app-store' && mode === 'video' && !APP_STORE_SIZES.includes(`${w}x${h}`)) die(`an App Store preview must be one of ${APP_STORE_SIZES.join(', ')}; got ${w}x${h} (886 1920 for current iPhones)`);
if (PRESET === 'app-store' && FPS > 30) die(`an App Store preview runs at most 30 fps, got FPS=${FPS}`);
const types = {
  '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.json': 'application/json', '.js': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
};

if (!['video', 'draft', 'stills', 'cues', 'check', 'board'].includes(mode)) die(`mode must be "video", "draft", "stills", "cues", "check" or "board", got "${mode}"`);
if (!Number.isInteger(+fullW) || !Number.isInteger(+fullH) || +fullW <= 0 || +fullH <= 0) die(`width and height must be positive integers, got ${fullW} ${fullH}`);
if (!(FPS > 0) || !(DUR > 0) || !Number.isFinite(FPS * DUR)) die(`FPS and DUR must be positive numbers, got FPS=${process.env.FPS} DUR=${process.env.DUR}`);
if (mode === 'video' && (+w % 2 || +h % 2)) die(`video needs even dimensions for yuv420p, got ${w}x${h}`);
const stillTimes = rest.map(Number);
if (mode === 'stills' && (!stillTimes.length || stillTimes.some(Number.isNaN))) die(`still times must be numbers, got: ${rest.join(' ') || '(none)'}`);

function productMoment() {
  const s = window.STORY;
  const name = s.lockup && String(s.lockup.name || '').trim().toLowerCase();
  const named = name && s.hook.find((x) => String(x.text).toLowerCase().includes(name));
  const seen = [];
  if (s.screens.length) seen.push({ at: +s.device.enter, what: s.frame === 'none' ? 'the first picture' : `the ${s.frame}` });
  if (s.lockup) seen.push({ at: +s.lockup.at, what: 'the logo' });
  if (named) seen.push({ at: +named.in, what: 'its name in the hook' });
  return { first: seen.sort((a, b) => a.at - b.at)[0] || null, pictures: s.screens.length > 0 };
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
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const pageErrors = [];
  const filmWarnings = [];
  page.on('pageerror', (e) => { pageErrors.push(e.message); console.error('page error:', e.message); });
  page.on('console', (m) => { if (m.type() === 'warning' && !m.text().includes('GL Driver Message')) { filmWarnings.push(m.text()); console.error('film:', m.text()); } });
  page.on('response', (r) => { if (r.status() >= 400) { filmWarnings.push(`${r.status()} ${r.url()}`); console.error(`${r.status()} ${r.url()}`); } });
  const story = process.env.STORY ? `&story=${encodeURIComponent(process.env.STORY)}` : '';
  await page.goto(`http://127.0.0.1:${port}/${FILM}?w=${w}&h=${h}${story}${draft ? '&draft=1' : ''}`);
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
