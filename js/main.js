'use strict';
// ---------------------------------------------------------------- main loop
genMap();
ui.init();
gfx.init();
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (DEBUG) window.G = { get save() { return save; }, get player() { return player; }, startGame, get enemies() { return enemies; }, gainXP, setState: s => state = s, say, get state() { return state; }, get dialog() { return dialog; }, advanceDialog };
