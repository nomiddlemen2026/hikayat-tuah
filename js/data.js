'use strict';
// ---------------------------------------------------------------- data
const WEAPONS = {
  fist: { name: 'Bare Hands', dmg: 5, range: 26, arc: 1.4, cd: 0.35, rarity: 'common', desc: 'Silat without a blade. Better than nothing.' },
  keris: { name: 'Keris Lama', dmg: 12, range: 34, arc: 1.8, cd: 0.38, rarity: 'common', desc: "Tuah's old keris with a wavy blade. Quick and reliable." },
  parang: { name: 'Parang Rimba', dmg: 19, range: 38, arc: 2.3, cd: 0.45, rarity: 'uncommon', desc: 'A heavy jungle machete. Wide, powerful swings.' },
  lembing: { name: 'Lembing Laut', dmg: 17, range: 58, arc: 0.9, cd: 0.42, rarity: 'rare', desc: 'A sea spear. Long reach but a narrow thrust.' },
  taming: { name: 'Keris Taming Sari', dmg: 42, range: 46, arc: 2.4, cd: 0.32, rarity: 'legendary', desc: 'The legendary keris. Its blade glows like the morning sun.' },
};
const PAL = {
  bandit: { baju: '#3e3a36', sampin: '#5d4037', tanjak: '#8e1b1b', trim: '#6d2a2a', skin: '#a8714a' },
  bchief: { baju: '#1c1a18', sampin: '#8e1b1b', tanjak: '#000', trim: '#ff5252', skin: '#9c6644' },
  pirate: { baju: '#e8e2d0', sampin: '#1565c0', tanjak: '#c62828', trim: '#263238', skin: '#a8714a' },
  pcapt: { baju: '#4a148c', sampin: '#d4a82a', tanjak: '#111', trim: '#d4a82a', skin: '#9c6644' },
};
const EDEF = {
  boar: { name: 'Babi Hutan', hp: 26, dmg: 6, spd: 62, r: 12, xp: 6, ai: 'charge', look: 'boar' },
  bandit: { name: 'Penyamun', hp: 38, dmg: 8, spd: 58, r: 11, xp: 9, ai: 'melee', look: 'human', pal: PAL.bandit, weapon: 'parang' },
  pirate: { name: 'Lanun', hp: 60, dmg: 11, spd: 62, r: 11, xp: 14, ai: 'melee', look: 'human', pal: PAL.pirate, weapon: 'parang' },
  knifer: { name: 'Lanun Pisau', hp: 42, dmg: 9, spd: 55, r: 11, xp: 14, ai: 'ranged', look: 'human', pal: { ...PAL.pirate, sampin: '#2e7d32' }, weapon: 'keris', proj: 'knife' },
  tiger: { name: 'Harimau', hp: 90, dmg: 14, spd: 80, r: 13, xp: 22, ai: 'charge', look: 'tiger' },
  croc: { name: 'Buaya', hp: 130, dmg: 17, spd: 44, r: 14, xp: 28, ai: 'melee', look: 'croc' },
  wisp: { name: 'Api Paya', hp: 60, dmg: 13, spd: 50, r: 10, xp: 26, ai: 'ranged', look: 'wisp', proj: 'orb', fly: true },
  golem: { name: 'Pengawal Batu', hp: 200, dmg: 22, spd: 40, r: 14, xp: 45, ai: 'melee', look: 'golem' },
  bchief: { name: 'Ketua Penyamun Rimba', hp: 320, dmg: 14, spd: 62, r: 12, xp: 90, ai: 'boss', look: 'human', pal: PAL.bchief, weapon: 'parang', boss: true, moves: ['spin', 'summon', 'spin'], summon: 'bandit' },
  pcapt: { name: 'Nakhoda Lanun Bengis', hp: 520, dmg: 17, spd: 66, r: 12, xp: 140, ai: 'boss', look: 'human', pal: PAL.pcapt, weapon: 'parang', boss: true, moves: ['knives', 'spin', 'knives', 'summon'], summon: 'pirate' },
  btiger: { name: 'Harimau Putih Ledang', hp: 760, dmg: 21, spd: 88, r: 13, xp: 190, ai: 'boss', look: 'tiger', boss: true, moves: ['pounce', 'pounce', 'spin'] },
  bcroc: { name: 'Raja Buaya Paya', hp: 1000, dmg: 25, spd: 50, r: 14, xp: 240, ai: 'boss', look: 'croc', boss: true, moves: ['charge', 'spin', 'summon', 'charge'], summon: 'croc' },
  guardian: { name: 'Penunggu Taming Sari', hp: 1600, dmg: 26, spd: 58, r: 14, xp: 500, ai: 'boss', look: 'guardian', boss: true, fly: true, moves: ['ring', 'pounce', 'summon', 'ring', 'knives'], summon: 'wisp' },
};
const SPAWNS = {
  meadow: { list: ['boar'], n: 6, lvl: 1 },
  jungle: { list: ['boar', 'bandit', 'bandit'], n: 12, lvl: 1 },
  coast: { list: ['pirate', 'knifer'], n: 10, lvl: 2 },
  mountain: { list: ['tiger', 'boar'], n: 10, lvl: 3 },
  swamp: { list: ['croc', 'wisp'], n: 11, lvl: 4 },
  temple: { list: ['golem', 'wisp'], n: 10, lvl: 5 },
};
const MISSIONS = [
  { id: 'jebat', title: 'Mission 1: Finding Jebat', hint: 'Jebat was taken by bandits in the Eastern Jungle.', boss: 'bchief' },
  { id: 'lekir', title: 'Mission 2: Finding Lekir', hint: 'Lekir is held by pirates at the Pirate Cove (south-west).', boss: 'pcapt' },
  { id: 'lekiu', title: 'Mission 3: Finding Lekiu', hint: 'Lekiu went up Mount Ledang Pass (north) and never returned.', boss: 'btiger' },
  { id: 'kasturi', title: 'Mission 4: Finding Kasturi', hint: 'Kasturi is lost in the Misty Swamp (west).', boss: 'bcroc' },
  { id: 'taming', title: 'Mission 5: The Keris Taming Sari', hint: 'All five warriors must enter the Forgotten Temple (north-east).', boss: 'guardian' },
];
const CAPTOR = { jebat: 'bchief', lekir: 'pcapt', lekiu: 'btiger', kasturi: 'bcroc' };

const ITEMS = {
  jamu: { name: 'Jamu Potion', rarity: 'common', desc: 'A bitter herbal remedy. Restores 50% of max HP.' },
};
const RARITY = { common: '#e0e0e0', uncommon: '#5fd068', rare: '#4fa3ff', epic: '#c77dff', legendary: '#ffa726' };
