// Starter post: copy to <series>/<post>/build.mjs, then replace the copy, the mark and the screenshot.
// Run: PLAYWRIGHT_DIR=<repo with playwright> node build.mjs [preset]
import {build, slide} from '../carousel.mjs';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(dir, '..', f), 'utf8');
const preset = process.argv[2] || 'tiktok';
const T = 3;
const mark = '<div class="logo">Brand<i>.</i></div>';

const slides = [
  slide(1, T, `
    <div class="hint">The problem</div>
    <h1>One line your viewer <span class="accent">already feels</span></h1>
    <div class="hint">Swipe &rarr;</div>`, {cls: 'dark', mark}),
  slide(2, T, `
    <div class="num">1</div>
    <h2>One point per slide</h2>
    <div class="card">
      <div class="row st"><span class="k">Label</span><span class="v">Value</span></div>
    </div>
    <div class="note">Demo data</div>`, {mark}),
  slide(3, T, `
    <h2>What the product <span class="accent">does</span></h2>
    <div class="lead">The offer, in one line.</div>
    <div class="cta">Link in bio</div>`, {mark}),
];

const {banned = [], ...rules} = JSON.parse(read('rules.json'));
await build({dir, slides, brand: read('brand.css'), banned, rules, preset});
