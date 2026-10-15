window.STORY = {
  duration: 20,
  frame: 'phone',
  colors: {
    page: '#F8FDFD', ink: '#1C3B3A', inkMuted: '#34605D', accent: '#2F7F77', accentSoft: '#DBF5F3',
    highlight: '#00B8A6', surface: '#FFFFFF', line: '#CEE3E1', bezel: '#0F151F',
  },
  fonts: {
    heading: { family: 'Manrope', weight: 800, file: 'assets/Manrope-800.ttf' },
    body: { family: 'SourceSans', weight: 600, file: 'assets/SourceSans3-600.ttf' },
  },
  logo: 'assets/autorentic-logo.png',
  shot: { w: 1170, h: 2532 },
  statusTime: '9:41',
  music: { bpm: 120, groove: [2.0, 14.0], hatsFrom: 1.0, introBell: 1.0 },

  hook: [
    { text: 'Three bills.', color: 'ink', in: 0.15, out: 2.0 },
    { text: 'One tap.', color: 'accent', in: 1.0, out: 2.05 },
  ],
  device: { enter: 2.05, leave: 14.5 },
  screens: [
    { name: '01_home', from: 0, status: 'page' },
    { name: '03_pay_bills', from: 6.5, via: 'push', status: 'surface' },
    { name: '04_waiting', from: 10.25, via: 'push', status: 'surface' },
    { name: '05_paid', from: 11.25, via: 'fade', status: 'surface' },
  ],
  taps: [
    { show: 5.35, at: 6.0, hide: 6.55, from: [0.8, 0.62], to: [585 / 1170, 827 / 2532] },
    { show: 9.3, at: 9.75, hide: 10.3, from: [0.78, 0.7], to: [585 / 1170, 2348 / 2532] },
  ],
  camera: [
    { t: 0, z: 1, x: 0.5, y: 0.5 },
    { t: 3.0, z: 1.6, x: 0.5, y: 0.24 },
    { t: 5.3, z: 1.6, x: 0.5, y: 0.3 },
    { t: 6.6, z: 1.45, x: 0.5, y: 0.3 },
    { t: 9.0, z: 1.3, x: 0.5, y: 0.62 },
    { t: 10.35, z: 1.45, x: 0.5, y: 0.22 },
    { t: 11.35, z: 1.7, x: 0.5, y: 0.17 },
  ],
  success: { at: 11.35, until: 14.6, y: 330 / 2532 },
  captions: [
    { rows: ['Everything you owe,', ['in one place.', 'accent']], in: 2.6, out: 6.2 },
    { rows: ['Pay them all', ['in one go.', 'accent']], in: 6.75, out: 10.2 },
    { rows: ['Receipts,', ['right in the app.', 'accent']], in: 11.4, out: 14.4 },
  ],
  number: {
    from: 14.55, to: 17.4, drop: 14.65, every: 0.045, count: 20, merge: 15.9, pill: 16.0, pillOut: 17.0,
    pillText: 'One payment',
    lines: [
      { text: 'Up to', color: 'inkMuted', scale: 1, in: 14.6, out: 16.95 },
      { text: '20 bills,', color: 'ink', scale: 1.25, in: 14.75, out: 17.0 },
      { text: 'one payment.', color: 'accent', scale: 1.25, in: 16.05, out: 17.05 },
    ],
  },
  lockup: { at: 17.15, name: 'Autorentic', line: 'Tenant app · coming soon to iOS and Android' },
};
