'use strict';
/* Hikayat Tuah: Quest for Taming Sari
   An original top-down action RPG inspired by the Malay legend of Hang Tuah.
   All art is drawn procedurally in code. */
'use strict';

// ---------------------------------------------------------------- setup
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const TS = 32, MW = 96, MH = 72;
let W = 0, H = 0, DPR = 1, ZOOM = 1, UIS = 1;
const DEBUG = /debug=1/.test(location.search);

// On phones held upright the whole game is turned 90 degrees (landscape, like most mobile games).
// The body is rotated with CSS, W/H are the landscape size and touches are remapped by toGame().
const TOUCH_DEV = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
let ROT = false;
const toGame = e => ROT ? { x: e.clientY, y: window.innerWidth - e.clientX } : { x: e.clientX, y: e.clientY };
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const iw = window.innerWidth, ih = window.innerHeight;
  ROT = TOUCH_DEV && ih > iw * 1.05;
  const bs = document.body.style;
  document.body.classList.toggle('rot', ROT);
  bs.width = ROT ? ih + 'px' : ''; bs.height = ROT ? iw + 'px' : '';
  W = ROT ? ih : iw; H = ROT ? iw : ih;
  document.documentElement.style.setProperty('--gw', W + 'px'); document.documentElement.style.setProperty('--gh', H + 'px');
  cv.width = Math.floor(W * DPR); cv.height = Math.floor(H * DPR);
  ZOOM = Math.max(0.85, Math.min(H / (TS * 11.5), 3));
  UIS = Math.max(0.75, Math.min(Math.min(W, H) / 380, 2.2));
}
window.addEventListener('resize', () => { resize(); if (typeof gfx !== 'undefined') gfx.resize(); });
resize();

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
let seed = 1234;
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rr = (a, b) => a + Math.random() * (b - a);

