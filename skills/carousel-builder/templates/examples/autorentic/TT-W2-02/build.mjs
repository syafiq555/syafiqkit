// TT-W2-02 "5 rekod": the week 2 Autorentic photo post, 7 slides, TikTok preset.
// Runs only after copying into a series folder (the logo and screenshot are not shipped with the skill):
// <series>/carousel.mjs, <series>/brand.css, <series>/rules.json, <series>/TT-W2-02/{build.mjs,logo.png,receipts-crop.png}
// Run: PLAYWRIGHT_DIR=<repo with playwright> node build.mjs
import {build} from '../carousel.mjs';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(dir, '..', f), 'utf8');
const T = 7;

const css = `
.bar{align-items:center}
.count{font-size:44px;padding:8px 30px}
.body{top:330px;height:1240px;gap:40px}
h2{font-size:96px}
.k,.v{white-space:nowrap}
.k{font-size:58px}
.v{font-size:96px}
.lead{font-size:68px}
.num{font-size:52px;width:112px;height:112px}
.card{padding:76px 64px;border-radius:56px}
.note{font-size:44px}
.hint{font-size:48px}
.cta{font-size:54px;padding:30px 52px}
.chip{font-size:64px;padding:26px 52px;margin:0 22px 22px 0}
.card .lead{font-size:62px}
.big{font-family:var(--font-display);font-weight:800;line-height:1.1;letter-spacing:-1.5px;text-wrap:balance}
`;

const mark = '<div class="logo-tile"><img src="logo.png"></div>';
const slide = (n, inner, cls = '') => `
<section class="slide ${cls}">
  <div class="bar">${mark}<div class="count">${n}/${T}</div></div>
  <div class="body">${inner}</div>
</section>`;

const slides = [
  slide(1, `
    <div class="hint">POV</div>
    <div class="big" style="font-size:84px">Tenant cakap dah bayar.</div>
    <div class="big" style="font-size:76px;margin-bottom:-24px">Simpan</div>
    <div style="font-family:var(--font-display);font-weight:800;font-size:210px;line-height:1;letter-spacing:-6px;color:var(--brand-300)">5 rekod</div>
    <div class="big" style="font-size:76px">ni setiap bulan.</div>
    <div class="hint">Leret, tengok 5 rekod tu &rarr;</div>`, 'dark'),

  slide(2, `
  <div class="num">1</div>
  <h2>Invoice dan <span class="accent">bulan</span> yang dibayar</h2>
  <div class="lead">Bayar untuk bulan mana? Tulis jelas.</div>
  <div class="card">
    <div class="row st"><span class="k">Invoice</span><span class="v">RM 1,200.00</span></div>
    <div class="lead" style="margin-top:32px;color:var(--ink-900);font-weight:600">Monthly Rental (Dec 2026)</div>
  </div>
  <div class="note">Data demo</div>`),

  slide(3, `
  <div class="num">2</div>
  <h2><span class="accent">Tarikh</span> duit masuk</h2>
  <div class="lead">Hari duit sampai, bukan tarikh due.</div>
  <div class="card">
    <div class="row st"><span class="k">Tarikh due</span><span class="v">1 Dec 2026</span></div>
    <div class="row st" style="margin-top:48px"><span class="k">Dah bayar</span><span class="v accent">3 Dec 2026</span></div>
  </div>
  <div class="note">Data demo</div>`),

  slide(4, `
  <div class="num">3</div>
  <h2><span class="accent">Jumlah</span> yang dibayar</h2>
  <div class="lead">Berapa sebenarnya yang masuk.</div>
  <div class="card">
    <div class="row st"><span class="k">Jumlah dibayar</span><span class="v">RM 1,200.00</span></div>
  </div>
  <div class="note">Data demo</div>`),

  slide(5, `
  <div class="num">4</div>
  <h2>Bayar <span class="accent">guna apa</span></h2>
  <div class="card">
    <div class="k" style="margin-bottom:36px">Cara bayar</div>
    <div>
      <span class="chip">FPX</span><span class="chip">DuitNow</span><span class="chip">Card</span>
    </div>
  </div>
  <div class="note">Data demo</div>`),

  slide(6, `
  <div class="num">5</div>
  <h2><span class="accent">Receipt</span> untuk tenant</h2>
  <div class="card">
    <div class="row st"><span class="k">Receipt</span><span class="v">RM 1,200.00</span></div>
    <div class="lead" style="margin-top:32px;color:var(--ink-900);font-weight:600">Dibayar 3 Dec 2026</div>
  </div>
  <div class="lead">Dihantar automatik bila tenant ada email dalam rekod.</div>
  <div class="note">Data demo</div>`),

  `
<section class="slide">
  <div class="bar">${mark}<div class="count">7/${T}</div></div>
  <div class="body" style="justify-content:center;gap:36px">
    <h2 style="font-size:88px">Autorentic simpan <span class="accent">receipt</span> tenant</h2>
    <div class="shot" style="width:640px;align-self:center"><img src="receipts-crop.png"></div>
    <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start">
      <div class="lead" style="font-weight:800;font-size:60px;color:var(--ink-900)">Free for up to 10 tenants.</div>
      <div class="lead" style="font-weight:700;font-size:56px;color:var(--brand-700)">Korang simpan rekod macam mana?</div>
      <div class="cta">Link di profil</div>
    </div>
  </div>
</section>`,
];

const {banned, ...rules} = JSON.parse(read('rules.json'));
await build({dir, slides, css, brand: read('brand.css'), banned, rules, preset: 'tiktok'});
