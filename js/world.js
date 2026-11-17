'use strict';
// ---------------------------------------------------------------- tiles & maps
// Every map is 96 x 72 tiles. MAPS holds each map's regions, spawns, sites and generator;
// genMap(id) rebuilds the tile grid and swaps the active REGIONS / SPAWNS / SITES.
const T = {
  GRASS: 0, PATH: 1, SAND: 2, WATER: 3, TREE: 4, ROCK: 5, DIRT: 6, SWAMP: 7, FLOOR: 8, WALL: 9, DEEP: 10, BRIDGE: 11, FLOWER: 12, DARK: 13, PALM: 14, GATE: 15, PLANK: 16, BLD: 17, MANGROVE: 18, PILLAR: 19, JTREE: 20,
  LAVA: 21, CRYSTAL: 22, MARBLE: 23, ASH: 24, PADDY: 25, MOSS: 26,
};
const SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.WALL, T.DEEP, T.PALM, T.GATE, T.BLD, T.MANGROVE, T.PILLAR, T.JTREE, T.LAVA, T.CRYSTAL]);
const map = new Uint8Array(MW * MH);
const getT = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? T.TREE : map[y * MW + x];
const setT = (x, y, t) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y * MW + x] = t; };
const solidAt = (px, py) => SOLID.has(getT(Math.floor(px / TS), Math.floor(py / TS)));

// region fields: bounds, name, fog colour (+ near/far), relief [amplitude, scale, offset], dark (music)
const MAPS = {
  melaka: {
    name: 'Melaka', townName: 'Kota Melaka', chapter: 1,
    base: { name: 'Melaka Countryside', fog: '#bfd8e8', relief: [0.35, 7] },
    regions: {
      town: { x0: 34, y0: 40, x1: 60, y1: 62, name: 'Kota Melaka', fog: '#bfd8e8', relief: [0, 1] },
      jungle: { x0: 64, y0: 22, x1: 95, y1: 62, name: 'Eastern Jungle', fog: '#a9c9a4', relief: [0.45, 5] },
      coast: { x0: 0, y0: 50, x1: 32, y1: 66, name: 'Pirate Cove', fog: '#bfd8e8', relief: [0, 1] },
      mountain: { x0: 26, y0: 0, x1: 66, y1: 25, name: 'Mount Ledang Pass', fog: '#c9d6e3', relief: [1.6, 6], rocky: true },
      swamp: { x0: 0, y0: 8, x1: 30, y1: 48, name: 'Misty Swamp', fog: '#8fa892', near: 11, far: 26, relief: [0.15, 5, -0.05], dark: true },
      temple: { x0: 68, y0: 0, x1: 95, y1: 21, name: 'Forgotten Temple', fog: '#4a3d5a', near: 9, far: 24, relief: [0.45, 5], dark: true },
    },
    spawns: {
      meadow: { list: ['boar'], n: 6 },
      jungle: { list: ['boar', 'bandit', 'bandit'], n: 12 },
      coast: { list: ['pirate', 'knifer'], n: 10 },
      mountain: { list: ['tiger', 'boar'], n: 10 },
      swamp: { list: ['croc', 'wisp'], n: 11 },
      temple: { list: ['golem', 'wisp'], n: 10 },
    },
    sites: { jebat: { x: 84, y: 40 }, lekir: { x: 13, y: 58 }, lekiu: { x: 47, y: 9 }, kasturi: { x: 12, y: 26 }, temple: { x: 81, y: 8 }, home: { x: 47, y: 57 }, bendahara: { x: 52, y: 49 } },
    safe: { x: 47, y: 50, r: 14 }, respawn: { x: 47.5, y: 59.5 }, arrive: { x: 49.5, y: 62.5 }, boat: { x: 50.5, y: 63.5 },
    props: {}, gen: genMelaka,
  },
  bendahara: {
    name: 'Kampung Bendahara', townName: 'Kampung Bendahara', chapter: 2,
    base: { name: 'Kampung Outskirts', fog: '#c8dcc0', relief: [0.35, 7] },
    regions: {
      kampung: { x0: 36, y0: 42, x1: 60, y1: 62, name: 'Kampung Bendahara', fog: '#d6e4c8', relief: [0, 1] },
      sawah: { x0: 0, y0: 42, x1: 32, y1: 64, name: 'Sawah Padi', fog: '#d8e6c0', relief: [0.05, 4] },
      bukit: { x0: 62, y0: 0, x1: 95, y1: 32, name: 'Bukit Batu', fog: '#b9b4c4', relief: [1.5, 6], rocky: true },
      hutan: { x0: 0, y0: 0, x1: 58, y1: 36, name: 'Hutan Larangan', fog: '#5d5470', near: 9, far: 24, relief: [0.5, 5], dark: true },
      dusun: { x0: 64, y0: 36, x1: 95, y1: 64, name: 'Dusun Durian', fog: '#c8dcc0', relief: [0.4, 6] },
    },
    spawns: {
      meadow: { list: ['boar2'], n: 5 },
      sawah: { list: ['boar2', 'toyol'], n: 8 },
      hutan: { list: ['toyol', 'pelesit', 'toyol', 'pelesit'], n: 16 },
      bukit: { list: ['beruang', 'toyol'], n: 10 },
      dusun: { list: ['boar2', 'beruang'], n: 8 },
    },
    sites: { harimau: { x: 80, y: 14 }, sihir: { x: 15, y: 11 }, toyol: { x: 30, y: 31 }, pelesit: { x: 22, y: 21 } },
    safe: { x: 48, y: 53, r: 13 }, respawn: { x: 48.5, y: 56.5 }, arrive: { x: 46.5, y: 63.5 }, boat: { x: 49.5, y: 64.5 },
    props: { jtree: '#4b3a6e', tree: '#5aa83a' }, gen: genBendahara,
  },
  naga: {
    name: 'Pulau Naga', townName: 'Pelabuhan Naga', chapter: 3,
    base: { name: 'Padang Abu', fog: '#cdb8a8', relief: [0.4, 6] },
    regions: {
      pelabuhan: { x0: 10, y0: 44, x1: 36, y1: 62, name: 'Pelabuhan Naga', fog: '#e0d0bc', relief: [0, 1] },
      kawah: { x0: 36, y0: 2, x1: 60, y1: 22, name: 'Kawah Naga', fog: '#7a4a3a', near: 10, far: 25, hf: (x, y) => Math.min(volcanoH(x, y), 1.6) + noise(x / 4, y / 4, 48) * 0.2, dark: true },
      gunung: { x0: 18, y0: 4, x1: 72, y1: 42, name: 'Gunung Berapi', fog: '#9a6a58', near: 12, far: 28, hf: (x, y) => volcanoH(x, y) + noise(x / 5, y / 5, 49) * 0.4, rocky: true, dark: true },
      hutan: { x0: 62, y0: 24, x1: 95, y1: 62, name: 'Hutan Biawak', fog: '#a9c9a4', relief: [0.45, 5] },
      pantai: { x0: 0, y0: 54, x1: 95, y1: 71, name: 'Pantai Karang', fog: '#d8e4ec', relief: [0, 1] },
    },
    spawns: {
      meadow: { list: ['biawak', 'lanunNaga'], n: 6 },
      pantai: { list: ['lanunNaga', 'lanunPanah', 'lanunNaga'], n: 14 },
      hutan: { list: ['biawak', 'lanunNaga'], n: 12 },
      gunung: { list: ['rohApi', 'biawak'], n: 12 },
      kawah: { list: ['rohApi'], n: 6 },
    },
    sites: { biawak: { x: 80, y: 42 }, ular: { x: 26, y: 22 }, naga: { x: 48, y: 11 }, lanun: { x: 62, y: 60 } },
    safe: { x: 23, y: 53, r: 12 }, respawn: { x: 23.5, y: 55.5 }, arrive: { x: 20.5, y: 61.5 }, boat: { x: 23.5, y: 62.5 },
    props: { tree: '#2f7a32', rock: '#4d4440', snow: false }, gen: genNaga,
  },
  bunian: {
    name: 'Kota Bunian', townName: 'Kota Bunian', chapter: 4,
    base: { name: 'Padang Bunian', fog: '#e8ddff', relief: [0.35, 7] },
    regions: {
      kota: { x0: 34, y0: 46, x1: 62, y1: 64, name: 'Kota Bunian', fog: '#efe6ff', relief: [0, 1] },
      istana: { x0: 32, y0: 1, x1: 64, y1: 19, name: 'Istana Bayang', fog: '#2a2040', near: 9, far: 24, relief: [0, 1], dark: true },
      timur: { x0: 66, y0: 6, x1: 95, y1: 62, name: 'Hutan Kristal Timur', fog: '#b9e6ff', relief: [0.5, 5] },
      barat: { x0: 0, y0: 6, x1: 30, y1: 62, name: 'Hutan Kristal Barat', fog: '#b9e6ff', relief: [0.5, 5] },
      taman: { x0: 30, y0: 20, x1: 66, y1: 44, name: 'Taman Bayang', fog: '#9d8fc0', near: 12, far: 28, relief: [0.3, 6], dark: true },
    },
    spawns: {
      meadow: { list: ['rohKristal'], n: 5 },
      timur: { list: ['golemKecil', 'rohKristal'], n: 12 },
      barat: { list: ['pengawal', 'rohKristal'], n: 12 },
      taman: { list: ['bayang', 'bayang', 'pengawal'], n: 14 },
    },
    sites: { golem: { x: 80, y: 30 }, panglima: { x: 15, y: 30 }, raja: { x: 48, y: 8 }, bayang: { x: 48, y: 32 } },
    safe: { x: 48, y: 55, r: 12 }, respawn: { x: 48.5, y: 58.5 }, arrive: { x: 46.5, y: 64.5 }, boat: { x: 49.5, y: 65.5 },
    props: { tree: '#8fc9b8', wall: '#d9d2e9', pillar: '#efe8ff' }, gen: genBunian,
  },
};
const MAP_ORDER = ['melaka', 'bendahara', 'naga', 'bunian'];

let MAP = 'melaka', MAPDEF = MAPS.melaka;
let REGIONS = MAPDEF.regions, SPAWNS = MAPDEF.spawns, SITES = MAPDEF.sites;
const buildings = [];

function regionAt(tx, ty) {
  for (const k in REGIONS) { const r = REGIONS[k]; if (tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1) return k; }
  return 'meadow';
}
const regionDef = k => REGIONS[k] || MAPDEF.base;
const regionName = k => regionDef(k).name;
const coastY = x => Math.floor(MH - 6 + Math.sin(x * 0.27) * 1.2);
const riverX = y => Math.floor(62 + Math.sin(y * 0.21) * 1.6);

function genMap(id) {
  MAP = id || 'melaka'; MAPDEF = MAPS[MAP];
  REGIONS = MAPDEF.regions; SPAWNS = MAPDEF.spawns; SITES = MAPDEF.sites;
  buildings.length = 0; map.fill(0);
  MAPDEF.gen();
  // a jetty and the boatman's spot on every map
  const b = MAPDEF.boat, a = MAPDEF.arrive;
  for (const p of [b, a]) { const tx = Math.floor(p.x), ty = Math.floor(p.y); if (SOLID.has(getT(tx, ty))) setT(tx, ty, T.SAND); }
}

// ---- shared generator tools
function clearDisc(cx, cy, rad, t) { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (dist(x, y, cx, cy) <= rad + 0.3 && x > 0 && x < MW - 1 && y > 0 && y < MH - 1) { const c = getT(x, y); if (c !== T.DEEP) setT(x, y, t); } }
function carve(x0, y0, x1, y1) {
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
  const put = (x, y) => { for (let o = 0; o < 2; o++) [[x, y + o], [x + o, y]].forEach(([a, b]) => { const c = getT(a, b); if (c === T.GATE || c === T.WALL || c === T.FLOOR || c === T.BLD || c === T.MARBLE || c === T.PLANK) return; setT(a, b, (c === T.WATER || c === T.DEEP || c === T.BRIDGE || c === T.LAVA) ? T.BRIDGE : T.PATH); }); };
  let x = x0, y = y0;
  while (x !== x1) { put(x, y); x += dx; }
  while (y !== y1) { put(x, y); y += dy; }
  put(x, y);
}
function addB(x, y, w, h, kind, label, style) { buildings.push({ x, y, w, h, kind, label, style }); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setT(i, j, T.BLD); }
function seaSouth() {
  for (let x = 0; x < MW; x++) {
    const cy = coastY(x);
    for (let y = cy - 3; y < MH; y++) {
      if (y >= cy + 1) setT(x, y, T.DEEP);
      else if (y === cy) setT(x, y, T.WATER);
      else if (getT(x, y) !== T.WATER) setT(x, y, (hash(x, y, 9) < 0.06 && x % 3 === 0) ? T.PALM : T.SAND);
    }
  }
}
function jetty(x, y0) { for (let y = y0; y < coastY(x) + 4 && y < MH; y++) { setT(x, y, T.PLANK); setT(x + 1, y, T.PLANK); } }
function borders(tTop, tSide) {
  for (let x = 0; x < MW; x++) if (getT(x, 0) !== T.DEEP) setT(x, 0, tTop);
  for (let y = 0; y < MH; y++) { if (getT(0, y) !== T.DEEP) setT(0, y, tSide); if (getT(MW - 1, y) !== T.DEEP) setT(MW - 1, y, tSide); }
}
function plaza(x0, y0, x1, y1, fn) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = getT(x, y); if (c !== T.WATER && c !== T.DEEP && c !== T.SAND && c !== T.PLANK) setT(x, y, fn(x, y)); } }

// ---------------------------------------------------------------- Chapter 1: Melaka
function genMelaka() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = regionAt(x, y), n = noise(x / 5, y / 5, 7), h = hash(x, y, 3);
    let t = T.GRASS;
    if (r === 'jungle') t = n > 0.5 || h < 0.1 ? T.JTREE : T.DARK;
    else if (r === 'mountain') t = n > 0.58 || h < 0.07 ? T.ROCK : T.DIRT;
    else if (r === 'swamp') t = n > 0.64 ? T.WATER : (h < 0.07 ? T.MANGROVE : T.SWAMP);
    else if (r === 'coast') t = h < 0.05 ? T.PALM : T.SAND;
    else if (r === 'temple') t = n > 0.55 || h < 0.08 ? T.JTREE : T.DARK;
    else if (r === 'town') t = h < 0.08 ? T.FLOWER : T.GRASS;
    else t = (n > 0.68 || h < 0.03) ? T.TREE : (h > 0.95 ? T.FLOWER : T.GRASS);
    setT(x, y, t);
  }
  for (let y = 18; y < MH; y++) { const rx = riverX(y); setT(rx, y, T.WATER); setT(rx + 1, y, T.WATER); }
  seaSouth();
  for (let x = 0; x < MW; x++) { setT(x, 0, x > 26 && x < 66 ? T.ROCK : T.TREE); }
  for (let y = 0; y < MH; y++) { if (getT(0, y) !== T.DEEP) setT(0, y, T.TREE); if (getT(MW - 1, y) !== T.DEEP) setT(MW - 1, y, T.JTREE); }
  clearDisc(SITES.jebat.x, SITES.jebat.y, 6, T.DARK);
  clearDisc(SITES.lekir.x, SITES.lekir.y, 6, T.SAND);
  clearDisc(SITES.lekiu.x, SITES.lekiu.y, 6, T.DIRT);
  clearDisc(SITES.kasturi.x, SITES.kasturi.y, 6, T.SWAMP);
  for (let y = 36; y <= 63; y++) for (let x = 35; x <= 60; x++) if (getT(x, y) !== T.WATER && getT(x, y) !== T.DEEP && getT(x, y) !== T.SAND) setT(x, y, hash(x, y, 4) < 0.07 ? T.FLOWER : T.GRASS);
  // temple
  for (let y = 2; y <= 16; y++) for (let x = 72; x <= 90; x++) { const edge = x === 72 || x === 90 || y === 2 || y === 16; setT(x, y, edge ? T.WALL : T.FLOOR); }
  for (const [px, py] of [[75, 6], [75, 12], [87, 6], [87, 12], [78, 4], [84, 4]]) setT(px, py, T.PILLAR);
  setT(80, 16, T.GATE); setT(81, 16, T.GATE); setT(82, 16, T.GATE);
  clearDisc(81, 19, 3, T.DIRT);
  carve(47, 58, 47, 9); carve(14, 52, 84, 52); carve(14, 52, 14, 26); carve(14, 52, 13, 58); carve(84, 52, 84, 40); carve(47, 20, 81, 20); carve(81, 20, 81, 17); carve(47, 57, 44, 57);
  carve(47, 58, 47, 62);
  for (let y = coastY(10) - 1; y < coastY(10) + 4; y++) { setT(9, y, T.PLANK); setT(10, y, T.PLANK); }
  jetty(47, 63);
  addB(51, 41, 8, 5, 'palace', 'Istana');
  addB(39, 43, 4, 3, 'house'); addB(39, 47, 4, 3, 'house'); addB(35, 54, 4, 3, 'house');
  addB(42, 54, 4, 3, 'home', 'Rumah Tuah');
  addB(51, 55, 4, 3, 'house'); addB(56, 48, 4, 3, 'house'); addB(57, 55, 4, 3, 'house');
  addB(80, 37, 3, 2, 'hut'); addB(86, 37, 3, 2, 'hut');
  addB(16, 55, 3, 2, 'hut');
}

// ---------------------------------------------------------------- Chapter 2: Kampung Bendahara and Hutan Larangan
function genBendahara() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = regionAt(x, y), n = noise(x / 5, y / 5, 31), h = hash(x, y, 33);
    let t = T.GRASS;
    if (r === 'hutan') t = n > 0.48 || h < 0.12 ? T.JTREE : (h > 0.93 ? T.SWAMP : T.DARK);
    else if (r === 'bukit') t = n > 0.56 || h < 0.07 ? T.ROCK : T.DIRT;
    else if (r === 'sawah') t = (y % 5 === 0 && x % 9 !== 0) ? T.GRASS : T.PADDY;
    else if (r === 'dusun') t = ((x % 4 === 0 && y % 4 === 1) && h < 0.8) || n > 0.74 ? T.TREE : (h > 0.94 ? T.FLOWER : T.GRASS);
    else if (r === 'kampung') t = h < 0.06 ? T.FLOWER : T.GRASS;
    else t = (n > 0.7 || h < 0.03) ? T.TREE : (h > 0.95 ? T.FLOWER : T.GRASS);
    setT(x, y, t);
  }
  // stream from the hills down to the sea
  for (let y = 0; y < MH; y++) { const rx = Math.floor(61 + Math.sin(y * 0.18) * 1.8); setT(rx, y, T.WATER); setT(rx + 1, y, T.WATER); }
  seaSouth();
  borders(T.JTREE, T.JTREE);
  clearDisc(SITES.harimau.x, SITES.harimau.y, 6, T.DIRT);
  clearDisc(SITES.sihir.x, SITES.sihir.y, 6, T.DARK);
  clearDisc(SITES.toyol.x, SITES.toyol.y, 4, T.DARK);
  clearDisc(SITES.pelesit.x, SITES.pelesit.y, 4, T.SWAMP);
  // the sorcerer's shrine: a ring of standing stones
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; setT(Math.round(SITES.sihir.x + Math.cos(a) * 4), Math.round(SITES.sihir.y + Math.sin(a) * 4), T.PILLAR); }
  for (let y = SITES.sihir.y - 1; y <= SITES.sihir.y + 1; y++) for (let x = SITES.sihir.x - 1; x <= SITES.sihir.x + 1; x++) setT(x, y, T.FLOOR);
  plaza(37, 43, 59, 62, (x, y) => hash(x, y, 34) < 0.06 ? T.FLOWER : T.GRASS);
  carve(48, 62, 48, 36); carve(48, 36, 30, 36); carve(30, 36, 30, 22); carve(30, 22, 15, 22); carve(15, 22, 15, 16);
  carve(48, 50, 80, 50); carve(80, 50, 80, 20); carve(48, 52, 12, 52);
  jetty(48, 63);
  addB(51, 43, 8, 5, 'palace', 'Balai Penghulu', 'kampung');
  addB(38, 44, 4, 3, 'house'); addB(38, 50, 4, 3, 'house'); addB(38, 56, 4, 3, 'house'); addB(53, 54, 4, 3, 'house', 'Kedai'); addB(53, 59, 4, 2, 'hut'); addB(40, 59, 3, 2, 'hut');
  addB(20, 46, 3, 2, 'hut'); addB(8, 56, 3, 2, 'hut'); addB(84, 54, 3, 2, 'hut');
}

// ---------------------------------------------------------------- Chapter 3: Pulau Naga (volcano island)
function volcanoH(x, y) { const d = dist(x, y, 47, 13); return Math.max(0, 2.6 - d / 9); }
function genNaga() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = regionAt(x, y), n = noise(x / 5, y / 5, 41), h = hash(x, y, 43);
    let t = T.GRASS;
    if (r === 'kawah') t = n > 0.62 ? T.LAVA : (h < 0.06 ? T.ROCK : T.ASH);
    else if (r === 'gunung') t = noise(x / 4, y / 4, 44) > 0.7 ? T.LAVA : (n > 0.6 || h < 0.07 ? T.ROCK : T.ASH);
    else if (r === 'hutan') t = n > 0.5 || h < 0.1 ? T.JTREE : T.DARK;
    else if (r === 'pantai') t = h < 0.05 ? T.PALM : T.SAND;
    else if (r === 'pelabuhan') t = T.GRASS;
    else t = n > 0.66 ? T.ROCK : h < 0.05 ? T.TREE : (h > 0.6 ? T.ASH : T.GRASS);
    setT(x, y, t);
  }
  // the island outline
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const e = Math.hypot((x - 48) / 47, (y - 34) / 37) + (noise(x / 6, y / 6, 45) - 0.5) * 0.12;
    if (e > 1) setT(x, y, T.DEEP); else if (e > 0.96) setT(x, y, T.WATER); else if (e > 0.9 && getT(x, y) !== T.LAVA) setT(x, y, hash(x, y, 46) < 0.05 ? T.PALM : T.SAND);
  }
  // crater lava lake with a stone platform for the dragon
  clearDisc(SITES.naga.x, SITES.naga.y + 1, 7, T.LAVA); clearDisc(SITES.naga.x, SITES.naga.y + 1, 5, T.ASH); clearDisc(SITES.naga.x, SITES.naga.y + 1, 2, T.FLOOR);
  clearDisc(SITES.ular.x, SITES.ular.y, 6, T.ASH);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; setT(Math.round(SITES.ular.x + Math.cos(a) * 7), Math.round(SITES.ular.y + Math.sin(a) * 7), T.LAVA); }
  clearDisc(SITES.biawak.x, SITES.biawak.y, 6, T.DARK);
  clearDisc(SITES.lanun.x, SITES.lanun.y, 4, T.SAND);
  plaza(11, 45, 35, 60, (x, y) => hash(x, y, 47) < 0.05 ? T.FLOWER : T.GRASS);
  carve(23, 61, 23, 40); carve(23, 40, 26, 40); carve(26, 40, 26, 24); carve(23, 50, 48, 50); carve(48, 50, 48, 20); carve(48, 50, 80, 50); carve(80, 50, 80, 44); carve(48, 56, 62, 56); carve(62, 56, 62, 59);
  // bridge path into the crater over the lava ring
  for (let y = SITES.naga.y + 3; y <= SITES.naga.y + 9; y++) { setT(48, y, T.BRIDGE); setT(49, y, T.BRIDGE); }
  jetty(22, 61);
  addB(26, 45, 7, 5, 'palace', 'Rumah Syahbandar', 'port');
  addB(13, 48, 4, 3, 'house'); addB(13, 53, 4, 3, 'house', 'Kedai'); addB(29, 54, 4, 3, 'house');
  addB(17, 45, 3, 2, 'hut'); addB(31, 58, 3, 2, 'hut');
}

// ---------------------------------------------------------------- Chapter 4: Kota Bunian (hidden crystal realm)
function genBunian() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = regionAt(x, y), n = noise(x / 5, y / 5, 51), h = hash(x, y, 53);
    let t = T.GRASS;
    if (r === 'timur' || r === 'barat') t = n > 0.55 || h < 0.08 ? T.CRYSTAL : (h > 0.9 ? T.FLOWER : T.MOSS);
    else if (r === 'taman') t = n > 0.66 || h < 0.04 ? T.TREE : (h > 0.88 ? T.FLOWER : T.MOSS);
    else if (r === 'kota') t = T.MARBLE;
    else if (r === 'istana') t = T.FLOOR;
    else t = h < 0.04 ? T.CRYSTAL : (h > 0.93 ? T.FLOWER : T.GRASS);
    setT(x, y, t);
  }
  seaSouth();
  borders(T.CRYSTAL, T.CRYSTAL);
  // the shadow palace: walls, pillars and a single entrance
  for (let y = 2; y <= 18; y++) for (let x = 34; x <= 62; x++) { const edge = x === 34 || x === 62 || y === 2 || y === 18; setT(x, y, edge ? T.WALL : T.FLOOR); }
  for (const [px, py] of [[38, 6], [38, 13], [58, 6], [58, 13], [43, 4], [53, 4], [43, 15], [53, 15]]) setT(px, py, T.PILLAR);
  for (let x = 46; x <= 50; x++) setT(x, 18, T.FLOOR);
  clearDisc(SITES.golem.x, SITES.golem.y, 6, T.MOSS);
  clearDisc(SITES.panglima.x, SITES.panglima.y, 6, T.MARBLE);
  clearDisc(SITES.bayang.x, SITES.bayang.y, 4, T.MOSS);
  plaza(35, 47, 61, 63, (x, y) => (x + y) % 7 === 0 && hash(x, y, 54) < 0.3 ? T.FLOWER : T.MARBLE);
  for (const [px, py] of [[40, 52], [56, 52], [40, 60], [56, 60]]) setT(px, py, T.CRYSTAL);
  carve(48, 62, 48, 19); carve(48, 40, 80, 40); carve(80, 40, 80, 32); carve(48, 40, 15, 40); carve(15, 40, 15, 32);
  jetty(48, 64);
  addB(51, 46, 10, 4, 'palace', 'Balairung Bunian', 'bunian');
  addB(36, 54, 4, 3, 'house', null, 'bunian'); addB(57, 54, 4, 3, 'house', 'Kedai', 'bunian'); addB(36, 59, 4, 3, 'house', null, 'bunian'); addB(57, 59, 4, 2, 'hut', null, 'bunian');
}
