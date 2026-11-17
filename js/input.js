'use strict';
// ---------------------------------------------------------------- input
// Keyboard + mouse on desktop, virtual joystick + buttons on touch screens.
const keys = {};
const input = { jx: 0, jy: 0, attackHeld: false };
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const pointers = {};
let isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };

// window hotkeys (classic MMO style)
const WIN_KEYS = { KeyC: 'stats', KeyI: 'items', KeyU: 'equip', KeyY: 'skills', KeyQ: 'quests', KeyM: 'map', KeyO: 'options' };

window.addEventListener('keydown', e => {
  if (typing()) return;
  keys[e.code] = true;
  if (e.code.startsWith('F') && /^F[1-8]$/.test(e.code)) e.preventDefault();
  if (e.repeat) return;
  audio.init();
  if (state === 'title') { if (e.code === 'Enter' || e.code === 'Space') startGame(!loadSave()); return; }
  if (state === 'dialog' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyE')) { advanceDialog(); return; }
  if (state === 'dead' && endingT > 1) { respawn(); return; }
  if (state === 'ending' && endingT > 2) { afterEnding(); return; }
  if (e.code === 'Escape') { ui.back(); return; }
  if (state === 'menu') return;
  if (e.code === 'Enter') { e.preventDefault(); ui.focusChat(); return; }
  if (WIN_KEYS[e.code]) { ui.toggle(WIN_KEYS[e.code]); return; }
  const hk = e.code.match(/^(?:Digit|F)([1-8])$/);
  if (hk) { useHotkey(+hk[1] - 1); return; }
  if (e.code === 'KeyJ' || e.code === 'Space' || e.code === 'KeyE') { input.attackHeld = true; doAction(); }
  if (e.code === 'KeyK') doSkill();
  if (e.code === 'KeyL' || e.code === 'KeyH') usePotion();
});
window.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'KeyJ' || e.code === 'Space' || e.code === 'KeyE') input.attackHeld = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; input.attackHeld = false; });

function useHotkey(i) {
  const id = save && save.hotkeys[i];
  if (!id || state !== 'play') return;
  if (id === 'jamu') usePotion();
  else if (SKILLS[id]) castSkill(id);
  ui.flashHotkey(i);
}

// on-screen touch buttons (drawn on the canvas, only on touch devices)
function buttons() {
  if (!isTouch) return [];
  const s = UIS, m = 18 * s;
  const A = { id: 'attack', x: W - m - SAFE.r - 46 * s, y: H - m - SAFE.b - 46 * s, r: 40 * s };
  const S = { id: 'skill', x: A.x - 86 * s, y: A.y + 14 * s, r: 27 * s };
  const P = { id: 'potion', x: A.x - 2 * s, y: A.y - 84 * s, r: 23 * s };
  const out = [A, S, P];
  if (use3D()) out.push({ id: 'camL', x: A.x - 132 * s, y: A.y - 62 * s, r: 17 * s }, { id: 'camR', x: A.x - 90 * s, y: A.y - 96 * s, r: 17 * s }, { id: 'camZ', x: A.x - 172 * s, y: A.y - 26 * s, r: 15 * s });
  return out;
}
function hitBtn(x, y) { for (const b of buttons()) if (dist(x, y, b.x, b.y) < b.r * 1.25) return b.id; return null; }
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audio.init();
  if (typing()) document.activeElement.blur();
  if (e.pointerType === 'touch') isTouch = true;
  const { x, y } = toGame(e);
  pointers[e.pointerId] = { x, y, btn: null };
  if (state === 'title') { const b = titleButtons(); for (const t of b) if (x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h) { startGame(t.fresh); return; } return; }
  if (state === 'dialog') { advanceDialog(); return; }
  if (state === 'dead') { if (endingT > 1) respawn(); return; }
  if (state === 'ending') { if (endingT > 2) afterEnding(); return; }
  if (state === 'menu') { ui.back(); return; }
  const b = hitBtn(x, y);
  if (b) {
    pointers[e.pointerId].btn = b;
    if (b === 'attack') { input.attackHeld = true; doAction(); }
    if (b === 'skill') doSkill();
    if (b === 'potion') usePotion();
    if (b === 'camZ') gfx.cycleZoom();
    return;
  }
  if (e.pointerType === 'mouse' && e.button === 2 && use3D()) { pointers[e.pointerId].btn = 'rot'; pointers[e.pointerId].lx = x; pointers[e.pointerId].ly = y; return; }
  if (e.pointerType === 'mouse') {
    // desktop: click to attack / talk toward the cursor, hold to keep attacking
    const wp = use3D() ? gfx.screenToWorld(x, y) : { x: cam.x + x / ZOOM, y: cam.y + y / ZOOM };
    if (wp) player.face = Math.atan2(wp.y - player.y, wp.x - player.x);
    pointers[e.pointerId].btn = 'attack'; input.attackHeld = true; doAction();
    return;
  }
  if (x < W * 0.55 && joy.id === null) { joy.id = e.pointerId; joy.ox = x; joy.oy = y; joy.x = x; joy.y = y; }
});
cv.addEventListener('pointermove', e => {
  e.preventDefault();
  const g = toGame(e);
  if (e.pointerId === joy.id) { joy.x = g.x; joy.y = g.y; }
  const p = pointers[e.pointerId];
  if (p && p.btn === 'rot') { gfx.rotate((e.clientX - p.lx) * 0.008); gfx.pitchBy((e.clientY - p.ly) * 0.004); p.lx = e.clientX; p.ly = e.clientY; }
});
cv.addEventListener('wheel', e => { e.preventDefault(); if (use3D() && state !== 'title') gfx.zoom(e.deltaY > 0 ? 0.1 : -0.1); }, { passive: false });
const endPtr = e => {
  const p = pointers[e.pointerId];
  if (p && p.btn === 'attack') input.attackHeld = false;
  delete pointers[e.pointerId];
  if (e.pointerId === joy.id) { joy.id = null; input.jx = input.jy = 0; }
};
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('contextmenu', e => e.preventDefault());
// Android back button: close the top window, or open Options
window.onAndroidBack = () => { if (state === 'play' || state === 'menu') { ui.back(); return true; } return false; };
document.addEventListener('visibilitychange', () => { if (document.hidden) { writeSave(); if (state === 'play') ui.open('options'); audio.suspend(); } else audio.resume(); });

function respawn() {
  player.hp = maxHp(); player.sp = maxSp(); player.x = MAPDEF.respawn.x * TS; player.y = MAPDEF.respawn.y * TS; player.shield = 0; player.inv = 2;
  for (const e of enemies) { if (e.def.boss) { e.hp = e.maxHp; e.x = e.hx; e.y = e.hy; e.aggro = false; e.tele = 0; e.dash = 0; } }
  enemies = enemies.filter(e => !e.summoned);
  projs = []; pprojs = []; teles = []; bossBar = null; trail.forEach(t => { t.x = player.x; t.y = player.y; }); companions.forEach(c => { c.x = player.x; c.y = player.y; });
  state = 'play'; writeSave(); toast('You recover in ' + MAPDEF.townName);
}

function titleButtons() {
  const s = UIS, bw = 190 * s, bh = 42 * s, has = !!loadSave();
  const out = [];
  if (has) out.push({ label: 'Continue', fresh: false, x: W / 2 - bw / 2, y: H * 0.62, w: bw, h: bh });
  out.push({ label: has ? 'New Game' : 'Start Adventure', fresh: true, x: W / 2 - bw / 2, y: H * 0.62 + (has ? bh + 12 * s : 0), w: bw, h: bh });
  return out;
}
