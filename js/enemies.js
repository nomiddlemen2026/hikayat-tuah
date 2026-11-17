'use strict';
// ---------------------------------------------------------------- enemies
function spawnEnemy(type, x, y, home) {
  const d = EDEF[type];
  const lv = 1;
  const e = { type, def: d, x, y, hx: x, hy: y, hp: d.hp, maxHp: d.hp, r: d.r * (d.boss ? 1.4 : 1), face: Math.PI / 2, cd: rr(0.5, 1.5), state: 'idle', wander: 0, wx: x, wy: y, hurt: 0, swing: 0, tele: 0, dash: 0, dvx: 0, dvy: 0, seed: Math.random() * 10, moving: false, aggro: false, moveI: 0, kbx: 0, kby: 0, sumCd: 0, region: regionAt(Math.floor(x / TS), Math.floor(y / TS)), isHome: !!home };
  enemies.push(e); return e;
}
function trySpawn(r, initial) {
  const sp = SPAWNS[r], R = r === 'meadow' ? null : REGIONS[r];
  for (let tries = 0; tries < 20; tries++) {
    let tx, ty;
    if (R) { tx = Math.floor(rr(R.x0 + 1, R.x1)); ty = Math.floor(rr(R.y0 + 1, R.y1)); }
    else { tx = Math.floor(rr(2, MW - 2)); ty = Math.floor(rr(2, MH - 8)); if (regionAt(tx, ty) !== 'meadow') continue; }
    if (SOLID.has(getT(tx, ty)) || getT(tx, ty) === T.PATH || getT(tx, ty) === T.BRIDGE) continue;
    if (dist(tx, ty, 47, 50) < 14) continue; // keep town safe
    if (r === 'temple' && foundCount() < 4 && ty < 17) continue;
    const px = (tx + 0.5) * TS, py = (ty + 0.5) * TS;
    if (player && dist(px, py, player.x, player.y) < (initial ? 200 : 420)) continue;
    let near = false; for (const s in SITES) if (dist(tx, ty, SITES[s].x, SITES[s].y) < 5 && s !== 'home') near = true;
    if (near) continue;
    const type = sp.list[Math.floor(Math.random() * sp.list.length)];
    const e = spawnEnemy(type, px, py); e.spawnRegion = r; return e;
  }
}
function canWalk(x, y, r, fly) {
  const o = r * 0.75;
  for (const [ax, ay] of [[-o, -o], [o, -o], [-o, o], [o, o]]) {
    const t = getT(Math.floor((x + ax) / TS), Math.floor((y + ay) / TS));
    if (SOLID.has(t) && !(fly && (t === T.WATER || t === T.DEEP))) return false;
  }
  return true;
}
function moveEnt(e, dx, dy, fly) {
  if (canWalk(e.x + dx, e.y, e.r, fly)) e.x += dx;
  if (canWalk(e.x, e.y + dy, e.r, fly)) e.y += dy;
}
function hurtPlayer(dmg, fromX, fromY) {
  if (player.inv > 0 || state !== 'play') return;
  if (DEBUG && window.GOD) dmg = 0;
  if (Math.random() < dodgeChance()) { player.inv = 0.3; texts.push({ x: player.x, y: player.y - 30, t: 'Miss', col: '#90caf9', life: 0.8 }); return; }
  player.hp -= dmg; player.inv = 0.7; player.hurt = 0.2; lastHurt = time; shake = Math.min(10, shake + 5);
  const a = Math.atan2(player.y - fromY, player.x - fromX);
  moveEnt(player, Math.cos(a) * 14, Math.sin(a) * 14);
  texts.push({ x: player.x, y: player.y - 30, t: '-' + Math.round(dmg), col: '#ff5252', life: 0.9 });
  audio.hurt();
  if (player.hp <= 0) { player.hp = 0; state = 'dead'; endingT = 0; }
}
function damageEnemy(e, dmg, fromX, fromY, crit, kb = 1) {
  if (e.hp <= 0) return;
  e.hp -= dmg; e.hurt = 0.12; e.aggro = true;
  if (!e.def.boss) { const a = Math.atan2(e.y - fromY, e.x - fromX); e.kbx += Math.cos(a) * 160 * kb; e.kby += Math.sin(a) * 160 * kb; }
  texts.push({ x: e.x + rr(-6, 6), y: e.y - 26 * (e.def.boss ? 1.6 : 1), t: Math.round(dmg) + (crit ? '!' : ''), col: crit ? '#ffd54f' : '#fff', life: 0.8, big: crit });
  for (let i = 0; i < 6; i++) parts.push({ x: e.x, y: e.y - 6, vx: rr(-90, 90), vy: rr(-90, 50), life: 0.35, col: crit ? '#ffd54f' : '#fff3c4', sz: 2 });
  audio.hit();
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  const d = e.def;
  for (let i = 0; i < (d.boss ? 40 : 14); i++) parts.push({ x: e.x, y: e.y - 6, vx: rr(-120, 120), vy: rr(-140, 40), life: rr(0.4, 0.9), col: d.boss ? '#ffd54f' : '#bbb', sz: rr(2, 4), g: 160 });
  const jx = Math.round(d.xp * 0.8), gold = Math.round(d.xp * rr(0.6, 1.3) * (d.boss ? 3 : 1));
  save.gold += gold;
  log('Defeated ' + d.name + ': +' + d.xp + ' Base EXP, +' + jx + ' Job EXP, +' + gold + ' ' + CURRENCY + '.', 'exp');
  gainXP(d.xp); gainJobXP(jx);
  if (Math.random() < (d.boss ? 1 : 0.12)) { save.potions++; texts.push({ x: e.x, y: e.y - 40, t: '+1 Jamu', col: '#80cbc4', life: 1.2 }); log('You picked up 1 Jamu potion.', 'item'); }
  if (d.boss) {
    save.bossDead[e.type] = true; shake = 14; audio.fanfare();
    bossBar = null;
    if (e.type === 'guardian') toast('The guardian is defeated! Claim the keris at the altar.');
    else { const k = Object.keys(CAPTOR).find(k => CAPTOR[k] === e.type); toast(EDEF[e.type].name + ' defeated! Free ' + HEROES[k].name + '.'); }
    writeSave();
  }
}
function gainXP(n) {
  save.xp += n;
  while (save.xp >= xpNeed(save.lvl)) {
    save.xp -= xpNeed(save.lvl); save.lvl++;
    const pts = statPtsForLevel(save.lvl); save.statPts += pts;
    player.hp = maxHp(); player.sp = maxSp(); audio.level();
    toast('Level up! You are now level ' + save.lvl);
    log('You gained ' + pts + ' status points. Open the Status window (C) to spend them.', 'sys');
    for (let i = 0; i < 30; i++) parts.push({ x: player.x + rr(-14, 14), y: player.y + rr(-10, 10), vx: 0, vy: rr(-80, -30), life: rr(0.6, 1.2), col: '#ffe082', sz: 3 });
  }
}
function shoot(e, ang, kind, spd) {
  projs.push({ x: e.x, y: e.y - 8, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: kind === 'orb' ? 6 : 4, dmg: e.def.dmg * (e.def.boss ? 0.7 : 1), life: 2.6, kind, a: ang });
}
function updateEnemy(e, dt) {
  const d = e.def, p = player;
  e.hurt -= dt; e.swing -= dt; e.cd -= dt; e.sumCd -= dt;
  // knockback
  if (Math.abs(e.kbx) + Math.abs(e.kby) > 1) { moveEnt(e, e.kbx * dt, e.kby * dt, d.fly); e.kbx *= Math.pow(0.001, dt); e.kby *= Math.pow(0.001, dt); }
  const dp = dist(e.x, e.y, p.x, p.y), dh = dist(e.x, e.y, e.hx, e.hy);
  const aggroR = d.boss ? 210 : 150;
  if (!e.aggro && dp < aggroR && state === 'play') e.aggro = true;
  if (e.aggro && (dh > (d.boss ? 380 : 480) || dp > 520)) { e.aggro = false; e.state = 'return'; e.tele = 0; e.dash = 0; }
  if (d.boss && e.aggro && !e.isNear) e.isNear = true;
  e.moving = false;
  let sp = d.spd;
  // dashing
  if (e.dash > 0) {
    e.dash -= dt; e.moving = true;
    moveEnt(e, e.dvx * dt, e.dvy * dt, d.fly);
    if (dist(e.x, e.y, p.x, p.y) < e.r + p.r + 4) hurtPlayer(d.dmg * 1.2, e.x, e.y);
    if (Math.random() < 0.5) parts.push({ x: e.x, y: e.y + 8, vx: 0, vy: -10, life: 0.3, col: 'rgba(200,180,140,.7)', sz: 4 });
    return;
  }
  // telegraph
  if (e.tele > 0) {
    e.tele -= dt;
    if (e.tele <= 0) executeMove(e);
    return;
  }
  if (!e.aggro) {
    if (e.state === 'return' || dh > 60) { const a = Math.atan2(e.hy - e.y, e.hx - e.x); moveEnt(e, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, d.fly); e.face = a; e.moving = true; if (dh < 10) e.state = 'idle'; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.3 * dt); return; }
    e.wander -= dt;
    if (e.wander <= 0) { e.wander = rr(1.5, 4); e.wx = e.hx + rr(-50, 50); e.wy = e.hy + rr(-50, 50); }
    if (dist(e.x, e.y, e.wx, e.wy) > 6) { const a = Math.atan2(e.wy - e.y, e.wx - e.x); moveEnt(e, Math.cos(a) * sp * 0.4 * dt, Math.sin(a) * sp * 0.4 * dt, d.fly); e.face = a; e.moving = true; }
    return;
  }
  const a = Math.atan2(p.y - e.y, p.x - e.x); e.face = a;
  if (d.boss) bossBar = e;
  if (d.ai === 'ranged') {
    if (dp > 150) { moveEnt(e, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, d.fly); e.moving = true; }
    else if (dp < 100) { moveEnt(e, -Math.cos(a) * sp * dt, -Math.sin(a) * sp * dt, d.fly); e.moving = true; }
    if (e.cd <= 0 && dp < 240) { e.cd = rr(1.6, 2.4); shoot(e, a, d.proj, d.proj === 'orb' ? 140 : 190); e.swing = 0.3; audio.throw(); }
    return;
  }
  const reach = e.r + p.r + 8;
  if (d.ai === 'boss' && e.cd <= 0 && dp < 260) {
    let mv = d.moves[e.moveI % d.moves.length]; e.moveI++;
    if (mv === 'summon' && (e.sumCd > 0 || enemies.filter(o => o.summoned && o.hp > 0).length >= 3)) mv = d.moves.find(m => m !== 'summon');
    e.move = mv; e.cd = d.type === 'guardian' ? 2.2 : rr(2.4, 3.4);
    if (e.hp < e.maxHp * 0.5) e.cd *= 0.75;
    if (mv === 'spin') { e.tele = 0.75; teles.push({ kind: 'circle', x: e.x, y: e.y, r: 78, t: 0.75, max: 0.75, follow: e }); }
    else if (mv === 'pounce' || mv === 'charge') { e.tele = mv === 'pounce' ? 0.55 : 0.8; e.lockA = a; teles.push({ kind: 'line', x: e.x, y: e.y, a, len: mv === 'pounce' ? 190 : 230, w: e.r * 2, t: e.tele, max: e.tele, follow: e }); }
    else if (mv === 'knives' || mv === 'ring') { e.tele = 0.45; teles.push({ kind: 'circle', x: e.x, y: e.y, r: 26, t: 0.45, max: 0.45, follow: e, col: 'rgba(255,200,0,' }); }
    else if (mv === 'summon') { e.tele = 0.6; teles.push({ kind: 'circle', x: e.x, y: e.y, r: 40, t: 0.6, max: 0.6, follow: e, col: 'rgba(170,0,255,' }); }
    return;
  }
  if (d.ai === 'charge' && e.cd <= 0 && dp < 150 && dp > 40) { e.move = 'pounce'; e.tele = 0.5; e.lockA = a; e.cd = rr(2.2, 3.2); teles.push({ kind: 'line', x: e.x, y: e.y, a, len: 150, w: e.r * 2, t: 0.5, max: 0.5, follow: e }); return; }
  if (dp > reach - 2) { moveEnt(e, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, d.fly); e.moving = true; }
  if (dp < reach + 4 && e.swing < -0.3 && e.atkWait === undefined) { e.atkWait = 0.32; }
  if (e.atkWait !== undefined) {
    e.atkWait -= dt;
    if (e.atkWait <= 0) { e.atkWait = undefined; e.swing = 0.3; if (dist(e.x, e.y, p.x, p.y) < reach + 10) hurtPlayer(d.dmg, e.x, e.y); }
  }
}
function executeMove(e) {
  const d = e.def, p = player;
  const mv = e.move;
  if (mv === 'spin') {
    e.swing = 0.3; shake = 6;
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; parts.push({ x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 0.35, col: '#ff8a65', sz: 3 }); }
    if (dist(e.x, e.y, p.x, p.y) < 78 + p.r) hurtPlayer(d.dmg * 1.3, e.x, e.y);
  } else if (mv === 'pounce' || mv === 'charge') {
    const s = mv === 'pounce' ? 420 : 300; e.dash = mv === 'pounce' ? 0.45 : 0.75; e.dvx = Math.cos(e.lockA) * s; e.dvy = Math.sin(e.lockA) * s; audio.dash();
  } else if (mv === 'knives') {
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) shoot(e, a + i * 0.22, d.look === 'guardian' ? 'orb' : 'knife', 210);
    audio.throw();
  } else if (mv === 'ring') {
    const off = Math.random();
    for (let i = 0; i < 14; i++) shoot(e, off + i / 14 * 6.283, 'orb', 130);
    setTimeout(() => { if (e.hp > 0) for (let i = 0; i < 14; i++) shoot(e, off + (i + 0.5) / 14 * 6.283, 'orb', 110); }, 500);
    audio.throw();
  } else if (mv === 'summon') {
    e.sumCd = 10;
    for (let i = 0; i < 2; i++) { const a = rr(0, 6.28); let x = e.x + Math.cos(a) * 50, y = e.y + Math.sin(a) * 50; if (!canWalk(x, y, 12, d.summon === 'wisp')) { x = e.x; y = e.y; } const m = spawnEnemy(d.summon, x, y); m.summoned = true; m.aggro = true; m.hx = e.hx; m.hy = e.hy; for (let j = 0; j < 10; j++) parts.push({ x, y, vx: rr(-50, 50), vy: rr(-80, 0), life: 0.6, col: '#b388ff', sz: 3 }); }
  }
}

