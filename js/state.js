'use strict';
// ---------------------------------------------------------------- state
let state = 'title', time = 0, shake = 0;
let player, enemies = [], projs = [], pprojs = [], parts = [], texts = [], chests = [], npcs = [], toasts = [], teles = [], slashes = [], bolts = [];
let save = null, trail = [], companions = [], dialog = null, cam = { x: 0, y: 0 }, bossBar = null, muted = false;
let lastHurt = 0, endingT = 0;

function newSave() {
  return migrateSave({ lvl: 1, xp: 0, hp: 100, weapon: 'fist', owned: ['fist'], potions: 2, found: {}, bossDead: {}, chests: {}, prologue: false, intro: false, taming: false, ended: false, x: (MAPS.melaka.sites.home.x + 0.5) * TS, y: (MAPS.melaka.sites.home.y + 2.5) * TS });
}
const SAVE_VERSION = 3;
// Upgrades older saves in place so existing progress is never lost.
function migrateSave(s) {
  if (!s) return s;
  if (!s.v || s.v < 2) {
    s.job = s.job || 'novice'; s.jlvl = s.jlvl || 1; s.jxp = s.jxp || 0;
    s.stats = s.stats || { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 };
    let pts = 0; for (let l = 2; l <= (s.lvl || 1); l++) pts += statPtsForLevel(l);
    s.statPts = s.statPts != null ? s.statPts : pts;
    s.skillPts = s.skillPts || 0;
    s.gold = s.gold || 0;
    s.hotkeys = s.hotkeys || ['silat', 'jamu', null, null, null, null, null, null];
    s.v = 2;
  }
  if (s.v < 3) { // chapters, maps, magic
    s.map = s.map || 'melaka';
    s.unlocked = s.unlocked || ['melaka'];
    s.chapter = s.chapter || (s.taming ? 2 : 1);
    if (s.chapter >= 2 && !s.unlocked.includes('bendahara')) s.unlocked.push('bendahara');
    s.ci = s.ci || 0; s.hunt = s.hunt || 0;
    s.skills = s.skills || ['silat'];
    s.chIntro = s.chIntro || {};
    s.v = 3;
  }
  return s;
}
function loadSave() { try { return migrateSave(JSON.parse(localStorage.getItem('hikayat_tuah_save') || 'null')); } catch (e) { return null; } }
function writeSave() { if (!player || state === 'title') return; save.x = player.x; save.y = player.y; save.hp = player.hp; save.sp = player.sp; save.map = MAP; try { localStorage.setItem('hikayat_tuah_save', JSON.stringify(save)); } catch (e) { } }
try { muted = localStorage.getItem('hikayat_tuah_mute') === '1'; } catch (e) { }

const xpNeed = l => 20 + l * l * 12;
const foundCount = () => ['jebat', 'lekir', 'lekiu', 'kasturi'].filter(k => save.found[k]).length;
function currentMission() {
  if (!save.prologue) return null;
  for (const m of MISSIONS.slice(0, 4)) if (!save.found[m.id]) return m;
  if (!save.taming) return MISSIONS[4];
  return 'done';
}
const curChapter = () => save.chapter >= 2 && save.chapter <= 4 ? CHAPTERS[save.chapter] : null;
const curMission = () => { const c = curChapter(); return c ? c.missions[save.ci] || null : null; };
function objectiveText() {
  if (save.chapter >= 5) return ['Hikayat Tuah: complete!', 'Sail anywhere with Pak Kemudi and keep training.'];
  const ch = curChapter();
  if (ch) {
    const m = curMission();
    if (MAP !== ch.map) return [ch.title, 'Talk to Pak Kemudi at the jetty and sail to ' + MAPS[ch.map].name + '.'];
    if (!m) return [ch.title, ''];
    return [m.title, m.hint + (m.type === 'hunt' ? ' (' + Math.min(save.hunt, m.n) + '/' + m.n + ')' : '')];
  }
  const m = currentMission();
  if (!save.prologue) return ['Prologue: Find a Weapon', 'Open the chest beside your house.'];
  if (m === 'done') return ['All missions complete!', 'Explore Melaka with the Keris Taming Sari.'];
  if (m.id === 'taming') return [m.title, foundCount() < 4 ? m.hint : save.bossDead.guardian ? 'Claim the keris from the altar.' : 'Defeat the guardian inside the temple.'];
  return [m.title, save.bossDead[CAPTOR[m.id]] ? 'Free ' + HEROES[m.id].name + '!' : m.hint];
}
function objectivePos() {
  if (!save.intro || save.chapter >= 5) return null;
  const ch = curChapter();
  if (ch) {
    if (MAP !== ch.map) return { x: MAPDEF.boat.x, y: MAPDEF.boat.y };
    const m = curMission(); if (!m) return null;
    const s = SITES[m.site]; return { x: s.x + 0.5, y: s.y + 0.5 };
  }
  if (MAP !== 'melaka') return { x: MAPDEF.boat.x, y: MAPDEF.boat.y };
  if (!save.prologue) return { x: 44.5, y: 58.5 };
  const m = currentMission();
  if (!m || m === 'done') return null;
  if (m.id === 'taming') { if (save.bossDead.guardian) return { x: 81.5, y: 4.5 }; return { x: 81.5, y: 9 }; }
  const s = SITES[m.id]; return { x: s.x + 0.5, y: s.y + 0.5 };
}

function startGame(fresh) {
  if (fresh) save = newSave(); else save = loadSave() || newSave();
  if (!MAPS[save.map] || !save.unlocked.includes(save.map)) save.map = 'melaka';
  if (MAP !== save.map) { genMap(save.map); gfx.rebuildWorld(); }
  miniCanvas = null;
  player = { x: save.x, y: save.y, r: 10, hp: save.hp > 0 ? save.hp : 100, face: -Math.PI / 2, walk: 0, moving: false, atkCd: 0, atkAnim: 0, skillCd: 0, spin: 0, inv: 0, hurt: 0, regenT: 0, cds: {}, shield: 0 };
  if (solidAt(player.x, player.y)) { player.x = MAPDEF.respawn.x * TS; player.y = MAPDEF.respawn.y * TS; }
  player.hp = Math.min(player.hp, maxHp());
  player.sp = Math.min(save.sp != null ? save.sp : maxSp(), maxSp());
  resetWorldState();
  setupWorld();
  gfx.onWorldReady();
  state = 'play';
  audio.init();
  ui.show(true); ui.refreshAll();
  log(isTouch ? 'Welcome to Hikayat Tuah. Tap the menu buttons to open windows.' : 'Welcome to Hikayat Tuah. Press Enter to chat, /help for commands.', 'sys');
  if (!save.intro) startIntro();
  else setTimeout(checkChapterIntro, 400);
}
function resetWorldState() {
  enemies = []; projs = []; pprojs = []; parts = []; texts = []; teles = []; slashes = []; bolts = []; trail = []; bossBar = null;
  for (let i = 0; i < 40; i++) trail.push({ x: player.x, y: player.y });
}
// sail to another map with Pak Kemudi
function travelTo(id) {
  if (!save.unlocked.includes(id) || id === MAP) return;
  writeSave();
  genMap(id); gfx.rebuildWorld(); miniCanvas = null;
  const a = MAPDEF.arrive; player.x = a.x * TS; player.y = a.y * TS; player.inv = 1.5;
  resetWorldState();
  setupWorld(); gfx.onWorldReady();
  save.map = id; writeSave();
  audio.fanfare && audio.pickup();
  toast('You sail to ' + MAPDEF.name);
  setTimeout(checkChapterIntro, 500);
}

const npc = (name, x, y, talk, extra = {}) => ({ kind: 'npc', name, pal: NPC_PALS[name], x: x * TS, y: y * TS, talk, ...extra });
function setupWorld() {
  const CH = {
    melaka: [[44.5, 58.5, 'keris', 'c_keris'], [75.5, 47.5, 'parang', 'c_parang'], [21.5, 60.5, 'lembing', 'c_lembing'], [38.5, 16.5, 'potion3', 'c_p1'], [25.5, 36.5, 'potion3', 'c_p2'], [30.5, 31.5, 'potion2', 'c_p3'], [89.5, 29.5, 'potion2', 'c_p4'], [60.5, 12.5, 'potion3', 'c_p5']],
    bendahara: [[20.5, 30.5, 'potion3', 'b_p1'], [72.5, 24.5, 'potion3', 'b_p2'], [88.5, 58.5, 'gold800', 'b_g1'], [8.5, 60.5, 'potion2', 'b_p3'], [33.5, 26.5, 'gold1200', 'b_g2']],
    naga: [[70.5, 36.5, 'potion3', 'n_p1'], [34.5, 30.5, 'potion3', 'n_p2'], [86.5, 36.5, 'gold1500', 'n_g1'], [55.5, 61.5, 'potion3', 'n_p3'], [60.5, 18.5, 'gold2500', 'n_g2']],
    bunian: [[84.5, 16.5, 'potion3', 'u_p1'], [10.5, 16.5, 'potion3', 'u_p2'], [40.5, 30.5, 'gold3000', 'u_g1'], [76.5, 56.5, 'potion3', 'u_p3'], [20.5, 54.5, 'gold4000', 'u_g2']],
  }[MAP];
  chests = CH.map(c => ({ x: c[0] * TS, y: c[1] * TS, item: c[2], id: c[3], open: !!save.chests[c[3]] }));
  for (const c of chests) { const tx = Math.floor(c.x / TS), ty = Math.floor(c.y / TS); for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) if (SOLID.has(getT(x, y)) && getT(x, y) !== T.DEEP && getT(x, y) !== T.WALL) setT(x, y, MAP === 'bunian' ? T.MOSS : MAP === 'naga' ? T.ASH : T.DIRT); }
  const B = MAPDEF.boat;
  npcs = [npc('Pak Kemudi', B.x, B.y, talkBoatman)];
  if (MAP === 'melaka') {
    npcs.push(
      npc('Bendahara', SITES.bendahara.x + 0.5, SITES.bendahara.y + 0.5, talkBendahara),
      npc('Pak Mat', 41.5, 51.5, () => say([['Pak Mat', save.chapter >= 2 ? 'They say the Laksamana sails to faraway lands now. Bring us back a story!' : 'Wild boars roam the meadows outside the town. Swing your weapon at them, Laksamana!']])),
      npc('Mak Som', 54.5, 53.5, () => { restoreParty(); save.potions = Math.max(save.potions, 2); say([['Mak Som', 'Rest a while and drink some jamu. Your health and spirit are restored, and I packed you a few potions.']]); }),
      npc('Tok Besi', 37.5, 51.5, () => { if (save.chapter >= 2) say([['Tok Besi', 'Laksamana! I have forged new blades. Take a look.']], () => ui.openShop('melaka', 'Tok Besi')); else say([['Tok Besi', 'A good blade matters. They say a Parang lies in a chest in the Eastern Jungle, and a Lembing (spear) near the Pirate Cove.'], ['Tok Besi', 'Hold the attack button to keep swinging. The Silat button spins you through your enemies.']]); }, { weapon: 'parang' }),
    );
    for (const k of ['jebat', 'lekir', 'lekiu', 'kasturi']) {
      const s = SITES[k];
      if (!save.bossDead[CAPTOR[k]]) spawnEnemy(CAPTOR[k], (s.x + 0.5) * TS, (s.y + 2.5) * TS, true);
      if (!save.found[k]) npcs.push({ kind: 'captive', hero: k, name: HEROES[k].name, x: (s.x + 0.5) * TS, y: (s.y - 0.5) * TS, talk: () => talkCaptive(k) });
    }
    if (!save.bossDead.guardian) spawnEnemy('guardian', 81.5 * TS, 9 * TS, true);
    if (foundCount() === 4) openGate();
  } else if (MAP === 'bendahara') {
    npcs.push(npc('Tok Penghulu', 54.5, 48.6, () => talkGiver('bendahara')), npc('Mak Limah', 55.5, 57.6, () => say([['Mak Limah', 'Fresh jamu and fine blades! What will it be?']], () => ui.openShop('bendahara', 'Mak Limah'))));
  } else if (MAP === 'naga') {
    npcs.push(npc('Syahbandar', 29.5, 50.6, () => talkGiver('naga')), npc('Nyonya Kim', 15.5, 56.6, () => say([['Nyonya Kim', 'Weapons from every port in the world. Gold only, no credit!']], () => ui.openShop('naga', 'Nyonya Kim'))));
  } else if (MAP === 'bunian') {
    npcs.push(npc('Puteri Bunian', 55.5, 50.6, () => talkGiver('bunian')), npc('Pedagang Bunian', 58.5, 57.6, () => say([['Pedagang Bunian', 'A human with gold? How curious. Our crystal craft is yours, for a price.']], () => ui.openShop('bunian', 'Pedagang Bunian'))));
  }
  spawnMissionBoss();
  companions = ['jebat', 'lekir', 'lekiu', 'kasturi'].filter(k => save.found[k]).map((k, i) => ({ id: k, x: player.x, y: player.y, face: 0, walk: 0, moving: false, atkCd: rr(0, 1), atk: 0, idx: i }));
  for (const r in SPAWNS) for (let i = 0; i < SPAWNS[r].n; i++) trySpawn(r, true);
}
function openGate() { setT(80, 16, T.FLOOR); setT(81, 16, T.FLOOR); setT(82, 16, T.FLOOR); }
function restoreParty() { player.hp = maxHp(); player.sp = maxSp(); }
