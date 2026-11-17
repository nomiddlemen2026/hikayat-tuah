'use strict';
// ---------------------------------------------------------------- 3D renderer (Three.js, low-poly, phone friendly)
// The game logic stays on the 2D tile grid (x/y in pixels, 32px = 1 tile).
// Here 1 tile = 1 world unit: world X = x/32, world Z = y/32, Y is up.
// Everything is built in code from simple shapes: no model or texture files.

const gfx = (() => {
  const api = { ok: false, yaw: 0 };
  if (typeof THREE === 'undefined') return api;
  let renderer, scene, camera, glCanvas, groundMesh, waterMesh, gateMesh, shadowMesh, particles, altarKeris, chestMeshes = [];
  let pitch = 1.0, dist = 15, wantDist = 15, yaw = 0, lastT = 0;
  const tgt = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3();
  const corner = new Float32Array((MW + 1) * (MH + 1));
  const models = new Map();
  const portraits = {};
  let fogTarget = new THREE.Color('#bfd8e8');

  // ---------- helpers
  const matCache = {};
  const VC = () => matCache.vc || (matCache.vc = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const basic = (col, extra = {}) => { const k = 'b' + col + JSON.stringify(extra); return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial({ color: col, ...extra })); };
  const FLASH = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  // x-ray silhouette: only drawn where the hero is hidden behind trees or buildings
  // drawn in the opaque pass after the world (renderOrder 1) but before the hero (renderOrder 2), so the hero never hides itself
  const SIL = new THREE.MeshBasicMaterial({ color: '#8a6a10', blending: THREE.AdditiveBlending, depthFunc: THREE.GreaterDepth, depthWrite: false });
  let sil = null, silSrc = [], silDst = [], silWid = null;
  function syncSilhouette(m) {
    if (!sil || silWid !== m.userData.wid) {
      if (sil) scene.remove(sil);
      sil = m.clone(true); silSrc = []; silDst = []; silWid = m.userData.wid;
      m.traverse(o => silSrc.push(o)); sil.traverse(o => { silDst.push(o); if (o.isMesh) { o.material = SIL; o.renderOrder = 1; } });
      scene.add(sil);
    }
    for (let i = 0; i < silSrc.length; i++) { const a = silSrc[i], b = silDst[i]; if (!b) break; b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); b.visible = a.visible; }
  }
  const _c = new THREE.Color();
  function P(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    return { geo, color, m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)) };
  }
  function merge(parts) {
    const pos = [], nor = [], col = [];
    for (const p of parts) {
      const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
      g.applyMatrix4(p.m); g.computeVertexNormals();
      _c.set(p.color);
      const pa = g.attributes.position.array, na = g.attributes.normal.array;
      for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
      for (let i = 0; i < pa.length / 3; i++) col.push(_c.r, _c.g, _c.b);
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  }
  const meshOf = parts => new THREE.Mesh(merge(parts), VC());
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const geoCache = {};
  const G = (k, f) => geoCache[k] || (geoCache[k] = f());
  function gable(w, d, h, over = 0.15) {
    const x = w / 2 + over, z = d / 2 + over;
    const v = [
      -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0,      // front slope
      x, 0, -z, -x, 0, -z, -x, h, 0, x, 0, -z, -x, h, 0, x, h, 0,   // back slope
      -x, 0, -z, -x, 0, z, -x, h, 0, x, 0, z, x, 0, -z, x, h, 0,    // gable ends
      -x, 0, -z, x, 0, -z, x, 0, z, -x, 0, -z, x, 0, z, -x, 0, z,   // underside
    ];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  }

  // ---------- terrain heights
  function tileH(x, y) {
    const t = getT(x, y), r = regionAt(x, y);
    if (t === T.WATER || t === T.DEEP) return -0.5;
    if (t === T.FLOOR || t === T.WALL || t === T.PILLAR || t === T.GATE) return 0.06;
    if (t === T.BRIDGE || t === T.PLANK) return 0.04;
    let h = 0;
    if (r === 'mountain') h = noise(x / 6, y / 6, 21) * 1.6 + (t === T.ROCK ? 0.2 : 0);
    else if (r === 'jungle' || r === 'temple') h = noise(x / 5, y / 5, 22) * 0.45;
    else if (r === 'meadow') h = noise(x / 7, y / 7, 23) * 0.35;
    else if (r === 'swamp') h = noise(x / 5, y / 5, 24) * 0.15 - 0.05;
    if (t === T.PATH) h *= 0.6;
    return h;
  }
  function buildHeights() {
    for (let y = 0; y <= MH; y++) for (let x = 0; x <= MW; x++) {
      let s = 0, n = 0, bridge = false;
      for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
        const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
        s += tileH(tx, ty); n++; const t = getT(tx, ty); if (t === T.BRIDGE || t === T.PLANK) bridge = true;
      }
      let h = n ? s / n : 0; if (bridge) h = Math.max(h, 0.04);
      corner[y * (MW + 1) + x] = h;
    }
  }
  function heightAt(px, py) {
    const fx = clamp(px / TS, 0, MW - 0.001), fy = clamp(py / TS, 0, MH - 0.001), x = Math.floor(fx), y = Math.floor(fy), u = fx - x, v = fy - y, R = MW + 1;
    const a = corner[y * R + x], b = corner[y * R + x + 1], c = corner[(y + 1) * R + x], d = corner[(y + 1) * R + x + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  api.heightAt = heightAt;

  // ---------- world construction
  function groundTexture() {
    const S = 16, cvs = mk(MW * S, MH * S, g => {
      g.imageSmoothingEnabled = false;
      const base = { [T.TREE]: T.GRASS, [T.JTREE]: T.DARK, [T.ROCK]: T.DIRT, [T.PALM]: T.SAND, [T.MANGROVE]: T.SWAMP, [T.BLD]: T.DIRT, [T.WALL]: T.FLOOR, [T.PILLAR]: T.FLOOR, [T.GATE]: T.FLOOR };
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        let t = map[y * MW + x]; t = base[t] !== undefined ? base[t] : t;
        const spr = t === T.WATER ? waterSprite(false, 0) : t === T.DEEP ? waterSprite(true, 0) : tileSprite(t, Math.floor(hash(x, y, 11) * 3));
        g.drawImage(spr, x * S, y * S, S, S);
      }
    });
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }
  function buildGround() {
    const R = MW + 1, pos = new Float32Array(R * (MH + 1) * 3), uv = new Float32Array(R * (MH + 1) * 2), idx = [];
    for (let y = 0; y <= MH; y++) for (let x = 0; x <= MW; x++) { const i = y * R + x; pos.set([x, corner[i], y], i * 3); uv.set([x / MW, 1 - y / MH], i * 2); }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const a = y * R + x, b = a + 1, c = a + R, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    groundMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: groundTexture() }));
    scene.add(groundMesh);
    waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(MW + 60, MH + 60), new THREE.MeshLambertMaterial({ color: '#2f86b8', transparent: true, opacity: 0.78 }));
    waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(MW / 2, -0.2, MH / 2); scene.add(waterMesh);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#1f4f2c' }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(MW / 2, -0.6, MH / 2); scene.add(floor);
  }
  // Instanced props are split into 16x16-tile chunks so off-screen chunks are skipped (frustum culling).
  function instanced(geo, mat, items, set) {
    const chunks = {};
    for (const it of items) { const k = Math.floor(it.x / 16) + ',' + Math.floor(it.z / 16); (chunks[k] = chunks[k] || []).push(it); }
    for (const k in chunks) {
      const list = chunks[k], m = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { set(it, tmpM, _c); m.setMatrixAt(i, tmpM); m.setColorAt(i, _c); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere(); scene.add(m);
    }
  }
  function buildProps() {
    const lists = { tree: [], jtree: [], palm: [], rock: [], mangrove: [], wall: [], pillar: [] };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const t = map[y * MW + x], it = { x: x + 0.5 + (hash(x, y, 5) - 0.5) * 0.3, z: y + 0.5 + (hash(y, x, 6) - 0.5) * 0.3, h: heightAt((x + 0.5) * TS, (y + 0.5) * TS), r: hash(x, y, 7), s: 0.85 + hash(x, y, 8) * 0.35 };
      if (t === T.TREE) lists.tree.push(it); else if (t === T.JTREE) lists.jtree.push(it); else if (t === T.PALM) lists.palm.push(it);
      else if (t === T.ROCK) lists.rock.push(it); else if (t === T.MANGROVE) lists.mangrove.push(it);
      else if (t === T.WALL) lists.wall.push({ ...it, x: x + 0.5, z: y + 0.5 }); else if (t === T.PILLAR) lists.pillar.push({ ...it, x: x + 0.5, z: y + 0.5 });
    }
    const lam = new THREE.MeshLambertMaterial({ flatShading: true });
    const trunk = new THREE.CylinderGeometry(0.07, 0.12, 0.8, 5).translate(0, 0.4, 0);
    const crown = new THREE.IcosahedronGeometry(0.55, 0).translate(0, 1.1, 0);
    const setT = (sc, col, colVar, yMul = 1) => (it, m, c) => { m.compose(tmpV.set(it.x, it.h, it.z), tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.r * 6.28), tmpS.set(it.s * sc, it.s * sc * yMul, it.s * sc)); c.set(col).offsetHSL(0, 0, (it.r - 0.5) * colVar); };
    const all = [...lists.tree, ...lists.jtree, ...lists.mangrove];
    instanced(trunk, lam, all, setT(1, '#6b4423', 0.05));
    instanced(crown, lam, lists.tree, setT(1, '#3f9a3a', 0.12));
    instanced(crown, lam, lists.jtree, setT(1.12, '#2a6e2e', 0.1, 0.95));
    instanced(crown, lam, lists.mangrove, setT(1.15, '#3d5a32', 0.08, 0.7));
    instanced(new THREE.CylinderGeometry(0.05, 0.09, 1.5, 5).translate(0, 0.75, 0).applyMatrix4(new THREE.Matrix4().makeRotationZ(0.12)), lam, lists.palm, setT(1, '#8b6b3e', 0.05));
    instanced(new THREE.ConeGeometry(0.85, 0.35, 7, 1, true).translate(0, 1.55, 0), new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide }), lists.palm, setT(1, '#2e8b3e', 0.1));
    instanced(new THREE.DodecahedronGeometry(0.45, 0).translate(0, 0.22, 0), lam, lists.rock, (it, m, c) => { m.compose(tmpV.set(it.x, it.h, it.z), tmpQ.setFromEuler(new THREE.Euler(it.r, it.r * 5, 0)), tmpS.set(it.s * 1.1, it.s * (0.7 + it.r * 0.5), it.s)); c.set(it.r > 0.85 ? '#d8dde2' : '#7a7a80').offsetHSL(0, 0, (it.r - 0.5) * 0.1); });
    instanced(B(1, 1.4, 1).translate(0, 0.7, 0), lam, lists.wall, (it, m, c) => { m.compose(tmpV.set(it.x, it.h, it.z), tmpQ.identity(), tmpS.set(1, 1, 1)); c.set('#6b665c').offsetHSL(0, 0, (it.r - 0.5) * 0.08); });
    instanced(new THREE.CylinderGeometry(0.26, 0.32, 2, 8).translate(0, 1, 0), lam, lists.pillar, (it, m, c) => { m.compose(tmpV.set(it.x, it.h, it.z), tmpQ.identity(), tmpS.set(1, 1, 1)); c.set('#b5a98f'); });
    gateMesh = meshOf([80, 81, 82].flatMap(x => [P(B(1, 1.4, 0.3), '#b8901e', x + 0.5, 0.76, 16.5), P(B(0.12, 1.5, 0.35), '#ffd54f', x + 0.15, 0.8, 16.5), P(B(0.12, 1.5, 0.35), '#ffd54f', x + 0.85, 0.8, 16.5)]));
    scene.add(gateMesh);
    // altar + the keris
    scene.add(meshOf([P(B(3.4, 0.5, 1.2), '#9b927f', 79.9, 0.3, 4.3), P(B(3.5, 0.08, 1.3), '#c9a227', 79.9, 0.58, 4.3), P(B(1, 0.4, 0.8), '#b5ab95', 81.5, 0.8, 4.3)]));
    altarKeris = new THREE.Group();
    altarKeris.add(new THREE.Mesh(B(0.06, 0.7, 0.03), basic('#ffe082')), new THREE.Mesh(B(0.16, 0.05, 0.05).translate(0, -0.35, 0), basic('#d4a82a')));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), basic('#ffd54f', { transparent: true, opacity: 0.25, depthWrite: false })); altarKeris.add(glow);
    altarKeris.position.set(81.5, 1.6, 4.3); scene.add(altarKeris);
  }
  function buildBuildings() {
    const parts = [];
    for (const b of buildings) {
      const cx = b.x + b.w / 2, cz = b.y + b.h / 2, w = b.w, d = b.h;
      const h0 = heightAt(cx * TS, cz * TS);
      if (b.kind === 'palace') {
        for (let i = 0; i < 6; i++) for (const zz of [-1, 1]) parts.push(P(B(0.16, 0.7, 0.16), '#4e3420', cx - w / 2 + 0.6 + i * (w - 1.2) / 5, h0 + 0.35, cz + zz * (d / 2 - 0.5)));
        parts.push(P(B(w - 0.6, 1.3, d - 1), '#8d5a2b', cx, h0 + 1.35, cz));
        parts.push(P(B(w - 0.5, 0.12, d - 0.9), '#5d3a1a', cx, h0 + 0.72, cz));
        parts.push(P(B(1.2, 0.9, 0.06), '#3e2510', cx, h0 + 1.15, cz + (d - 1) / 2 + 0.03));
        for (let i = 0; i < 4; i++) parts.push(P(B(0.5, 0.35, 0.06), '#ffe9a8', cx - w / 2 + 1.2 + i * (w - 2.4) / 3 + (i > 1 ? 0.6 : -0.6) * 0, h0 + 1.5, cz + (d - 1) / 2 + 0.03));
        parts.push(P(B(1.4, 0.12, 0.8), '#7a5230', cx, h0 + 0.5, cz + d / 2 - 0.1), P(B(1.4, 0.12, 0.5), '#7a5230', cx, h0 + 0.28, cz + d / 2 + 0.3));
        parts.push(P(gable(w - 0.6, d - 1, 1.1, 0.35), '#7a2e1a', cx, h0 + 2, cz));
        parts.push(P(B(w + 0.1, 0.08, 0.1), '#d4a82a', cx, h0 + 2.02, cz + (d - 1) / 2 + 0.36));
        parts.push(P(B(w * 0.55, 0.7, d * 0.45), '#8d5a2b', cx, h0 + 3.1, cz));
        parts.push(P(gable(w * 0.55, d * 0.45, 1, 0.3), '#8e3a22', cx, h0 + 3.45, cz));
        for (const sx of [-1, 1]) parts.push(P(new THREE.ConeGeometry(0.1, 0.6, 4), '#d4a82a', cx + sx * (w * 0.275 + 0.3), h0 + 4.6, cz, 0, 0, -sx * 0.5));
      } else {
        const hut = b.kind === 'hut', wall = hut ? '#7a5a3a' : '#a0703e', roof = hut ? '#8a7a4a' : b.kind === 'home' ? '#9c2a1c' : '#6b4a2a';
        for (const xx of [-1, 1]) for (const zz of [-1, 1]) parts.push(P(B(0.12, 0.55, 0.12), '#4e3420', cx + xx * (w / 2 - 0.35), h0 + 0.27, cz + zz * (d / 2 - 0.35)));
        parts.push(P(B(w - 0.5, 0.95, d - 0.6), wall, cx, h0 + 1.02, cz));
        parts.push(P(B(0.55, 0.7, 0.05), '#3e2510', cx, h0 + 0.9, cz + (d - 0.6) / 2 + 0.03));
        parts.push(P(B(0.35, 0.3, 0.05), '#ffe9a8', cx - w / 2 + 0.75, h0 + 1.1, cz + (d - 0.6) / 2 + 0.03), P(B(0.35, 0.3, 0.05), '#ffe9a8', cx + w / 2 - 0.75, h0 + 1.1, cz + (d - 0.6) / 2 + 0.03));
        parts.push(P(B(0.8, 0.08, 0.5), '#7a5230', cx, h0 + 0.5, cz + d / 2 + 0.05));
        parts.push(P(gable(w - 0.5, d - 0.6, 0.95, 0.28), roof, cx, h0 + 1.5, cz));
        for (const sx of [-1, 1]) parts.push(P(new THREE.ConeGeometry(0.06, 0.4, 4), '#d4a82a', cx + sx * (w / 2 - 0.05), h0 + 2.55, cz, 0, 0, -sx * 0.5));
      }
    }
    scene.add(meshOf(parts));
  }
  function buildChests() {
    for (const c of chests) {
      const g = new THREE.Group();
      g.add(meshOf([P(B(0.5, 0.28, 0.34), '#6d4220', 0, 0.14, 0), P(B(0.52, 0.05, 0.36), '#d4a82a', 0, 0.22, 0), P(B(0.08, 0.1, 0.02), '#ffd54f', 0, 0.22, 0.18)]));
      const lid = new THREE.Group(); lid.position.set(0, 0.28, -0.17);
      lid.add(meshOf([P(B(0.52, 0.12, 0.36), '#8d5a2b', 0, 0.06, 0.17), P(B(0.54, 0.04, 0.38), '#d4a82a', 0, 0.12, 0.17)]));
      g.add(lid);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 20).rotateX(-Math.PI / 2), basic('#ffd54f', { transparent: true, opacity: 0.5, depthWrite: false }));
      ring.position.y = 0.03; g.add(ring);
      g.position.set(c.x / TS, heightAt(c.x, c.y), c.y / TS);
      scene.add(g); chestMeshes.push({ c, g, lid, ring });
    }
  }

  // ---------- character models (low-poly, animated limbs)
  function limb(parts, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(meshOf(parts)); return g; }
  function weaponGroup(wid) {
    const g = new THREE.Group();
    if (!wid || wid === 'fist') return g;
    if (wid === 'lembing') {
      g.add(meshOf([P(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 5), '#7a5230', 0, 0, 0.3, Math.PI / 2), P(new THREE.ConeGeometry(0.05, 0.18, 4), '#cfd8dc', 0, 0, 0.94, Math.PI / 2), P(B(0.06, 0.06, 0.05), '#c62828', 0, 0, 0.82)]));
      return g;
    }
    const blade = wid === 'parang' ? '#b0bec5' : '#cfd8dc', len = wid === 'parang' ? 0.42 : 0.36;
    const parts = [P(B(0.05, 0.05, 0.12), '#5d3a1a', 0, 0, 0.02), P(B(0.12, 0.03, 0.03), '#d4a82a', 0, 0, 0.09)];
    if (wid === 'taming') { g.add(meshOf(parts)); const b = new THREE.Mesh(B(0.05, 0.02, len), basic('#ffe082')); b.position.z = 0.1 + len / 2; g.add(b); const gl = new THREE.Mesh(B(0.12, 0.06, len + 0.1), basic('#ffd54f', { transparent: true, opacity: 0.3, depthWrite: false })); gl.position.z = 0.1 + len / 2; g.add(gl); return g; }
    if (wid === 'parang') parts.push(P(B(0.09, 0.02, len), blade, 0.02, 0, 0.1 + len / 2));
    else for (let i = 0; i < 4; i++) parts.push(P(B(0.045, 0.02, len / 4 + 0.01), blade, (i % 2 ? 0.012 : -0.012), 0, 0.1 + len / 8 + i * len / 4));
    g.add(meshOf(parts)); return g;
  }
  function buildHuman(pal, opts = {}) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const head = G('head', () => new THREE.IcosahedronGeometry(0.19, 1));
    const torso = [
      P(B(0.36, 0.34, 0.24), pal.baju, 0, 0.58, 0), P(B(0.05, 0.3, 0.02), pal.trim, 0, 0.6, 0.125),
      P(new THREE.CylinderGeometry(0.205, 0.215, 0.14, 8), pal.sampin, 0, 0.42, 0),
      P(B(0.2, 0.03, 0.02), pal.trim, 0, 0.42, 0.21), // songket line
      P(head, pal.skin || '#c68b59', 0, 0.9, 0),
      P(B(0.04, 0.045, 0.02), '#1a1a1a', -0.065, 0.91, 0.175), P(B(0.04, 0.045, 0.02), '#1a1a1a', 0.065, 0.91, 0.175),
      P(B(0.06, 0.015, 0.02), '#8d5a3a', 0, 0.83, 0.18),
      P(new THREE.CylinderGeometry(0.2, 0.205, 0.07, 8), pal.trim, 0, 1.02, 0),
      P(new THREE.ConeGeometry(0.2, 0.26, 4), pal.tanjak, 0.03, 1.17, 0, 0, Math.PI / 4, -0.15),
      P(B(0.05, 0.14, 0.08), pal.tanjak, -0.2, 1.08, -0.02, 0, 0, 0.7),
    ];
    if (opts.tied) torso.push(P(new THREE.TorusGeometry(0.21, 0.025, 4, 10), '#c8a165', 0, 0.62, 0, Math.PI / 2), P(new THREE.TorusGeometry(0.22, 0.025, 4, 10), '#c8a165', 0, 0.5, 0, Math.PI / 2));
    body.add(meshOf(torso));
    const skin = pal.skin || '#c68b59';
    const armL = limb([P(B(0.1, 0.28, 0.11), pal.baju, 0, -0.12, 0), P(B(0.09, 0.08, 0.09), skin, 0, -0.3, 0)], -0.235, 0.72, 0);
    const armR = limb([P(B(0.1, 0.28, 0.11), pal.baju, 0, -0.12, 0), P(B(0.09, 0.08, 0.09), skin, 0, -0.3, 0)], 0.235, 0.72, 0);
    const legL = limb([P(B(0.13, 0.34, 0.14), '#3e2723', 0, -0.17, 0), P(B(0.13, 0.05, 0.18), skin, 0, -0.33, 0.02)], -0.09, 0.36, 0);
    const legR = limb([P(B(0.13, 0.34, 0.14), '#3e2723', 0, -0.17, 0), P(B(0.13, 0.05, 0.18), skin, 0, -0.33, 0.02)], 0.09, 0.36, 0);
    body.add(armL, armR); root.add(legL, legR);
    const hand = new THREE.Group(); hand.position.set(0, -0.3, 0.02); armR.add(hand);
    root.userData = { kind: 'human', body, armL, armR, legL, legR, hand, wid: null };
    if (opts.scale) root.scale.setScalar(opts.scale);
    return root;
  }
  function setWeapon(m, wid) {
    const u = m.userData; if (u.wid === wid) return; u.wid = wid;
    while (u.hand.children.length) u.hand.remove(u.hand.children[0]);
    const w = weaponGroup(wid); w.rotation.x = 0.25; u.hand.add(w);
  }
  function buildQuad(kind, white) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    let parts = [], legC, legY, legX, legZ, legL = 0.3;
    if (kind === 'boar') {
      parts = [P(B(0.42, 0.36, 0.7), '#6b4a2f', 0, 0.42, 0), P(B(0.3, 0.28, 0.26), '#7d5a3c', 0, 0.45, 0.45), P(B(0.18, 0.12, 0.08), '#a07a5a', 0, 0.4, 0.6),
        P(B(0.03, 0.12, 0.03), '#f5f5dc', -0.1, 0.36, 0.6, 0.4), P(B(0.03, 0.12, 0.03), '#f5f5dc', 0.1, 0.36, 0.6, 0.4), P(B(0.04, 0.04, 0.02), '#000', -0.08, 0.53, 0.58), P(B(0.04, 0.04, 0.02), '#000', 0.08, 0.53, 0.58),
        P(B(0.06, 0.1, 0.4), '#4e3420', 0, 0.63, -0.05), P(B(0.07, 0.09, 0.04), '#5a3a22', -0.1, 0.62, 0.42), P(B(0.07, 0.09, 0.04), '#5a3a22', 0.1, 0.62, 0.42)];
      legC = '#3e2a1a'; legY = 0.26; legX = 0.14; legZ = 0.24; legL = 0.26;
    } else if (kind === 'tiger') {
      const fur = white ? '#ececec' : '#e07b1a', st = '#1a1a1a';
      parts = [P(B(0.42, 0.36, 0.9), fur, 0, 0.5, 0), P(B(0.36, 0.34, 0.32), fur, 0, 0.62, 0.55), P(B(0.2, 0.14, 0.12), '#fff', 0, 0.55, 0.72),
        P(B(0.08, 0.08, 0.04), fur, -0.12, 0.82, 0.5), P(B(0.08, 0.08, 0.04), fur, 0.12, 0.82, 0.5), P(B(0.05, 0.04, 0.02), '#2a2a2a', -0.09, 0.67, 0.715), P(B(0.05, 0.04, 0.02), '#2a2a2a', 0.09, 0.67, 0.715),
        P(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 5), fur, 0, 0.72, -0.62, -0.7)];
      for (let i = 0; i < 5; i++) parts.push(P(B(0.44, 0.05, 0.06), st, 0, 0.6 + (i % 2) * 0.01, -0.32 + i * 0.15, 0, 0, 0));
      parts.push(P(B(0.06, 0.03, 0.2), st, 0, 0.8, 0.55));
      legC = fur; legY = 0.34; legX = 0.15; legZ = 0.32; legL = 0.34;
    } else if (kind === 'croc') {
      const sk = white ? '#3d5a1e' : '#4a6b2a';
      parts = [P(B(0.5, 0.24, 1.0), sk, 0, 0.22, 0), P(B(0.32, 0.14, 0.55), sk, 0, 0.2, 0.75), P(new THREE.ConeGeometry(0.2, 0.9, 5), sk, 0, 0.2, -0.9, -Math.PI / 2),
        P(B(0.08, 0.08, 0.08), '#ffeb3b', -0.12, 0.33, 0.55), P(B(0.08, 0.08, 0.08), '#ffeb3b', 0.12, 0.33, 0.55), P(B(0.3, 0.02, 0.4), '#fff', 0, 0.14, 0.8)];
      for (let i = 0; i < 5; i++) parts.push(P(B(0.06, 0.08, 0.06), '#2e4413', 0, 0.37, -0.4 + i * 0.2));
      if (white) for (let i = -1; i <= 1; i++) parts.push(P(new THREE.ConeGeometry(0.06, 0.2, 4), '#d4a82a', i * 0.1, 0.48, 0.35));
      legC = sk; legY = 0.16; legX = 0.3; legZ = 0.3; legL = 0.16;
    }
    body.add(meshOf(parts));
    const legs = [];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const l = limb([P(B(0.1, legL, 0.1), legC, 0, -legL / 2, 0)], sx * legX, legY, sz * legZ); root.add(l); legs.push(l); }
    root.userData = { kind: 'quad', body, legs };
    return root;
  }
  function buildWisp(gold) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    body.add(new THREE.Mesh(G('wcore', () => new THREE.IcosahedronGeometry(0.14, 1)), basic('#ffffff')));
    body.add(new THREE.Mesh(G('wshell', () => new THREE.IcosahedronGeometry(0.3, 1)), basic(gold ? '#ffc107' : '#40ffaa', { transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })));
    body.add(meshOf([P(B(0.04, 0.06, 0.02), '#063', -0.05, 0.02, 0.14), P(B(0.04, 0.06, 0.02), '#063', 0.05, 0.02, 0.14)]));
    body.position.y = 0.75;
    root.userData = { kind: 'float', body };
    return root;
  }
  function buildGolem() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    body.add(meshOf([P(B(0.7, 0.55, 0.45), '#7a756c', 0, 0.75, 0), P(B(0.42, 0.36, 0.38), '#8f897e', 0, 1.2, 0), P(B(0.3, 0.06, 0.2), '#4e7a3e', -0.15, 1.03, 0.05)]));
    body.add(new THREE.Mesh(B(0.07, 0.07, 0.02).translate(-0.08, 1.24, 0.2), basic('#40e0ff')), new THREE.Mesh(B(0.07, 0.07, 0.02).translate(0.08, 1.24, 0.2), basic('#40e0ff')));
    const armL = limb([P(B(0.2, 0.55, 0.22), '#6a655c', 0, -0.25, 0)], -0.47, 0.95, 0), armR = limb([P(B(0.2, 0.55, 0.22), '#6a655c', 0, -0.25, 0)], 0.47, 0.95, 0);
    const legL = limb([P(B(0.22, 0.48, 0.24), '#5f5b54', 0, -0.24, 0)], -0.18, 0.48, 0), legR = limb([P(B(0.22, 0.48, 0.24), '#5f5b54', 0, -0.24, 0)], 0.18, 0.48, 0);
    body.add(armL, armR); root.add(legL, legR);
    root.userData = { kind: 'human', body, armL, armR, legL, legR };
    return root;
  }
  function buildGuardian() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    body.add(meshOf([P(new THREE.ConeGeometry(0.5, 1.1, 8), '#3b2a4a', 0, 0.55, 0), P(new THREE.CylinderGeometry(0.22, 0.24, 0.07, 8), '#d4a82a', 0, 0.85, 0),
      P(B(0.08, 0.7, 0.03), '#d4a82a', 0, 0.45, 0.33, -0.42), P(new THREE.IcosahedronGeometry(0.22, 1), '#2a1e36', 0, 1.25, 0),
      P(new THREE.ConeGeometry(0.06, 0.28, 4), '#d4a82a', 0, 1.55, 0), P(new THREE.ConeGeometry(0.05, 0.22, 4), '#d4a82a', -0.13, 1.5, 0, 0, 0, 0.3), P(new THREE.ConeGeometry(0.05, 0.22, 4), '#d4a82a', 0.13, 1.5, 0, 0, 0, -0.3),
      P(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 8), '#d4a82a', 0, 1.38, 0)]));
    body.add(new THREE.Mesh(B(0.07, 0.04, 0.02).translate(-0.07, 1.27, 0.2), basic('#ff5252')), new THREE.Mesh(B(0.07, 0.04, 0.02).translate(0.07, 1.27, 0.2), basic('#ff5252')));
    const orbit = new THREE.Group(); orbit.position.y = 0.8;
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(B(0.05, 0.02, 0.45), basic('#ffe082')); const a = i / 3 * Math.PI * 2; b.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85); b.rotation.y = -a; orbit.add(b); }
    body.add(orbit);
    body.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), basic('#ffc83c', { transparent: true, opacity: 0.12, depthWrite: false })).translateY(0.9));
    root.userData = { kind: 'float', body, orbit, hover: 0.25 };
    return root;
  }
  function modelFor(o) {
    if (o === player) { const m = buildHuman(HEROES.tuah); return m; }
    if (o.isCompanion) { const m = buildHuman(HEROES[o.id]); setWeapon(m, 'keris'); return m; }
    if (o.kind === 'captive') return buildHuman(HEROES[o.hero], { tied: !save.bossDead[CAPTOR[o.hero]] });
    if (o.kind) { const pal = { bendahara: { baju: '#f5f0e1', sampin: '#6d4c41', tanjak: '#c9a227', trim: '#c9a227', skin: '#c08a5c' }, villager1: { baju: '#8d6e63', sampin: '#a1887f', tanjak: '#5d4037', trim: '#d7ccc8' }, villager2: { baju: '#ec407a', sampin: '#7b1fa2', tanjak: '#ec407a', trim: '#f8bbd0', skin: '#d29a6a' }, smith: { baju: '#455a64', sampin: '#ff7043', tanjak: '#263238', trim: '#ffab91', skin: '#b97f50' } }[o.kind]; const m = buildHuman(pal); if (o.kind === 'smith') setWeapon(m, 'parang'); return m; }
    const d = o.def, s = d.boss ? 1.5 : 1;
    let m;
    if (d.look === 'human') { m = buildHuman(d.pal, { scale: s }); setWeapon(m, d.weapon); }
    else if (d.look === 'boar' || d.look === 'tiger' || d.look === 'croc') { m = buildQuad(d.look, d.boss); m.scale.setScalar(s); }
    else if (d.look === 'wisp') m = buildWisp(d.boss);
    else if (d.look === 'golem') m = buildGolem();
    else if (d.look === 'guardian') { m = buildGuardian(); m.scale.setScalar(1.3); }
    return m;
  }
  function setFlash(m, on) {
    if (m.userData.flash === on) return; m.userData.flash = on;
    m.traverse(o => { if (o.isMesh) { if (on) { o.userData.mat = o.material; o.material = FLASH; } else if (o.userData.mat) o.material = o.userData.mat; } });
  }
  function animate(m, o, t) {
    const u = m.userData, moving = !!o.moving, ph = (o.walk || t) * 11;
    if (u.kind === 'human') {
      const sw = moving ? Math.sin(ph) : 0;
      u.legL.rotation.x = sw * 0.7; u.legR.rotation.x = -sw * 0.7;
      u.armL.rotation.x = -sw * 0.6;
      const atk = o.atkAnim !== undefined ? o.atkAnim : o.atk !== undefined ? o.atk : (o.swing > 0 ? o.swing / 0.3 : 0);
      if (atk > 0) {
        if (u.wid === 'lembing') { u.armR.rotation.x = -1.5; u.armR.position.z = Math.sin((1 - atk) * Math.PI) * 0.25; }
        else { u.armR.rotation.x = lerp(-2.6, 0.2, 1 - atk); u.armR.rotation.z = lerp(0.6, -0.4, 1 - atk); }
      } else { u.armR.rotation.x = sw * 0.6 - (u.wid && u.wid !== 'fist' ? 0.35 : 0); u.armR.rotation.z = 0; u.armR.position.z = 0; }
      u.body.position.y = moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 2 + (o.seed || 0)) * 0.01;
    } else if (u.kind === 'quad') {
      const sw = moving ? Math.sin(ph * 1.2) * 0.6 : 0;
      u.legs[0].rotation.x = sw; u.legs[3].rotation.x = sw; u.legs[1].rotation.x = -sw; u.legs[2].rotation.x = -sw;
      u.body.position.y = moving ? Math.abs(Math.sin(ph * 1.2)) * 0.03 : 0;
      u.body.rotation.x = o.tele > 0 ? -0.15 : 0;
    } else if (u.kind === 'float') {
      u.body.position.y = (u.hover || 0) + Math.sin(t * 3 + (o.seed || 0)) * 0.08 + (u.orbit ? 0 : 0.0);
      if (u.orbit) u.orbit.rotation.y = t * 2.2;
    }
    const tele = o.tele > 0;
    m.userData.baseScale = m.userData.baseScale || m.scale.x;
    const k = tele ? 1 + Math.sin(t * 40) * 0.04 : 1;
    m.scale.setScalar(m.userData.baseScale * k);
  }

  // ---------- effect pools
  let telePool = [], slashPool = [], projPool = [];
  const teleMatFill = () => new THREE.MeshBasicMaterial({ color: '#ff2828', transparent: true, opacity: 0.3, depthWrite: false });
  function getPooled(pool, make) { for (const p of pool) if (!p.used) { p.used = true; p.obj.visible = true; return p; } const p = { used: true, obj: make() }; scene.add(p.obj); pool.push(p); return p; }
  function releaseAll(pool) { for (const p of pool) { p.used = false; } }
  function hideUnused(pool) { for (const p of pool) if (!p.used) p.obj.visible = false; }
  const circleGeo = new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), ringGeo = new THREE.RingGeometry(0.9, 1, 28).rotateX(-Math.PI / 2), lineGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0);
  const arcGeo = (r, arc) => G('arc' + r.toFixed(2) + '_' + arc.toFixed(2), () => new THREE.RingGeometry(r * 0.7, r, 18, 1, -arc / 2, arc).rotateX(-Math.PI / 2));

  // ---------- init
  api.init = function () {
    try {
      glCanvas = document.createElement('canvas'); glCanvas.id = 'gl';
      const stage = document.getElementById('stage') || document.body; stage.insertBefore(glCanvas, stage.firstChild);
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: !isTouch, powerPreference: 'high-performance' });
    } catch (e) { console.warn('WebGL not available, using classic 2D view', e); if (glCanvas) glCanvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5));
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#bfd8e8');
    scene.fog = new THREE.Fog('#bfd8e8', 16, 34);
    camera = new THREE.PerspectiveCamera(38, 1, 0.5, 46);
    scene.add(new THREE.HemisphereLight('#e8f4ff', '#5a6b3a', 1.6));
    const sun = new THREE.DirectionalLight('#fff3d6', 1.5); sun.position.set(-4, 10, 6); scene.add(sun);
    buildHeights(); buildGround(); buildProps(); buildBuildings();
    shadowMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(0.32, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }), 160);
    shadowMesh.count = 0; shadowMesh.frustumCulled = false; scene.add(shadowMesh);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(600 * 3), 3)); pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
    particles = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, depthWrite: false })); particles.frustumCulled = false; scene.add(particles);
    api.resize();
    api.ok = true;
    makePortraits();
  };
  api.resize = function () { if (!renderer) return; renderer.setSize(W, H, false); glCanvas.style.width = W + 'px'; glCanvas.style.height = H + 'px'; camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  api.setVisible = v => { if (glCanvas) glCanvas.style.display = v ? '' : 'none'; };
  api.onWorldReady = function () { // after setupWorld(): chests depend on save
    if (!api.ok) return;
    for (const cm of chestMeshes) scene.remove(cm.g);
    chestMeshes = []; buildChests();
    for (const [o, m] of models) scene.remove(m); models.clear();
    if (sil) { scene.remove(sil); sil = null; }
    snapCamera = true;
  };
  let snapCamera = true;
  api.rotate = d => { yaw += d; api.yaw = yaw; };
  api.zoom = d => { wantDist = clamp(wantDist * (1 + d), 7, 22); };
  api.pitchBy = d => { pitch = clamp(pitch + d, 0.55, 1.25); };
  api.cycleZoom = () => { wantDist = wantDist > 17 ? 10 : wantDist > 12 ? 20 : 15; };

  // ---------- portraits (rendered once from the 3D models for the HTML windows)
  function makePortraits() {
    const ps = new THREE.Scene(); ps.background = new THREE.Color('#f0dfb0');
    ps.add(new THREE.HemisphereLight('#ffffff', '#806040', 2)); const l = new THREE.DirectionalLight('#fff', 1.2); l.position.set(1, 2, 3); ps.add(l);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
    const list = { ...Object.fromEntries(Object.keys(HEROES).map(k => [k, HEROES[k]])), bendahara: { baju: '#f5f0e1', sampin: '#6d4c41', tanjak: '#c9a227', trim: '#c9a227', skin: '#c08a5c' }, 'npc:Pak Mat': { baju: '#8d6e63', sampin: '#a1887f', tanjak: '#5d4037', trim: '#d7ccc8' }, 'npc:Mak Som': { baju: '#ec407a', sampin: '#7b1fa2', tanjak: '#ec407a', trim: '#f8bbd0', skin: '#d29a6a' }, 'npc:Tok Besi': { baju: '#455a64', sampin: '#ff7043', tanjak: '#263238', trim: '#ffab91', skin: '#b97f50' } };
    const S = 96;
    renderer.setPixelRatio(1); renderer.setSize(S, S, false);
    for (const k in list) {
      const m = buildHuman(list[k]); m.rotation.y = 0.35; ps.add(m);
      cam.position.set(0.35, 1.0, 1.55); cam.lookAt(0, 0.88, 0);
      renderer.render(ps, cam);
      portraits[k] = glCanvas.toDataURL();
      ps.remove(m);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5)); api.resize();
  }
  api.portrait = k => portraits[k] || null;

  // ---------- per-frame
  function syncModel(o, x, y, face, extra) {
    let m = models.get(o);
    if (!m) { m = modelFor(o); if (!m) return null; models.set(o, m); scene.add(m); }
    m.userData.seen = true;
    m.position.set(x / TS, heightAt(x, y), y / TS);
    m.rotation.y = Math.PI / 2 - face;
    return m;
  }
  let shadowN = 0;
  function addShadow(x, y, s) { if (shadowN >= 160) return; tmpM.compose(tmpV.set(x / TS, heightAt(x, y) + 0.02, y / TS), tmpQ.identity(), tmpS.set(s, 1, s)); shadowMesh.setMatrixAt(shadowN++, tmpM); }
  api.render = function () {
    if (!api.ok) return;
    const p = player, t = time;
    // camera follow
    const ph = heightAt(p.x, p.y);
    tmpV.set(p.x / TS, ph, p.y / TS);
    const fdt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
    const k = 1 - Math.pow(0.0005, fdt);
    if (snapCamera || tgt.distanceTo(tmpV) > 6) { tgt.copy(tmpV); snapCamera = false; } else tgt.lerp(tmpV, k);
    dist += (wantDist - dist) * k;
    camera.position.set(tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, tgt.y + Math.sin(pitch) * dist, tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(tgt.x, tgt.y + 0.6, tgt.z);
    // region mood via fog colour
    const reg = regionAt(Math.floor(p.x / TS), Math.floor(p.y / TS));
    fogTarget.set(reg === 'swamp' ? '#8fa892' : reg === 'temple' ? '#4a3d5a' : reg === 'mountain' ? '#c9d6e3' : reg === 'jungle' ? '#a9c9a4' : '#bfd8e8');
    scene.fog.color.lerp(fogTarget, 0.03); scene.background.copy(scene.fog.color);
    scene.fog.near = reg === 'temple' ? 9 : reg === 'swamp' ? 11 : 16; scene.fog.far = reg === 'temple' ? 24 : reg === 'swamp' ? 26 : 34;
    waterMesh.position.y = -0.2 + Math.sin(t * 1.2) * 0.02;
    gateMesh.visible = getT(81, 16) === T.GATE;
    altarKeris.visible = !save.taming; altarKeris.rotation.y = t * 1.5; altarKeris.position.y = 1.6 + Math.sin(t * 2) * 0.08;
    for (const cm of chestMeshes) { cm.lid.rotation.x = cm.c.open ? -1.9 : 0; cm.ring.visible = !cm.c.open; cm.ring.material.opacity = 0.3 + 0.25 * Math.sin(t * 4); }
    // characters
    for (const m of models.values()) m.userData.seen = false;
    shadowN = 0;
    const near = (x, y) => Math.abs(x - p.x) < 24 * TS && Math.abs(y - p.y) < 20 * TS;
    const pm = syncModel(p, p.x, p.y, p.face);
    if (pm) {
      setWeapon(pm, save.weapon); animate(pm, p, t);
      if (p.spin > 0) pm.rotation.y += t * 30;
      pm.visible = !(p.inv > 0 && p.hurt < 0 && Math.floor(t * 20) % 2);
      setFlash(pm, p.hurt > 0); addShadow(p.x, p.y, 1);
      pm.traverse(o => { if (o.isMesh) o.renderOrder = 2; });
      syncSilhouette(pm);
    }
    for (const c of companions) { c.isCompanion = true; const m = syncModel(c, c.x, c.y, c.face); if (m) { animate(m, c, t); addShadow(c.x, c.y, 1); } }
    for (const n of npcs) { if (!near(n.x, n.y)) continue; const m = syncModel(n, n.x, n.y, n.kind === 'captive' ? Math.PI / 2 : Math.atan2(p.y - n.y, p.x - n.x)); if (m) { if (n.kind === 'captive' && save.bossDead[CAPTOR[n.hero]] && !m.userData.untied) { m.userData.untied = true; scene.remove(m); models.delete(n); } else { animate(m, { moving: false, seed: n.x }, t); addShadow(n.x, n.y, 1); } } }
    for (const e of enemies) { if (e.hp <= 0 || !near(e.x, e.y)) continue; const m = syncModel(e, e.x, e.y, e.face); if (m) { animate(m, e, t); setFlash(m, e.hurt > 0); addShadow(e.x, e.y, e.def.boss ? 1.8 : e.def.look === 'croc' ? 1.5 : 1.1); } }
    for (const [o, m] of models) if (!m.userData.seen) { scene.remove(m); models.delete(o); }
    shadowMesh.count = shadowN; shadowMesh.instanceMatrix.needsUpdate = true;
    // telegraphs
    releaseAll(telePool);
    for (const tl of teles) {
      const k = 1 - tl.t / tl.max, h = heightAt(tl.x, tl.y) + 0.05;
      const col = tl.col ? (tl.col.includes('255,200') ? '#ffc800' : '#aa00ff') : '#ff2828';
      if (tl.kind === 'circle') {
        const f = getPooled(telePool, () => new THREE.Mesh(circleGeo, teleMatFill())); f.obj.geometry = circleGeo; f.obj.material.color.set(col); f.obj.material.opacity = 0.15 + k * 0.25; f.obj.position.set(tl.x / TS, h, tl.y / TS); f.obj.scale.set(tl.r / TS, 1, tl.r / TS); f.obj.rotation.y = 0;
        const r = getPooled(telePool, () => new THREE.Mesh(ringGeo, teleMatFill())); r.obj.geometry = ringGeo; r.obj.material.color.set(col); r.obj.material.opacity = 0.8; r.obj.position.set(tl.x / TS, h + 0.01, tl.y / TS); const rs = Math.max(0.01, tl.r * k / TS); r.obj.scale.set(rs, 1, rs); r.obj.rotation.y = 0;
      } else {
        const f = getPooled(telePool, () => new THREE.Mesh(lineGeo, teleMatFill())); f.obj.geometry = lineGeo; f.obj.material.color.set(col); f.obj.material.opacity = 0.15 + k * 0.35; f.obj.position.set(tl.x / TS, h, tl.y / TS); f.obj.scale.set(tl.len / TS, 1, tl.w / TS); f.obj.rotation.y = -tl.a;
      }
    }
    hideUnused(telePool);
    // slashes
    releaseAll(slashPool);
    for (const s of slashes) {
      const k = s.t / s.max, o = getPooled(slashPool, () => new THREE.Mesh(arcGeo(1, 1), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, depthWrite: false, side: THREE.DoubleSide })));
      o.obj.geometry = arcGeo(s.r / TS * (1.1 - k * 0.2), s.arc); o.obj.material.color.setRGB(...s.col.split(',').map(v => v / 255)); o.obj.material.opacity = k * 0.85;
      o.obj.position.set(s.x / TS, heightAt(s.x, s.y) + 0.45, s.y / TS); o.obj.rotation.y = -s.a;
    }
    hideUnused(slashPool);
    // projectiles
    releaseAll(projPool);
    for (const pr of projs) {
      const o = getPooled(projPool, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), basic('#e8fff4'))); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), basic('#40ffaa', { transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }))); g.add(new THREE.Mesh(B(0.32, 0.04, 0.07), basic('#cfd8dc'))); return g; });
      const orb = pr.kind === 'orb'; o.obj.children[0].visible = orb; o.obj.children[1].visible = orb; o.obj.children[2].visible = !orb;
      o.obj.position.set(pr.x / TS, heightAt(pr.x, pr.y) + 0.55, pr.y / TS); o.obj.rotation.y = orb ? 0 : t * 20;
    }
    hideUnused(projPool);
    // particles
    const pa = particles.geometry.attributes.position.array, ca = particles.geometry.attributes.color.array;
    let n = 0;
    for (const q of parts) { if (n >= 600) break; pa[n * 3] = q.x / TS; pa[n * 3 + 1] = heightAt(q.x, q.y) + 0.5 + (q.g ? 0.2 : 0); pa[n * 3 + 2] = q.y / TS; _c.set(q.col.startsWith('rgba') ? '#c8b48c' : q.col); ca[n * 3] = _c.r; ca[n * 3 + 1] = _c.g; ca[n * 3 + 2] = _c.b; n++; }
    particles.geometry.setDrawRange(0, n); particles.geometry.attributes.position.needsUpdate = true; particles.geometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
  };

  // ---------- screen <-> world
  api.project = function (px, py, up = 0) {
    tmpV.set(px / TS, heightAt(px, py) + up, py / TS).project(camera);
    return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * H, vis: tmpV.z < 1 && tmpV.z > -1 };
  };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  api.screenToWorld = function (sx, sy) {
    ndc.set(sx / W * 2 - 1, -(sy / H) * 2 + 1); ray.setFromCamera(ndc, camera);
    plane.constant = -heightAt(player.x, player.y);
    const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, hit)) return null;
    return { x: hit.x * TS, y: hit.z * TS };
  };
  api.stats = () => renderer ? renderer.info.render : null;
  return api;
})();
