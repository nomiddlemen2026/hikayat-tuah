'use strict';
// ---------------------------------------------------------------- tiles & map
const T = { GRASS: 0, PATH: 1, SAND: 2, WATER: 3, TREE: 4, ROCK: 5, DIRT: 6, SWAMP: 7, FLOOR: 8, WALL: 9, DEEP: 10, BRIDGE: 11, FLOWER: 12, DARK: 13, PALM: 14, GATE: 15, PLANK: 16, BLD: 17, MANGROVE: 18, PILLAR: 19, JTREE: 20 };
const SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.WALL, T.DEEP, T.PALM, T.GATE, T.BLD, T.MANGROVE, T.PILLAR, T.JTREE]);
const map = new Uint8Array(MW * MH);
const getT = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? T.TREE : map[y * MW + x];
const setT = (x, y, t) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y * MW + x] = t; };
const solidAt = (px, py) => SOLID.has(getT(Math.floor(px / TS), Math.floor(py / TS)));

const REGIONS = {
  town: { x0: 34, y0: 40, x1: 60, y1: 62, name: 'Kota Melaka' },
  jungle: { x0: 64, y0: 22, x1: 95, y1: 62, name: 'Eastern Jungle' },
  coast: { x0: 0, y0: 50, x1: 32, y1: 66, name: 'Pirate Cove' },
  mountain: { x0: 26, y0: 0, x1: 66, y1: 25, name: 'Mount Ledang Pass' },
  swamp: { x0: 0, y0: 8, x1: 30, y1: 48, name: 'Misty Swamp' },
  temple: { x0: 68, y0: 0, x1: 95, y1: 21, name: 'Forgotten Temple' },
};
function regionAt(tx, ty) {
  for (const k in REGIONS) { const r = REGIONS[k]; if (tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1) return k; }
  return 'meadow';
}
const coastY = x => Math.floor(MH - 6 + Math.sin(x * 0.27) * 1.2);
const riverX = y => Math.floor(62 + Math.sin(y * 0.21) * 1.6);

const SITES = {
  jebat: { x: 84, y: 40 }, lekir: { x: 13, y: 58 }, lekiu: { x: 47, y: 9 }, kasturi: { x: 12, y: 26 }, temple: { x: 81, y: 8 },
  home: { x: 47, y: 57 }, bendahara: { x: 52, y: 49 },
};
const buildings = [];

function genMap() {
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
  // river
  for (let y = 18; y < MH; y++) { const rx = riverX(y); setT(rx, y, T.WATER); setT(rx + 1, y, T.WATER); }
  // sea and beach
  for (let x = 0; x < MW; x++) {
    const cy = coastY(x);
    for (let y = cy - 3; y < MH; y++) {
      if (y >= cy + 1) setT(x, y, T.DEEP);
      else if (y === cy) setT(x, y, T.WATER);
      else if (getT(x, y) !== T.WATER) setT(x, y, (hash(x, y, 9) < 0.06 && x % 3 === 0) ? T.PALM : T.SAND);
    }
  }
  // borders
  for (let x = 0; x < MW; x++) { setT(x, 0, x > 26 && x < 66 ? T.ROCK : T.TREE); }
  for (let y = 0; y < MH; y++) { if (getT(0, y) !== T.DEEP) setT(0, y, T.TREE); if (getT(MW - 1, y) !== T.DEEP) setT(MW - 1, y, T.JTREE); }
  // clearings
  const clear = (cx, cy, rad, t) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (dist(x, y, cx, cy) <= rad + 0.3 && x > 0 && x < MW - 1 && y > 0) { const c = getT(x, y); if (c !== T.DEEP) setT(x, y, t); } };
  clear(SITES.jebat.x, SITES.jebat.y, 6, T.DARK);
  clear(SITES.lekir.x, SITES.lekir.y, 6, T.SAND);
  clear(SITES.lekiu.x, SITES.lekiu.y, 6, T.DIRT);
  clear(SITES.kasturi.x, SITES.kasturi.y, 6, T.SWAMP);
  for (let y = 36; y <= 63; y++) for (let x = 35; x <= 60; x++) if (getT(x, y) !== T.WATER && getT(x, y) !== T.DEEP && getT(x, y) !== T.SAND) setT(x, y, hash(x, y, 4) < 0.07 ? T.FLOWER : T.GRASS);
  // temple
  for (let y = 2; y <= 16; y++) for (let x = 72; x <= 90; x++) {
    const edge = x === 72 || x === 90 || y === 2 || y === 16;
    setT(x, y, edge ? T.WALL : T.FLOOR);
  }
  for (const [px, py] of [[75, 6], [75, 12], [87, 6], [87, 12], [78, 4], [84, 4]]) setT(px, py, T.PILLAR);
  setT(80, 16, T.GATE); setT(81, 16, T.GATE); setT(82, 16, T.GATE);
  clear(81, 19, 3, T.DIRT);
  // paths
  const carve = (x0, y0, x1, y1) => {
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    const put = (x, y) => { for (let o = 0; o < 2; o++) { const tx = dy === 0 || true ? x : x, ty = y; [[tx, ty + o], [tx + o, ty]].forEach(([a, b]) => { const c = getT(a, b); if (c === T.GATE || c === T.WALL || c === T.FLOOR || c === T.BLD) return; setT(a, b, (c === T.WATER || c === T.DEEP || c === T.BRIDGE) ? T.BRIDGE : T.PATH); }); } };
    let x = x0, y = y0;
    while (x !== x1) { put(x, y); x += dx; }
    while (y !== y1) { put(x, y); y += dy; }
    put(x, y);
  };
  carve(47, 58, 47, 9);      // main north road to Ledang
  carve(14, 52, 84, 52);     // east-west road
  carve(14, 52, 14, 26);     // to swamp
  carve(14, 52, 13, 58);     // to cove
  carve(84, 52, 84, 40);     // to jungle camp
  carve(47, 20, 81, 20);     // to temple
  carve(81, 20, 81, 17);
  carve(47, 57, 44, 57);
  // docks
  for (let y = coastY(10) - 1; y < coastY(10) + 4; y++) { setT(9, y, T.PLANK); setT(10, y, T.PLANK); }
  // buildings (x,y,w,h in tiles)
  const addB = (x, y, w, h, kind, label) => { buildings.push({ x, y, w, h, kind, label }); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setT(i, j, T.BLD); };
  addB(51, 41, 8, 5, 'palace', 'Istana');
  addB(39, 43, 4, 3, 'house'); addB(39, 47, 4, 3, 'house'); addB(35, 54, 4, 3, 'house');
  addB(42, 54, 4, 3, 'home', 'Rumah Tuah');
  addB(51, 55, 4, 3, 'house'); addB(56, 48, 4, 3, 'house'); addB(57, 55, 4, 3, 'house');
  addB(80, 37, 3, 2, 'hut'); addB(86, 37, 3, 2, 'hut');
  addB(16, 55, 3, 2, 'hut');
}

