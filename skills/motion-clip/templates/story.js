window.STORY = {
  duration: 15,
  frame: 'browser',
  colors: { page: '#F7F7F5', ink: '#1B1B1B', inkMuted: '#555555', accent: '#2F6FEB', accentSoft: '#DCE7FC', highlight: '#2F6FEB' },
  fonts: {
    heading: { family: 'Helvetica Neue', weight: 800 },
    body: { family: 'Helvetica Neue', weight: 600 },
  },
  shot: { w: 2880, h: 1800 },
  browser: { url: 'example.com' },
  music: { bpm: 120, groove: [2.0, 11.0], hatsFrom: 1.0 },

  hook: [
    { text: 'Your hook,', color: 'ink', in: 0.15, out: 2.0 },
    { text: 'in five words.', color: 'accent', in: 1.0, out: 2.05 },
  ],
  device: { enter: 2.05, leave: 11.5 },
  screens: [
    { name: '01_first', from: 0 },
    { name: '02_second', from: 6.5, via: 'push' },
  ],
  taps: [
    { show: 5.35, at: 6.0, hide: 6.55, from: [0.7, 0.7], to: [0.5, 0.5] },
  ],
  camera: [
    { t: 0, z: 1, x: 0.5, y: 0.5 },
    { t: 3.0, z: 1.3, x: 0.5, y: 0.4 },
    { t: 6.6, z: 1.2, x: 0.5, y: 0.5 },
  ],
  captions: [
    { rows: ['First thing', ['it does for you.', 'accent']], in: 2.6, out: 6.2 },
    { rows: ['Second thing', ['it does for you.', 'accent']], in: 6.75, out: 11.2 },
  ],
  lockup: { at: 12.15, name: 'Product name', line: 'One line call to action' },
};
