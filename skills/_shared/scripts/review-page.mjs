// One self-contained HTML review page: a numbered card per beat or slide, its picture,
// the check results, a note box per card, and a button that copies every note as one change list.
// Used by motion-clip (render.mjs review) and carousel-builder (carousel.mjs review).

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const scriptString = (s) => JSON.stringify(String(s)).replace(/</g, '\\u003c');

export function reviewPage({title, subtitle = '', frame, items, notes = [], zones = null, zonesLabel = 'platform UI areas'}) {
  const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`;
  const zoneDivs = (zones || []).map((z) => `<i class="zone" title="${esc(z.name)}" style="left:${pct(z.x0, frame.w)};top:${pct(z.y0, frame.h)};width:${pct(z.x1 - z.x0, frame.w)};height:${pct(z.y1 - z.y0, frame.h)}"></i>`).join('');
  const level = (l) => (l === 'error' ? 'bad' : l === 'warn' ? 'warn' : 'ok');
  const cards = items.map((it) => `
<article class="card${it.issues?.some((x) => x.level !== 'ok') ? ' flagged' : ''}" data-n="${it.n}" data-label="${esc(`${it.when ? `${it.when} · ` : ''}${it.label}`)}">
  <div class="pic" style="aspect-ratio:${frame.w}/${frame.h}"><img src="${it.img}" alt="${esc(it.label)}">${zoneDivs}<b class="num">${it.n}</b></div>
  <div class="meta">
    <h2>${it.when ? `<span>${esc(it.when)}</span>` : ''}${esc(it.label)}</h2>
    ${it.detail ? `<p class="detail">${esc(it.detail)}</p>` : ''}
    ${(it.issues || []).map((x) => `<p class="issue ${level(x.level)}">${esc(x.text)}</p>`).join('')}
    <textarea placeholder="What should change here?"></textarea>
  </div>
</article>`).join('');
  const noteRows = notes.map((x) => `<li class="${level(x.level)}">${esc(x.text)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f3f4f6;color:#111827}
header{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #e5e7eb;padding:14px 20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
header h1{font-size:18px;margin:0;flex:1 1 260px}header h1 small{display:block;font-weight:400;color:#6b7280;font-size:13px}
button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:10px 16px;background:#111827;color:#fff;cursor:pointer}
label.toggle{display:flex;gap:6px;align-items:center;color:#374151;font-size:14px}
main{padding:20px;display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.summary{grid-column:1/-1;background:#fff;border-radius:12px;padding:12px 18px}.summary ul{margin:6px 0 0;padding-left:18px}
.card{background:#fff;border-radius:12px;overflow:hidden;border:2px solid transparent}.card.flagged{border-color:#f59e0b}
.pic{position:relative;background:#000}.pic img{display:block;width:100%;height:100%;object-fit:contain}
.zone{position:absolute;background:rgba(239,68,68,.22);outline:1px dashed rgba(239,68,68,.8);display:none}body.zones .zone{display:block}
.num{position:absolute;left:8px;top:8px;background:#111827;color:#fff;border-radius:999px;min-width:30px;padding:3px 9px;text-align:center}
.meta{padding:12px 14px}.meta h2{font-size:15px;margin:0 0 4px}.meta h2 span{color:#6b7280;font-weight:500;margin-right:6px}
.detail{margin:0 0 6px;color:#374151}.issue{margin:4px 0;font-size:13px;padding:4px 8px;border-radius:6px}
.ok{color:#065f46}.issue.ok{background:#ecfdf5}.warn{color:#92400e}.issue.warn{background:#fffbeb}.bad{color:#991b1b}.issue.bad{background:#fef2f2}
textarea{width:100%;min-height:58px;margin-top:8px;font:inherit;border:1px solid #d1d5db;border-radius:8px;padding:8px}
#general{grid-column:1/-1;min-height:70px}#done{color:#065f46;font-weight:600}
</style></head><body${zones ? ' class="zones"' : ''}>
<header><h1>${esc(title)}<small>${esc(subtitle)}</small></h1>
${zones ? `<label class="toggle"><input type="checkbox" id="zt" checked> Show ${esc(zonesLabel)}</label>` : ''}
<span id="done"></span><button id="copy">Copy change list</button></header>
<main>
${noteRows ? `<section class="summary"><strong>Automatic checks</strong><ul>${noteRows}</ul></section>` : ''}
${cards}
<textarea id="general" placeholder="Anything about the whole piece (music, pace, the idea)?"></textarea>
</main>
<script>
const zt = document.getElementById('zt');
if (zt) zt.onchange = () => document.body.classList.toggle('zones', zt.checked);
document.getElementById('copy').onclick = async () => {
  const lines = [];
  document.querySelectorAll('.card').forEach((c) => {
    const note = c.querySelector('textarea').value.trim();
    if (note) lines.push('#' + c.dataset.n + ' ' + c.dataset.label + '\\n  ' + note.replace(/\\n/g, '\\n  '));
  });
  const general = document.getElementById('general').value.trim();
  if (general) lines.push('Overall\\n  ' + general.replace(/\\n/g, '\\n  '));
  const text = lines.length ? ${scriptString(`Changes for ${title}`)} + '\\n\\n' + lines.join('\\n\\n') : ${scriptString(`No changes for ${title}`)};
  const done = document.getElementById('done');
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  done.textContent = lines.length ? 'Copied ' + lines.length + (lines.length === 1 ? ' change' : ' changes') : 'Copied (no notes yet)';
};
</script></body></html>`;
}
