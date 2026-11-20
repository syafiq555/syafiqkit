#!/usr/bin/env node
// Render a series of product stills, each in a widescreen and a vertical shape, from one config.
// Usage: node series.mjs <series.json> [beat-name ...]
// Paths in the config are relative to the config file. Needs PLAYWRIGHT_DIR (see render.cjs).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const [cfgPath, ...only] = process.argv.slice(2);
if (!cfgPath) { console.error('usage: node series.mjs <series.json> [beat-name ...]'); process.exit(1); }
const cfgDir = path.dirname(path.resolve(cfgPath));
const S = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const rel = (p) => path.relative(cfgDir, path.resolve(cfgDir, p));
const tpl = fs.readFileSync(S.template ? path.resolve(cfgDir, S.template) : path.join(here, '..', 'templates', 'still.html'), 'utf8');
const outDir = path.resolve(cfgDir, S.out || 'out');
fs.mkdirSync(outDir, { recursive: true });

const look = { background: '#ffffff', accent: '#2563eb', ink: '#1e3a5f', inkDeep: '#0f172a', font: 'system-ui, sans-serif', badge: null, ...S.look };
const muted = S.muted || '#5a5a55';
const chipBg = S.chipBg || '#e6efe8';
const [PW, PH] = S.phoneSize || [1170, 2532];
const label = S.label || '';
const hOf = (crop, w) => Math.round(w * crop[3] / crop[2]);
const fit = (crop, maxW, maxH) => Math.min(maxW, Math.round(maxH * crop[2] / crop[3]));

// Widescreen 1920x1080: text column on the left (x 172, where the film's subtitles also start), pictures on the right.
const WIDE = { w: 1920, h: 1080, textX: 172, textW: 500, phone: { x: 1452, y: 60, w: 400 }, desk: { x: 690, maxW: 730, maxH: 760 }, solo: { x: 690, w: 1150, h: 800, y: 80 } };
// Vertical 1080x1920: text on top, one phone or desktop card below, the bottom ~15% left clear for subtitles.
const TALL = { w: 1080, h: 1920, textX: 64, textW: 952, cardY: 420, phoneW: 560, deskMaxW: 1000, deskMaxH: 1150 };

function head(item, texts, chips, wide) {
  const L = wide ? WIDE : TALL, x = L.textX;
  if (label) texts.push({ text: label, x, y: wide ? 92 : 86, size: wide ? 30 : 36, weight: 500, w: L.textW, color: muted });
  if (item.chip) chips.push({ text: item.chip, x, y: wide ? 160 : 150, bg: chipBg, color: look.accent, size: wide ? 30 : 32 });
  texts.push({ text: wide ? item.title : item.title.replace(/\n/g, ' '), x, y: wide ? 240 : 230, size: wide ? 54 : 60, weight: 700, w: L.textW, color: look.ink });
  if (item.body) texts.push({ text: item.body, x, y: wide ? 420 : 400, size: wide ? 34 : 40, weight: 500, w: L.textW, color: look.ink });
}

function beatWide(b) {
  const cards = [], texts = [], chips = [];
  head(b, texts, chips, true);
  const P = WIDE.phone, phoneH = Math.round(P.w * PH / PW);
  const phoneCard = b.phone && { src: rel(b.phone), crop: [0, 0, PW, PH], ...P, radius: 46 };
  if (b.phone && !b.desktop) {
    cards.push(phoneCard);
    if (b.phoneLift) cards.push({ src: rel(b.phone), crop: b.phoneLift, x: 700, y: P.y + (phoneH - hOf(b.phoneLift, 700)) / 2, w: 700, radius: 18, lift: true });
  } else if (b.phone && b.desktop) {
    const w = fit(b.desktop.crop, WIDE.desk.maxW, WIDE.desk.maxH);
    cards.push({ src: rel(b.desktop.src), crop: b.desktop.crop, x: WIDE.desk.x, y: P.y + (phoneH - hOf(b.desktop.crop, w)) / 2, w, radius: 22 });
    cards.push(phoneCard);
  } else if (b.desktop) {
    const D = WIDE.solo, w = fit(b.desktop.crop, D.w, D.h), h = hOf(b.desktop.crop, w), y = D.y + Math.max(0, (D.h - h) / 2);
    cards.push({ src: rel(b.desktop.src), crop: b.desktop.crop, x: D.x + (D.w - w) / 2, y, w, radius: 22 });
    if (b.lift) cards.push({ src: rel(b.lift.src || b.desktop.src), crop: b.lift.crop, x: WIDE.w - 50 - 520, y: 40, w: 520, radius: 18, lift: true });
  }
  return { width: WIDE.w, height: WIDE.h, glows: S.glow ? [{ x: 1150, y: -300, w: 1100, h: 700, color: S.glow }] : [], cards, texts, chips };
}

function beatTall(b) {
  const cards = [], texts = [], chips = [];
  head(b, texts, chips, false);
  if (b.phone) cards.push({ src: rel(b.phone), crop: [0, 0, PW, PH], x: (TALL.w - TALL.phoneW) / 2, y: TALL.cardY, w: TALL.phoneW, radius: 52 });
  else if (b.desktop) {
    const c = b.tallCrop || b.desktop.crop, w = fit(c, TALL.deskMaxW, TALL.deskMaxH);
    cards.push({ src: rel(b.desktop.src), crop: c, x: (TALL.w - w) / 2, y: TALL.cardY + 40, w, radius: 22 });
  }
  return { width: TALL.w, height: TALL.h, glows: S.glow ? [{ x: 400, y: -300, w: 1000, h: 700, color: S.glow }] : [], cards, texts, chips };
}

// A closing page: title, optional body, an optional numbered list, and up to two labelled pictures (a tracker, a deck).
function page(p, wide) {
  const cards = [], texts = [], chips = [];
  head(p, texts, chips, wide);
  const x0 = wide ? WIDE.textX : TALL.textX;
  (p.list || []).forEach((t, i) => {
    const y = (wide ? 420 : 400) + i * (wide ? 84 : 96), size = wide ? 40 : 46;
    chips.push({ text: String(i + 1), x: x0, y, bg: look.accent, color: '#ffffff', size: size * 0.7 });
    texts.push({ text: t, x: x0 + (wide ? 72 : 84), y: y + 2, size, weight: 600, w: 700, color: look.ink });
  });
  const imgs = p.images || [];
  imgs.forEach((im, i) => {
    let x, y, w;
    if (wide) {
      w = imgs.length > 1 ? 760 : 1000;
      x = imgs.length > 1 ? 760 + i * 340 : 840;
      y = imgs.length > 1 ? 120 + i * 440 : 150;
    } else {
      w = 820; x = (TALL.w - w) / 2;
      const prev = imgs.slice(0, i).reduce((s, q) => s + hOf(q.crop, w) + 80, 0);
      y = (p.list ? 940 : 580) + prev;
    }
    cards.push({ src: rel(im.src), crop: im.crop, x, y, w, radius: 18, lift: i > 0 });
    if (im.label) texts.push({ text: im.label, x, y: y + hOf(im.crop, w) + 16, size: wide ? 26 : 32, weight: 600, w: 600, color: muted });
  });
  return { width: wide ? WIDE.w : TALL.w, height: wide ? WIDE.h : TALL.h, glows: [], cards, texts, chips };
}

const fontFace = S.fontFile ? `<style>@font-face{font-family:${JSON.stringify(look.font.split(',')[0].trim())};src:url(${rel(S.fontFile)});font-weight:100 900}</style>` : '';
function html(cfg) {
  const block = `window.STILL = ${JSON.stringify({ ...look, ...cfg }, null, 1)};`;
  return tpl.replace(/window\.STILL = \{[\s\S]*?\n\};/, block).replace('<style>', fontFace + '<style>');
}
function render(name, kind, cfg) {
  const file = path.join(cfgDir, `${name}-${kind}.html`);
  fs.writeFileSync(file, html(cfg));
  execFileSync('node', [path.join(here, 'render.cjs'), file, path.join(outDir, `${name}-${kind}.png`), String(cfg.width), String(cfg.height)], { stdio: 'inherit' });
}

for (const b of S.beats || []) {
  if (only.length && !only.includes(b.name)) continue;
  render(b.name, 'w', beatWide(b));
  render(b.name, 't', beatTall(b));
}
for (const p of S.pages || []) {
  if (only.length && !only.includes(p.name)) continue;
  render(p.name, 'w', page(p, true));
  render(p.name, 't', page(p, false));
}
