'use strict';
// ---------------------------------------------------------------- player actions
function nearestInteract() {
  let best = null, bd = 46;
  for (const n of npcs) { const d = dist(n.x, n.y, player.x, player.y); if (d < bd) { bd = d; best = { type: 'npc', o: n }; } }
  for (const c of chests) { if (c.open) continue; const d = dist(c.x, c.y, player.x, player.y); if (d < bd) { bd = d; best = { type: 'chest', o: c }; } }
  if (MAP === 'melaka' && save.bossDead.guardian && !save.taming) { const d = dist(81.5 * TS, 4.5 * TS, player.x, player.y); if (d < 50) best = { type: 'altar' }; }
  return best;
}
function doAction() {
  if (state !== 'play') return;
  const it = nearestInteract();
  if (it) {
    if (it.type === 'npc') { it.o.talk(); return; }
    if (it.type === 'chest') { openChest(it.o); return; }
    if (it.type === 'altar') { if (foundCount() < 4) say([['Hang Tuah', 'The keris will not move... All five of us must stand here together.']]); else takeTamingSari(); return; }
  }
  attack();
}
function attack() {
  if (player.atkCd > 0) return;
  const w = WEAPONS[save.weapon];
  // auto-aim at nearest enemy in reach
  let tgt = null, bd = w.range + 40;
  for (const e of enemies) { if (e.hp <= 0) continue; const d = dist(e.x, e.y, player.x, player.y) - e.r; if (d < bd) { bd = d; tgt = e; } }
  if (tgt) player.face = Math.atan2(tgt.y - player.y, tgt.x - player.x);
  player.atkCd = w.cd * atkSpeedMul(); player.atkAnim = 1;
  if (w.type === 'bow') { // ranged: auto-aim further and loose an arrow
    let far = null, fd = w.range;
    for (const e of enemies) { if (e.hp <= 0) continue; const d = dist(e.x, e.y, player.x, player.y); if (d < fd) { fd = d; far = e; } }
    if (far) player.face = Math.atan2(far.y - player.y, far.x - player.x);
    const crit = Math.random() < critChance();
    pprojs.push({ x: player.x + Math.cos(player.face) * 10, y: player.y + Math.sin(player.face) * 10, vx: Math.cos(player.face) * 430, vy: Math.sin(player.face) * 430, r: 6, life: w.range / 430 + 0.1, dmg: wdmg() * rr(dmgFloor(), 1.15) * (crit ? 2 : 1), crit, kind: 'arrow' });
    audio.throw(); return;
  }
  audio.swing();
  slashes.push({ x: player.x, y: player.y - 4, a: player.face, r: w.range, arc: w.arc, t: 0.18, max: 0.18, col: w.glow ? hexRGB(w.glow) : '255,255,255' });
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = dist(e.x, e.y, player.x, player.y);
    if (d > w.range + e.r + 6) continue;
    const ad = Math.abs(angDiff(Math.atan2(e.y - player.y, e.x - player.x), player.face));
    if (ad > w.arc / 2 && d > e.r + 12) continue;
    const crit = Math.random() < critChance();
    const dmg = wdmg() * rr(dmgFloor(), 1.15) * (crit ? 2 : 1);
    damageEnemy(e, dmg, player.x, player.y, crit);
  }
}
function doSkill() {
  if (state !== 'play' || player.skillCd > 0 || save.weapon === 'fist') { if (save.weapon === 'fist' && state === 'play') toast('Find a weapon first!'); return; }
  if (player.sp < SILAT_SP) { toast('Not enough SP'); return; }
  const w = WEAPONS[save.weapon];
  player.sp -= SILAT_SP; player.skillCd = 5; player.spin = 0.4; player.inv = Math.max(player.inv, 0.45); audio.dash();
  const R = 78;
  slashes.push({ x: player.x, y: player.y - 4, a: 0, r: R, arc: 6.3, t: 0.3, max: 0.3, col: '255,224,130' });
  for (const e of enemies) { if (e.hp <= 0) continue; if (dist(e.x, e.y, player.x, player.y) < R + e.r) damageEnemy(e, wdmg() * 1.6 * skillMul() * rr(0.9, 1.1), player.x, player.y, false, 1.6); }
}
// ---- magic (Chapter 2 onwards)
const wdmg = () => (WEAPONS[save.weapon].dmg + atkBonus()) * (player.tiger > 0 ? 1.4 : 1);
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0; return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
const inCone = (e, R, arc) => { const d = dist(e.x, e.y, player.x, player.y); return d < R + e.r && (d < e.r + 10 || Math.abs(angDiff(Math.atan2(e.y - player.y, e.x - player.x), player.face)) < arc / 2); };
function aimAt(range) { const t = nearestEnemy(range); if (t) player.face = Math.atan2(t.y - player.y, t.x - player.x); return t; }
const magicAtk = () => (20 + save.lvl * 3 + save.stats.int * 4) * skillMul();
const skillCdLeft = id => id === 'silat' ? Math.max(0, player.skillCd) : Math.max(0, player.cds[id] || 0);
function nearestEnemy(range) { let best = null, bd = range; for (const e of enemies) { if (e.hp <= 0) continue; const d = dist(e.x, e.y, player.x, player.y); if (d < bd) { bd = d; best = e; } } return best; }
function castSkill(id) {
  if (id === 'silat') return doSkill();
  const sk = SKILLS[id];
  if (!sk || state !== 'play' || !save.skills.includes(id)) return;
  if ((player.cds[id] || 0) > 0) return;
  if (player.sp < sk.sp) { toast('Not enough SP'); return; }
  if (id === 'penawar' && player.hp >= maxHp()) { toast('Health is already full'); return; }
  if (id === 'bayang' && !nearestEnemy(260)) { toast('No enemy close enough'); return; }
  player.sp -= sk.sp; player.cds[id] = sk.cd;
  if (castSilat(id)) return;
  if (id === 'api') {
    const t = nearestEnemy(300); if (t) player.face = Math.atan2(t.y - player.y, t.x - player.x);
    pprojs.push({ x: player.x, y: player.y, vx: Math.cos(player.face) * 300, vy: Math.sin(player.face) * 300, r: 9, life: 1.2, dmg: magicAtk() * 2.2, kind: 'fire', aoe: 52 });
    player.atkAnim = 1; audio.throw();
  } else if (id === 'penawar') {
    const h = Math.round(maxHp() * 0.35 + save.stats.int * 6); player.hp = Math.min(maxHp(), player.hp + h);
    texts.push({ x: player.x, y: player.y - 30, t: '+' + h, col: '#69f0ae', life: 1.2 }); audio.pickup();
    for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; parts.push({ x: player.x + Math.cos(a) * 20, y: player.y + Math.sin(a) * 14, vx: 0, vy: rr(-70, -30), life: 1, col: '#69f0ae', sz: 3 }); }
  } else if (id === 'petir') {
    const list = enemies.filter(e => e.hp > 0 && dist(e.x, e.y, player.x, player.y) < 190).sort((a, b) => dist(a.x, a.y, player.x, player.y) - dist(b.x, b.y, player.x, player.y)).slice(0, 5);
    if (!list.length) { bolts.push({ x: player.x + Math.cos(player.face) * 60, y: player.y + Math.sin(player.face) * 60, t: 0.35 }); }
    for (const e of list) { bolts.push({ x: e.x, y: e.y, t: 0.35 }); damageEnemy(e, magicAtk() * 1.7 * rr(0.9, 1.1), player.x, player.y, false, 0.4); }
    shake = Math.min(10, shake + 4); audio.dash();
  } else if (id === 'perisai') {
    player.shield = 10; audio.level();
    texts.push({ x: player.x, y: player.y - 30, t: 'Perisai!', col: '#80deea', life: 1.2 });
  }
}
function usePotion() {
  if (state !== 'play') return;
  if (save.potions <= 0) { toast('No Jamu potions left'); return; }
  if (player.hp >= maxHp()) { toast('Health is already full'); return; }
  save.potions--; const h = Math.round(maxHp() * 0.5); player.hp = Math.min(maxHp(), player.hp + h);
  texts.push({ x: player.x, y: player.y - 30, t: '+' + h, col: '#69f0ae', life: 1 }); audio.pickup();
  for (let i = 0; i < 12; i++) parts.push({ x: player.x + rr(-10, 10), y: player.y + rr(-10, 10), vx: 0, vy: rr(-60, -20), life: 0.8, col: '#69f0ae', sz: 3 });
}
function toast(t) { toasts.push({ t, life: 3 }); if (toasts.length > 3) toasts.shift(); log(t, 'sys'); }

function hexRGB(h) { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }

// ---- new silat skills and magic (v9)
function castSilat(id) {
  const p = player, cs = Math.cos(p.face), sn = Math.sin(p.face);
  if (id === 'tikam') { // dash strike
    aimAt(230); const c = Math.cos(p.face), s = Math.sin(p.face), sx = p.x, sy = p.y;
    for (let i = 0; i < 14; i++) moveEnt(p, c * 9, s * 9);
    for (const e of enemies) if (e.hp > 0 && segDist(e.x, e.y, sx, sy, p.x, p.y) < e.r + 22) damageEnemy(e, wdmg() * 2.2 * skillMul() * rr(0.9, 1.1), sx, sy, Math.random() < critChance(), 1.4);
    for (let k = 0; k < 4; k++) slashes.push({ x: lerp(sx, p.x, k / 3), y: lerp(sy, p.y, k / 3) - 4, a: p.face, r: 30, arc: 1.2, t: 0.22, max: 0.22, col: '170,215,255' });
    for (let i = 0; i < 26; i++) { const k = Math.random(); parts.push({ x: lerp(sx, p.x, k) + rr(-5, 5), y: lerp(sy, p.y, k) + rr(-5, 5), vx: -c * rr(20, 60), vy: -s * rr(20, 60), life: rr(0.2, 0.45), col: i % 2 ? '#bbdefb' : '#ffffff', sz: 3 }); }
    p.inv = Math.max(p.inv, 0.35); p.atkAnim = 1; audio.dash(); return true;
  }
  if (id === 'bayang') { // shadow step behind the target
    const t = aimAt(260), a = Math.atan2(t.y - p.y, t.x - p.x);
    puff(p.x, p.y, '#4a3b6b');
    let nx = t.x + Math.cos(a) * (t.r + 16), ny = t.y + Math.sin(a) * (t.r + 16);
    if (solidAt(nx, ny)) { nx = t.x - Math.cos(a) * (t.r + 16); ny = t.y - Math.sin(a) * (t.r + 16); }
    if (!solidAt(nx, ny)) { p.x = nx; p.y = ny; }
    p.face = Math.atan2(t.y - p.y, t.x - p.x); puff(p.x, p.y, '#7c4dff');
    damageEnemy(t, wdmg() * 3 * skillMul() * rr(0.95, 1.1), p.x, p.y, true, 1);
    slashes.push({ x: p.x, y: p.y - 4, a: p.face, r: 40, arc: 2.2, t: 0.25, max: 0.25, col: '179,136,255' });
    p.inv = Math.max(p.inv, 0.4); p.atkAnim = 1; audio.dash(); return true;
  }
  if (id === 'hempas') { // ground slam + stun
    const R = 95;
    for (const e of enemies) if (e.hp > 0 && dist(e.x, e.y, p.x, p.y) < R + e.r) { damageEnemy(e, wdmg() * 2.5 * skillMul() * rr(0.9, 1.1), p.x, p.y, false, 0.5); e.stun = e.def.boss ? 0.7 : 1.5; }
    for (let k = 0; k < 3; k++) pend.push({ t: k * 0.08, f: () => slashes.push({ x: p.x, y: p.y, a: 0, r: R * (0.5 + k * 0.28), arc: 6.3, t: 0.3, max: 0.3, col: k ? '205,170,120' : '255,236,179' }) });
    for (let i = 0; i < 34; i++) { const a = rr(0, 6.28), v = rr(60, 200); parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rr(0.4, 0.8), col: i % 3 ? '#8d6e63' : '#d7ccc8', sz: rr(3, 5), g: 300 }); }
    shake = Math.min(12, shake + 9); p.atkAnim = 1; audio.hit(); return true;
  }
  if (id === 'harimau') { // tiger spirit buff
    p.tiger = 12; audio.level();
    texts.push({ x: p.x, y: p.y - 30, t: 'Semangat Harimau!', col: '#ffb74d', life: 1.4 });
    for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283; parts.push({ x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 12, vx: Math.cos(a) * 30, vy: rr(-80, -40), life: rr(0.6, 1), col: i % 2 ? '#ff9800' : '#ffe082', sz: 3 }); }
    return true;
  }
  if (id === 'panah') { // arrow rain on the nearest group
    const t = nearestEnemy(330), cx = t ? t.x : p.x + cs * 120, cy = t ? t.y : p.y + sn * 120;
    if (t) p.face = Math.atan2(cy - p.y, cx - p.x);
    teles.push({ kind: 'circle', x: cx, y: cy, r: 70, t: 1.1, max: 1.1, col: '255,200,0' });
    for (let i = 0; i < 16; i++) { const a = rr(0, 6.28), r = Math.sqrt(Math.random()) * 64; drops.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, h: 3.2, t: 0.35 + i * 0.05, max: 0.35 + i * 0.05, dmg: magicAtk() * 0.8 }); }
    p.atkAnim = 1; audio.throw(); return true;
  }
  if (id === 'ombak') { // sea wave cone
    aimAt(170); const R = 150, arc = 1.7, f = p.face;
    for (const e of enemies) if (e.hp > 0 && inCone(e, R, arc)) damageEnemy(e, magicAtk() * 2.6 * rr(0.9, 1.1), p.x, p.y, false, 3);
    for (let k = 0; k < 4; k++) pend.push({ t: k * 0.06, f: () => slashes.push({ x: p.x, y: p.y - 4, a: f, r: R * (0.35 + k * 0.22), arc, t: 0.35, max: 0.35, col: k % 2 ? '129,212,250' : '227,242,253' }) });
    for (let i = 0; i < 40; i++) { const a = f + rr(-arc / 2, arc / 2), v = rr(80, 260); parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rr(0.3, 0.6), col: i % 3 ? '#4fc3f7' : '#ffffff', sz: rr(3, 5) }); }
    shake = Math.min(10, shake + 5); p.atkAnim = 1; audio.dash(); return true;
  }
  if (id === 'angin') { // travelling whirlwind
    aimAt(260);
    pprojs.push({ x: p.x + Math.cos(p.face) * 20, y: p.y + Math.sin(p.face) * 20, vx: Math.cos(p.face) * 115, vy: Math.sin(p.face) * 115, r: 28, life: 2.4, dmg: magicAtk() * 0.6, kind: 'wind', pierce: true, tick: 0 });
    p.atkAnim = 1; audio.dash(); return true;
  }
  if (id === 'naga') { p.breath = 2; p.breathT = 0; audio.level(); texts.push({ x: p.x, y: p.y - 30, t: 'Nafas Naga!', col: '#ff7043', life: 1.2 }); return true; }
  return false;
}
function puff(x, y, col) { for (let i = 0; i < 18; i++) { const a = rr(0, 6.28), v = rr(20, 90); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: rr(0.3, 0.6), col, sz: 4 }); } }
// per-frame effects of the skills above
function updateSkills(dt) {
  const p = player;
  p.tiger = Math.max(0, p.tiger - dt);
  if (p.tiger > 0 && Math.random() < dt * 14) parts.push({ x: p.x + rr(-10, 10), y: p.y + rr(-6, 6), vx: 0, vy: rr(-60, -25), life: 0.5, col: Math.random() < 0.5 ? '#ff9800' : '#ffcc80', sz: 3 });
  if (p.breath > 0) {
    p.breath -= dt; p.breathT -= dt; aimAt(170);
    if (p.breathT <= 0) {
      p.breathT = 0.12;
      for (const e of enemies) if (e.hp > 0 && inCone(e, 140, 1.1)) damageEnemy(e, magicAtk() * 0.75 * rr(0.9, 1.1), p.x, p.y, false, 0.25);
      shake = Math.min(5, shake + 1);
    }
    for (let i = 0; i < 6; i++) { const a = p.face + rr(-0.5, 0.5), v = rr(120, 300); parts.push({ x: p.x + Math.cos(p.face) * 12, y: p.y + Math.sin(p.face) * 12, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rr(0.3, 0.5), col: i % 3 === 0 ? '#fff3e0' : i % 3 === 1 ? '#ff9100' : '#ff3d00', sz: rr(3, 6) }); }
    p.atkAnim = 0.6;
  }
  const due = pend.filter(q => (q.t -= dt) <= 0); pend = pend.filter(q => q.t > 0); for (const q of due) q.f();
  for (const d of drops) {
    d.t -= dt;
    if (d.t <= 0) {
      for (const e of enemies) if (e.hp > 0 && dist(e.x, e.y, d.x, d.y) < e.r + 22) damageEnemy(e, d.dmg * rr(0.9, 1.1), d.x, d.y - 1, false, 0.2);
      for (let i = 0; i < 4; i++) parts.push({ x: d.x, y: d.y, vx: rr(-40, 40), vy: rr(-50, 0), life: 0.3, col: '#d7ccc8', sz: 2 });
    }
  }
  drops = drops.filter(d => d.t > 0);
}
