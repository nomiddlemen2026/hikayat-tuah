'use strict';
// ---------------------------------------------------------------- phone extras
// Fullscreen + landscape lock on the first tap, pinch to zoom, and drag on the right side to turn the camera.
const mobile = (() => {
  const inApp = /; wv\)/.test(navigator.userAgent); // the Android app is already fullscreen and landscape
  function lock() { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => { }); } catch (e) { } }
  function goFull() {
    if (!TOUCH_DEV || inApp) return;
    const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement || !rq) { lock(); return; }
    try { const p = rq.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(() => { }); else lock(); } catch (e) { }
  }
  // the title screen tap (Start / Continue) is the user gesture browsers need for fullscreen
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && state === 'title') goFull(); }, true);

  let pinch = null;
  const free = () => Object.values(pointers).filter(p => p.touch && !p.btn);
  const gap = f => dist(f[0].x, f[0].y, f[1].x, f[1].y);
  cv.addEventListener('pointerdown', e => {
    const p = pointers[e.pointerId];
    if (e.pointerType !== 'touch' || !p || p.btn || state === 'title') return;
    p.touch = true;
    const f = free();
    if (f.length >= 2) { joy.id = null; pinch = { d: gap(f) }; } // two fingers: pinch zoom, not walking
  });
  cv.addEventListener('pointermove', e => {
    const p = pointers[e.pointerId];
    if (!p || !p.touch || p.btn) return;
    const g = toGame(e), dx = g.x - p.x; p.x = g.x; p.y = g.y;
    if (pinch) { const f = free(); if (f.length >= 2) { const d = gap(f); if (use3D()) gfx.zoom((pinch.d - d) / 220); pinch.d = d; } return; }
    if (e.pointerId !== joy.id && use3D() && state === 'play') gfx.rotate(dx * 0.01); // one finger on the right: turn the camera
  });
  const end = () => { if (pinch && free().length < 2) pinch = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  return { goFull };
})();
