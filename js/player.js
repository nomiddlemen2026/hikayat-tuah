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
    pprojs.push({ x: player.x + Math.cos(player.face) * 10, y: player.y + Math.sin(player.face) * 10, vx: Math.cos(player.face) * 430, vy: Math.sin(player.face) * 430, r: 6, life: w.range / 430 + 0.1, dmg: (w.dmg + atkBonus()) * rr(dmgFloor(), 1.15) * (crit ? 2 : 1), crit, kind: 'arrow' });
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
    const dmg = (w.dmg + atkBonus()) * rr(dmgFloor(), 1.15) * (crit ? 2 : 1);
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
  for (const e of enemies) { if (e.hp <= 0) continue; if (dist(e.x, e.y, player.x, player.y) < R + e.r) damageEnemy(e, (w.dmg + atkBonus()) * 1.6 * skillMul() * rr(0.9, 1.1), player.x, player.y, false, 1.6); }
}
// ---- magic (Chapter 2 onwards)
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
  player.sp -= sk.sp; player.cds[id] = sk.cd;
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
