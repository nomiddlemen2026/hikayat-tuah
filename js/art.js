'use strict';
// ---------------------------------------------------------------- tile sprites
const tileCache = {};
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function speckle(g, base, cols, n, s) {
  g.fillStyle = base; g.fillRect(0, 0, TS, TS);
  for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(Math.floor(hash(i, s, 1) * TS), Math.floor(hash(s, i, 2) * TS), 2, 2); }
}
function drawTreeOn(g, v, dark) {
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(16, 26, 12, 5, 0, 0, 7); g.fill();
  g.fillStyle = '#5b3a1e'; g.fillRect(14, 18, 5, 10);
  const c1 = dark ? '#1f5a2a' : '#2f7d32', c2 = dark ? '#2a7234' : '#43a047', c3 = dark ? '#3a8a40' : '#66bb6a';
  g.fillStyle = c1; g.beginPath(); g.arc(16, 13, 12, 0, 7); g.fill();
  g.fillStyle = c2; g.beginPath(); g.arc(13 + v, 11, 8, 0, 7); g.fill();
  g.fillStyle = c3; g.beginPath(); g.arc(11 + v, 8, 3.5, 0, 7); g.fill();
}
function tileSprite(t, v) {
  const key = t + '_' + v;
  if (tileCache[key]) return tileCache[key];
  const s = v * 31 + t * 7;
  const c = mk(TS, TS, g => {
    switch (t) {
      case T.GRASS: case T.BLD: speckle(g, '#4f9a3a', ['#5fae46', '#448a31', '#6dbb4f'], 26, s); break;
      case T.FLOWER: speckle(g, '#4f9a3a', ['#5fae46', '#448a31'], 18, s);
        for (let i = 0; i < 4; i++) { g.fillStyle = ['#ff6f91', '#ffd54f', '#fff', '#ba68c8'][(i + v) % 4]; const x = 4 + hash(i, s, 5) * 24, y = 4 + hash(s, i, 6) * 24; g.fillRect(x, y, 3, 3); g.fillStyle = '#ffeb3b'; g.fillRect(x + 1, y + 1, 1, 1); } break;
      case T.DARK: speckle(g, '#2f6b2c', ['#3b7d35', '#265a24', '#468a3c'], 26, s); break;
      case T.PATH: speckle(g, '#b8925a', ['#a5824f', '#c9a36a', '#9a7444'], 20, s); break;
      case T.DIRT: speckle(g, '#8d7b68', ['#7d6b5a', '#a08e7a', '#6e5e4f'], 24, s); break;
      case T.SAND: speckle(g, '#e8d39a', ['#f2e0ae', '#d8c088', '#fff1c8'], 22, s); break;
      case T.SWAMP: speckle(g, '#4b5e3a', ['#56703f', '#3e4e30', '#617a48'], 24, s);
        g.fillStyle = 'rgba(60,90,80,0.5)'; g.beginPath(); g.ellipse(8 + v * 4, 20, 6, 3, 0, 0, 7); g.fill(); break;
      case T.FLOOR: g.fillStyle = '#6d6a62'; g.fillRect(0, 0, TS, TS); g.fillStyle = '#7d7a70'; g.fillRect(1, 1, 14, 14); g.fillRect(17, 17, 14, 14); g.fillStyle = '#625f57'; g.fillRect(17, 1, 14, 14); g.fillRect(1, 17, 14, 14);
        if (v === 2) { g.fillStyle = '#4e7a3e'; g.fillRect(5, 22, 6, 2); } break;
      case T.WALL: g.fillStyle = '#4a463f'; g.fillRect(0, 0, TS, TS);
        for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { g.fillStyle = (r + k + v) % 3 ? '#625d53' : '#57524a'; g.fillRect(k * 12 - (r % 2) * 6 + 1, r * 8 + 1, 10, 6); }
        g.fillStyle = 'rgba(80,140,60,0.6)'; g.fillRect(2 + v * 5, 0, 5, 3); break;
      case T.PILLAR: g.fillStyle = '#6d6a62'; g.fillRect(0, 0, TS, TS); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(6, 24, 22, 6);
        g.fillStyle = '#9b927f'; g.fillRect(8, 2, 16, 24); g.fillStyle = '#b5ab95'; g.fillRect(8, 2, 5, 24); g.fillStyle = '#c9a227'; g.fillRect(6, 0, 20, 4); g.fillRect(6, 24, 20, 3); break;
      case T.GATE: g.fillStyle = '#4a463f'; g.fillRect(0, 0, TS, TS); g.fillStyle = '#8a6a1c'; g.fillRect(2, 0, 28, TS); g.fillStyle = '#d4a82a';
        for (let i = 0; i < 4; i++) g.fillRect(4 + i * 7, 2, 3, 28); g.fillStyle = '#ffe082'; g.fillRect(2, 12, 28, 3); break;
      case T.PLANK: g.fillStyle = '#7a5230'; g.fillRect(0, 0, TS, TS); g.fillStyle = '#8f6239'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 8 + 1, TS, 6); g.fillStyle = '#4e3420'; g.fillRect(3, 0, 2, TS); g.fillRect(27, 0, 2, TS); break;
      case T.BRIDGE: g.fillStyle = '#2a6f9e'; g.fillRect(0, 0, TS, TS); g.fillStyle = '#8f6239'; g.fillRect(0, 0, TS, TS); g.fillStyle = '#a7743f'; for (let i = 0; i < 4; i++) g.fillRect(1 + i * 8, 0, 6, TS); g.fillStyle = '#5b3a1e'; g.fillRect(0, 0, TS, 2); g.fillRect(0, 30, TS, 2); break;
      case T.TREE: speckle(g, '#4f9a3a', ['#5fae46', '#448a31'], 16, s); drawTreeOn(g, v, false); break;
      case T.JTREE: speckle(g, '#2f6b2c', ['#3b7d35', '#265a24'], 16, s); drawTreeOn(g, v, true);
        g.fillStyle = '#7cb342'; g.fillRect(3 + v * 3, 20, 2, 8); g.fillRect(26 - v, 18, 2, 9); break;
      case T.MANGROVE: speckle(g, '#4b5e3a', ['#56703f', '#3e4e30'], 16, s);
        g.strokeStyle = '#4a3726'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16, 18); g.lineTo(6 + i * 7, 29); g.stroke(); }
        g.fillStyle = '#35502c'; g.beginPath(); g.arc(16, 12, 11, 0, 7); g.fill(); g.fillStyle = '#4b6b3a'; g.beginPath(); g.arc(13, 9, 6, 0, 7); g.fill(); break;
      case T.PALM: speckle(g, '#e8d39a', ['#f2e0ae', '#d8c088'], 16, s);
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(18, 28, 9, 3, 0, 0, 7); g.fill();
        g.strokeStyle = '#8b6b3e'; g.lineWidth = 4; g.beginPath(); g.moveTo(17, 29); g.quadraticCurveTo(12, 18, 16, 9); g.stroke();
        g.strokeStyle = '#2e8b3e'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.moveTo(16, 9); g.quadraticCurveTo(16 + Math.cos(a) * 8, 9 + Math.sin(a) * 4 - 4, 16 + Math.cos(a) * 13, 9 + Math.sin(a) * 7 + 3); g.stroke(); }
        g.fillStyle = '#6d4c1f'; g.beginPath(); g.arc(15, 11, 2, 0, 7); g.arc(18, 11, 2, 0, 7); g.fill(); break;
      case T.ROCK: speckle(g, '#8d7b68', ['#7d6b5a', '#a08e7a'], 14, s);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(16, 26, 13, 5, 0, 0, 7); g.fill();
        g.fillStyle = '#6f6f73'; g.beginPath(); g.moveTo(3, 26); g.lineTo(7, 8); g.lineTo(18, 3); g.lineTo(28, 10); g.lineTo(30, 26); g.closePath(); g.fill();
        g.fillStyle = '#8e8e94'; g.beginPath(); g.moveTo(8, 10); g.lineTo(18, 5); g.lineTo(20, 16); g.lineTo(9, 20); g.closePath(); g.fill();
        g.fillStyle = '#e8eef2'; if (v === 1) { g.beginPath(); g.moveTo(14, 5); g.lineTo(18, 3); g.lineTo(22, 6); g.closePath(); g.fill(); } break;
    }
  });
  tileCache[key] = c;
  return c;
}
function waterSprite(deep, f) {
  const key = 'w' + (deep ? 1 : 0) + f;
  if (tileCache[key]) return tileCache[key];
  return tileCache[key] = mk(TS, TS, g => {
    g.fillStyle = deep ? '#1e5a8c' : '#2f86b8'; g.fillRect(0, 0, TS, TS);
    g.strokeStyle = deep ? 'rgba(140,200,255,.35)' : 'rgba(200,240,255,.5)'; g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const y = (i * 11 + f * 4) % TS + 3, x = (i * 13 + f * 5) % 20; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 3, x + 8, y); g.stroke(); }
  });
}

// ---------------------------------------------------------------- character drawing
const HEROES = {
  tuah: { name: 'Hang Tuah', baju: '#f2c12e', sampin: '#7a4a12', tanjak: '#9a6a00', trim: '#fff3b0', skin: '#c68b59' },
  jebat: { name: 'Hang Jebat', baju: '#c62828', sampin: '#1f1f1f', tanjak: '#8e1b1b', trim: '#ffcdd2', skin: '#b97f50' },
  lekir: { name: 'Hang Lekir', baju: '#2e7d32', sampin: '#f9a825', tanjak: '#1b5e20', trim: '#c5e1a5', skin: '#c68b59' },
  lekiu: { name: 'Hang Lekiu', baju: '#5e35b1', sampin: '#26a69a', tanjak: '#311b92', trim: '#d1c4e9', skin: '#bf8654' },
  kasturi: { name: 'Hang Kasturi', baju: '#1e5bb8', sampin: '#eceff1', tanjak: '#0d2c6b', trim: '#90caf9', skin: '#c99062' },
};
function drawWeapon(g, wid, len) {
  // drawn pointing to +x from hand
  if (wid === 'fist' || !wid) return;
  if (wid === 'lembing') {
    g.fillStyle = '#7a5230'; g.fillRect(-6, -1.2, len + 6, 2.4);
    g.fillStyle = '#cfd8dc'; g.beginPath(); g.moveTo(len, -3.5); g.lineTo(len + 9, 0); g.lineTo(len, 3.5); g.fill();
    g.fillStyle = '#c62828'; g.fillRect(len - 3, -2.5, 3, 5); return;
  }
  const blade = wid === 'parang' ? '#b0bec5' : wid === 'taming' ? '#ffe082' : '#cfd8dc';
  g.fillStyle = '#5d3a1a'; g.fillRect(-2, -2, 6, 4);           // hilt
  g.fillStyle = '#d4a82a'; g.fillRect(3, -3.5, 2, 7);          // guard
  g.fillStyle = blade; g.beginPath();
  if (wid === 'parang') { g.moveTo(5, -2); g.lineTo(len, -4); g.lineTo(len + 2, 1); g.lineTo(5, 3); }
  else { // keris: wavy blade
    g.moveTo(5, -2.2); for (let i = 1; i <= 5; i++) g.lineTo(5 + i * (len - 5) / 5, (i % 2 ? -3.2 : -1.2)); g.lineTo(len + 3, 0);
    for (let i = 5; i >= 1; i--) g.lineTo(5 + i * (len - 5) / 5, (i % 2 ? 1.2 : 3.2)); g.lineTo(5, 2.2);
  }
  g.closePath(); g.fill();
  if (wid === 'taming') { g.shadowColor = '#ffd54f'; g.shadowBlur = 10; g.strokeStyle = 'rgba(255,240,180,.8)'; g.lineWidth = 1; g.stroke(); g.shadowBlur = 0; }
}
function drawHero(g, x, y, h, face, walk, wid, atk, opts = {}) {
  g.save(); g.translate(x, y);
  const s = opts.scale || 1; g.scale(s, s);
  const bob = Math.sin(walk * 10) * (opts.moving ? 1.5 : 0);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 12, 10, 4, 0, 0, 7); g.fill();
  const fx = Math.cos(face), fy = Math.sin(face), left = fx < -0.2;
  // legs
  const l = opts.moving ? Math.sin(walk * 10) * 3 : 0;
  g.fillStyle = '#3e2723'; g.fillRect(-5, 4 + l * 0.3, 4, 8 - l * 0.3); g.fillRect(1, 4 - l * 0.3, 4, 8 + l * 0.3);
  g.fillStyle = h.skin; g.fillRect(-5, 10 + l * 0.3, 4, 2); g.fillRect(1, 10 - l * 0.3, 4, 2);
  // weapon behind if facing up
  const wAng = face + (atk > 0 ? lerp(-1.4, 1.4, 1 - atk) : 0.5);
  const wl = wid === 'lembing' ? 20 + (atk > 0 ? 10 * Math.sin((1 - atk) * Math.PI) : 0) : (wid === 'parang' ? 15 : 14);
  const drawW = () => { if (!wid || wid === 'fist') return; g.save(); g.translate(fx * 6, -2 + bob + fy * 3); g.rotate(wid === 'lembing' ? face : wAng); drawWeapon(g, wid, wl); g.restore(); };
  if (fy < -0.3) drawW();
  // body / baju
  g.translate(0, bob);
  g.fillStyle = h.baju; g.beginPath(); g.roundRect ? g.roundRect(-8, -8, 16, 14, 4) : g.rect(-8, -8, 16, 14); g.fill();
  g.fillStyle = h.trim; g.fillRect(-1, -8, 2, 8);
  // sampin (waist cloth) with songket pattern
  g.fillStyle = h.sampin; g.fillRect(-9, 1, 18, 6);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = -8; i < 9; i += 4) g.fillRect(i, 3, 2, 2);
  // arms
  g.fillStyle = h.baju; const ax = fx * 7; g.fillRect(-11, -6, 4, 9); g.fillRect(7, -6, 4, 9);
  g.fillStyle = h.skin; g.fillRect(-11 + (fx > 0.3 ? 2 : 0), 2, 4, 3); g.fillRect(7 - (fx < -0.3 ? 2 : 0), 2, 4, 3);
  // head
  g.fillStyle = h.skin; g.beginPath(); g.arc(0, -14, 7, 0, 7); g.fill();
  // face
  if (fy > -0.4) {
    g.fillStyle = '#1a1a1a'; const ex = fx * 2.5;
    g.fillRect(-3.5 + ex, -14, 2, 2); g.fillRect(1.5 + ex, -14, 2, 2);
    g.fillStyle = '#8d5a3a'; g.fillRect(-1.5 + ex, -10.5, 3, 1);
  }
  // tanjak (folded head cloth): pointed crown with a tail
  g.fillStyle = h.tanjak;
  g.beginPath(); g.moveTo(-8, -16); g.lineTo(-7, -22); g.lineTo(left ? -4 : 4, -27); g.lineTo(7, -22); g.lineTo(8, -16); g.closePath(); g.fill();
  g.fillStyle = h.trim; g.fillRect(-8, -17.5, 16, 2);
  g.beginPath(); g.moveTo(left ? 7 : -7, -21); g.lineTo(left ? 12 : -12, -24); g.lineTo(left ? 8 : -8, -18); g.fill();
  g.translate(0, -bob);
  if (fy >= -0.3) drawW();
  if (opts.tied) { g.strokeStyle = '#c8a165'; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -4); g.lineTo(10, -2); g.moveTo(-10, 1); g.lineTo(10, 3); g.stroke(); }
  if (opts.flash) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-14, -30, 28, 44); }
  g.restore();
}
function drawNPC(g, x, y, kind, t) {
  if (kind === 'bendahara') drawHero(g, x, y, { baju: '#f5f0e1', sampin: '#6d4c41', tanjak: '#c9a227', trim: '#c9a227', skin: '#c08a5c' }, Math.PI / 2, t, null, 0);
  else if (kind === 'villager1') drawHero(g, x, y, { baju: '#8d6e63', sampin: '#a1887f', tanjak: '#5d4037', trim: '#d7ccc8', skin: '#c68b59' }, Math.PI / 2, t, null, 0);
  else if (kind === 'villager2') { drawHero(g, x, y, { baju: '#ec407a', sampin: '#7b1fa2', tanjak: '#ec407a', trim: '#f8bbd0', skin: '#d29a6a' }, Math.PI / 2, t, null, 0); }
  else if (kind === 'smith') drawHero(g, x, y, { baju: '#455a64', sampin: '#ff7043', tanjak: '#263238', trim: '#ffab91', skin: '#b97f50' }, Math.PI / 2, t, 'parang', 0);
}
function drawEnemy(g, e, t) {
  const d = e.def, s = d.boss ? 1.6 : 1, x = e.x, y = e.y;
  const flash = e.hurt > 0;
  g.save(); g.translate(x, y);
  if (e.tele > 0) { g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 40); }
  const k = d.look;
  if (k === 'human') {
    g.restore();
    drawHero(g, x, y, d.pal, e.face, t + e.seed, d.weapon, e.swing > 0 ? e.swing / 0.3 : 0, { scale: s, moving: e.moving, flash });
    return;
  }
  g.scale(s, s);
  const face = e.face, fx = Math.cos(face), dirx = fx < 0 ? -1 : 1;
  const step = e.moving ? Math.sin((t + e.seed) * 14) * 2 : 0;
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 10, d.r * 0.95, 4, 0, 0, 7); g.fill();
  if (k === 'boar') {
    g.fillStyle = '#3e2a1a'; g.fillRect(-8, 4 + step, 3, 6); g.fillRect(5, 4 - step, 3, 6);
    g.fillStyle = '#6b4a2f'; g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#4e3420'; for (let i = -6; i <= 6; i += 3) g.fillRect(i, -9, 2, 4);
    g.fillStyle = '#7d5a3c'; g.beginPath(); g.ellipse(dirx * 11, 1, 6, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#f5f5dc'; g.fillRect(dirx * 15 - 1, 2, 2, 4); g.fillStyle = '#000'; g.fillRect(dirx * 12, -2, 2, 2);
  } else if (k === 'tiger') {
    const white = d.boss;
    g.fillStyle = white ? '#e0e0e0' : '#e07b1a'; g.fillRect(-10, 4 + step, 4, 7); g.fillRect(7, 4 - step, 4, 7);
    g.beginPath(); g.ellipse(0, 0, 15, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; for (let i = -9; i <= 7; i += 4) g.fillRect(i, -8, 2, 7);
    g.fillStyle = white ? '#f5f5f5' : '#f08c2e'; g.beginPath(); g.arc(dirx * 13, -3, 7, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(dirx * 15, 0, 3.5, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.fillRect(dirx * 14 - 1, -6, 2, 2); g.fillRect(dirx * 11 - 1, -10, 3, 3);
    g.strokeStyle = white ? '#e0e0e0' : '#e07b1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-dirx * 14, -2); g.quadraticCurveTo(-dirx * 22, -10, -dirx * 19, -16); g.stroke();
    if (white) { g.fillStyle = '#1a1a1a'; g.fillRect(dirx * 9, -9, 2, 5); }
  } else if (k === 'croc') {
    g.fillStyle = d.boss ? '#3d5a1e' : '#4a6b2a';
    g.beginPath(); g.ellipse(0, 0, 16, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(dirx * 12, -4); g.lineTo(dirx * 26, -2); g.lineTo(dirx * 26, 3); g.lineTo(dirx * 12, 5); g.fill();
    g.beginPath(); g.moveTo(-dirx * 14, -3); g.lineTo(-dirx * 28, 0 + step); g.lineTo(-dirx * 14, 4); g.fill();
    g.fillRect(-9, 4 + step, 4, 4); g.fillRect(6, 4 - step, 4, 4); g.fillRect(-9, -8 - step, 4, 4); g.fillRect(6, -8 + step, 4, 4);
    g.fillStyle = '#2e4413'; for (let i = -10; i <= 10; i += 4) g.fillRect(i, -2, 2, 3);
    g.fillStyle = '#ffeb3b'; g.fillRect(dirx * 14, -5, 2, 2);
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(dirx * (15 + i * 3), 2, 1, 2);
    if (d.boss) { g.fillStyle = '#d4a82a'; g.beginPath(); g.moveTo(-6, -7); g.lineTo(-4, -12); g.lineTo(-1, -8); g.lineTo(2, -12); g.lineTo(4, -7); g.fill(); }
  } else if (k === 'wisp') {
    const p = Math.sin((t + e.seed) * 6);
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -6, 1, 0, -6, 14); gr.addColorStop(0, d.boss ? '#fff8e1' : '#e0fff4'); gr.addColorStop(0.4, d.boss ? 'rgba(255,193,7,.8)' : 'rgba(64,255,170,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, -6 + p * 2, 14, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#063'; g.fillRect(-3, -8 + p * 2, 2, 3); g.fillRect(2, -8 + p * 2, 2, 3);
  } else if (k === 'golem') {
    g.fillStyle = '#5f5b54'; g.fillRect(-9, 4 + step, 6, 8); g.fillRect(3, 4 - step, 6, 8);
    g.fillStyle = '#7a756c'; g.fillRect(-11, -10, 22, 16); g.fillStyle = '#8f897e'; g.fillRect(-7, -20, 14, 11);
    g.fillStyle = '#6a655c'; g.fillRect(-16, -8, 5, 12); g.fillRect(11, -8, 5, 12);
    g.fillStyle = '#4e7a3e'; g.fillRect(-10, -10, 6, 2);
    g.fillStyle = '#40e0ff'; g.fillRect(-4, -16, 3, 3); g.fillRect(2, -16, 3, 3); g.fillRect(-1, -4, 2, 4);
  } else if (k === 'guardian') {
    const p = Math.sin(t * 3) * 3;
    g.translate(0, p - 6);
    g.fillStyle = 'rgba(255,200,60,.25)'; g.beginPath(); g.arc(0, -4, 22, 0, 7); g.fill();
    g.fillStyle = '#3b2a4a'; g.beginPath(); g.moveTo(-12, -6); g.lineTo(12, -6); g.lineTo(16, 16); g.lineTo(-16, 16); g.closePath(); g.fill();
    g.fillStyle = '#d4a82a'; g.fillRect(-12, -6, 24, 3); g.fillRect(-2, -6, 4, 22);
    g.fillStyle = '#2a1e36'; g.beginPath(); g.arc(0, -14, 9, 0, 7); g.fill();
    g.fillStyle = '#d4a82a'; g.beginPath(); g.moveTo(-9, -18); g.lineTo(-6, -30); g.lineTo(-2, -21); g.lineTo(0, -33); g.lineTo(2, -21); g.lineTo(6, -30); g.lineTo(9, -18); g.closePath(); g.fill();
    g.fillStyle = '#ff5252'; g.fillRect(-5, -15, 3, 2); g.fillRect(2, -15, 3, 2);
    g.save(); g.rotate(t * 2); g.fillStyle = '#ffe082'; for (let i = 0; i < 3; i++) { g.rotate(Math.PI * 2 / 3); g.fillRect(20, -1, 8, 2); } g.restore();
  }
  if (flash) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(-30, -36, 60, 56); }
  g.restore();
}

