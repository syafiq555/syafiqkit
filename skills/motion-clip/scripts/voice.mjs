import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const die = (msg) => { console.error(msg); process.exit(1); };
const here = dirname(fileURLToPath(import.meta.url));
const localPython = process.env.MOTION_CLIP_PYTHON
  || join(process.env.MOTION_CLIP_HOME || join(homedir(), '.local/share/motion-clip'), 'venv/bin/python');

const cuesPath = resolve(process.argv[2] || 'cues.json');
if (!existsSync(cuesPath)) die(`no cues file at ${cuesPath}: run "node render.mjs cues 1080 1920 cues.json" first`);
const cues = JSON.parse(await readFile(cuesPath, 'utf8'));
const lines = cues.voice || [];
if (!lines.length) die('the story has no voice lines: add voice: [{ at, text }] to story.js and write the cues again');
const base = dirname(cuesPath);

const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;
if (!has('ffmpeg')) die('ffmpeg must be on the PATH');
const kokoroReady = () => existsSync(localPython) && spawnSync(localPython, ['-c', 'import kokoro, soundfile']).status === 0;
const provider = process.env.VOICE_PROVIDER || (kokoroReady() && 'kokoro') || (has('say') && 'say');
if (!provider) die('no free voice on this machine: run "sh setup-local.sh voice" for the free Kokoro voice, or ask the user whether a paid voice may be used, then set VOICE_PROVIDER=elevenlabs (with ELEVENLABS_API_KEY) or VOICE_PROVIDER=openai (with OPENAI_API_KEY)');
if (!['kokoro', 'elevenlabs', 'openai', 'say'].includes(provider)) die(`VOICE_PROVIDER must be "kokoro", "elevenlabs", "openai" or "say", got "${provider}"`);
if (provider === 'kokoro' && !kokoroReady()) die(`the Kokoro voice is not installed at ${localPython}: run "sh setup-local.sh voice"`);
if (provider === 'say' && !has('say')) die('the macOS "say" voice is not on this machine: run "sh setup-local.sh voice" for the free Kokoro voice, or ask the user whether a paid voice may be used');
const keyName = { elevenlabs: 'ELEVENLABS_API_KEY', openai: 'OPENAI_API_KEY' }[provider];
if (keyName && !process.env[keyName]) die(`VOICE_PROVIDER=${provider} needs ${keyName} set`);
if (keyName) console.error(`using ${provider}: each line's text is sent to ${provider} and billed to that key`);
if (provider === 'say') console.error('using the macOS "say" voice: a draft to test the wiring; a real voice speaks at another pace, so re-time after switching, and never release this one');
if (provider === 'kokoro') console.error(`using the free Kokoro voice on this machine (${process.env.VOICE || 'af_heart'}): nothing leaves the laptop`);

function speakLocally(jobs) {
  const r = spawnSync(localPython, [join(here, 'kokoro_tts.py')], {
    input: JSON.stringify({ voice: process.env.VOICE || 'af_heart', speed: Number(process.env.VOICE_SPEED || 1), lines: jobs }),
    encoding: 'utf8', maxBuffer: 1 << 26,
  });
  if (r.status !== 0) throw new Error(`Kokoro failed: ${(r.stderr || '').trim().split('\n').slice(-3).join(' ')}`);
}

async function speak(text, raw) {
  if (provider === 'say') {
    const args = process.env.VOICE ? ['-v', process.env.VOICE] : [];
    const r = spawnSync('say', [...args, '-o', raw, '--', text]);
    if (r.status !== 0) throw new Error(`say failed: ${r.stderr}`);
    return;
  }
  const request = provider === 'elevenlabs'
    ? {
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE || '21m00Tcm4TlvDq8ikWAM'}`,
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, accept: 'audio/mpeg' },
      body: { text, model_id: process.env.VOICE_MODEL || 'eleven_multilingual_v2' },
    }
    : {
      url: 'https://api.openai.com/v1/audio/speech',
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: {
        model: process.env.VOICE_MODEL || 'gpt-4o-mini-tts', voice: process.env.VOICE || 'alloy', input: text, response_format: 'wav',
        ...(process.env.VOICE_STYLE ? { instructions: process.env.VOICE_STYLE } : {}),
      },
    };
  const res = await fetch(request.url, { method: 'POST', headers: { 'content-type': 'application/json', ...request.headers }, body: JSON.stringify(request.body) });
  if (!res.ok) throw new Error(`${provider} answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  await writeFile(raw, Buffer.from(await res.arrayBuffer()));
}

async function spokenLength(file) {
  const wav = await readFile(file);
  let at = 12;
  while (at + 8 <= wav.length && wav.toString('ascii', at, at + 4) !== 'data') { const size = wav.readUInt32LE(at + 4); at += 8 + size + (size & 1); }
  if (at + 8 > wav.length) die(`${file} has no data chunk: delete it and run voice.mjs again`);
  const start = at + 8, whole = (Math.min(wav.length, start + wav.readUInt32LE(at + 4)) - start) >> 1;
  let last = whole - 1;
  while (last >= 0 && Math.abs(wav.readInt16LE(start + last * 2)) < 650) last--;
  return (last < 0 ? whole : last + 1) / 48000;
}

const only = process.env.VOICE_LINES ? new Set(process.env.VOICE_LINES.split(',').map(Number)) : null;
if (only && [...only].some((n) => !Number.isInteger(n) || n < 1 || n > lines.length)) die(`VOICE_LINES must list line numbers from 1 to ${lines.length}, got "${process.env.VOICE_LINES}"`);

const kept = [];
const pending = [];
let unmade = 0;
for (const [i, line] of lines.entries()) {
  const file = resolve(base, line.file);
  if (only && !only.has(i + 1)) {
    if (existsSync(file)) kept.push({ i, line, file });
    else unmade++;
    continue;
  }
  const stamp = `${file}.txt`;
  const label = `${provider}|${process.env.VOICE || ''}|${process.env.VOICE_MODEL || ''}|${process.env.VOICE_STYLE || ''}|${provider === 'kokoro' ? `${process.env.VOICE_SPEED || ''}|` : ''}${line.text}`;
  await mkdir(dirname(file), { recursive: true });
  if (existsSync(file) && existsSync(stamp) && (await readFile(stamp, 'utf8')) === label) kept.push({ i, line, file });
  else pending.push({ i, line, file, stamp, label, raw: `${file}.${provider === 'say' ? 'aiff' : 'src'}` });
}

if (provider === 'kokoro' && pending.length) {
  try { speakLocally(pending.map((p) => ({ text: p.line.text, out: p.raw }))); } catch (e) { die(e.message); }
} else {
  for (const p of pending) {
    try { await speak(p.line.text, p.raw); } catch (e) { die(`line ${p.i + 1} ("${p.line.text.slice(0, 40)}"): ${e.message}`); }
  }
}
for (const p of pending) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', p.raw, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', p.file]);
  await rm(p.raw, { force: true });
  if (r.status !== 0) die(`could not convert line ${p.i + 1} to wav: ${r.stderr}`);
  await writeFile(p.stamp, p.label);
}

const made = await Promise.all([...kept, ...pending].map(async ({ i, line, file }) => ({ n: i + 1, at: line.at, end: line.at + await spokenLength(file), text: line.text, file: line.file, captionOut: line.captionOut })));

const warnings = [];
made.sort((a, b) => a.at - b.at);
for (const [i, m] of made.entries()) {
  console.log(`${String(m.n).padStart(2)}  ${m.at.toFixed(2)}-${m.end.toFixed(2)} s  ${m.file}  "${m.text}"`);
  const next = made[i + 1];
  if (next && m.end > next.at - 0.2) warnings.push(`line ${m.n} runs until ${m.end.toFixed(2)} s, into line ${next.n} at ${next.at} s: shorten it or move line ${next.n}`);
  if (m.captionOut != null && m.end > m.captionOut) warnings.push(`line ${m.n} is still speaking at ${m.end.toFixed(2)} s, after its caption leaves at ${m.captionOut} s: lengthen the caption or shorten the line`);
  if (cues.duration && m.end > cues.duration - 0.3) warnings.push(`line ${m.n} ends at ${m.end.toFixed(2)} s, past the film's ${cues.duration} s less the fade: shorten it or start it earlier`);
}
if (unmade) warnings.push(`${unmade} of ${lines.length} lines have no file yet, so the timing checks between lines are incomplete: run without VOICE_LINES for the full check`);
for (const w of warnings) console.log(`warn  ${w}`);
