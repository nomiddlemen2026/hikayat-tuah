'use strict';
// ---------------------------------------------------------------- detailed 3D weapons (traditional Malay arms)
// Each weapon is built from real profiles: extruded blades with a bevelled edge, lathe-turned hilts,
// pamor (damascus) steel on keris, brass fittings and carved wooden grips.
// Frame: the grip is at the origin, the blade points along +Z, the flat of the blade lies in the X-Z plane.
// Bows keep the old frame (limbs along Y, grip at x 0.42) so the bow-holding pose still works.
const weapons3d = (() => {
  const PI = Math.PI;
  let env = null, R = null; const mats = {}, built = {};
  // a small studio environment so polished steel and brass catch the light
  function init(renderer) {
    if (env || !renderer) return;
    R = renderer;
    try {
      const sc = new THREE.Scene();
      const sg = new THREE.SphereGeometry(10, 24, 12), col = [];
      const p = sg.attributes.position, c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; if (y > 0) c.set('#9ec9ef').lerp(new THREE.Color('#ffffff'), Math.pow(1 - y, 3)); else c.set('#7d8270').lerp(new THREE.Color('#e8e0c8'), Math.pow(1 + y, 6)); col.push(c.r, c.g, c.b); }
      sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      sc.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const box = (x, y, z, s, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
      box(-4, 7, 5, 5, 4); box(6, 3, -3, 4, 2); box(0, -2, -8, 6, 1.2);
      const pm = new THREE.PMREMGenerator(renderer); env = pm.fromScene(sc, 0.03).texture; pm.dispose();
    } catch (e) { env = null; }
  }
  // ---- textures
  function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  const pamorTex = () => mats.pamorT || (mats.pamorT = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#5c6268'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { // flowing nickel layers
      const y0 = Math.random() * h, a = 4 + Math.random() * 10, f = 0.02 + Math.random() * 0.05, ph = Math.random() * 6;
      g.strokeStyle = `rgba(${200 + Math.random() * 55 | 0},${205 + Math.random() * 50 | 0},${210 + Math.random() * 45 | 0},${0.35 + Math.random() * 0.5})`; g.lineWidth = 0.6 + Math.random() * 1.4;
      g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0 + Math.sin(x * f + ph) * a + Math.sin(x * f * 2.7 + ph * 2) * a * 0.3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
  }, [6, 12]));
  const grainTex = () => mats.grainT || (mats.grainT = canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(60,30,10,${0.08 + Math.random() * 0.22})`; g.lineWidth = 0.5 + Math.random() * 2; const x = Math.random() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rr(-8, 8), h * 0.3, x + rr(-8, 8), h * 0.7, x + rr(-4, 4), h); g.stroke(); }
  }, [1, 1]));
  const wrapTex = () => mats.wrapT || (mats.wrapT = canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 5;
    for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 22); g.lineTo(w, i * 22 + 26); g.stroke(); }
  }, [3, 6]));
  // ---- materials
  const std = (k, o) => mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ envMap: env, envMapIntensity: 1, ...o }));
  const steel = (col = '#cfd8dc', glow) => std('st' + col + glow, { color: col, metalness: 0.92, roughness: 0.26, emissive: glow || '#000', emissiveIntensity: glow ? 0.45 : 0 });
  const pamor = (col = '#ffffff', glow) => std('pm' + col + glow, { color: col, map: pamorTex(), metalness: 0.88, roughness: 0.32, emissive: glow || '#000', emissiveIntensity: glow ? 0.35 : 0 });
  const brass = (col = '#d4a82a') => std('br' + col, { color: col, metalness: 1, roughness: 0.3 });
  const wood = (col = '#6b3f1f') => std('wd' + col, { color: col, map: grainTex(), metalness: 0, roughness: 0.55 });
  const wrap = (col = '#3e2723') => std('wr' + col, { color: col, map: wrapTex(), metalness: 0, roughness: 0.85 });
  const cloth = col => std('cl' + col, { color: col, metalness: 0, roughness: 0.9, side: THREE.DoubleSide });
  const halo = col => mats['h' + col] || (mats['h' + col] = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
  // ---- geometry helpers
  const M_BLADE = new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1); // shape (u,v,w) -> (x=v, y=w, z=u)
  function extrude(pts, thick, edge, at = 0) {
    const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.0005, thick - edge * 2), bevelEnabled: edge > 0, bevelThickness: edge, bevelSize: edge * 0.6, bevelOffset: -edge * 0.6, bevelSegments: 1, curveSegments: 4 });
    g.translate(at, 0, -Math.max(0.0005, thick - edge * 2) / 2); g.applyMatrix4(M_BLADE); g.computeVertexNormals(); return g;
  }
  // blade outline from an upper and lower edge function of u (0..len), closed with a tip point
  function bladePts(len, top, bot, tip, n = 24) {
    const a = [], b = [];
    for (let i = 0; i <= n; i++) { const u = len * i / n, f0 = Math.min(1, i / n), t = top(f0), d = bot(f0); if (i === n && Math.abs(t - d) < 0.002) break; a.push([u, t]); b.push([u, d]); }
    return [...a, tip, ...b.reverse()];
  }
  // lathe around +Z from a profile of [radius, z] pairs
  function lathe(prof, seg = 12) { const g = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(Math.max(0.0001, p[0]), p[1])), seg); g.rotateX(PI / 2); g.computeVertexNormals(); return g; }
  function bend(g, k, from = 0) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z < from) p.setX(i, p.getX(i) + k * (z - from) * (z - from)); } p.needsUpdate = true; g.computeVertexNormals(); return g; }
  const mesh = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
  const tube = (pts, r, seg = 20) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 6, false);
  // hair tuft (Dayak / Iranun hilts)
  function tuft(g, z, col, n = 9, len = 0.07) { for (let i = 0; i < n; i++) { const a = i / n * PI * 2; const m = mesh(new THREE.CylinderGeometry(0.0015, 0.004, len, 3), cloth(col), Math.cos(a) * 0.008, Math.sin(a) * 0.008, z - len / 2 + 0.01, PI / 2 + rr(-0.25, 0.25), 0, rr(-0.3, 0.3)); g.add(m); } }

  // ---------------- hilts
  function kerisHilt(g, w) { // hulu (Jawa Demam style, bent like a feverish man), pendokok cup and ganja
    const gold = w.glow ? brass('#ffd54f') : brass();
    g.add(mesh(lathe([[0.0, 0.1], [0.013, 0.098], [0.017, 0.092], [0.017, 0.086], [0.012, 0.083], [0, 0.082]]), gold)); // pendokok/selut cup
    const hulu = lathe([[0, 0.083], [0.012, 0.082], [0.014, 0.072], [0.012, 0.06], [0.015, 0.045], [0.017, 0.025], [0.016, 0.005], [0.021, -0.012], [0.025, -0.024], [0.021, -0.034], [0.009, -0.039], [0, -0.04]], 10);
    bend(hulu, 7, 0.04);
    g.add(mesh(hulu, wood(w.hilt || '#5a3218')));
    // ganja: the asymmetric guard plate at the base of the blade
    g.add(mesh(extrude([[0, -0.032], [0, 0.03], [0.012, 0.03], [0.016, 0.016], [0.016, -0.02], [0.009, -0.034], [0.004, -0.046], [0.002, -0.038]], 0.016, 0.003), w.glow ? pamor(w.blade, w.glow) : pamor('#d0d4d8'), 0, 0, 0.1));
  }
  function woodHilt(g, len, col, opts = {}) {
    const r = opts.r || 0.016, z1 = opts.top || 0.09;
    g.add(mesh(lathe([[0, z1 + 0.008], [r + 0.004, z1 + 0.006], [r + 0.005, z1 - 0.004], [r + 0.001, z1 - 0.012], [r, z1 - 0.014], [0, z1 - 0.015]]), brass(opts.brass))); // ferrule
    const h = lathe([[0, z1 - 0.014], [r, z1 - 0.014], [r * 0.95, z1 - len * 0.4], [r * 1.1, z1 - len * 0.8], [r * (opts.flare || 1.35), z1 - len], [r * 0.9, z1 - len - 0.008], [0, z1 - len - 0.01]], 10);
    if (opts.bend) bend(h, opts.bend, z1 - 0.03);
    g.add(mesh(h, opts.wrap ? wrap(col) : wood(col)));
    return z1 - len;
  }

  // ---------------- blades
  function keris(g, w, len, luk, width = 1) {
    kerisHilt(g, w);
    const c = f => luk ? 0.011 * width * Math.sin(luk * PI * f) * (1 - 0.35 * f) * Math.min(1, f * 6, (1 - f) / 0.2) : 0;
    const wd = f => (0.021 + 0.022 * (1 - f)) * width * Math.min(1, Math.pow(Math.max(0, 1 - f) / 0.18, 0.75));
    const pts = bladePts(len, f => c(f) + wd(f) / 2 + (f < 0.12 ? 0.006 * (1 - f / 0.12) : 0), f => c(f) - wd(f) / 2 - (f < 0.08 ? 0.004 : 0), [len + 0.012, c(1)], 40);
    const bm = mesh(extrude(pts, 0.014, 0.0055, 0), w.glow ? pamor(w.blade, w.glow) : pamor(w.blade === '#cfd8dc' ? '#ffffff' : w.blade), 0, 0, 0.115);
    g.add(bm); if (w.glow) g.add(glowOf(bm, w.glow));
  }
  function glowOf(m, col) { const h = new THREE.Mesh(m.geometry, halo(col)); h.position.copy(m.position); h.rotation.copy(m.rotation); h.scale.set(1.9, 2.6, 1.04); return h; }
  function single(g, w, len, top, bot, tip, opts = {}) { // single-edged choppers and swords
    const pts = bladePts(len, top, bot, tip, 30);
    const m = mesh(extrude(pts, opts.thick || 0.012, opts.edge || 0.0045), opts.mat || steel(w.blade, w.glow), 0, 0, opts.at || 0.1);
    g.add(m); if (w.glow) g.add(glowOf(m, w.glow)); return m;
  }
  const BUILD = {
    keris: (g, w) => keris(g, w, 0.36, 5),
    taming: (g, w) => keris(g, w, 0.4, 7),
    sundang: (g, w) => keris(g, w, 0.5, 5, 1.45),
    kerisBunian: (g, w) => keris(g, w, 0.44, 9, 1.1),
    kerisPanjang: (g, w) => keris(g, w, 0.56, 0, 0.95),
    kerisWarisan: (g, w) => keris(g, w, 0.5, 13, 1.25),
    parang: (g, w) => { // broad jungle parang, the blade widens toward the tip
      woodHilt(g, 0.14, '#4e2c14', { bend: 2 });
      single(g, w, 0.4, f => 0.014 - 0.004 * f, f => -(0.026 + 0.032 * Math.pow(f, 1.4)), [0.43, -0.03]);
      g.add(mesh(extrude([[0, -0.03], [0, 0.022], [0.008, 0.022], [0.008, -0.03]], 0.02, 0.003), brass('#9e7b3a'), 0, 0, 0.088));
    },
    golok: (g, w) => { // golok: clipped point, slight downward curve
      woodHilt(g, 0.13, '#3e2414', { bend: 3, flare: 1.5 });
      single(g, w, 0.42, f => 0.014 - 0.03 * Math.pow(f, 2.5), f => -(0.03 + 0.012 * Math.sin(PI * f)), [0.45, -0.032]);
    },
    lading: (g, w) => { // Terengganu lading: slender at the hilt, a heavy flared tip that sweeps up
      woodHilt(g, 0.13, '#5d3a1a', { bend: 4 });
      single(g, w, 0.44, f => 0.012 + 0.012 * Math.pow(f, 3), f => -(0.018 + 0.05 * Math.pow(f, 2.6)), [0.47, 0.03]);
    },
    mandau: (g, w) => { // Dayak mandau: convex edge, notched spine, carved antler hilt with hair tufts
      const end = woodHilt(g, 0.15, '#e8dcc0', { bend: 2, flare: 1.9, brass: '#b08d57' });
      tuft(g, end + 0.01, '#b71c1c', 10, 0.08);
      g.add(mesh(new THREE.TorusGeometry(0.02, 0.005, 5, 12), wood('#1a1a1a'), 0, 0, end + 0.04));
      const notch = f => f > 0.04 && f < 0.2 && Math.floor(f * 60) % 2 ? -0.004 : 0;
      single(g, w, 0.44, f => 0.016 - 0.012 * Math.pow(f, 2) + notch(f), f => -(0.028 + 0.016 * Math.sin(PI * f * 0.9)), [0.48, 0.006]);
    },
    kampilan: (g, w) => { // Iranun / Sabah kampilan: long, widening blade with a spike at the tip, H guard, forked pommel
      const end = woodHilt(g, 0.2, '#2b1b10', { wrap: true, flare: 1.1 });
      for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.014, 0.018, 0.06), wood('#2b1b10'), s * 0.022, 0, end - 0.018, 0, 0, 0)), g.add(mesh(new THREE.BoxGeometry(0.01, 0.012, 0.035), brass(), s * 0.026, 0, end - 0.05, 0, s * 0.5, 0));
      tuft(g, end - 0.05, '#fafafa', 12, 0.09);
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.018, 0.012), brass('#a8865a'), 0, 0, 0.088));
      for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.012, 0.018, 0.05), brass('#a8865a'), s * 0.05, 0, 0.1));
      single(g, w, 0.7, f => 0.012 + 0.03 * f, f => -(0.012 + 0.024 * f), [0.73, 0.06], { at: 0.1 });
      g.add(mesh(new THREE.ConeGeometry(0.007, 0.05, 4), steel(w.blade), 0.02, 0, 0.81, PI / 2, 0, 0));
    },
    jenawi: (g, w) => { // long court sword: gentle curve, round guard, wrapped grip
      woodHilt(g, 0.2, '#1b1b1b', { wrap: true, flare: 1.05 });
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 20).rotateX(PI / 2), brass('#c9a227'), 0, 0, 0.092));
      single(g, w, 0.6, f => 0.012 + 0.03 * f * f, f => -0.013 + 0.03 * f * f, [0.64, 0.03], { at: 0.1 });
    },
    pedang: (g, w) => { // straight double-edged sword with curled quillons
      woodHilt(g, 0.14, '#3e2723', { wrap: true });
      g.add(mesh(new THREE.SphereGeometry(0.02, 10, 8), brass(w.glow ? '#ffd54f' : undefined), 0, 0, -0.06));
      g.add(mesh(new THREE.BoxGeometry(0.12, 0.016, 0.014), brass(w.glow ? '#ffd54f' : undefined), 0, 0, 0.09));
      for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.014, 0.005, 5, 10, PI * 1.3), brass(w.glow ? '#ffd54f' : undefined), s * 0.064, 0, 0.1, PI / 2, 0, s > 0 ? 0 : PI));
      const wd = f => 0.02 * (1 - 0.3 * f) * Math.min(1, (1 - f) / 0.12);
      single(g, w, 0.56, f => wd(f), f => -wd(f), [0.6, 0], { thick: 0.012, edge: 0.0055 });
    },
    badik: (g, w) => { // Bugis badik: belly-shaped blade, pistol grip, no guard
      g.add(mesh(lathe([[0, 0.096], [0.014, 0.094], [0.015, 0.086], [0, 0.084]]), brass()));
      const h = lathe([[0, 0.086], [0.013, 0.086], [0.013, 0.04], [0.016, 0.0], [0.022, -0.02], [0.018, -0.032], [0, -0.035]], 10); bend(h, 12, 0.05); g.add(mesh(h, wood('#3b2416')));
      single(g, w, 0.24, f => 0.012 + 0.006 * Math.sin(PI * f), f => -(0.012 + 0.02 * Math.sin(PI * Math.min(1, f * 1.15))) * Math.min(1, (1 - f) / 0.25 + 0.2), [0.255, 0.008], { at: 0.095, mat: pamor('#e0e4e8') });
    },
    sewar: (g, w) => { // Kedah sewar: slim, slightly curved, single-edged
      g.add(mesh(lathe([[0, 0.098], [0.013, 0.096], [0.014, 0.088], [0, 0.086]]), brass('#e0c060')));
      const h = lathe([[0, 0.088], [0.012, 0.088], [0.013, 0.04], [0.015, 0.0], [0.019, -0.02], [0.016, -0.03], [0, -0.033]], 10); bend(h, 9, 0.05); g.add(mesh(h, wood('#d8c8a0')));
      single(g, w, 0.28, f => 0.009 - 0.02 * f * f, f => -(0.014 + 0.006 * (1 - f)) - 0.02 * f * f, [0.295, -0.022], { at: 0.097 });
    },
    tekpi: (g, w) => { // Kelantan tekpi: a round central prong and two hooked side prongs
      woodHilt(g, 0.13, '#3e2723', { wrap: true, flare: 1.2 });
      g.add(mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.32, 8).rotateX(PI / 2), steel(w.blade, w.glow), 0, 0, 0.26));
      g.add(mesh(new THREE.ConeGeometry(0.004, 0.02, 8).rotateX(PI / 2), steel(w.blade), 0, 0, 0.43));
      for (const s of [-1, 1]) g.add(mesh(tube([[0, 0, 0.09], [s * 0.05, 0, 0.095], [s * 0.06, 0, 0.13], [s * 0.045, 0, 0.18]], 0.0055, 16), steel(w.blade)));
    },
    kerambit: (g, w) => { // claw blade with a finger ring
      g.add(mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 16), brass(), 0.012, 0, -0.058, PI / 2, 0, 0));
      const h = lathe([[0, 0.09], [0.012, 0.088], [0.013, 0.02], [0.014, -0.025], [0, -0.032]], 8); bend(h, 4, 0.05); g.add(mesh(h, wood('#4e342e')));
      const c = f => -0.12 * f * f;
      single(g, w, 0.18, f => c(f) + 0.012 * (1 - f) + 0.002, f => c(f) - 0.016 * (1 - f) - 0.002, [0.19, c(1) - 0.012], { at: 0.09, mat: steel(w.blade) });
    },
  };
  // ---- spears
  function spear(g, w, opts = {}) {
    const glow = w.glow;
    g.add(mesh(lathe([[0, -0.3], [0.017, -0.298], [0.016, 0.4], [0.015, 0.84], [0, 0.842]], 8), wood(opts.shaft || '#7a5230')));
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.TorusGeometry(0.017, 0.003, 4, 10), brass(), 0, 0, -0.06 + i * 0.03));
    g.add(mesh(lathe([[0, 0.83], [0.019, 0.83], [0.022, 0.86], [0.012, 0.9], [0, 0.905]], 10), brass(opts.socket)));
    // tassel (jambul)
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.add(mesh(new THREE.CylinderGeometry(0.002, 0.005, 0.08, 3), cloth(w.tassel || '#c62828'), Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0.8, PI / 2 + 0.25 * Math.sin(a), 0, -0.25 * Math.cos(a))); }
    if (opts.crystal) {
      const m = mesh(new THREE.OctahedronGeometry(0.05, 0), std('cr' + w.blade, { color: w.blade, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.85, emissive: w.glow, emissiveIntensity: 0.6 }), 0, 0, 1.02); m.scale.set(0.9, 0.5, 2.6); g.add(m); g.add(glowOf(m, w.glow)); return;
    }
    const L = opts.len || 0.2, wd = f => 0.05 * Math.sin(PI * Math.min(1, 0.15 + f * 1.2)) * (1 - f * 0.4);
    const m = mesh(extrude(bladePts(L, f => wd(f), f => -wd(f), [L + 0.03, 0], 24), 0.016, 0.0065), opts.pamor ? pamor(w.blade, glow) : steel(w.blade, glow), 0, 0, 0.9);
    g.add(m); if (glow) g.add(glowOf(m, glow));
    if (opts.flag) { // royal pennant (benderang)
      const fg = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.26, 0.05), new THREE.Vector2(0, 0.15)])); fg.rotateX(PI / 2);
      g.add(mesh(fg, cloth(opts.flag), 0.016, 0, 0.62));
      const f2 = mesh(fg, cloth('#c62828'), 0.016, 0, 0.5); f2.scale.setScalar(0.65); g.add(f2);
    }
  }
  BUILD.spear = (g, w) => spear(g, w);
  BUILD.lembing = (g, w) => spear(g, w, { len: 0.18 });
  BUILD.tombak = (g, w) => spear(g, w, { len: 0.24, pamor: true });
  BUILD.tombakKristal = (g, w) => spear(g, w, { crystal: true, shaft: '#cfd8dc' });
  BUILD.benderang = (g, w) => spear(g, w, { len: 0.26, pamor: true, flag: '#ffd600', shaft: '#3e2723', socket: '#ffd54f' });
  // ---- club
  BUILD.club = (g, w) => {
    g.add(mesh(lathe([[0, -0.08], [0.02, -0.078], [0.022, 0.1], [0.018, 0.44], [0, 0.45]], 8), wood('#5d4037')));
    g.add(mesh(lathe([[0.024, 0.06], [0.026, -0.07], [0.03, -0.08], [0, -0.09]], 8), wrap('#2b1b10')));
    g.add(mesh(lathe([[0, 0.42], [0.05, 0.45], [0.07, 0.52], [0.065, 0.6], [0.035, 0.65], [0, 0.66]], 14), steel(w.blade)));
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.add(mesh(extrude([[0, 0.02], [0.2, 0.02], [0.16, 0.078], [0.05, 0.078]], 0.01, 0.002), steel('#b0bec5'), 0, 0, 0.44, 0, 0, a)); }
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * PI * 2; g.add(mesh(new THREE.ConeGeometry(0.012, 0.05, 5), steel('#eceff1'), Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.53, 0, 0, a - PI / 2)); }
    g.add(mesh(new THREE.ConeGeometry(0.014, 0.06, 6).rotateX(PI / 2), steel('#eceff1'), 0, 0, 0.69));
  };
  // ---- bows (old frame: limbs along Y, grip at x 0.42)
  BUILD.bow = (g, w) => {
    const L = [[0.13, 0.43, 0], [0.07, 0.4, 0], [0.16, 0.32, 0], [0.33, 0.17, 0], [0.42, 0.05, 0], [0.43, 0, 0]];
    const pts = [...L, ...L.slice(0, -1).reverse().map(p => [p[0], -p[1], 0])];
    g.add(mesh(tube(pts, 0.016, 40), wood(w.wood)));
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), wrap('#3e2723'), 0.43, 0, 0));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.014, 6, 5), brass(), 0.13, s * 0.43, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.8, 4), std('str', { color: '#f5f0e1', roughness: 0.8 }), 0.075, 0, 0));
  };
  BUILD.sumpit = (g, w) => { // Orang Asli blowpipe with a spear tip lashed to the end
    g.add(mesh(lathe([[0, -0.35], [0.019, -0.35], [0.02, -0.3], [0.017, 0.4], [0.015, 0.95], [0, 0.95]], 10), wood(w.wood || '#8d6e3a')));
    g.add(mesh(lathe([[0.023, -0.36], [0.026, -0.3], [0.023, -0.26]], 10), wood('#3e2723')));
    for (let i = 0; i < 6; i++) g.add(mesh(new THREE.TorusGeometry(0.018, 0.0028, 4, 10), cloth('#c8a26a'), 0, 0, -0.1 + i * 0.22));
    g.add(mesh(extrude(bladePts(0.12, f => 0.02 * (1 - f), f => -0.02 * (1 - f), [0.13, 0]), 0.008, 0.003), steel('#b0bec5'), 0.022, 0, 0.84));
  };

  function build(wid) {
    const w = WEAPONS[wid], g = new THREE.Group();
    if (!w || w.type === 'fist') return g;
    if (!built[wid]) {
      const src = new THREE.Group();
      const f = BUILD[w.model] || BUILD[wid] || BUILD[{ keris: 'keris', blade: 'pedang', curved: 'kerambit', spear: 'spear', club: 'club', bow: 'bow' }[w.type]];
      f(src, w);
      if (w.type === 'bow' && w.model !== 'sumpit') { const inner = new THREE.Group(); inner.add(src); src.position.x = -0.43; inner.rotation.y = PI / 2; const o = new THREE.Group(); o.add(inner); built[wid] = o; }
      else built[wid] = src;
    }
    g.add(built[wid].clone());
    return g;
  }
  // inventory icons rendered from the real 3D model (falls back to the 2D drawing when WebGL is missing)
  let iconScene = null, iconRT = null;
  function icon(wid, px) {
    if (!R || !env) return null;
    try {
      const S = px * 2;
      if (!iconScene) { iconScene = new THREE.Scene(); iconScene.add(new THREE.HemisphereLight('#ffffff', '#6a6a5a', 1.7)); const d = new THREE.DirectionalLight('#fff6e0', 2.2); d.position.set(-2, 3, 5); iconScene.add(d); }
      if (!iconRT || iconRT.width !== S) { if (iconRT) iconRT.dispose(); iconRT = new THREE.WebGLRenderTarget(S, S); }
      const w = WEAPONS[wid], obj = build(wid), piv = new THREE.Group(); piv.add(obj);
      if (w.type === 'bow' && w.model !== 'sumpit') { obj.rotation.set(0, -Math.PI / 2, 0); piv.rotation.z = -0.78; }
      else { obj.rotation.x = -Math.PI / 2; piv.rotation.z = -0.78; piv.rotation.y = 0.1; }
      iconScene.add(piv); piv.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(piv), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), h = Math.max(sz.x, sz.y) * 0.54;
      const cam = new THREE.OrthographicCamera(c.x - h, c.x + h, c.y + h, c.y - h, -10, 10); cam.position.set(0, 0, 5);
      const prevT = R.getRenderTarget(), prevC = R.getClearColor(new THREE.Color()), prevA = R.getClearAlpha();
      R.setRenderTarget(iconRT); R.setClearColor(0x000000, 0); R.clear(); R.render(iconScene, cam);
      const buf = new Uint8Array(S * S * 4); R.readRenderTargetPixels(iconRT, 0, 0, S, S, buf);
      R.setRenderTarget(prevT); R.setClearColor(prevC, prevA); iconScene.remove(piv);
      const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), im = g.createImageData(S, S);
      const lut = new Uint8Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; lut[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const s0 = ((S - 1 - y) * S + x) * 4, d0 = (y * S + x) * 4, a = buf[s0 + 3]; im.data[d0] = lut[buf[s0]]; im.data[d0 + 1] = lut[buf[s0 + 1]]; im.data[d0 + 2] = lut[buf[s0 + 2]]; im.data[d0 + 3] = a; }
      g.putImageData(im, 0, 0);
      g.globalCompositeOperation = 'destination-over'; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = S * 0.04; g.drawImage(cv, 0, 0); // soft outline so thin blades read on any background
      return cv.toDataURL();
    } catch (e) { return null; }
  }
  return { init, build, icon, get ready() { return !!env; } };
})();
