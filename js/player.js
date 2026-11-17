'use strict';
// ---------------------------------------------------------------- player actions
function nearestInteract() {
  let best = null, bd = 46;
  for (const n of npcs) { const d = dist(n.x, n.y, player.x, player.y); if (d < bd) { bd = d; best = { type: 'npc', o: n }; } }
  for (const c of chests) { if (c.open) continue; const d = dist(c.x, c.y, player.x, player.y); if (d < bd) { bd = d; best = { type: 'chest', o: c }; } }
  if (save.bossDead.guardian && !save.taming) { const d = dist(81.5 * TS, 4.5 * TS, player.x, player.y); if (d < 50) best = { type: 'altar' }; }
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
  audio.swing();
  slashes.push({ x: player.x, y: player.y - 4, a: player.face, r: w.range, arc: w.arc, t: 0.18, max: 0.18, col: save.weapon === 'taming' ? '255,213,79' : '255,255,255' });
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
function usePotion() {
  if (state !== 'play') return;
  if (save.potions <= 0) { toast('No Jamu potions left'); return; }
  if (player.hp >= maxHp()) { toast('Health is already full'); return; }
  save.potions--; const h = Math.round(maxHp() * 0.5); player.hp = Math.min(maxHp(), player.hp + h);
  texts.push({ x: player.x, y: player.y - 30, t: '+' + h, col: '#69f0ae', life: 1 }); audio.pickup();
  for (let i = 0; i < 12; i++) parts.push({ x: player.x + rr(-10, 10), y: player.y + rr(-10, 10), vx: 0, vy: rr(-60, -20), life: 0.8, col: '#69f0ae', sz: 3 });
}
function toast(t) { toasts.push({ t, life: 3 }); if (toasts.length > 3) toasts.shift(); log(t, 'sys'); }

