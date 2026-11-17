'use strict';
// ---------------------------------------------------------------- state
let state = 'title', time = 0, shake = 0;
let player, enemies = [], projs = [], parts = [], texts = [], chests = [], npcs = [], toasts = [], teles = [], slashes = [];
let save = null, trail = [], companions = [], dialog = null, cam = { x: 0, y: 0 }, bossBar = null, muted = false;
let lastHurt = 0, endingT = 0;

function newSave() {
  return migrateSave({ lvl: 1, xp: 0, hp: 100, weapon: 'fist', owned: ['fist'], potions: 2, found: {}, bossDead: {}, chests: {}, prologue: false, intro: false, taming: false, ended: false, x: (SITES.home.x + 0.5) * TS, y: (SITES.home.y + 2.5) * TS });
}
const SAVE_VERSION = 2;
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
  return s;
}
function loadSave() { try { return migrateSave(JSON.parse(localStorage.getItem('hikayat_tuah_save') || 'null')); } catch (e) { return null; } }
function writeSave() { if (!player || state === 'title') return; save.x = player.x; save.y = player.y; save.hp = player.hp; save.sp = player.sp; try { localStorage.setItem('hikayat_tuah_save', JSON.stringify(save)); } catch (e) { } }
try { muted = localStorage.getItem('hikayat_tuah_mute') === '1'; } catch (e) { }

const xpNeed = l => 20 + l * l * 12;
const foundCount = () => ['jebat', 'lekir', 'lekiu', 'kasturi'].filter(k => save.found[k]).length;
function currentMission() {
  if (!save.prologue) return null;
  for (const m of MISSIONS.slice(0, 4)) if (!save.found[m.id]) return m;
  if (!save.taming) return MISSIONS[4];
  return 'done';
}
function objectiveText() {
  const m = currentMission();
  if (!save.prologue) return ['Prologue: Find a Weapon', 'Open the chest beside your house.'];
  if (m === 'done') return ['All missions complete!', 'Explore Melaka with the Keris Taming Sari.'];
  if (m.id === 'taming') return [m.title, foundCount() < 4 ? m.hint : save.bossDead.guardian ? 'Claim the keris from the altar.' : 'Defeat the guardian inside the temple.'];
  return [m.title, save.bossDead[CAPTOR[m.id]] ? 'Free ' + HEROES[m.id].name + '!' : m.hint];
}
function objectivePos() {
  if (!save.intro) return null;
  if (!save.prologue) return { x: 44.5, y: 58.5 };
  const m = currentMission();
  if (!m || m === 'done') return null;
  if (m.id === 'taming') { if (save.bossDead.guardian) return { x: 81.5, y: 4.5 }; return { x: 81.5, y: 9 }; }
  const s = SITES[m.id]; return { x: s.x + 0.5, y: s.y + 0.5 };
}

function startGame(fresh) {
  if (fresh) save = newSave(); else save = loadSave() || newSave();
  player = { x: save.x, y: save.y, r: 10, hp: save.hp > 0 ? save.hp : 100, face: -Math.PI / 2, walk: 0, moving: false, atkCd: 0, atkAnim: 0, skillCd: 0, spin: 0, inv: 0, hurt: 0, regenT: 0 };
  player.hp = Math.min(player.hp, maxHp());
  player.sp = Math.min(save.sp != null ? save.sp : maxSp(), maxSp());
  enemies = []; projs = []; parts = []; texts = []; teles = []; slashes = []; trail = [];
  setupWorld();
  gfx.onWorldReady();
  for (let i = 0; i < 40; i++) trail.push({ x: player.x, y: player.y });
  state = 'play';
  audio.init();
  ui.show(true); ui.refreshAll();
  log(isTouch ? 'Welcome to Hikayat Tuah. Tap the menu buttons to open windows.' : 'Welcome to Hikayat Tuah. Press Enter to chat, /help for commands.', 'sys');
  if (!save.intro) startIntro();
}
function setupWorld() {
  chests = [
    { x: 44.5, y: 58.5, item: 'keris', id: 'c_keris' },
    { x: 75.5, y: 47.5, item: 'parang', id: 'c_parang' },
    { x: 21.5, y: 60.5, item: 'lembing', id: 'c_lembing' },
    { x: 38.5, y: 16.5, item: 'potion3', id: 'c_p1' },
    { x: 25.5, y: 36.5, item: 'potion3', id: 'c_p2' },
    { x: 30.5, y: 31.5, item: 'potion2', id: 'c_p3' },
    { x: 89.5, y: 29.5, item: 'potion2', id: 'c_p4' },
    { x: 60.5, y: 12.5, item: 'potion3', id: 'c_p5' },
  ].map(c => ({ ...c, x: c.x * TS, y: c.y * TS, open: !!save.chests[c.id] }));
  for (const c of chests) { const tx = Math.floor(c.x / TS), ty = Math.floor(c.y / TS); if (SOLID.has(getT(tx, ty))) setT(tx, ty, T.GRASS); }
  npcs = [
    { kind: 'bendahara', name: 'Bendahara', x: (SITES.bendahara.x + 0.5) * TS, y: (SITES.bendahara.y + 0.5) * TS, talk: talkBendahara },
    { kind: 'villager1', name: 'Pak Mat', x: 41.5 * TS, y: 51.5 * TS, talk: () => say([['Pak Mat', 'Wild boars roam the meadows outside the town. Swing your weapon at them, Laksamana!']]) },
    { kind: 'villager2', name: 'Mak Som', x: 54.5 * TS, y: 53.5 * TS, talk: () => { player.hp = maxHp(); player.sp = maxSp(); save.potions = Math.max(save.potions, 2); say([['Mak Som', 'Rest a while and drink some jamu. Your health and spirit are restored, and I packed you a few potions.']]); } },
    { kind: 'smith', name: 'Tok Besi', x: 37.5 * TS, y: 51.5 * TS, talk: () => say([['Tok Besi', 'A good blade matters. They say a Parang lies in a chest in the Eastern Jungle, and a Lembing (spear) near the Pirate Cove.'], ['Tok Besi', 'Hold the attack button to keep swinging. The Silat button spins you through your enemies.']]) },
  ];
  // bosses & captives
  for (const k of ['jebat', 'lekir', 'lekiu', 'kasturi']) {
    const s = SITES[k];
    if (!save.bossDead[CAPTOR[k]]) spawnEnemy(CAPTOR[k], (s.x + 0.5) * TS, (s.y + 2.5) * TS, true);
    if (!save.found[k]) npcs.push({ kind: 'captive', hero: k, name: HEROES[k].name, x: (s.x + 0.5) * TS, y: (s.y - 0.5) * TS, talk: () => talkCaptive(k) });
  }
  if (!save.bossDead.guardian) spawnEnemy('guardian', 81.5 * TS, 9 * TS, true);
  if (foundCount() === 4) openGate();
  companions = ['jebat', 'lekir', 'lekiu', 'kasturi'].filter(k => save.found[k]).map((k, i) => ({ id: k, x: player.x, y: player.y, face: 0, walk: 0, moving: false, atkCd: rr(0, 1), atk: 0, idx: i }));
  // initial population
  for (const r in SPAWNS) for (let i = 0; i < SPAWNS[r].n; i++) trySpawn(r, true);
}
function openGate() { setT(80, 16, T.FLOOR); setT(81, 16, T.FLOOR); setT(82, 16, T.FLOOR); }

