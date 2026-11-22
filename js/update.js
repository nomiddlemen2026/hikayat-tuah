'use strict';
// ---------------------------------------------------------------- update
function update(dt) {
  time += dt;
  if (state === 'dialog' && dialog) { dialog.ch = Math.min(dialog.lines[dialog.i][1].length, dialog.ch + dt * 55); }
  if (state === 'dead' || state === 'ending') endingT += dt;
  if (state !== 'play' || ui.blocking()) { updateFx(dt * (state === 'dialog' ? 1 : 0)); return; }
  audio.music();
  const p = player;
  // movement input
  let mx = 0, my = 0;
  if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  if (joy.id !== null) {
    const maxR = 50 * UIS; let dx = joy.x - joy.ox, dy = joy.y - joy.oy; const l = Math.hypot(dx, dy);
    if (l > maxR) { joy.ox = joy.x - dx / l * maxR; joy.oy = joy.y - dy / l * maxR; dx = joy.x - joy.ox; dy = joy.y - joy.oy; }
    if (l > 6) { mx = dx / maxR; my = dy / maxR; }
  }
  if (use3D() && (mx || my)) { const c = Math.cos(gfx.yaw), s = Math.sin(gfx.yaw); const rx = c * mx + s * my, ry = -s * mx + c * my; mx = rx; my = ry; }
  // camera rotation (hold buttons or Z/X keys)
  if (use3D()) { const held = id => Object.values(pointers).some(q => q.btn === id); if (keys.KeyZ || held('camL')) gfx.rotate(-1.8 * dt); if (keys.KeyX || held('camR')) gfx.rotate(1.8 * dt); }
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  const tile = getT(Math.floor(p.x / TS), Math.floor(p.y / TS));
  const spd = 125 * (p.tiger > 0 ? 1.25 : 1) * (p.breath > 0 ? 0.5 : 1) * (tile === T.SWAMP || tile === T.PADDY ? 0.8 : 1) * (tile === T.PATH || tile === T.BRIDGE ? 1.1 : 1);
  p.moving = ml > 0.1;
  if (p.moving) { if (p.atkAnim <= 0) p.face = Math.atan2(my, mx); p.walk += dt; moveEnt(p, mx * spd * dt, my * spd * dt); }
  for (const k in p.cds) p.cds[k] -= dt; p.shield = Math.max(0, p.shield - dt);
  p.atkCd -= dt; p.atkAnim = Math.max(0, p.atkAnim - dt / 0.22); p.skillCd -= dt; p.spin -= dt; p.inv -= dt; p.hurt -= dt;
  if (input.attackHeld && p.atkCd <= 0 && !nearestInteract()) attack();
  // regen out of combat
  if (time - lastHurt > 5 && p.hp < maxHp()) p.hp = Math.min(maxHp(), p.hp + hpRegen() * dt);
  if (p.sp < maxSp()) p.sp = Math.min(maxSp(), p.sp + spRegen() * dt * (time - lastHurt > 5 ? 2 : 1));
  // trail & companions
  const last = trail[trail.length - 1];
  if (dist(last.x, last.y, p.x, p.y) > 4) { trail.push({ x: p.x, y: p.y }); if (trail.length > 80) trail.shift(); }
  for (const c of companions) {
    c.atkCd -= dt; c.atk = Math.max(0, c.atk - dt / 0.25);
    let tgt = null, bd = 90;
    for (const e of enemies) { if (e.hp <= 0 || !e.aggro) continue; const d = dist(e.x, e.y, c.x, c.y); if (d < bd) { bd = d; tgt = e; } }
    let gx, gy;
    if (tgt && dist(tgt.x, tgt.y, p.x, p.y) < 200) { gx = tgt.x - Math.cos(c.idx * 1.6) * 26; gy = tgt.y - Math.sin(c.idx * 1.6) * 26; c.face = Math.atan2(tgt.y - c.y, tgt.x - c.x); }
    else { const tp = trail[Math.max(0, trail.length - 1 - (c.idx + 1) * 7)]; gx = tp.x; gy = tp.y; }
    const d = dist(gx, gy, c.x, c.y);
    c.moving = d > 6;
    if (c.moving) { const a = Math.atan2(gy - c.y, gx - c.x); const s = Math.min(d, (d > 120 ? 260 : 135) * dt); if (!tgt) c.face = a; c.x += Math.cos(a) * s; c.y += Math.sin(a) * s; c.walk += dt; }
    if (d > 400) { c.x = p.x; c.y = p.y; }
    if (tgt && bd < 46 && c.atkCd <= 0) { c.atkCd = rr(0.9, 1.3); c.atk = 1; damageEnemy(tgt, (7 + save.lvl * 2.2) * rr(0.8, 1.2), c.x, c.y, false, 0.6); slashes.push({ x: c.x, y: c.y - 4, a: c.face, r: 32, arc: 1.8, t: 0.15, max: 0.15, col: '200,230,255' }); }
  }
  // enemies
  bossBar = null;
  for (const e of enemies) if (e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 900) updateEnemy(e, dt);
  enemies = enemies.filter(e => e.hp > 0);
  // respawn
  if (Math.floor(time * 2) !== Math.floor((time - dt) * 2)) {
    for (const r in SPAWNS) { const cnt = enemies.filter(e => e.spawnRegion === r).length; if (cnt < SPAWNS[r].n && Math.random() < 0.25) trySpawn(r, false); }
  }
  // projectiles
  for (const pr of projs) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.kind !== 'orb' && pr.kind !== 'fire' && solidAt(pr.x, pr.y) && getT(Math.floor(pr.x / TS), Math.floor(pr.y / TS)) !== T.WATER) pr.life = 0;
    if (dist(pr.x, pr.y, p.x, p.y - 6) < pr.r + p.r) { hurtPlayer(pr.dmg, pr.x - pr.vx, pr.y - pr.vy); pr.life = 0; }
  }
  projs = projs.filter(pr => pr.life > 0);
  // the player's arrows and fireballs
  for (const pr of pprojs) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    const tt = getT(Math.floor(pr.x / TS), Math.floor(pr.y / TS));
    if (pr.pierce) { // whirlwind: passes through, pulls and grinds enemies
      pr.tick -= dt; const tick = pr.tick <= 0; if (tick) pr.tick = 0.18;
      for (const e of enemies) { if (e.hp <= 0) continue; const d = dist(e.x, e.y, pr.x, pr.y); if (d < pr.r + e.r + 20) { if (!e.def.boss) { e.kbx += (pr.x - e.x) * 4; e.kby += (pr.y - e.y) * 4; } if (tick && d < pr.r + e.r) damageEnemy(e, pr.dmg * rr(0.9, 1.1), pr.x, pr.y, false, 0); } }
      if (Math.random() < 0.8) { const a = rr(0, 6.28); parts.push({ x: pr.x + Math.cos(a) * 18, y: pr.y + Math.sin(a) * 18, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 120 - 30, life: 0.35, col: Math.random() < 0.5 ? '#e0f2f1' : '#b2dfdb', sz: 3 }); }
      continue;
    }
    let hit = pr.life <= 0 || (SOLID.has(tt) && tt !== T.WATER && tt !== T.DEEP && tt !== T.LAVA);
    if (pr.kind === 'fire' && Math.random() < 0.7) parts.push({ x: pr.x, y: pr.y, vx: rr(-20, 20), vy: rr(-30, 0), life: 0.35, col: Math.random() < 0.5 ? '#ffab40' : '#ff5722', sz: 3 });
    for (const e of enemies) { if (hit) break; if (e.hp > 0 && dist(e.x, e.y, pr.x, pr.y) < e.r + pr.r) { hit = true; if (!pr.aoe) damageEnemy(e, pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, pr.crit, 0.6); } }
    if (hit) {
      pr.life = 0;
      if (pr.aoe) {
        for (const e of enemies) if (e.hp > 0 && dist(e.x, e.y, pr.x, pr.y) < pr.aoe + e.r) damageEnemy(e, pr.dmg * rr(0.9, 1.1), pr.x, pr.y, false, 1);
        for (let i = 0; i < 22; i++) { const a = rr(0, 6.28), v = rr(40, 160); parts.push({ x: pr.x, y: pr.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rr(0.3, 0.6), col: i % 3 ? '#ff7043' : '#ffd54f', sz: 4 }); }
        shake = Math.min(8, shake + 3);
      }
    }
  }
  pprojs = pprojs.filter(pr => pr.life > 0);
  updateSkills(dt);
  for (const b of bolts) b.t -= dt; bolts = bolts.filter(b => b.t > 0);
  for (const t of teles) { t.t -= dt; if (t.follow) { t.x = t.follow.x; t.y = t.follow.y; } }
  teles = teles.filter(t => t.t > 0 && (!t.follow || t.follow.hp > 0));
  updateFx(dt);
  // camera
  const vw = W / ZOOM, vh = H / ZOOM;
  cam.x = clamp(p.x - vw / 2, 0, MW * TS - vw); cam.y = clamp(p.y - vh / 2, 0, MH * TS - vh);
  if (Math.floor(time / 20) !== Math.floor((time - dt) / 20)) writeSave();
}
function updateFx(dt) {
  for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.g) q.vy += q.g * dt; q.life -= dt; }
  parts = parts.filter(q => q.life > 0);
  for (const t of texts) { t.y -= 30 * dt; t.life -= dt; } texts = texts.filter(t => t.life > 0);
  for (const t of toasts) t.life -= dt; toasts = toasts.filter(t => t.life > 0);
  for (const s of slashes) s.t -= dt; slashes = slashes.filter(s => s.t > 0);
  shake = Math.max(0, shake - dt * 30);
}

