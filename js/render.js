'use strict';
// ---------------------------------------------------------------- render
const fanImgs = {};
function iconImg(id) { let im = fanImgs[id]; if (!im) { im = fanImgs[id] = new Image(); im.src = iconURL(id, 48); } return im; }
function drawBuilding(g, b) {
  const x = b.x * TS, y = b.y * TS, w = b.w * TS, h = b.h * TS;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4, y + h - 4, w, 8);
  if (b.kind === 'palace') {
    g.fillStyle = '#5d3a1a'; for (let i = 0; i < 6; i++) g.fillRect(x + 8 + i * (w - 20) / 5, y + h - 16, 5, 16);
    g.fillStyle = '#8d5a2b'; g.fillRect(x + 4, y + h * 0.42, w - 8, h * 0.4);
    g.fillStyle = '#6d4220'; for (let i = 0; i < w - 8; i += 8) g.fillRect(x + 4 + i, y + h * 0.42, 2, h * 0.4);
    g.fillStyle = '#3e2510'; g.fillRect(x + w / 2 - 12, y + h * 0.55, 24, h * 0.27);
    const roof = (rx, ry, rw, rh, c1, c2) => { g.fillStyle = c1; g.beginPath(); g.moveTo(rx, ry + rh); g.lineTo(rx + rw * 0.18, ry); g.lineTo(rx + rw * 0.82, ry); g.lineTo(rx + rw, ry + rh); g.closePath(); g.fill(); g.fillStyle = c2; for (let i = 1; i < 5; i++) g.fillRect(rx + rw * 0.1, ry + rh * i / 5, rw * 0.8, 1.5); g.fillStyle = '#d4a82a'; g.fillRect(rx, ry + rh - 3, rw, 3); };
    roof(x - 6, y + h * 0.18, w + 12, h * 0.26, '#7a2e1a', '#5a1e10');
    roof(x + w * 0.15, y - 6, w * 0.7, h * 0.26, '#8e3a22', '#5a1e10');
    g.fillStyle = '#d4a82a'; g.beginPath(); g.moveTo(x + w * 0.27, y - 6); g.lineTo(x + w * 0.22, y - 18); g.lineTo(x + w * 0.32, y - 6); g.fill(); g.beginPath(); g.moveTo(x + w * 0.73, y - 6); g.lineTo(x + w * 0.78, y - 18); g.lineTo(x + w * 0.68, y - 6); g.fill();
  } else {
    const hut = b.kind === 'hut';
    g.fillStyle = '#4e3420'; for (let i = 0; i < 4; i++) g.fillRect(x + 6 + i * (w - 16) / 3, y + h - 12, 4, 12);
    g.fillStyle = hut ? '#7a5a3a' : '#a0703e'; g.fillRect(x + 4, y + h * 0.45, w - 8, h * 0.38);
    g.fillStyle = hut ? '#5e4329' : '#7e5530'; for (let i = 0; i < w - 8; i += 6) g.fillRect(x + 4 + i, y + h * 0.45, 1.5, h * 0.38);
    g.fillStyle = '#3e2510'; g.fillRect(x + w / 2 - 7, y + h * 0.55, 14, h * 0.28);
    g.fillStyle = '#ffe9a8'; g.fillRect(x + 10, y + h * 0.55, 8, 7); g.fillRect(x + w - 18, y + h * 0.55, 8, 7);
    g.fillStyle = hut ? '#8a7a4a' : (b.kind === 'home' ? '#9c2a1c' : '#6b4a2a');
    g.beginPath(); g.moveTo(x - 4, y + h * 0.5); g.lineTo(x + w * 0.2, y + 2); g.lineTo(x + w * 0.8, y + 2); g.lineTo(x + w + 4, y + h * 0.5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 1; i < 5; i++) g.fillRect(x + w * 0.08, y + 2 + (h * 0.48) * i / 5, w * 0.84, 1.5);
    g.fillStyle = '#d4a82a'; g.beginPath(); g.moveTo(x + w * 0.2, y + 2); g.lineTo(x + w * 0.14, y - 8); g.lineTo(x + w * 0.26, y + 2); g.fill(); g.beginPath(); g.moveTo(x + w * 0.8, y + 2); g.lineTo(x + w * 0.86, y - 8); g.lineTo(x + w * 0.74, y + 2); g.fill();
  }
  if (b.label) label(g, b.label, x + w / 2, y - 12, '#ffe082');
}
function label(g, t, x, y, col) { g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; const w = g.measureText(t).width + 6; g.fillRect(x - w / 2, y - 8, w, 11); g.fillStyle = col || '#fff'; g.fillText(t, x, y); }
function drawChest(g, c) {
  g.save(); g.translate(c.x, c.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 8, 11, 4, 0, 0, 7); g.fill();
  g.fillStyle = '#6d4220'; g.fillRect(-10, -4, 20, 12);
  g.fillStyle = c.open ? '#3e2510' : '#8d5a2b'; g.fillRect(-10, c.open ? -10 : -9, 20, c.open ? 4 : 7);
  g.fillStyle = '#d4a82a'; g.fillRect(-10, -4, 20, 2); g.fillRect(-2, -5, 4, 5);
  if (!c.open) { const p = 0.5 + 0.5 * Math.sin(time * 4); g.fillStyle = `rgba(255,230,120,${0.3 * p})`; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); }
  g.restore();
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (state === 'title') { gfx.setVisible(false); renderTitle(); return; }
  const reg = regionAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
  if (use3D()) { gfx.setVisible(true); gfx.render(); ctx.clearRect(0, 0, W, H); renderOverlay3D(); }
  else { gfx.setVisible(false); renderWorld2D(); }
  if (player.hurt > 0) { ctx.fillStyle = 'rgba(255,0,0,.15)'; ctx.fillRect(0, 0, W, H); }
  renderHUD(reg);
  ui.frame();
  if (state === 'dead') renderOverlay('You have fallen...', 'Tap to recover in ' + MAPDEF.townName, 'rgba(60,0,0,');
  if (state === 'ending') renderEnding();
}
// classic top-down 2D view (fallback when WebGL is missing or chosen in Options)
function renderWorld2D() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-Math.round(cam.x) + sx, -Math.round(cam.y) + sy);
  const vw = W / ZOOM, vh = H / ZOOM;
  const tx0 = Math.max(0, Math.floor(cam.x / TS) - 1), ty0 = Math.max(0, Math.floor(cam.y / TS) - 1);
  const tx1 = Math.min(MW - 1, Math.ceil((cam.x + vw) / TS) + 1), ty1 = Math.min(MH - 1, Math.ceil((cam.y + vh) / TS) + 1);
  const wf = Math.floor(time * 2.5) % 3;
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const t = map[y * MW + x];
    let spr;
    if (t === T.WATER) spr = waterSprite(false, (wf + x + y) % 3); else if (t === T.DEEP) spr = waterSprite(true, (wf + x) % 3);
    else spr = tileSprite(t, Math.floor(hash(x, y, 11) * 3));
    ctx.drawImage(spr, x * TS, y * TS);
  }
  // altar
  if (MAP === 'melaka') { ctx.fillStyle = '#9b927f'; ctx.fillRect(78 * TS, 3.6 * TS, 3 * TS + 16, 1.4 * TS); ctx.fillStyle = '#c9a227'; ctx.fillRect(78 * TS, 3.6 * TS, 3 * TS + 16, 4); }
  if (MAP === 'melaka' && !save.taming) { ctx.save(); ctx.translate(81.5 * TS, 4.2 * TS); ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 12 + 6 * Math.sin(time * 3); drawWeapon(ctx, 'taming', 18); ctx.restore(); }
  for (const b of buildings) if (b.x * TS < cam.x + vw + 64 && (b.x + b.w) * TS > cam.x - 64 && b.y * TS < cam.y + vh + 64 && (b.y + b.h) * TS > cam.y - 64) drawBuilding(ctx, b);
  // telegraphs
  for (const t of teles) {
    const k = 1 - t.t / t.max;
    ctx.save();
    if (t.kind === 'circle') { ctx.fillStyle = (t.col || 'rgba(255,40,40,') + (0.15 + k * 0.25) + ')'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.fill(); ctx.strokeStyle = (t.col || 'rgba(255,40,40,') + '0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, 7); ctx.stroke(); }
    else { ctx.translate(t.x, t.y); ctx.rotate(t.a); ctx.fillStyle = `rgba(255,40,40,${0.15 + k * 0.3})`; ctx.fillRect(0, -t.w / 2, t.len, t.w); ctx.fillStyle = 'rgba(255,80,80,.7)'; ctx.fillRect(0, -t.w / 2, t.len * k, t.w); }
    ctx.restore();
  }
  // entities sorted by y
  const ents = [];
  for (const c of chests) ents.push({ y: c.y, f: () => drawChest(ctx, c) });
  for (const n of npcs) ents.push({ y: n.y, f: () => { if (n.kind === 'captive') drawHero(ctx, n.x, n.y, HEROES[n.hero], Math.PI / 2, 0, null, 0, { tied: !save.bossDead[CAPTOR[n.hero]] }); else drawNPC(ctx, n.x, n.y, n.kind, 0, n); label(ctx, n.name, n.x, n.y - 34, n.kind === 'captive' ? '#90caf9' : '#fff'); } });
  for (const e of enemies) if (e.x > cam.x - 80 && e.x < cam.x + vw + 80 && e.y > cam.y - 80 && e.y < cam.y + vh + 80) ents.push({ y: e.y, f: () => { drawEnemy(ctx, e, time); if (!e.def.boss && (e.aggro || e.hp < e.maxHp)) { ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(e.def.name, e.x, e.y - 33); ctx.fillStyle = '#ffe9e9'; ctx.fillText(e.def.name, e.x, e.y - 33); } if (!e.def.boss && e.hp < e.maxHp) { ctx.fillStyle = '#000'; ctx.fillRect(e.x - 13, e.y - 30, 26, 4); ctx.fillStyle = '#e53935'; ctx.fillRect(e.x - 12, e.y - 29, 24 * e.hp / e.maxHp, 2); } } });
  for (const c of companions) ents.push({ y: c.y, f: () => drawHero(ctx, c.x, c.y, HEROES[c.id], c.face, c.walk, 'keris', c.atk, { moving: c.moving }) });
  ents.push({ y: player.y, f: () => { if (player.inv > 0 && Math.floor(time * 20) % 2 && player.hurt < 0) return; drawHero(ctx, player.x, player.y, HEROES.tuah, player.spin > 0 ? player.face + time * 30 : player.face, player.walk, save.weapon, player.atkAnim, { moving: player.moving, flash: player.hurt > 0 }); } });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  // slashes
  for (const s of slashes) {
    const k = s.t / s.max; ctx.save(); ctx.translate(s.x, s.y);
    ctx.strokeStyle = `rgba(${s.col},${k * 0.9})`; ctx.lineWidth = 4 * k + 1;
    ctx.beginPath(); ctx.arc(0, 0, s.r * (1.1 - k * 0.2), s.a - s.arc / 2, s.a + s.arc / 2); ctx.stroke();
    ctx.restore();
  }
  // projectiles
  for (const pr of [...projs, ...pprojs]) {
    ctx.save(); ctx.translate(pr.x, pr.y);
    if (pr.kind === 'arrow') { ctx.rotate(Math.atan2(pr.vy, pr.vx)); ctx.fillStyle = '#8d6e63'; ctx.fillRect(-9, -1, 16, 2); ctx.fillStyle = '#cfd8dc'; ctx.fillRect(7, -2, 4, 4); }
    else if (pr.kind === 'rock') { ctx.fillStyle = '#6d675e'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); }
    else if (pr.kind === 'wind') { ctx.strokeStyle = 'rgba(178,223,219,.8)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -i * 7, 16 - i * 3, 5, 0, time * 12 + i, time * 12 + i + 4.5); ctx.stroke(); } }
    else if (pr.kind === 'orb' || pr.kind === 'fire') { const fire = pr.kind === 'fire'; ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, 9); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, fire ? 'rgba(255,120,20,.85)' : 'rgba(120,255,200,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); }
    else { ctx.rotate(time * 20); ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-6, -1.5, 12, 3); ctx.fillStyle = '#5d3a1a'; ctx.fillRect(-6, -1.5, 4, 3); }
    ctx.restore();
  }
  for (const d of drops) if (d.t < 0.35) { const hy = d.t / 0.35 * 90; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d.x, d.y - hy - 14); ctx.lineTo(d.x, d.y - hy); ctx.stroke(); }
  if (player.tiger > 0) { ctx.strokeStyle = 'rgba(255,152,0,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(player.x, player.y + 8, 16, 6, 0, 0, 7); ctx.stroke(); }
  for (const b of bolts) { ctx.strokeStyle = 'rgba(255,245,157,' + Math.min(1, b.t * 4) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y - 120); for (let i = 1; i <= 6; i++) ctx.lineTo(b.x + Math.sin(i * 2.1 + b.t * 50) * 8, b.y - 120 + i * 20); ctx.stroke(); }
  if (player.shield > 0) { ctx.strokeStyle = 'rgba(128,222,234,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y - 4, 20, 0, 7); ctx.stroke(); }
  for (const q of parts) { ctx.globalAlpha = Math.min(1, q.life * 3); ctx.fillStyle = q.col; ctx.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); }
  ctx.globalAlpha = 1;
  for (const t of texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.font = `bold ${t.big ? 14 : 11}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t.t, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.t, t.x, t.y); }
  ctx.globalAlpha = 1;
  // interaction hint
  const it = state === 'play' ? nearestInteract() : null;
  if (it) { const o = it.o || { x: 81.5 * TS, y: 4.5 * TS }; const bob = Math.sin(time * 6) * 2; ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.moveTo(o.x - 5, o.y - 46 + bob); ctx.lineTo(o.x + 5, o.y - 46 + bob); ctx.lineTo(o.x, o.y - 40 + bob); ctx.fill(); }
  ctx.restore();
  // region tint
  const reg = regionAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
  if (MAP === 'melaka' && reg === 'swamp') { ctx.fillStyle = 'rgba(60,90,70,.18)'; ctx.fillRect(0, 0, W, H); }
  if (regionDef(reg).dark && reg !== 'swamp') { const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,0,30,.55)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
}
// 2D overlay on top of the 3D scene: names, HP bars, damage numbers, interaction marker
function renderOverlay3D() {
  const lab = (t, x, y, col, size = 10) => { ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center'; const w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - w / 2, y - size, w, size + 4); ctx.fillStyle = col; ctx.fillText(t, x, y); };
  for (const b of buildings) if (b.label) { const q = gfx.project((b.x + b.w / 2) * TS, (b.y + b.h / 2) * TS, b.kind === 'palace' ? 5 : 3); if (q.vis && dist((b.x + b.w / 2) * TS, (b.y + b.h / 2) * TS, player.x, player.y) < 14 * TS) lab(b.label, q.x, q.y, '#ffe082', 11); }
  for (const n of npcs) { if (dist(n.x, n.y, player.x, player.y) > 12 * TS) continue; const q = gfx.project(n.x, n.y, 1.45); if (q.vis) lab(n.name, q.x, q.y, n.kind === 'captive' ? '#90caf9' : '#fff'); }
  for (const e of enemies) {
    if (e.def.boss || dist(e.x, e.y, player.x, player.y) > 14 * TS || !(e.aggro || e.hp < e.maxHp)) continue;
    const q = gfx.project(e.x, e.y, e.def.look === 'golem' ? 1.7 : e.def.look === 'wisp' ? 1.3 : 1.35); if (!q.vis) continue;
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(e.def.name, q.x, q.y - 6); ctx.fillStyle = '#ffe9e9'; ctx.fillText(e.def.name, q.x, q.y - 6);
    ctx.fillStyle = '#000'; ctx.fillRect(q.x - 18, q.y - 2, 36, 5); ctx.fillStyle = '#e53935'; ctx.fillRect(q.x - 17, q.y - 1, 34 * e.hp / e.maxHp, 3);
  }
  for (const t of texts) { const q = gfx.project(t.x, t.y, 1.2); if (!q.vis) continue; ctx.globalAlpha = Math.min(1, t.life * 2); ctx.font = `bold ${t.big ? 17 : 13}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t.t, q.x, q.y); ctx.fillStyle = t.col; ctx.fillText(t.t, q.x, q.y); }
  ctx.globalAlpha = 1;
  const it = state === 'play' ? nearestInteract() : null;
  if (it) { const o = it.o || { x: 81.5 * TS, y: 4.5 * TS }; const q = gfx.project(o.x, o.y, o.kind ? 1.75 : 0.9); const bob = Math.sin(time * 6) * 3; ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x - 7, q.y - 10 + bob); ctx.lineTo(q.x + 7, q.y - 10 + bob); ctx.lineTo(q.x, q.y + bob); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
let gfxMode = '3d';
try { gfxMode = localStorage.getItem('hikayat_tuah_gfx') || '3d'; } catch (e) { }
const use3D = () => gfx.ok && gfxMode === '3d';
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(20,12,6,.78)'; rrect(ctx, x, y, w, h, 8 * UIS); ctx.fill(); ctx.strokeStyle = 'rgba(212,168,42,.85)'; ctx.lineWidth = 1.5; ctx.stroke(); }
function txt(t, x, y, size, col, align = 'left', bold = true) { ctx.font = `${bold ? 'bold ' : ''}${Math.round(size)}px sans-serif`; ctx.textAlign = align; ctx.fillStyle = col; ctx.fillText(t, x, y); }
function wrap(t, maxW, size) { ctx.font = `${Math.round(size)}px sans-serif`; const words = t.split(' '), lines = []; let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); return lines; }
function renderHUD(reg) {
  const s = UIS, p = player;
  // objective arrow
  const op = objectivePos();
  if (op && state === 'play') {
    const ox = op.x * TS, oy = op.y * TS, d = dist(ox, oy, p.x, p.y);
    if (d > 70) {
      let a = Math.atan2(oy - p.y, ox - p.x), scx = (p.x - cam.x) * ZOOM, scy = (p.y - cam.y) * ZOOM - 8 * ZOOM, R = 48 * ZOOM;
      if (use3D()) { const q0 = gfx.project(p.x, p.y, 0.6), q1 = gfx.project(p.x + Math.cos(a) * TS, p.y + Math.sin(a) * TS, 0.6); scx = q0.x; scy = q0.y; a = Math.atan2(q1.y - q0.y, q1.x - q0.x); R = 70 * s; }
      ctx.save(); ctx.translate(scx + Math.cos(a) * R, scy + Math.sin(a) * R); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,213,79,' + (0.7 + 0.3 * Math.sin(time * 5)) + ')'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(12 * s, 0); ctx.lineTo(-6 * s, -8 * s); ctx.lineTo(-2 * s, 0); ctx.lineTo(-6 * s, 8 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(Math.round(d / TS) + 'm', scx + Math.cos(a) * (R + 20 * s), scy + Math.sin(a) * (R + 20 * s) + 4 * s, 9 * s, '#ffe082', 'center');
    }
  }
  // boss bar
  if (bossBar && bossBar.hp > 0) {
    const bw = Math.min(W * 0.34, 300 * s), bx = W / 2 - bw / 2, by = (isTouch ? 56 : 30) * s;
    panel(bx - 6 * s, by - 18 * s, bw + 12 * s, 34 * s);
    txt(bossBar.def.name, W / 2, by - 4 * s, 11 * s, '#ff8a80', 'center');
    ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, 10 * s); ctx.fillStyle = '#c62828'; ctx.fillRect(bx, by, bw * bossBar.hp / bossBar.maxHp, 10 * s);
  }
  // toasts
  toasts.forEach((t, i) => { ctx.globalAlpha = Math.min(1, t.life * 2); const w = Math.min(W - 40, (ctx.measureText(t.t).width || 200) + 40 * s); ctx.font = `bold ${Math.round(12 * s)}px sans-serif`; const tw = ctx.measureText(t.t).width + 30 * s; panel(W / 2 - tw / 2, H * 0.3 + i * 30 * s, tw, 24 * s); txt(t.t, W / 2, H * 0.3 + i * 30 * s + 16 * s, 12 * s, '#fff', 'center'); ctx.globalAlpha = 1; });
  // buttons
  const it = nearestInteract();
  for (const b of buttons()) {
    if (b.id === 'attack') { ctx.globalAlpha = 0.35; ctx.strokeStyle = '#d4a82a'; ctx.lineWidth = 1.5 * s; ctx.setLineDash([3 * s, 6 * s]); ctx.beginPath(); ctx.arc(b.x, b.y, 114 * s, Math.PI * 0.94, Math.PI * 1.56); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha = 0.85;
    const pressed = Object.values(pointers).some(q => q.btn === b.id);
    ctx.fillStyle = pressed ? 'rgba(212,168,42,.6)' : 'rgba(20,12,6,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d4a82a'; ctx.lineWidth = 2; ctx.stroke();
    if (b.id === 'attack') {
      if (it) txt(it.type === 'chest' ? 'OPEN' : it.type === 'altar' ? 'TAKE' : 'TALK', b.x, b.y + 6 * s, 17 * s, '#ffe082', 'center');
      else { ctx.save(); ctx.translate(b.x - 8 * s, b.y + 8 * s); ctx.rotate(-0.8); ctx.scale(1.8 * s, 1.8 * s); drawWeapon(ctx, save.weapon === 'fist' ? 'keris' : save.weapon, 16); ctx.restore(); }
    }
    if (b.skill) {
      const id = b.skill, sk = SKILLS[id], cdl = skillCdLeft(id), off = player.sp < sk.sp || (id === 'silat' && save.weapon === 'fist');
      const im = iconImg(id); if (im.complete && im.naturalWidth) { ctx.globalAlpha = off ? 0.4 : 0.95; ctx.drawImage(im, b.x - b.r * 0.72, b.y - b.r * 0.72, b.r * 1.44, b.r * 1.44); ctx.globalAlpha = 0.85; }
      if (cdl > 0) {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.min(1, cdl / sk.cd)); ctx.fill();
        txt(cdl >= 1 ? '' + Math.ceil(cdl) : cdl.toFixed(1), b.x, b.y + 5 * s, 13 * s, '#fff', 'center');
      }
      txt(sk.sp + '', b.x + b.r * 0.62, b.y + b.r * 0.9, 9 * s, player.sp < sk.sp ? '#ff8a80' : '#90caf9', 'center');
    }
    if (b.id === 'page') {
      ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.moveTo(b.x - 5 * s, b.y - 6 * s); ctx.lineTo(b.x + 6 * s, b.y); ctx.lineTo(b.x - 5 * s, b.y + 6 * s); ctx.fill();
      txt((fanPage + 1) + '/' + b.pages, b.x, b.y + b.r + 9 * s, 8 * s, '#ffe082', 'center');
    }
    if (b.id === 'potion') {
      ctx.fillStyle = '#69f0ae'; ctx.beginPath(); ctx.arc(b.x, b.y + 3 * s, 7 * s, 0, 7); ctx.fill(); ctx.fillRect(b.x - 3 * s, b.y - 9 * s, 6 * s, 7 * s); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(b.x - 4 * s, b.y - 11 * s, 8 * s, 3 * s);
      txt('' + save.potions, b.x + b.r * 0.75, b.y + b.r * 0.85, 11 * s, '#fff', 'center');
    }
    ctx.globalAlpha = 1;
  }
  // joystick
  if (joy.id !== null) {
    ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50 * s, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.arc(joy.x, joy.y, 20 * s, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  } else if (isTouch && time < 25 && state === 'play') {
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(90 * s, H - 90 * s, 50 * s, 0, 7); ctx.stroke(); txt('drag to move', 90 * s, H - 86 * s, 10 * s, '#fff', 'center'); ctx.globalAlpha = 1;
  }
}
let miniCanvas = null;
function getMiniCanvas() {
  if (!miniCanvas) miniCanvas = mk(MW, MH, g => {
    const col = { [T.LAVA]: '#ff6a00', [T.CRYSTAL]: '#7fe3f5', [T.MARBLE]: '#e9e4f2', [T.ASH]: '#5a514c', [T.PADDY]: '#7fbf6a', [T.MOSS]: '#3f8f86', [T.GRASS]: '#4f9a3a', [T.FLOWER]: '#4f9a3a', [T.PATH]: '#c9a36a', [T.SAND]: '#e8d39a', [T.WATER]: '#2f86b8', [T.DEEP]: '#1e5a8c', [T.TREE]: '#2f7d32', [T.JTREE]: '#1f5a2a', [T.ROCK]: '#6f6f73', [T.DIRT]: '#8d7b68', [T.SWAMP]: '#4b5e3a', [T.MANGROVE]: '#35502c', [T.FLOOR]: '#7d7a70', [T.WALL]: '#3a3630', [T.PILLAR]: '#3a3630', [T.GATE]: '#d4a82a', [T.BRIDGE]: '#a7743f', [T.PLANK]: '#8f6239', [T.PALM]: '#2e8b3e', [T.DARK]: '#2f6b2c', [T.BLD]: '#9c2a1c' };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { g.fillStyle = col[map[y * MW + x]] || '#000'; g.fillRect(x, y, 1, 1); }
  });
  return miniCanvas;
}
function renderOverlay(a, b, col) {
  ctx.fillStyle = col + Math.min(0.7, endingT) + ')'; ctx.fillRect(0, 0, W, H);
  txt(a, W / 2, H / 2 - 10 * UIS, 26 * UIS, '#fff', 'center');
  if (endingT > 1) txt(b, W / 2, H / 2 + 24 * UIS, 13 * UIS, '#ffe082', 'center', false);
}
function renderEnding() {
  const s = UIS;
  ctx.fillStyle = `rgba(10,5,0,${Math.min(0.85, endingT * 0.5)})`; ctx.fillRect(0, 0, W, H);
  if (endingT < 0.8) return;
  const fin = save.chapter >= 5;
  txt(fin ? 'Hikayat Tuah: Tamat' : 'Keris Taming Sari', W / 2, H * 0.2, 26 * s, '#ffd54f', 'center');
  txt(fin ? 'The Shadow King is defeated. Melaka and the Bunian are at peace.' : 'The five warriors of Melaka are united once more.', W / 2, H * 0.2 + 26 * s, 12 * s, '#fff', 'center', false);
  const order = ['jebat', 'lekir', 'tuah', 'lekiu', 'kasturi'];
  order.forEach((k, i) => { const x = W / 2 + (i - 2) * 70 * s, y = H * 0.62; ctx.save(); ctx.translate(x, y); ctx.scale(2.4 * s, 2.4 * s); drawHero(ctx, 0, 0, HEROES[k], Math.PI / 2, time, k === 'tuah' ? (fin ? 'kerisBunian' : 'taming') : 'keris', 0); ctx.restore(); txt(HEROES[k].name, x, y + 46 * s, 10 * s, HEROES[k].trim, 'center'); });
  if (endingT > 2) txt(fin ? 'THE END  ·  Thank you for playing  ·  Tap to keep exploring' : 'Chapter 1 complete  ·  Tap to continue', W / 2, H - 20 * s, 12 * s, '#ffe082', 'center');
}
function renderTitle() {
  const s = UIS;
  const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a0f05'); gr.addColorStop(0.55, '#b5541c'); gr.addColorStop(1, '#f4b450');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  // sun and sea
  ctx.fillStyle = 'rgba(255,230,150,.9)'; ctx.beginPath(); ctx.arc(W / 2, H * 0.58, Math.min(W, H) * 0.22, 0, 7); ctx.fill();
  ctx.fillStyle = '#1e3a5c'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  ctx.fillStyle = 'rgba(255,220,140,.35)'; for (let i = 0; i < 8; i++) ctx.fillRect(W / 2 - (80 - i * 8) * s, H * 0.72 + i * 9 * s, (160 - i * 16) * s, 2 * s);
  // ship silhouette (a Malay jong)
  ctx.fillStyle = '#1a0a05'; const bx = W * 0.16, by = H * 0.7;
  ctx.beginPath(); ctx.moveTo(bx - 40 * s, by - 6 * s); ctx.lineTo(bx + 40 * s, by - 6 * s); ctx.lineTo(bx + 30 * s, by + 4 * s); ctx.lineTo(bx - 30 * s, by + 4 * s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx - 4 * s, by - 6 * s); ctx.lineTo(bx - 4 * s, by - 60 * s); ctx.lineTo(bx + 26 * s, by - 14 * s); ctx.fill();
  // heroes silhouette line-up
  const order = ['jebat', 'lekir', 'tuah', 'lekiu', 'kasturi'];
  order.forEach((k, i) => { ctx.save(); ctx.translate(W / 2 + (i - 2) * 46 * s, H * 0.56 - (k === 'tuah' ? 8 * s : 0)); ctx.scale(1.9 * s, 1.9 * s); drawHero(ctx, 0, 0, HEROES[k], Math.PI / 2, time, k === 'tuah' ? 'keris' : null, 0); ctx.restore(); });
  ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
  txt('HIKAYAT TUAH', W / 2, H * 0.17, 38 * s, '#ffe082', 'center');
  txt('Quest for the Keris Taming Sari', W / 2, H * 0.17 + 26 * s, 14 * s, '#fff', 'center', false);
  ctx.shadowBlur = 0;
  for (const b of titleButtons()) { ctx.fillStyle = 'rgba(30,15,5,.85)'; rrect(ctx, b.x, b.y, b.w, b.h, 8 * s); ctx.fill(); ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2; ctx.stroke(); txt(b.label, b.x + b.w / 2, b.y + b.h / 2 + 6 * s, 16 * s, '#ffe082', 'center'); }
  txt('An original game inspired by the legend of Hang Tuah', W / 2, H - 10 * s, 9 * s, 'rgba(255,255,255,.7)', 'center', false);
  if (/Barcelona|Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly/i.test(navigator.userAgent)) txt('For fullscreen, tap the ⋮ menu and choose Open in browser', W / 2, H - 26 * s, 10 * s, '#ffe082', 'center');
}

