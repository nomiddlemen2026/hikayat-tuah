'use strict';
// ---------------------------------------------------------------- realistic 3D people
// Every person (heroes, villagers, enemies) is built from one rigged, animated human body:
// Quaternius "Universal Animation Library" mannequin (CC0, quaternius.com), with the Malay
// costume added in code: baju and seluar painted from the skin weights, a songket sampin,
// tanjak headcloth, hair, eyes and brows, all coloured from a palette.
const chars3d = (() => {
  let base = null, clips = {}, ready = false, failed = false;
  const bindInv = {}, baseMeshes = [], geoCache = {};
  const waiting = [];
  function load(url, done) {
    if (!THREE.GLTFLoader) { failed = true; return done && done(false); }
    const L = new THREE.GLTFLoader(); if (THREE.MeshoptDecoder) L.setMeshoptDecoder(THREE.MeshoptDecoder);
    L.load(url, g => {
      base = g.scene; for (const a of g.animations) clips[a.name] = a;
      base.updateMatrixWorld(true);
      base.traverse(o => { if (o.isBone) bindInv[o.name] = o.matrixWorld.clone().invert(); if (o.isSkinnedMesh) baseMeshes.push(o); });
      ready = true; done && done(true); waiting.splice(0).forEach(f => f());
    }, undefined, () => { failed = true; done && done(false); });
  }
  const col = c => new THREE.Color(c);
  const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

  // Dress the bare body: loosen the cloth (push baju and seluar out along the normals, so they hang like
  // real fabric and still bend with the skeleton) and paint every vertex by where it sits in the T-pose.
  // Reference: baju Melayu cekak musang (long sleeves, raised collar), loose seluar gathered at the ankle,
  // samping worn over it from waist to knee, bengkung sash with the keris tucked in front, tanjak, capal.
  function dressBody(src, pal, sm) {
    const geo = toFloat(src), pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count, c = new Float32Array(n * 3);
    const v = new THREE.Vector3(), w = new THREE.Vector3(), v2 = new THREE.Vector3(), w2 = new THREE.Vector3(), nn = new THREE.Vector3();
    const skin = col(pal.skin || '#c68b59'), baju = col(pal.baju), seluar = col(pal.seluar || pal.baju), sampin = col(pal.sampin), gold = col(pal.gold || '#d9b03c'), sole = col(pal.shoe || '#4a3020'), cuff = col(pal.trim || pal.gold || '#d9b03c');
    const t = new THREE.Color(), bare = pal.bare;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i); w.copy(v); sm.applyBoneTransform(i, w);
      const x = w.x, y = w.y, z = w.z, ax = Math.abs(x);
      let puff = 0;
      const head = y > 1.505 && ax < 0.11, hand = ax > (bare ? 0.36 : 0.685);
      if (head) t.copy(skin);
      else if (hand) t.copy(skin);
      else if (y > 0.9) {                                            // baju: torso and sleeves
        t.copy(baju); puff = ax > 0.2 ? 0.012 + (ax - 0.2) * 0.012 : 0.014;
        if (!bare && ax > 0.655) t.copy(cuff);                         // embroidered cuffs
        if (ax < 0.012 && z > 0 && y > 1.2 && y < 1.47) t.copy(baju).multiplyScalar(0.82); // front placket
      } else if (y > 0.13) {                                         // loose seluar, gathered at the ankle
        t.copy(y > 0.56 && !pal.noSampin ? sampin : seluar); puff = y > 0.55 ? 0.006 : 0.014 + (0.55 - y) * 0.02; if (y < 0.2) puff *= (y - 0.13) / 0.07;
        if (y < 0.155) t.copy(cuff);
      } else {                                                       // capal: bare foot on a leather sole
        t.copy(pal.barefoot || y > 0.03 ? skin : sole); if (!pal.barefoot && y > 0.03 && y < 0.06 && (Math.abs(ax - 0.09) < 0.02 || z > 0.12)) t.copy(sole);
      }
      if (puff) { // move outwards by puff metres in body space
        nn.fromBufferAttribute(nor, i); v2.copy(v).addScaledVector(nn, 0.001); w2.copy(v2); sm.applyBoneTransform(i, w2);
        const l = w2.distanceTo(w); if (l > 1e-7) { v.addScaledVector(nn, 0.001 * puff / l); pos.setXYZ(i, v.x, v.y, v.z); }
      }
      const k = 0.93 + hsh(x * 23, y * 23) * 0.07;
      c[i * 3] = t.r * k; c[i * 3 + 1] = t.g * k; c[i * 3 + 2] = t.b * k;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    geo.computeBoundingSphere();
    return geo;
  }

  // songket: woven base colour with gold supplementary-weft motifs, a gold border (kaki) at the hem,
  // and the contrasting kepala kain panel (pucuk rebung triangles) that sits at the front
  const songketCache = {};
  function songket(base, gold, head) {
    const k = base + gold + head; if (songketCache[k]) return songketCache[k];
    const W = 512, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    // fine weave lines
    g.globalAlpha = 0.12; g.fillStyle = '#000'; for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H); g.globalAlpha = 1;
    // body motifs: small gold flowers (bunga tabur) in a half-drop grid
    g.fillStyle = gold;
    for (let y = 14, r = 0; y < H - 26; y += 16, r++) for (let x = (r % 2) * 10; x < W; x += 20) {
      if (x > W * 0.42 && x < W * 0.58) continue;
      g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 4, y); g.lineTo(x, y + 4); g.lineTo(x - 4, y); g.closePath(); g.fill();
      g.fillRect(x - 6, y - 0.5, 12, 1);
    }
    // kepala kain: a darker panel full of pucuk rebung (bamboo shoot) triangles
    const kx0 = W * 0.42, kx1 = W * 0.58;
    g.fillStyle = head || base; g.fillRect(kx0, 0, kx1 - kx0, H);
    g.fillStyle = gold; g.fillRect(kx0, 0, 3, H); g.fillRect(kx1 - 3, 0, 3, H);
    for (let y = 8; y < H - 24; y += 18) for (let x = kx0 + 6; x < kx1 - 10; x += 14) { g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x + 6, y); g.lineTo(x + 12, y + 14); g.closePath(); g.fill(); }
    // waist and hem borders
    g.fillRect(0, 0, W, 5);
    g.fillRect(0, H - 22, W, 22); g.fillStyle = base; for (let x = 0; x < W; x += 12) { g.beginPath(); g.moveTo(x, H - 4); g.lineTo(x + 6, H - 17); g.lineTo(x + 12, H - 4); g.closePath(); g.fill(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    return songketCache[k] = tx;
  }
  const mats = {};
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o, (key, val) => val && val.isTexture ? val.uuid : val); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o })); };

  // samping: a short songket sarong wrapped over the baju from the waist to just above the knee,
  // narrow at the waist, falling outwards, with the overlap fold and kepala kain at the front
  function sampingMesh(pal) {
    const g = new THREE.Group();
    const prof = [[0.175, 0.0], [0.19, -0.04], [0.212, -0.11], [0.236, -0.2], [0.258, -0.29], [0.274, -0.36], [0.279, -0.39]].map(p => new THREE.Vector2(p[0], p[1]));
    const lathe = new THREE.LatheGeometry(prof, 40);
    // rotate so the kepala kain (the middle of the texture) faces the front (+Z)
    lathe.rotateY(Math.PI);
    const cloth = new THREE.Mesh(lathe, mat('#ffffff', { map: songket(pal.sampin, pal.gold || '#d9b03c', pal.sampinHead || null), side: THREE.DoubleSide, roughness: 0.6, metalness: 0.08 }));
    cloth.scale.set(1, 1, 0.8); g.add(cloth);
    // the wrapped overlap: a fold running down the front, a little off-centre
    const fold = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.4, 0.03), mat(pal.sampin, { roughness: 0.6 }));
    fold.position.set(0.075, -0.2, 0.198); fold.rotation.set(-0.16, 0.35, 0.02); g.add(fold);
    // bengkung: a sash tied over the samping at the waist, with its knot and hanging ends on the left
    const sash = pal.bengkung || pal.gold || '#d9b03c', sm = mat(sash, { roughness: 0.55, metalness: 0.15 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.182, 0.055, 32, 1, true), sm); band.scale.z = 0.8; band.position.y = -0.012; g.add(band);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), sm); knot.position.set(0.145, -0.015, 0.09); knot.scale.set(1, 0.8, 0.7); g.add(knot);
    for (const [dx, rz] of [[0.0, 0.08], [0.022, -0.12]]) { const end = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.008), sm); end.position.set(0.15 + dx, -0.1, 0.1); end.rotation.set(-0.25, 0.6, rz); g.add(end); }
    // keris tucked into the sash at the front, hilt to the right hand, in its sheath (sampir + batang)
    const kr = new THREE.Group();
    const wood = mat('#6b4423', { roughness: 0.5 }), dark = mat('#3e2412', { roughness: 0.45 }), brass = mat('#c9a03a', { metalness: 0.75, roughness: 0.3 });
    const sampir = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.022), wood); sampir.position.set(0.0, 0.0, 0); kr.add(sampir);
    for (const sx of [-1, 1]) { const tip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 6), wood); tip.position.set(sx * 0.085, 0.01, 0); tip.rotation.z = -sx * 1.2; kr.add(tip); }
    const batang = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.007, 0.26, 8), wood); batang.position.set(0.0, -0.14, 0); kr.add(batang);
    const hulu = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.075, 8), dark); hulu.position.set(-0.012, 0.055, 0); hulu.rotation.z = 0.5; kr.add(hulu);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), dark); top.position.set(-0.03, 0.09, 0); top.scale.set(1.4, 0.8, 0.8); kr.add(top);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 10), brass); ring.position.set(-0.002, 0.022, 0); ring.rotation.z = 0.5; kr.add(ring);
    kr.position.set(-0.03, -0.01, 0.18); kr.rotation.set(0.15, 0, -0.55); g.add(kr);
    return g;
  }
  // baju details: the raised cekak musang collar and its gold studs (kancing) down the placket
  function bajuDetails(pal) {
    const g = new THREE.Group(), bm = mat(pal.baju, { roughness: 0.7 }), stud = mat(pal.gold || '#d9b03c', { metalness: 0.85, roughness: 0.25 });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.04, 20, 1, true), mat(pal.baju, { roughness: 0.7, side: THREE.DoubleSide })); collar.position.set(0, 1.505, 0.0); collar.scale.set(1, 1, 1.12); g.add(collar);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.004, 5, 24), stud); edge.rotation.x = Math.PI / 2; edge.position.set(0, 1.525, 0.0); edge.scale.set(1, 1.12, 1); g.add(edge);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 6), stud); b.position.set(0, 1.47 - i * 0.055, 0.118 - i * 0.004 + (i > 1 ? 0.004 : 0)); g.add(b); }
    return g;
  }
  // tanjak (tengkolok): a songket headcloth folded into a firm band with layered pleats, a flat crown,
  // and the solek, the stiff pointed peak that stands up at the front-left (Lang Menyongsong Angin style)
  function tanjakTex(base, gold) {
    const k = 'tj' + base + gold; if (songketCache[k]) return songketCache[k];
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 64);
    g.globalAlpha = 0.15; g.fillStyle = '#000'; for (let y = 0; y < 64; y += 3) g.fillRect(0, y, 256, 1); g.globalAlpha = 1;
    g.fillStyle = gold;
    for (let y = 8, r = 0; y < 56; y += 12, r++) for (let x = (r % 2) * 8; x < 256; x += 16) { g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.lineTo(x - 3, y); g.closePath(); g.fill(); }
    g.fillRect(0, 0, 256, 3); g.fillRect(0, 61, 256, 3);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return songketCache[k] = t;
  }
  function tanjakMesh(pal) {
    const g = new THREE.Group(), gold = pal.gold || '#d9b03c';
    const cloth = mat('#ffffff', { map: tanjakTex(pal.tanjak, gold), roughness: 0.6, metalness: 0.05 }), plain = mat(pal.tanjak, { roughness: 0.65 }), tr = mat(gold, { metalness: 0.6, roughness: 0.35 });
    const cy = 1.765, tilt = -0.12;
    // three stacked pleats make the band, each a little smaller, slightly offset like folded cloth
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1 - i * 0.004, 0.102 - i * 0.004, 0.03, 28, 1, true), cloth); b.position.set(0, cy - 0.028 + i * 0.026, -0.004 - i * 0.002); b.scale.set(0.98, 1, 1.22); b.rotation.set(tilt, 0, (i - 1) * 0.04); g.add(b); }
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.096, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), plain); crown.position.set(0, cy + 0.03, -0.01); crown.scale.set(0.96, 0.42, 1.18); g.add(crown);
    // the solek: two stiff cloth wings rising to a point, front-left, leaning outwards
    const wing = (w, h, x, z, ry, rz) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.quadraticCurveTo(w * 0.3, h * 0.55, 0, h); sh.quadraticCurveTo(-w * 0.45, h * 0.5, -w / 2, 0);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false, curveSegments: 8 }), cloth); m.position.set(x, cy + 0.02, z); m.rotation.set(-0.15, ry, rz); g.add(m); return m; };
    wing(0.1, 0.15, -0.035, 0.06, 0.55, 0.28);
    wing(0.08, 0.12, -0.06, 0.035, 0.95, 0.38);
    // a folded tail of cloth at the back
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.012), plain); tail.position.set(0.02, cy + 0.01, -0.125); tail.rotation.set(0.3, 0.1, 0.5); g.add(tail);
    // gold songket edges at the brow
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.101, 0.005, 6, 32), tr); edge.rotation.x = Math.PI / 2 + tilt; edge.position.set(0, cy - 0.043, 0.0); edge.scale.set(0.98, 1.22, 1); g.add(edge);
    return g;
  }
  function faceMeshes(pal, female) {
    const g = new THREE.Group(), eyeW = mat('#efe9df', { roughness: 0.4 }), eyeB = mat('#1b120c', { roughness: 0.25 }), hairM = mat(pal.hair || '#16110d', { roughness: 0.9 }), lip = mat('#7a3f2e');
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), eyeW); w.position.set(s * 0.033, 1.708, 0.104); w.scale.set(1.25, 0.75, 0.5); g.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 8, 6), eyeB); p.position.set(s * 0.033, 1.708, 0.1095); g.add(p);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.0065, 0.008), hairM); br.position.set(s * 0.034, 1.728, 0.109); br.rotation.z = s * -0.14; g.add(br);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.034, 6), mat(pal.skin || '#c68b59')); nose.position.set(0, 1.684, 0.117); nose.rotation.x = 0.35; g.add(nose);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.006), lip); mouth.position.set(0, 1.646, 0.112); g.add(mouth);
    if (pal.moustache) { const mo = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.01), hairM); mo.position.set(0, 1.659, 0.114); g.add(mo); }
    if (pal.beard) { const be = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(pal.beard)); be.position.set(0, 1.64, 0.05); g.add(be); }
    // hair: a short crop showing under the tanjak, or long hair for women
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hairM); hair.position.set(0, 1.72, -0.012); hair.scale.set(0.97, 1.08, 1.2); hair.rotation.x = -0.5; g.add(hair);
    if (female) { const lh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.3, 12), hairM); lh.position.set(0, 1.6, -0.08); g.add(lh); }
    return g;
  }
  const bone = (root, name) => { let b = null; root.traverse(o => { if (!b && o.isBone && o.name === name) b = o; }); return b; };

  // put an object, given in bind-pose body space (metres, facing +Z), onto a bone of any rig, even mid-animation
  function attach(rig, boneName, obj) {
    const b = rig.bones[boneName]; if (!b || !bindInv[boneName]) return;
    obj.updateMatrix(); obj.matrix.premultiply(bindInv[boneName]); obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
    b.add(obj);
  }
  const palKey = pal => [pal.baju, pal.seluar, pal.sampin, pal.skin, pal.gold, pal.shoe, pal.bare, pal.barefoot, pal.trim].join();

  // pal: { baju, seluar, sampin, tanjak, trim, gold, skin, hair, moustache, beard, bare, barefoot, female, noHat, noSampin }
  function make(pal, opts = {}) {
    const root = THREE.SkeletonUtils.clone(base);
    const key = palKey(pal), cached = geoCache[key] || (geoCache[key] = baseMeshes.map(sm => dressBody(sm.geometry, pal, sm)));
    let mi = 0;
    root.traverse(o => {
      if (!o.isSkinnedMesh) return;
      o.geometry = cached[mi++];
      o.material = bodyMat();
      o.frustumCulled = false;
    });
    const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name] = o; });
    const rig = { root, bones, handR: bones['DEF-handR'], head: bones['DEF-head'], hips: bones['DEF-hips'], cur: null, busy: 0 };
    if (!pal.noSampin) { const sm = sampingMesh(pal); sm.position.set(0, 0.965, 0.0); attach(rig, 'DEF-hips', sm); }
    if (!pal.bare) attach(rig, 'DEF-spine003', bajuDetails(pal));
    attach(rig, 'DEF-head', faceMeshes(pal, pal.female));
    if (!pal.noHat) attach(rig, 'DEF-head', tanjakMesh(pal));
    if (opts.tied) for (const y of [1.2, 1.02]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 5, 16), mat('#c8a165')); r.rotation.x = Math.PI / 2; r.position.y = y; r.scale.set(1.15, 0.8, 1); attach(rig, 'DEF-spine002', r); }
    rig.mixer = new THREE.AnimationMixer(root); rig.acts = {};
    for (const k in clips) rig.acts[k] = rig.mixer.clipAction(clips[k]);
    for (const k of ['Sword_Attack', 'Hit_Chest', 'Spell_Simple_Shoot', 'Punch_Jab', 'Punch_Cross', 'Roll', 'Death01']) if (rig.acts[k]) { rig.acts[k].setLoop(THREE.LoopOnce); rig.acts[k].clampWhenFinished = true; }
    play(rig, opts.anim || 'Idle_Loop', 0);
    rig.mixer.update(Math.random() * 2); // everyone out of step
    return rig;
  }
  let _bodyMat = null;
  const bodyMat = () => _bodyMat || (_bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, side: THREE.DoubleSide }));
  function play(rig, name, fade = 0.18, restart, speed = 1) {
    const a = rig.acts[name]; if (!a) return;
    a.timeScale = speed;
    if (rig.cur === a && !restart) return;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (rig.cur && rig.cur !== a) a.crossFadeFrom(rig.cur, fade, false);
    rig.cur = a;
  }
  // quantized (int16) attributes cannot hold baked transforms: copy them out as plain floats
  function toFloat(src) {
    const g = new THREE.BufferGeometry();
    for (const k in src.attributes) { const a = src.attributes[k], n = a.count, sz = a.itemSize, f = new Float32Array(n * sz); for (let i = 0; i < n; i++) for (let j = 0; j < sz; j++) f[i * sz + j] = j === 0 ? a.getX(i) : j === 1 ? a.getY(i) : j === 2 ? a.getZ(i) : a.getW(i); g.setAttribute(k, new THREE.BufferAttribute(f, sz)); }
    if (src.index) g.setIndex(src.index.clone());
    return g;
  }
  // the maple leaves are autumn red: repaint them tropical green, keeping the light and shade
  function greenify(m) {
    const img = m.map.image; if (!img || !img.width) return;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const l = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) / 255; a[i] = 40 + l * 90; a[i + 1] = 80 + l * 150; a[i + 2] = 25 + l * 50; }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = m.map.colorSpace; t.flipY = m.map.flipY; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT; m.map = t; m.needsUpdate = true;
  }
  // scenery models: name -> [{ geo, mat }] with each part's transform baked into its geometry
  const nature = {}; let natureReady = false;
  function loadNature(url, done) {
    if (!THREE.GLTFLoader) return done && done(false);
    const L = new THREE.GLTFLoader(); if (THREE.MeshoptDecoder) L.setMeshoptDecoder(THREE.MeshoptDecoder);
    L.load(url, g => {
      g.scene.updateMatrixWorld(true);
      let tops = g.scene.children; while (tops.length === 1 && !tops[0].isMesh && !/_/.test(tops[0].name) && tops[0].children.length > 1) tops = tops[0].children;
      for (const top of tops) {
        const parts = [], inv = top.matrixWorld.clone().invert();
        top.traverse(o => { if (!o.isMesh) return; const geo = toFloat(o.geometry); geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); const m = o.material; m.side = THREE.DoubleSide; if (m.isMeshStandardMaterial) { m.__metal = m.metalness; m.metalness = 0; m.roughness = Math.max(m.roughness, 0.8); } if (/MapleLeaves/.test(m.name) && m.map) greenify(m); if (/^Rock/.test(top.name)) m.color.setRGB(1.15, 1.12, 1.06); parts.push({ geo, mat: m }); });
        nature[top.name] = parts;
      }
      natureReady = true; done && done(true);
    }, undefined, () => done && done(false));
  }
  return { load, loadNature, nature, get natureReady() { return natureReady; }, make, play, attach, get ready() { return ready; }, get failed() { return failed; }, onReady: f => ready ? f() : waiting.push(f), clips };
})();
