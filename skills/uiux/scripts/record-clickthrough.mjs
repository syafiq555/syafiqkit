#!/usr/bin/env node
// Records a scripted click-through of a page and tiles the frames into contact sheets, so motion,
// flicker, greyed controls and layout jumps a still capture cannot show are judged from evidence.
//   node record-clickthrough.mjs <url> --steps steps.json [--widths 375,1280] [--storage-state auth.json]
//        [--fps 6] [--pause 1500] [--out DIR] [--scheme light|dark]
// steps.json is an array run in order, each entry one of:
//   { "click": "css selector" }            click the first visible match
//   { "clickLabel": "Select Almonds" }     click the first visible control whose accessible text or aria-label starts with this
//   { "wait": 800 }                        pause (ms) with recording on
//   { "scroll": 600 }                      wheel down (negative goes up)
//   { "type": "sel" }                      type into the focused element one key at a time (a search box, a combobox)
//   { "press": "Escape" }                  press one key: Escape, Enter, Tab, Backspace, ArrowDown, ArrowUp
// Every click, type and press is followed by --pause ms of recording. Writes per width: frames/, sheet-<width>.png (needs ffmpeg on PATH;
// without it the frames stay and the sheet is skipped) and timeline.json (which frame each step started on).
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { Browser, sleep } from '../app-kit/scripts/lib/cdp.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback = '') => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const url = args[0] && !args[0].startsWith('--') ? args[0] : '';
const stepsFile = flag('steps');
if (!url || !stepsFile) {
  console.error('usage: node record-clickthrough.mjs <url> --steps steps.json [--widths 375,1280] [--storage-state auth.json] [--fps 6] [--pause 1500] [--out DIR] [--scheme light|dark]');
  process.exit(2);
}
const steps = JSON.parse(readFileSync(stepsFile, 'utf8'));
const widths = flag('widths', '375,1280').split(',').map(Number);
const fps = Number(flag('fps', '6'));
const pauseMs = Number(flag('pause', '1500'));
const scheme = flag('scheme', 'light');
const out = resolve(flag('out', join(tmpdir(), 'uiux-clickthrough', String(Date.now()))));
const storage = flag('storage-state');

const KEYS = { Escape: 27, Enter: 13, Tab: 9, Backspace: 8, ArrowDown: 40, ArrowUp: 38 };

const FIND = ({ css, label }) => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    // A screen-reader-only label is 1px wide: clicking it lands nowhere, so only targets a finger could hit count.
    return r.width >= 8 && r.height >= 8 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const textOf = (el) => (el.getAttribute('aria-label') || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) || el.textContent || '').trim().replace(/\s+/g, ' ');
  // A label (often screen-reader only) names a control that may itself be a hidden input beside a
  // styled box, so follow the label to the visible control next to what it points at.
  const controlOf = (el) => {
    if (el.tagName !== 'LABEL') return el;
    const target = el.control || (el.htmlFor && document.getElementById(el.htmlFor));
    if (!target) return el;
    if (visible(target)) return target;
    return target.parentElement?.querySelector('[role=checkbox], [role=switch], [role=radio], button') || el;
  };
  const pool = css
    ? [...document.querySelectorAll(css)]
    : [...document.querySelectorAll('button, a[href], [role=button], [role=checkbox], [role=switch], [role=tab], input, label')]
        .filter((el) => textOf(el).startsWith(label))
        .map(controlOf);
  const el = pool.find(visible);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const browser = await Browser.launch({ extraArgs: ['--ignore-certificate-errors'] });
const report = [];
try {
  if (storage) await browser.useStorageState(JSON.parse(readFileSync(storage, 'utf8')));
  for (const width of widths) {
    const dir = join(out, `w${width}`);
    const framesDir = join(dir, 'frames');
    mkdirSync(framesDir, { recursive: true });
    const page = await browser.newPage({ width, height: width < 768 ? 812 : 900, mobile: width < 768, scheme });
    await page.goto(url, { settleMs: 1200 });

    const frames = [];
    page.browser.on(page.sessionId, 'Page.screencastFrame', ({ data, sessionId, metadata }) => {
      const file = join(framesDir, `raw-${String(frames.length).padStart(5, '0')}.jpg`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      frames.push({ file, t: metadata.timestamp * 1000 });
      page.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await page.send('Page.bringToFront').catch(() => {});
    await page.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
    await page.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
    await sleep(400);

    const timeline = [];
    for (const step of steps) {
      const at = Date.now();
      if (step.wait) await sleep(step.wait);
      else if (step.scroll) await page.wheel(step.scroll);
      else if (typeof step.type === 'string') {
        for (const char of step.type) {
          await page.send('Input.dispatchKeyEvent', { type: 'char', text: char });
          await sleep(60);
        }
        await sleep(pauseMs);
      } else if (step.press) {
        const code = KEYS[step.press];
        if (!code) { timeline.push({ step, at, error: 'unknown key' }); continue; }
        for (const type of ['rawKeyDown', 'keyUp']) {
          await page.send('Input.dispatchKeyEvent', { type, key: step.press, code: step.press, windowsVirtualKeyCode: code });
        }
        await sleep(pauseMs);
      } else {
        const point = await page.eval(FIND, { css: step.click || '', label: step.clickLabel || '' });
        if (!point) { timeline.push({ step, at, error: 'not found' }); continue; }
        await sleep(150);
        if (width < 768) {
          // Phone widths emulate touch, where synthetic mouse events are dropped: tap instead.
          await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
          await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          for (const type of ['mousePressed', 'mouseReleased']) {
            await page.send('Input.dispatchMouseEvent', { type, x: point.x, y: point.y, button: 'left', clickCount: 1 });
          }
        }
        await sleep(pauseMs);
      }
      timeline.push({ step, at });
    }
    await sleep(300);
    await page.send('Page.stopScreencast').catch(() => {});
    await page.close();

    // Chrome sends a frame only when something paints, so sample the timeline at a steady rate.
    const start = frames[0]?.t ?? 0;
    const end = frames.at(-1)?.t ?? 0;
    const sampled = [];
    for (let t = start, i = 0; t <= end; t += 1000 / fps) {
      while (i + 1 < frames.length && frames[i + 1].t <= t) i++;
      sampled.push(frames[i]);
    }
    sampled.forEach((f, n) => copyFileSync(f.file, join(framesDir, `f${String(n).padStart(4, '0')}.jpg`)));
    const stepFrames = timeline.map((s) => ({ ...s, frame: Math.max(0, Math.round(((s.at - start) / 1000) * fps)) }));
    writeFileSync(join(dir, 'timeline.json'), JSON.stringify({ fps, frames: sampled.length, steps: stepFrames }, null, 2));

    let sheet = '';
    if (hasFfmpeg && sampled.length) {
      const cols = width < 768 ? 10 : 5;
      const rows = Math.ceil(sampled.length / cols);
      sheet = join(dir, `sheet-${width}.png`);
      spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(framesDir, 'f%04d.jpg'),
        '-vf', `scale=${width < 768 ? 190 : 400}:-1,tile=${cols}x${rows}`, '-frames:v', '1', sheet], { stdio: 'inherit' });
    }
    report.push({ width, frames: sampled.length, sheet: existsSync(sheet) ? sheet : null, missing: timeline.filter((s) => s.error).map((s) => s.step) });
  }
} finally {
  await browser.close();
}
for (const r of report) {
  console.log(`w${r.width}: ${r.frames} frames at ${fps} fps${r.sheet ? ` -> ${r.sheet}` : hasFfmpeg ? '' : ' (no ffmpeg: frames only)'}`);
  if (r.missing.length) console.log(`  steps not found: ${r.missing.map((s) => JSON.stringify(s)).join(', ')}`);
}
console.log(`Read each sheet left to right, top to bottom: a control that greys, text that appears for one frame, or content that jumps after a click is the finding.`);
if (report.some((r) => r.missing.length)) process.exit(1);
