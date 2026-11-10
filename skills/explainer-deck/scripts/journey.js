module.exports = function makeJourney(ctx) {
  const { pres, T, party, txt, icon, possessive } = ctx;
  const place = (x) => ({
    outside: ['Outside the system', T.soft],
    email: ['By email', T.soft],
    screen: [`Screen: ${x.screen}`, T.accent],
    tool: [`In ${x.tool}`, T.soft],
    auto: ['Automatic', T.soft],
  })[x.where];

  function momentCard(slide, m, num, x, y, w, h, ink, size) {
    const amber = !!m.when, off = m.where === 'outside' || m.where === 'email';
    const [tag, tagColor] = place(m);
    const runs = [];
    if (m.when) runs.push({ text: m.when, options: { fontSize: size - 2, bold: true, color: T.open, breakLine: true } });
    runs.push({ text: `${num}  `, options: { bold: true, color: T.accent } });
    runs.push({ text: m.label, options: { bold: true, color: T.ink, breakLine: true } });
    runs.push({ text: tag, options: { fontSize: size - 2.5, bold: true, color: tagColor, breakLine: !!m.eg } });
    if (m.eg) runs.push({ text: m.eg, options: { fontSize: size - 2, italic: true, color: T.soft } });
    slide.addText(runs, txt({
      x, y, w, h, fontSize: size, valign: 'top', align: 'center', margin: [5, 6, 5, 6],
      fill: { color: off ? T.ground : T.surface }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06,
      line: { color: amber ? T.open : off ? T.soft : ink, width: 1.25, dashType: off || m.when ? 'dash' : 'solid' },
    }));
  }

  return function journeyMap(slide, j, x, y, w, bottom) {
    const mains = j.moments.filter((m) => !m.under), alts = j.moments.filter((m) => m.under);
    const n = mains.length, gap = 0.28, cw = (w - gap * (n - 1)) / n;
    const at = (i) => x + i * (cw + gap);
    const [fill, ink] = party(j.actor);
    const forked = alts.length > 0;
    const iconD = forked ? 0.6 : 0.7, iconY = y + 0.02, cardY = iconY + iconD + 0.1, cardH = forked ? 1.05 : 1.3;
    const size = n >= 6 ? 11 : forked ? 11.5 : 12.5;
    slide.addShape(pres.shapes.LINE, { x: at(0) + cw / 2, y: iconY + iconD / 2, w: at(n - 1) - at(0), h: 0, line: { color: ink, width: 2 } });
    mains.forEach((m, i) => {
      const cx = at(i), ic = iconD * 0.6;
      slide.addShape(pres.shapes.OVAL, { x: cx + cw / 2 - iconD / 2, y: iconY, w: iconD, h: iconD, fill: { color: fill }, line: { color: ink, width: 1.5 } });
      slide.addImage({ path: icon(m.icon, ink), x: cx + cw / 2 - ic / 2, y: iconY + iconD / 2 - ic / 2, w: ic, h: ic });
      momentCard(slide, m, String(i + 1), cx, cardY, cw, cardH, ink, size);
    });
    let lineY = cardY + cardH + 0.22;
    if (forked) {
      const altY = cardY + cardH + 0.18, altH = 0.82;
      alts.forEach((m) => {
        const i = m.under - 1;
        slide.addShape(pres.shapes.LINE, { x: at(i) + cw / 2, y: cardY + cardH, w: 0, h: 0.18, line: { color: T.open, width: 1.25, dashType: 'dash', endArrowType: 'triangle' } });
        momentCard(slide, m, `${m.under}b`, at(i), altY, cw, altH, ink, size - 1);
      });
      lineY = altY + altH + 0.18;
    }
    slide.addShape(pres.shapes.LINE, { x, y: lineY, w, h: 0, line: { color: T.soft, width: 1, dashType: 'dash' } });
    const by = lineY + 0.3, bh = bottom - by;
    const groups = {};
    (j.behind || []).forEach((b) => (groups[b.at] = groups[b.at] || []).push(b));
    Object.entries(groups).forEach(([k, list]) => {
      const i = Number(k) - 1, h = (bh - 0.06 * (list.length - 1)) / list.length;
      const small = list.length > 1 || bh < 0.8, bare = forked && list.length > 1;
      list.forEach((b, r) => {
        const [bf, bi] = party(b.actor);
        slide.addText([
          { text: b.actor, options: { fontSize: small ? 8.5 : 10, bold: true, color: bi, breakLine: true } },
          { text: b.label, options: { fontSize: small ? 9.5 : 12, bold: true, color: T.ink, breakLine: !bare } },
          ...(bare ? [] : [{ text: place(b)[0], options: { fontSize: small ? 8 : 9.5, color: bi } }]),
        ], txt({ x: at(i), y: by + r * (h + 0.06), w: cw, h, valign: 'middle', align: 'center', margin: small ? 2 : 5, fill: { color: bf }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05, line: { color: bi, width: 0.75 } }));
      });
      if (!alts.some((m) => m.under === Number(k))) slide.addShape(pres.shapes.LINE, { x: at(i) + cw / 2, y: cardY + cardH, w: 0, h: by - cardY - cardH, line: { color: T.soft, width: 0.75, dashType: 'sysDot' } });
    });
    const who = j.person.replace(/^(The|A) /, (s) => s.toLowerCase());
    slide.addText(`Out of ${possessive(who)} sight`, txt({ x, y: lineY - 0.14, w: 2.6, h: 0.28, fontSize: 10, bold: true, color: T.soft, valign: 'middle', fill: { color: T.ground } }));
  };
};
