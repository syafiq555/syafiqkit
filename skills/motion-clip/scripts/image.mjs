import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, extname } from 'node:path';

const die = (msg) => { console.error(msg); process.exit(1); };
const [, , outArg, prompt, wArg = '1080', hArg = '1920'] = process.argv;
if (!outArg || !prompt) die('usage: node image.mjs <out.png> "<prompt>" [width] [height]   e.g. node image.mjs assets/screens/bg_city.png "night street in Kuala Lumpur, rain, neon reflections" 1080 1920');
if (extname(outArg).toLowerCase() !== '.png') die(`the output must be a .png path, got ${outArg}`);

const models = {
  'flux-2-klein-4b': { form: true, max: 1920 },
  'flux-1-schnell': { form: false, max: 1024 },
};
const model = process.env.IMAGE_MODEL || 'flux-2-klein-4b';
if (!models[model]) die(`IMAGE_MODEL must be one of ${Object.keys(models).join(', ')}, got "${model}"`);
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) die('needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN: create a token from the "Workers AI" template under My Profile > API Tokens in the Cloudflare dashboard, then export both in the shell profile');

const fitTo = (n) => Math.max(256, Math.min(models[model].max, Math.round(n / 16) * 16));
const width = fitTo(+wArg), height = fitTo(+hArg);
const seed = Number(process.env.IMAGE_SEED || 1);
if (!Number.isInteger(seed) || seed < 0) die(`IMAGE_SEED must be a whole number, got "${process.env.IMAGE_SEED}"`);

const out = resolve(outArg);
const stamp = `${out}.txt`;
const label = JSON.stringify({ model, prompt, width, height, seed });
if (existsSync(out) && existsSync(stamp) && (await readFile(stamp, 'utf8')) === label) {
  console.log(`${outArg} already made from this prompt, size and seed; change IMAGE_SEED for another take`);
  process.exit(0);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/${model}`;
let body;
const headers = { authorization: `Bearer ${token}` };
if (models[model].form) {
  body = new FormData();
  body.append('prompt', prompt);
  body.append('width', String(width));
  body.append('height', String(height));
  body.append('seed', String(seed));
} else {
  body = JSON.stringify({ prompt, steps: 8, seed });
  headers['content-type'] = 'application/json';
}
console.error(`asking Cloudflare ${model} for ${models[model].form ? `${width}x${height}` : 'a square picture (this model takes no size)'} (seed ${seed}); the prompt is sent to Cloudflare`);
const res = await fetch(url, { method: 'POST', headers, body });
const text = await res.text();
let data;
try { data = JSON.parse(text); } catch { die(`Cloudflare answered ${res.status} with something that is not JSON: ${text.slice(0, 300)}`); }
if (!res.ok || data.success === false) {
  const why = (data.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || text.slice(0, 300);
  die(`Cloudflare answered ${res.status}: ${why}${res.status === 429 ? ' (the free daily allowance may be used up; it resets at 00:00 UTC)' : ''}`);
}
const b64 = data.result?.image || data.image;
if (!b64) die(`Cloudflare's answer has no image: ${text.slice(0, 300)}`);

await mkdir(dirname(out), { recursive: true });
const raw = `${out}.download`;
await writeFile(raw, Buffer.from(b64, 'base64'));
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-frames:v', '1', out]);
await rm(raw, { force: true });
if (r.status !== 0) die(`could not convert the download to png: ${r.stderr}`);
await writeFile(stamp, label);
const size = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', out], { encoding: 'utf8' }).stdout.trim();
console.log(`${outArg}  ${size}  ${model}  seed ${seed}`);
