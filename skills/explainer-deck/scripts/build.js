#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [specPath, outArg, flag] = process.argv.slice(2);
if (!specPath) {
  console.error('usage: build.js <deck.json> [out.pptx] [--check]');
  process.exit(2);
}
const checkOnly = outArg === '--check' || flag === '--check';
const specDir = path.dirname(path.resolve(specPath));
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const OUT = outArg && outArg !== '--check' ? outArg : path.join(specDir, 'dist', `${path.basename(specPath, '.json')}.pptx`);

const T = {
  ground: 'F3F2EE', surface: 'FFFFFF', sunk: 'E8E6E0', ink: '1D1C1A', soft: '55524C',
  accent: '1D4FA8', onAccent: 'FFFFFF', ours: 'E6EEFC', oursInk: '16326B',
  open: '7A4300', openBg: 'F5EAD9', font: 'Arial', ...(spec.theme || {}),
};
const PALETTE = [
  ['DFF0F0', '1C5656'], ['F3E6D4', '6A4013'], ['ECE3F3', '51306B'], ['E1EFDF', '24561F'],
  ['E3E9F3', '24406C'], ['F6E1E1', '7A2626'], ['E6E4DF', '3B3936'], ['FFF1C9', '6B5200'],
];
const PARTIES = Array.isArray(spec.parties)
  ? Object.fromEntries(spec.parties.map((p, i) => [p, PALETTE[i % PALETTE.length]]))
  : spec.parties || {};
const LABELS = { quoted: 'From the source', worked: 'Worked from source figures', made_up: 'Made-up numbers', ...(spec.example_labels || {}) };
const BADGE = { quoted: [T.oursInk, T.ours], worked: ['24561F', 'E1EFDF'], made_up: [T.open, T.openBg] };
const STRIP = spec.strip_label || 'In the source';
const WAITS = spec.waits_label || 'Waiting on';
const CURRENCY = spec.currency || 'RM';
const FIGURE = new RegExp(spec.figure_pattern || `${CURRENCY.replace(/[$]/g, '\\$')}[\\d,]*\\d(?:\\.\\d\\d)?|\\d+(?:\\.\\d+)?%|\\d+ (?:days?|hours?|weeks?|months?)\\b`, 'g');
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plain = (x) => norm(x).replace(/(\d),(?=\d{3})/g, '$1');
const holds = (hay, f) => new RegExp(`(?<![\\w.])${esc(plain(f))}(?!\\d|\\.\\d)`).test(plain(hay));

const W = 13.333, M = 0.5, CW = W - 2 * M;
const money = (n) => `${n < 0 ? '-' : ''}${CURRENCY}${Math.abs(n).toFixed(2)}`;

const possessive = (n) => (n.endsWith('s') ? `${n}'` : `${n}'s`);
let lucideDir = null;
try { lucideDir = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons'); require.resolve('@resvg/resvg-js'); } catch { lucideDir = null; }
const iconFile = (name) => path.join(lucideDir, `${name}.svg`);
const usesJourney = (spec.slides || []).some((x) => x.type === 'journey');

const errors = [];
const bad = (where, msg) => errors.push(`${where}: ${msg}`);
const words = (s, n, where) => {
  if (typeof s !== 'string' || !s.trim()) return bad(where, 'empty text');
  if (s.trim().split(/\s+/).length > n) bad(where, `"${s}" is over ${n} words`);
};
const count = (arr, lo, hi, where, what) => {
  if (!Array.isArray(arr) || arr.length < lo || arr.length > hi) bad(where, `needs ${lo} to ${hi} ${what}`);
  return Array.isArray(arr) ? arr : [];
};
const party = (name) => PARTIES[name] || [T.sunk, T.soft];
const isParty = (name, where) => { if (!PARTIES[name]) bad(where, `"${name}" is not in parties`); };
const CLASSES = new Set(['dry', 'chilled', 'frozen']);
const TONES = new Set(['now', 'other', 'warn', 'same']);

function items(list, where) {
  for (const it of list) {
    if (typeof it === 'string') {
      bad(where, `item "${it}" must be an object {"name": "..."}, not a bare string`);
      continue;
    }
    words(it.name, 4, `${where} item`);
    if (it.cls && !CLASSES.has(it.cls)) bad(where, 'cls must be dry, chilled or frozen');
  }
}

function checkVisual(v, where) {
  const k = v && v.kind;
  if (k === 'flow') {
    count(v.steps, 3, 5, where, 'flow steps (more break words mid-way in Google Slides)');
    const all = [...(v.steps || []), ...((v.branch && v.branch.steps) || [])];
    all.forEach((s, i) => { words(s.label, 6, `${where} step ${i + 1}`); isParty(s.actor, `${where} step ${i + 1}`); if (s.note) words(s.note, 12, `${where} step ${i + 1} note`); });
    if (v.branch) {
      if (!(v.branch.from_step >= 0 && v.branch.from_step < v.steps.length)) bad(where, 'branch from_step out of range');
      words(v.branch.when, 6, `${where} branch when`);
      count(v.branch.steps, 1, 3, where, 'branch steps');
    }
  } else if (k === 'split') {
    words(v.from.label, 6, `${where} from`);
    for (const g of count(v.to, 2, 4, where, 'groups')) { words(g.label, 6, `${where} group`); if (g.tag) words(g.tag, 4, `${where} tag`); }
    for (const g of [v.from, ...(v.to || [])]) items(count(g.items, 1, 6, where, 'items per box'), where);
  } else if (k === 'compare') {
    for (const side of ['left', 'right']) {
      const c = v[side] || {};
      words(c.heading, 6, `${where} ${side} heading`);
      if (!TONES.has(c.tone)) bad(where, `${side} tone must be now, other, warn or same`);
      for (const l of count(c.lines, 2, 5, `${where} ${side}`, 'lines')) words(l, 12, `${where} ${side} line`);
    }
  } else if (k === 'waterfall') {
    let total = Math.round(v.start.amount * 100);
    for (const s of count(v.steps, 2, 6, where, 'steps')) { words(s.label, 7, `${where} step`); isParty(s.by, `${where} step`); total += Math.round(s.delta * 100); }
    if (total !== Math.round(v.end.amount * 100)) bad(where, `start plus steps is ${money(total / 100)}, end says ${money(v.end.amount)}`);
  } else if (k === 'timeline') {
    for (const p of count(v.points, 3, 6, where, 'points')) { words(p.when, 4, `${where} when`); words(p.what, 10, `${where} what`); }
  } else if (k === 'ledger') {
    const cols = count(v.columns, 3, 5, where, 'columns');
    const rows = count(v.rows, 2, 7, where, 'rows');
    for (const r of [...rows, ...(v.total ? [v.total] : [])]) {
      if (r.length !== cols.length) bad(where, `row ${JSON.stringify(r)} does not match ${cols.length} columns`);
      r.forEach((c) => words(c || '-', 8, `${where} cell`));
    }
  } else if (k === 'ladder') {
    for (const t of count(v.tiers, 2, 4, where, 'tiers')) { words(t.if, 8, `${where} if`); words(t.then, 10, `${where} then`); }
  } else if (k === 'share') {
    let total = 0;
    for (const p of count(v.parts, 2, 5, where, 'parts')) { words(p.label, 5, `${where} part`); isParty(p.who, `${where} part`); total += Math.round(p.amount * 100); }
    if (total !== Math.round(v.total.amount * 100)) bad(where, `parts add to ${money(total / 100)}, total says ${money(v.total.amount)}`);
  } else if (k === 'panels') {
    if (!Array.isArray(v.panels) || v.panels.length !== 2) bad(where, 'panels needs exactly 2 panels');
    for (const p of v.panels || []) {
      words(p.heading, 6, `${where} panel heading`);
      if (!TONES.has(p.tone)) bad(where, 'panel tone must be now, other, warn or same');
      for (const g of count(p.groups, 1, 4, where, 'groups per panel')) {
        words(g.label, 6, `${where} group`);
        if (g.tag) words(g.tag, 4, `${where} tag`);
        items(count(g.items, 1, 4, where, 'items per group'), where);
      }
    }
  } else if (k === 'clocks') {
    words(v.start.when, 4, `${where} start when`);
    words(v.start.what, 10, `${where} start what`);
    for (const b of count(v.bars, 2, 4, where, 'bars')) { words(b.label, 5, `${where} bar`); if (b.end != null) words(b.end, 4, `${where} bar end`); words(b.note, 12, `${where} bar note`); }
  } else {
    bad(where, 'visual.kind must be flow, split, compare, waterfall, timeline, ledger, ladder, share, panels or clocks');
  }
}

const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase();
const docs = {};
const doc = (file) => {
  const p = path.resolve(specDir, file);
  if (!docs[p]) {
    if (!fs.existsSync(p)) { bad('sources', `${file} not found`); return (docs[p] = []); }
    docs[p] = fs.readFileSync(p, 'utf8').split('\n');
  }
  return docs[p];
};
const sourceFiles = spec.sources || [];
const factFiles = spec.facts || [];
const workingFiles = spec.workings || [];
const allSourceText = [...sourceFiles, ...factFiles, ...workingFiles].map((f) => doc(f).join('\n')).join('\n');
const factText = factFiles.map((f) => doc(f).join('\n')).join('\n');

function nearText(srcs, where) {
  const out = [];
  for (const s of srcs) {
    const lines = doc(s.file);
    const i = Number(s.line) - 1, lo = Math.max(0, i - 12), hi = Math.min(lines.length, i + 13);
    const window = lines.slice(lo, hi).join(' ');
    if (!s.quote || s.quote.trim().length < 20) bad(where, `quote "${s.quote}" is too short to prove anything; copy at least 20 characters`);
    else if (!norm(window).includes(norm(s.quote))) bad(where, `quote "${s.quote}" not found near ${s.file} line ${s.line}`);
    out.push(window);
  }
  return out.join(' ');
}

function checkMechanism(s, where) {
  words(s.heading, 5, `${where} heading`);
  if (!s.sub || s.sub.length > 100) bad(where, 'sub (the claim under the heading) is required, max 100 characters');
  checkVisual(s.visual, where);
  const ex = s.example || {};
  if (!LABELS[ex.kind]) bad(where, 'example.kind must be quoted, worked or made_up');
  for (const l of count(ex.lines, 2, 6, where, 'example lines')) words(l, 16, `${where} example line`);
  if (s.rule) words(s.rule, 30, `${where} rule`);
  for (const w of s.waits_on || []) words(w, 3, `${where} waits_on`);
  if (sourceFiles.length && !(s.src || []).length) bad(where, 'needs src (file, line, quote) because the spec lists sources');
  const near = (s.src || []).length ? nearText(s.src, where) : '';
  if (ex.kind === 'made_up' || !sourceFiles.length && !factFiles.length && !workingFiles.length) return;
  const nums = [];
  const v = s.visual || {};
  if (v.kind === 'waterfall') nums.push(v.start.amount, v.end.amount, ...v.steps.map((x) => x.delta));
  if (v.kind === 'share') nums.push(v.total.amount, ...v.parts.map((x) => x.amount));
  const body = JSON.stringify([s.visual, ex.lines, s.sub, s.rule]) + nums.map((n) => ` ${money(Math.abs(n))}`).join('');
  const allowed = ex.kind === 'quoted' ? factText : allSourceText;
  for (const f of new Set(body.match(FIGURE) || [])) {
    if (!holds(near, f) && !holds(allowed, f)) {
      bad(where, `${f} is not near its cited lines${ex.kind === 'quoted' ? ' or in the facts files; if you worked it out, set example.kind to "worked"' : ' or in the sources, facts or workings files'}`);
    }
  }
}

const WHERE = new Set(['outside', 'email', 'screen', 'tool', 'auto']);
function checkPlace(x, at, isMoment) {
  if (!WHERE.has(x.where)) return bad(at, 'where must be outside, email, screen, tool or auto');
  if (x.where === 'screen') words(x.screen, 4, `${at} screen`);
  if (x.where === 'tool') words(x.tool, 3, `${at} tool`);
  if (isMoment && x.where === 'auto') bad(at, 'a moment is something the person does or sees, never auto');
}
function checkJourney(s, where) {
  words(s.person, 3, `${where} person`);
  isParty(s.actor, `${where} actor`);
  words(s.goal, 14, `${where} goal`);
  if (s.heading) words(s.heading, 5, `${where} heading`);
  const ms = Array.isArray(s.moments) ? s.moments : [];
  const mains = ms.filter((m) => !m.under);
  if (mains.length < 2 || mains.length > 6 || ms.length > 8) bad(where, 'needs 2 to 6 main moments and at most 8 in all');
  const taken = new Set();
  ms.forEach((m, i) => {
    const at = `${where} moment ${i + 1}`;
    if (!/^[a-z0-9-]+$/.test(m.icon || '')) bad(at, 'icon must be a lucide icon name (lowercase-with-dashes)');
    else if (lucideDir && !fs.existsSync(iconFile(m.icon))) bad(at, `no lucide icon named ${m.icon}`);
    words(m.label, 6, at);
    checkPlace(m, at, true);
    if (m.eg) words(m.eg, 7, `${at} eg`);
    if (m.when) {
      words(m.when, 6, `${at} when`);
      if (!/^(If|Once|After|Until|When) /.test(m.when)) bad(at, 'when must read as a condition starting If, Once, After, Until or When');
    }
    if (m.under != null) {
      if (!Number.isInteger(m.under) || m.under < 1 || m.under > mains.length || !m.when) bad(at, 'an alternative moment needs under (a main moment number) and when');
      if (taken.has(m.under)) bad(at, 'one alternative per main moment');
      taken.add(m.under);
    }
  });
  const behind = s.behind || [];
  const per = {};
  behind.forEach((b, i) => {
    const at = `${where} behind ${i + 1}`;
    isParty(b.actor, at);
    if (!Number.isInteger(b.at) || b.at < 1 || b.at > mains.length) bad(at, 'at must be a main moment number');
    if ((per[b.at] = (per[b.at] || 0) + 1) > 2) bad(at, 'at most 2 behind cards under one moment');
    words(b.label, 6, at);
    checkPlace(b, at, false);
  });
  if (behind.length > 8) bad(where, 'at most 8 behind cards');
  if (s.numbers && !LABELS[s.numbers]) bad(where, 'numbers must be quoted, worked or made_up');
  if (s.rule) words(s.rule, 30, `${where} rule`);
  for (const w of s.waits_on || []) words(w, 3, `${where} waits_on`);
  const named = [...ms, ...behind].map((x) => x.screen || x.tool).filter(Boolean);
  if (sourceFiles.length && (named.length || s.rule) && !(s.src || []).length) bad(where, 'needs src (file, line, quote) for its screens, tools and rule');
  const near = (s.src || []).length ? nearText(s.src, where) : '';
  for (const n of named) {
    const close = (s.src || []).some((x) => {
      const lines = doc(x.file), i = Number(x.line) - 1;
      return new RegExp(`(?<![a-z0-9])${esc(norm(n))}(?![a-z0-9])`).test(norm(lines.slice(Math.max(0, i - 3), i + 4).join(' ')));
    });
    if (sourceFiles.length && !close) bad(where, `"${n}" is not named within 3 lines of a cited line; cite the line that names it`);
  }
  const kind = s.numbers || 'quoted';
  if (kind === 'made_up' || !allSourceText) return;
  const allowed = kind === 'quoted' ? factText : allSourceText;
  for (const f of new Set(JSON.stringify([s.goal, ms, behind, s.rule, s.notes]).match(FIGURE) || [])) {
    if (!holds(near, f) && !holds(allowed, f)) bad(where, `${f} is not near its cited lines or in the files its numbers kind allows`);
  }
}

function checkFigures(parts, where) {
  if (!allSourceText) return;
  for (const f of new Set(JSON.stringify(parts).match(FIGURE) || [])) {
    if (!holds(allSourceText, f)) bad(where, `${f} is not in the sources, facts or workings files`);
  }
}

const raw = JSON.stringify(spec);
if (raw.includes('\u2014')) bad('spec', 'em dash found; use a colon, comma or brackets');
const slides = count(spec.slides, 1, 80, 'spec', 'slides');
const tracker = spec.tracker || null;
const ids = new Set();
slides.forEach((s, i) => {
  const where = `slide ${i + 1}${s.id ? ` (${s.id})` : ''}`;
  if (s.id) { if (ids.has(s.id)) bad(where, 'duplicate id'); ids.add(s.id); }
  if (s.section != null && (!tracker || !(s.section >= 1 && s.section <= tracker.length))) bad(where, 'section must be a 1-based index into tracker');
  if (s.notes) count(s.notes, 1, 5, where, 'notes lines');
  if (s.type === 'title') { words(s.title, 12, `${where} title`); }
  else if (s.type === 'text') { words(s.heading, 5, `${where} heading`); count(s.bullets, 1, 6, where, 'bullets').forEach((b) => words(b, 18, `${where} bullet`)); checkFigures([s.sub, s.bullets], where); }
  else if (s.type === 'table') { words(s.heading, 5, `${where} heading`); checkVisual({ kind: 'ledger', columns: s.columns, rows: s.rows, total: s.total }, where); checkFigures([s.sub, s.rows, s.total], where); }
  else if (s.type === 'mechanism') checkMechanism(s, where);
  else if (s.type === 'journey') checkJourney(s, where);
  else bad(where, 'type must be title, text, table, mechanism or journey');
});
if (tracker) tracker.forEach((t, i) => words(t, 2, `tracker ${i + 1}`));

if (usesJourney && !lucideDir) bad('spec', 'journey slides need lucide-static and @resvg/resvg-js: npm install --prefix ~/.cache/explainer-deck lucide-static @resvg/resvg-js');
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exit(1);
}
if (!sourceFiles.length && !factFiles.length && !workingFiles.length) {
  console.error('UNCHECKED: the spec lists no sources, facts or workings, so no quote or figure was checked against anything.');
}
if (checkOnly) {
  console.log(`OK ${slides.length} slides checked`);
  process.exit(0);
}

const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = spec.title || '';
if (spec.author) pres.author = spec.author;
pres.theme = { headFontFace: T.font, bodyFontFace: T.font };

const txt = (opts) => ({ fontFace: T.font, color: T.ink, margin: 0, isTextBox: true, valign: 'top', ...opts });
function fit(text, w, h, max, min = 8) {
  const parts = Array.isArray(text) ? text : [text];
  for (let size = max; size > min; size -= 0.5) {
    const perLine = Math.max(1, Math.floor((w * 72) / (size * 0.52)));
    const lines = parts.reduce((a, p) => a + Math.max(1, Math.ceil(String(p).length / perLine)), 0);
    if (lines * size * 1.25 <= h * 72) return size;
  }
  return min;
}
const kinds = require('./kinds.js')({ pres, T, party, txt, fit, money });
const ICONS = path.join(path.dirname(path.resolve(OUT)), 'icons');
function icon(name, color) {
  const out = path.join(ICONS, `${name}-${color}.png`);
  if (!fs.existsSync(out)) {
    const { Resvg } = require('@resvg/resvg-js');
    const svg = fs.readFileSync(iconFile(name), 'utf8').replace(/currentColor/g, `#${color}`);
    fs.mkdirSync(ICONS, { recursive: true });
    fs.writeFileSync(`${out}.tmp`, new Resvg(svg, { fitTo: { mode: 'width', value: 192 } }).render().asPng());
    fs.renameSync(`${out}.tmp`, out);
  }
  return out;
}
const journeyMap = require('./journey.js')({ pres, T, party, txt, icon, possessive });

const base = (slide) => { slide.background = { color: T.ground }; };
const PRESENTER_CUTS = [
  /^Stress( [^:]{1,30})?:\s*/i,
  /^Stress that\s+/i,
  /^Raise:\s*/i,
  /^Raise rows? \d[\d, and]*( \([^)]*\))?( and rows? \d+( \([^)]*\))?)?[^:.]{0,40}[:.]\s*/i,
  /^[^:.]{0,20} to say out loud:\s*/i,
  /^Say (it |this |the [^.]{1,30} )?out loud[:.]?\s*/i,
  /\s+Say (it |this |the [^.]{1,30} )?out loud\.?\s*$/i,
  /,? so do not give a number on the day(?=\.)/i,
  ...(spec.presenter_cues || []).map((p) => new RegExp(p, 'i')),
];
const forClient = spec.notes_for === 'client';
const clientNote = (line) => {
  const t = PRESENTER_CUTS.reduce((s, re) => s.replace(re, ''), line).trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const notes = (slide, lines) => {
  const out = (lines || []).map((l) => (forClient ? clientNote(l) : l)).filter((l) => l.length > 0);
  if (out.length) slide.addNotes(out.join('\n'));
};
function strip(slide, current) {
  if (!tracker) return;
  const gap = 0.08, w = (CW - (tracker.length - 1) * gap) / tracker.length;
  tracker.forEach((name, i) => {
    const on = i + 1 === current;
    slide.addText(`${i + 1}  ${name}`, txt({
      x: M + i * (w + gap), y: 0.3, w, h: 0.38, fontSize: fit(`${i + 1}  ${name}`, w - 0.1, 0.38, 11, 8), bold: on, align: 'center', valign: 'middle',
      color: on ? T.onAccent : T.soft, fill: { color: on ? T.accent : T.sunk }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06,
    }));
  });
}
function heading(slide, s, y) {
  if (s.kicker) slide.addText(s.kicker.toUpperCase(), txt({ x: M, y: y - 0.24, w: 4, h: 0.22, fontSize: 10, bold: true, color: T.accent, charSpacing: 2 }));
  slide.addText(s.heading, txt({ x: M, y, w: CW, h: 0.5, fontSize: 26, bold: true, valign: 'middle' }));
  if (s.sub) slide.addText(s.sub, txt({ x: M, y: y + 0.5, w: CW, h: 0.36, fontSize: fit(s.sub, CW, 0.36, 14, 11), color: T.soft, valign: 'middle' }));
}

function bottomStrip(slide, s) {
  const waits = s.waits_on || [], rw = waits.length ? 2.6 : 0;
  if (s.rule) slide.addText([{ text: `${STRIP}  `, options: { bold: true, color: T.accent } }, { text: s.rule, options: { color: T.ink } }], txt({ x: M, y: 6.25, w: CW - rw - (rw ? 0.15 : 0), h: 0.85, fontSize: fit(`${STRIP}  ${s.rule}`, CW - rw - 0.4, 0.75, 12.5, 10), valign: 'middle', fill: { color: T.surface }, margin: [6, 12, 6, 12], shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06 }));
  if (waits.length) slide.addText([{ text: WAITS, options: { bold: true, breakLine: true } }, { text: waits.join(', ') }], txt({ x: M + CW - rw, y: 6.25, w: rw, h: 0.85, fontSize: 12, color: T.open, valign: 'middle', align: 'center', fill: { color: T.openBg }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06 }));
}

const LAYOUT = {
  title(slide, s) {
    slide.addText(s.title, txt({ x: M, y: 2.3, w: CW, h: 1.2, fontSize: fit(s.title, CW, 1.2, 40, 26), bold: true, valign: 'bottom' }));
    slide.addShape(pres.shapes.RECTANGLE, { x: M, y: 3.55, w: 1.2, h: 0.06, fill: { color: T.accent }, line: { color: T.accent, width: 0 } });
    if (s.subtitle) slide.addText(s.subtitle, txt({ x: M, y: 3.7, w: 10, h: 0.9, fontSize: 18, color: T.soft }));
  },
  text(slide, s) {
    heading(slide, s, tracker ? 1.0 : 0.6);
    const y = tracker ? 2.0 : 1.6, h = 7.0 - y;
    slide.addText(s.bullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < s.bullets.length - 1, paraSpaceAfter: 10 } })), txt({ x: M, y, w: CW * 0.8, h, fontSize: fit(s.bullets, CW * 0.8 - 0.3, h, 20, 13), color: T.ink }));
  },
  table(slide, s) {
    heading(slide, s, tracker ? 1.0 : 0.6);
    const y = tracker ? 2.0 : 1.6;
    kinds.ledger(slide, { columns: s.columns, rows: s.rows, total: s.total }, M, y, CW, 7.0 - y);
  },
  journey(slide, s) {
    heading(slide, { kicker: s.kicker || 'User journey', heading: s.heading || `${possessive(s.person)} journey`, sub: s.goal }, 0.98);
    if (s.numbers === 'made_up') slide.addText(LABELS.made_up, txt({ x: M + CW - 1.9, y: 0.8, w: 1.9, h: 0.3, fontSize: 10, bold: true, align: 'center', valign: 'middle', color: BADGE.made_up[0], fill: { color: BADGE.made_up[1] }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05 }));
    journeyMap(slide, s, M, 1.95, CW, s.rule || (s.waits_on || []).length ? 6.08 : 6.9);
    bottomStrip(slide, s);
  },
  mechanism(slide, s) {
    heading(slide, { kicker: s.kicker || 'How it works', heading: s.heading, sub: s.sub }, 0.98);
    const vx = M, vy = 1.95, vw = 8.55, vh = 4.1;
    kinds[s.visual.kind](slide, s.visual, vx, vy, vw, vh);
    const ex = 9.3, ew = M + CW - ex, badge = BADGE[s.example.kind];
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ex, y: vy, w: ew, h: vh, fill: { color: T.surface }, line: { color: T.sunk, width: 1 }, rectRadius: 0.08 });
    slide.addText('Example', txt({ x: ex + 0.18, y: vy + 0.14, w: 1.2, h: 0.32, fontSize: 14, bold: true, color: T.accent }));
    slide.addText(LABELS[s.example.kind], txt({ x: ex + ew - 2.05, y: vy + 0.15, w: 1.87, h: 0.28, fontSize: fit(LABELS[s.example.kind], 1.8, 0.28, 9, 7), bold: true, align: 'center', valign: 'middle', color: badge[0], fill: { color: badge[1] }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05 }));
    const lines = s.example.lines;
    slide.addText(lines.map((l, i) => ({ text: l, options: { bullet: { type: 'number' }, breakLine: i < lines.length - 1, paraSpaceAfter: 7 } })), txt({ x: ex + 0.18, y: vy + 0.6, w: ew - 0.36, h: vh - 0.75, fontSize: fit(lines.map((l) => `${l}   `), ew - 0.7, vh - 0.75 - lines.length * 0.1, 12.5, 9), color: T.ink }));
    bottomStrip(slide, s);
  },
};

for (const s of slides) {
  const slide = pres.addSlide();
  base(slide);
  if (s.type !== 'title') strip(slide, s.section);
  LAYOUT[s.type](slide, s);
  notes(slide, s.notes);
}

fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
pres.writeFile({ fileName: OUT }).then((f) => console.log(`OK ${f} (${slides.length} slides)`));
