const CLASS = { dry: ['F3E6D4', '6A4013', 'Dry'], chilled: ['DFF0F0', '1C5656', 'Chilled'], frozen: ['D9E5F7', '1D3F7A', 'Frozen'] };

module.exports = function makeKinds(ctx) {
  const { pres, T, party, txt, fit, money } = ctx;
  const TONE = { now: [T.ours, T.oursInk, 'What gets built'], other: [T.sunk, T.soft, 'The alternative'], warn: [T.openBg, T.open, 'Watch out'], same: [T.surface, T.accent, ''] };

  const arrow = (slide, x1, y1, x2, y2, color = T.soft) =>
    slide.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
      flipH: x2 < x1, flipV: y2 < y1, line: { color, width: 1.75, endArrowType: 'triangle' },
    });
  const box = (slide, o) => slide.addText(o.runs, txt({
    x: o.x, y: o.y, w: o.w, h: o.h, fontSize: o.fontSize || 12, align: o.align || 'center', valign: 'middle',
    fill: { color: o.fill || T.surface }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.07,
    line: { color: o.line || T.sunk, width: o.lineW || 1, dashType: o.dash ? 'dash' : 'solid' }, margin: o.margin || [4, 6, 4, 6],
  }));
  const chip = (slide, it, x, y, w, h) => {
    const c = it.cls ? CLASS[it.cls] : [T.surface, T.ink, ''];
    const sub = [c[2], it.sub].filter(Boolean).join(' · ');
    const runs = [{ text: it.name, options: { bold: true, color: c[1], breakLine: !!sub } }];
    if (sub) runs.push({ text: sub, options: { fontSize: 9, color: c[1] } });
    box(slide, { runs, x, y, w, h, fill: c[0], line: c[1], fontSize: fit(`${it.name} ${sub}`, w - 0.15, h - 0.08, 11, 8.5) });
  };

  function flow(slide, v, x, y, w, h) {
    const n = v.steps.length, gap = 0.35, bw = (w - gap * (n - 1)) / n, bh = v.branch ? 1.15 : 1.35;
    const rowY = v.branch ? y + 0.35 : y + (h - bh) / 2 - 0.3;
    const at = (i) => x + i * (bw + gap);
    v.steps.forEach((s, i) => {
      const a = party(s.actor);
      slide.addText(s.actor, txt({ x: at(i), y: rowY - 0.3, w: bw, h: 0.26, fontSize: fit(s.actor, bw, 0.26, 9.5, 7.5), bold: true, color: a[1], align: 'center' }));
      box(slide, { runs: [{ text: `${i + 1}  `, options: { bold: true, color: T.accent } }, { text: s.label, options: { bold: true, color: T.ink } }], x: at(i), y: rowY, w: bw, h: bh, fill: a[0], line: a[1], fontSize: fit(`${i + 1}  ${s.label}`, bw - 0.2, bh - 0.1, 12.5, 9) });
      if (s.note) slide.addText(s.note, txt({ x: at(i), y: rowY + bh + 0.08, w: bw, h: 0.75, fontSize: fit(s.note, bw, 0.75, 9.5, 7.5), color: T.soft, align: 'center' }));
      if (i < n - 1) arrow(slide, at(i) + bw + 0.03, rowY + bh / 2, at(i + 1) - 0.03, rowY + bh / 2);
    });
    if (!v.branch) return;
    const b = v.branch, noteBottom = rowY + bh + (v.steps.some((s) => s.note) ? 0.85 : 0.1), by = noteBottom + 0.55, bx0 = at(b.from_step);
    const firstX = Math.min(bx0, x + w - b.steps.length * bw - (b.steps.length - 1) * gap);
    arrow(slide, bx0 + bw / 2, noteBottom, firstX + bw / 2, by - 0.05, T.open);
    slide.addText(b.when, txt({ x: Math.min(bx0 + bw / 2 + 0.1, x + w - 2.8), y: noteBottom + 0.08, w: 2.8, h: 0.35, fontSize: 10.5, bold: true, color: T.open }));
    b.steps.forEach((s, j) => {
      const bx = firstX + j * (bw + gap);
      box(slide, { runs: [{ text: s.label, options: { bold: true, color: T.open } }], x: bx, y: by, w: bw, h: 0.85, fill: T.openBg, line: T.open, fontSize: fit(s.label, bw - 0.2, 0.75, 11.5, 8.5), dash: true });
      const room = x + w - bx - bw - 0.1;
      if (s.note && j === b.steps.length - 1 && room >= 1.3) slide.addText(s.note, txt({ x: bx + bw + 0.08, y: by, w: Math.min(2.4, room), h: 0.85, fontSize: 9, color: T.soft, valign: 'middle' }));
      else if (s.note) slide.addText(s.note, txt({ x: bx, y: by + 0.88, w: bw, h: 0.42, fontSize: 8.5, color: T.soft, align: 'center' }));
      if (j > 0) arrow(slide, bx - gap + 0.03, by + 0.42, bx - 0.03, by + 0.42, T.open);
    });
  }

  function split(slide, v, x, y, w, h) {
    const fw = 2.5, fromH = Math.min(h, 0.75 + v.from.items.length * 0.62);
    const fy = y + (h - fromH) / 2;
    box(slide, { runs: [{ text: '' }], x, y: fy, w: fw, h: fromH, fill: T.surface, line: T.soft });
    slide.addText(v.from.label, txt({ x: x + 0.1, y: fy + 0.08, w: fw - 0.2, h: 0.4, fontSize: 12, bold: true, align: 'center' }));
    v.from.items.forEach((it, i) => chip(slide, it, x + 0.15, fy + 0.55 + i * 0.62, fw - 0.3, 0.54));
    const gx = x + fw + 0.9, gw = w - fw - 0.9, gap = 0.18, gh = (h - gap * (v.to.length - 1)) / v.to.length;
    v.to.forEach((g, i) => {
      const gy = y + i * (gh + gap);
      arrow(slide, x + fw + 0.05, fy + fromH / 2, gx - 0.05, gy + gh / 2, T.accent);
      box(slide, { runs: [{ text: '' }], x: gx, y: gy, w: gw, h: gh, fill: T.surface, line: T.accent });
      slide.addText(g.label, txt({ x: gx + 0.15, y: gy + 0.06, w: gw - 1.9, h: 0.36, fontSize: 12.5, bold: true, color: T.oursInk, valign: 'middle' }));
      if (g.tag) slide.addText(g.tag, txt({ x: gx + gw - 1.75, y: gy + 0.08, w: 1.6, h: 0.32, fontSize: 11, bold: true, align: 'center', valign: 'middle', color: T.onAccent, fill: { color: T.accent }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05 }));
      const cw = Math.min(2.0, (gw - 0.3 - 0.1 * (g.items.length - 1)) / g.items.length), ch = Math.min(0.6, gh - 0.55);
      g.items.forEach((it, j) => chip(slide, it, gx + 0.15 + j * (cw + 0.1), gy + 0.48, cw, ch));
    });
  }

  function compare(slide, v, x, y, w, h) {
    const cw = (w - 0.3) / 2;
    ['left', 'right'].forEach((side, i) => {
      const c = v[side], t = TONE[c.tone], cx = x + i * (cw + 0.3);
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y, w: cw, h, fill: { color: T.surface }, line: { color: t[1], width: 1.5 }, rectRadius: 0.08 });
      if (t[2]) slide.addText(t[2], txt({ x: cx + 0.2, y: y + 0.15, w: cw - 0.4, h: 0.3, fontSize: 10, bold: true, color: t[1] }));
      slide.addText(c.heading, txt({ x: cx + 0.2, y: y + 0.45, w: cw - 0.4, h: 0.6, fontSize: fit(c.heading, cw - 0.4, 0.6, 17, 12), bold: true, color: T.ink }));
      slide.addText(c.lines.map((l, j) => ({ text: l, options: { bullet: true, breakLine: j < c.lines.length - 1, paraSpaceAfter: 8 } })), txt({ x: cx + 0.2, y: y + 1.15, w: cw - 0.4, h: h - 1.3, fontSize: fit(c.lines, cw - 0.7, h - 1.3, 13, 9.5), color: T.ink }));
    });
  }

  function waterfall(slide, v, x, y, w, h) {
    const bars = [{ label: v.start.label, from: 0, to: v.start.amount, fill: T.sunk, ink: T.ink }];
    let run = v.start.amount;
    v.steps.forEach((s) => {
      const who = party(s.by);
      bars.push({ label: s.label, from: run, to: run + s.delta, fill: who[0], ink: who[1], by: s.by, delta: s.delta });
      run += s.delta;
    });
    bars.push({ label: v.end.label, from: 0, to: v.end.amount, fill: T.accent, ink: T.onAccent, end: true });
    const max = Math.max(...bars.map((b) => Math.max(b.from, b.to))), plotH = h - 1.2, floor = y + 0.35 + plotH;
    const gap = 0.2, bw = (w - gap * (bars.length - 1)) / bars.length, scale = plotH / max;
    bars.forEach((b, i) => {
      const lo = Math.min(b.from, b.to), hi = Math.max(b.from, b.to), bx = x + i * (bw + gap);
      const by = floor - hi * scale, bh = Math.max((hi - lo) * scale, 0.04);
      slide.addShape(pres.shapes.RECTANGLE, { x: bx, y: by, w: bw, h: bh, fill: { color: b.fill }, line: { color: b.end ? T.accent : b.ink, width: 1 } });
      slide.addText(money(b.delta !== undefined ? b.delta : b.to), txt({ x: bx - 0.1, y: by - 0.32, w: bw + 0.2, h: 0.3, fontSize: 12, bold: true, align: 'center', valign: 'bottom', color: b.delta !== undefined ? b.ink : T.ink }));
      const lab = [{ text: b.label, options: { breakLine: !!b.by } }];
      if (b.by) lab.push({ text: `paid by ${b.by}`, options: { fontSize: 9, bold: true, color: b.ink } });
      slide.addText(lab, txt({ x: bx - 0.05, y: floor + 0.06, w: bw + 0.1, h: 0.8, fontSize: fit(b.label, bw + 0.1, 0.55, 10, 8), align: 'center', color: T.ink }));
    });
  }

  function timeline(slide, v, x, y, w, h) {
    const n = v.points.length, ly = y + h * 0.42, x0 = x + 0.9, span = w - 1.8, step = span / (n - 1), lw = Math.min(2.0, step - 0.12);
    slide.addShape(pres.shapes.LINE, { x: x0, y: ly, w: span, h: 0, line: { color: T.accent, width: 3 } });
    v.points.forEach((p, i) => {
      const px = x0 + i * step;
      slide.addShape(pres.shapes.OVAL, { x: px - 0.15, y: ly - 0.15, w: 0.3, h: 0.3, fill: { color: i === n - 1 ? T.accent : T.surface }, line: { color: T.accent, width: 2 } });
      slide.addText(p.when, txt({ x: px - lw / 2, y: ly - 0.85, w: lw, h: 0.6, fontSize: fit(p.when, lw, 0.6, 15, 10), bold: true, align: 'center', valign: 'bottom' }));
      slide.addText(p.what, txt({ x: px - lw / 2, y: ly + 0.3, w: lw, h: 1.6, fontSize: fit(p.what, lw, 1.6, 12, 9), align: 'center', color: T.soft }));
    });
  }

  function ledger(slide, v, x, y, w, h) {
    const head = v.columns.map((c) => ({ text: c, options: { bold: true, color: T.soft, fill: { color: T.sunk } } }));
    const rows = v.rows.map((r) => r.map((c) => ({ text: c, options: { fill: { color: T.surface }, color: /^[-−]/.test(c) ? T.open : T.ink } })));
    if (v.total) rows.push(v.total.map((c) => ({ text: c, options: { bold: true, fill: { color: T.ours }, color: T.oursInk } })));
    const rowH = Math.min(0.5, h / (rows.length + 1));
    slide.addTable([head, ...rows], { x, y, w, fontFace: T.font, fontSize: rowH < 0.45 ? 12 : 14, color: T.ink, border: { type: 'solid', color: T.sunk, pt: 1 }, rowH, valign: 'middle', margin: [4, 8, 4, 8] });
  }

  function ladder(slide, v, x, y, w, h) {
    const n = v.tiers.length, gap = 0.42, th = Math.min(1.0, (h - gap * (n - 1)) / n);
    v.tiers.forEach((t, i) => {
      const ty = y + i * (th + gap), ind = i * 0.35;
      slide.addText(String(i + 1), txt({ x: x + ind, y: ty + (th - 0.55) / 2, w: 0.55, h: 0.55, fontSize: 18, bold: true, align: 'center', valign: 'middle', color: T.onAccent, fill: { color: T.accent }, shape: pres.shapes.OVAL }));
      box(slide, {
        runs: [{ text: t.if, options: { bold: true, color: T.ink, breakLine: true } }, { text: t.then, options: { color: T.oursInk } }],
        x: x + ind + 0.7, y: ty, w: w - ind - 0.7, h: th, fill: i === 0 ? T.ours : T.surface, line: T.accent, align: 'left', fontSize: 13, margin: [6, 12, 6, 12],
      });
      if (i < n - 1) {
        arrow(slide, x + ind + 0.28, ty + th - 0.05, x + ind + 0.63, ty + th + gap + (th - 0.55) / 2 - 0.02, T.soft);
        slide.addText('if not', txt({ x: x + ind + 0.75, y: ty + th + 0.06, w: 1.2, h: 0.3, fontSize: 9.5, italic: true, color: T.soft }));
      }
    });
  }

  function share(slide, v, x, y, w) {
    const total = v.total.amount, bh = 0.9;
    slide.addText(`${v.total.label}: ${money(total)}`, txt({ x, y, w, h: 0.4, fontSize: 15, bold: true }));
    let bx = x;
    v.parts.forEach((p) => {
      const pw = (p.amount / total) * w, c = party(p.who);
      if (pw > 0) slide.addShape(pres.shapes.RECTANGLE, { x: bx, y: y + 0.5, w: pw, h: bh, fill: { color: c[0] }, line: { color: T.surface, width: 2 } });
      bx += pw;
    });
    const cw = (w - 0.15 * (v.parts.length - 1)) / v.parts.length;
    v.parts.forEach((p, i) => {
      const c = party(p.who);
      slide.addText([
        { text: money(p.amount), options: { fontSize: 20, bold: true, color: c[1], breakLine: true } },
        { text: p.label, options: { fontSize: 12, color: T.ink, breakLine: true } },
        { text: p.who, options: { fontSize: 9.5, bold: true, color: c[1] } },
      ], txt({ x: x + i * (cw + 0.15), y: y + 1.65, w: cw, h: 1.5, fill: { color: c[0] }, margin: [8, 10, 8, 10], shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.07 }));
    });
  }

  function panels(slide, v, x, y, w, h) {
    const pw = (w - 0.3) / 2;
    v.panels.forEach((p, i) => {
      const t = TONE[p.tone], px = x + i * (pw + 0.3);
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y, w: pw, h, fill: { color: T.surface }, line: { color: t[1], width: 1.5 }, rectRadius: 0.08 });
      if (t[2]) slide.addText(t[2], txt({ x: px + 0.18, y: y + 0.12, w: pw - 0.36, h: 0.26, fontSize: 9.5, bold: true, color: t[1] }));
      slide.addText(p.heading, txt({ x: px + 0.18, y: y + 0.38, w: pw - 0.36, h: 0.4, fontSize: fit(p.heading, pw - 0.36, 0.4, 15, 11), bold: true, color: T.ink, valign: 'middle' }));
      const top = y + 0.9, gap = 0.14, n = p.groups.length, gh = Math.min(1.25, (h - 1.0 - gap * (n - 1)) / n);
      p.groups.forEach((g, j) => {
        const gy = top + j * (gh + gap), gx = px + 0.15, gw = pw - 0.3;
        box(slide, { runs: [{ text: '' }], x: gx, y: gy, w: gw, h: gh, fill: T.ground, line: T.accent });
        slide.addText(g.label, txt({ x: gx + 0.12, y: gy + 0.05, w: gw - 1.5, h: 0.32, fontSize: 11.5, bold: true, color: T.oursInk, valign: 'middle' }));
        if (g.tag) slide.addText(g.tag, txt({ x: gx + gw - 1.4, y: gy + 0.07, w: 1.3, h: 0.28, fontSize: 9.5, bold: true, align: 'center', valign: 'middle', color: T.onAccent, fill: { color: T.accent }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05 }));
        const k = g.items.length, cw = Math.min(1.75, (gw - 0.24 - 0.08 * (k - 1)) / k), ch = Math.min(0.62, gh - 0.48);
        g.items.forEach((it, m) => chip(slide, it, gx + 0.12 + m * (cw + 0.08), gy + 0.42, cw, ch));
      });
    });
  }

  function clocks(slide, v, x, y, w, h) {
    const x0 = x + 2.15, n = v.bars.length, rowH = Math.min(1.0, (h - 0.75) / n), barEnd = x + w - 0.1;
    slide.addShape(pres.shapes.LINE, { x: x0, y: y + 0.55, w: 0, h: n * rowH + 0.1, line: { color: T.accent, width: 2.5 } });
    slide.addText([{ text: v.start.when, options: { bold: true, fontSize: 14, color: T.ink, breakLine: true } }, { text: v.start.what, options: { fontSize: 10.5, color: T.soft } }], txt({ x: x0 - 0.1, y, w: 4.5, h: 0.52, valign: 'bottom' }));
    v.bars.forEach((b, i) => {
      const by = y + 0.7 + i * rowH, open = b.end == null, bw = barEnd - x0;
      slide.addText(b.label, txt({ x, y: by, w: 2.0, h: 0.42, fontSize: fit(b.label, 2.0, 0.42, 12, 9), bold: true, align: 'right', valign: 'middle' }));
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x0, y: by + 0.04, w: bw, h: 0.34, fill: { color: open ? T.surface : T.ours }, line: { color: open ? T.soft : T.accent, width: 1.25, dashType: open ? 'dash' : 'solid' }, rectRadius: 0.05 });
      slide.addText(open ? 'length not set yet' : b.end, txt({ x: barEnd - 2.2, y: by + 0.04, w: 2.1, h: 0.34, fontSize: 11, bold: true, align: 'right', valign: 'middle', color: open ? T.soft : T.oursInk }));
      slide.addText(b.note, txt({ x: x0, y: by + 0.42, w: barEnd - x0, h: Math.max(0.3, rowH - 0.46), fontSize: 10, color: T.soft }));
    });
  }

  return { flow, split, compare, waterfall, timeline, ledger, ladder, share, panels, clocks };
};
