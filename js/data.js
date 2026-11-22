'use strict';
// ---------------------------------------------------------------- data
// type: keris | blade | curved | spear | club | bow (drives the 2D icon, the 3D model and the attack)
const WEAPONS = {
  fist: { name: 'Bare Hands', dmg: 5, range: 26, arc: 1.4, cd: 0.35, rarity: 'common', type: 'fist', desc: 'Silat without a blade. Better than nothing.' },
  keris: { name: 'Keris Lama', dmg: 12, range: 34, arc: 1.8, cd: 0.38, rarity: 'common', type: 'keris', blade: '#cfd8dc', desc: "Tuah's old keris with a wavy blade. Quick and reliable." },
  parang: { name: 'Parang Rimba', dmg: 19, range: 38, arc: 2.3, cd: 0.45, rarity: 'uncommon', type: 'blade', blade: '#b0bec5', desc: 'A heavy jungle machete. Wide, powerful swings.' },
  lembing: { name: 'Lembing Laut', dmg: 17, range: 58, arc: 0.9, cd: 0.42, rarity: 'rare', type: 'spear', blade: '#cfd8dc', tassel: '#c62828', desc: 'A sea spear. Long reach but a narrow thrust.' },
  taming: { name: 'Keris Taming Sari', dmg: 42, range: 46, arc: 2.4, cd: 0.32, rarity: 'legendary', type: 'keris', blade: '#ffe082', glow: '#ffd54f', story: true, desc: 'The legendary keris. Its blade glows like the morning sun.' },
  // Chapter 2
  golok: { name: 'Golok Perak', dmg: 52, range: 40, arc: 2.5, cd: 0.42, rarity: 'uncommon', type: 'blade', blade: '#e3e8ec', price: 1200, desc: 'A broad silver-edged golok from the kampung smith. Wide sweeping cuts.' },
  busur: { name: 'Busur Rotan', dmg: 44, range: 230, cd: 0.5, rarity: 'uncommon', type: 'bow', wood: '#9c6b3c', price: 1500, desc: 'A rattan bow. Shoots arrows at the nearest enemy from a safe distance.' },
  kerambit: { name: 'Kerambit Harimau', dmg: 40, range: 32, arc: 2.2, cd: 0.24, rarity: 'rare', type: 'curved', blade: '#d7ccc8', desc: 'A claw-shaped blade taken from the weretiger. Lightning-fast slashes.' },
  // Chapter 3
  gada: { name: 'Gada Besi', dmg: 82, range: 42, arc: 2.8, cd: 0.6, rarity: 'rare', type: 'club', blade: '#78909c', price: 3600, desc: 'An iron war club. Slow, but it flattens everything in a wide arc.' },
  busurNaga: { name: 'Busur Naga', dmg: 68, range: 250, cd: 0.46, rarity: 'rare', type: 'bow', wood: '#8e2a1c', price: 4200, desc: 'A red lacquered bow from the island port. Fast, far-flying arrows.' },
  tombak: { name: 'Tombak Api', dmg: 80, range: 64, arc: 1.0, cd: 0.42, rarity: 'epic', type: 'spear', blade: '#ff7043', glow: '#ff5722', tassel: '#ffca28', desc: 'A spear forged in the giant monitor\'s lair. Its tip burns red-hot.' },
  pedang: { name: 'Pedang Naga', dmg: 96, range: 46, arc: 2.4, cd: 0.36, rarity: 'epic', type: 'blade', blade: '#ffcc80', glow: '#ffb300', desc: 'A sword cooled in the lava serpent\'s blood. Hums with heat.' },
  // Chapter 4
  tombakKristal: { name: 'Tombak Kristal', dmg: 112, range: 66, arc: 1.0, cd: 0.42, rarity: 'rare', type: 'spear', blade: '#80deea', glow: '#4dd0e1', tassel: '#b388ff', price: 8000, desc: 'A Bunian crystal spear. Light as air, sharp as frost.' },
  sundang: { name: 'Sundang Bunian', dmg: 124, range: 48, arc: 2.4, cd: 0.32, rarity: 'epic', type: 'keris', blade: '#b2ebf2', glow: '#80deea', desc: 'The twin-edged blade of the Bunian commander. Cold light ripples along it.' },
  kerisBunian: { name: 'Keris Bunian', dmg: 165, range: 52, arc: 2.6, cd: 0.3, rarity: 'legendary', type: 'keris', blade: '#e1bee7', glow: '#b388ff', story: true, desc: 'The hidden keris of the Bunian kings. Only a true Laksamana can wield it.' },
  // Malaysian states arc (from Chapter 5): traditional arms of each state
  jenawi: { name: 'Jenawi Melaka', dmg: 185, range: 54, arc: 2.4, cd: 0.4, rarity: 'rare', type: 'blade', model: 'jenawi', blade: '#e3e8ec', desc: 'The long single-edged sword of the Melaka palace guard. Long reach, clean cuts.' },
  kerisPanjang: { name: 'Keris Panjang', dmg: 205, range: 52, arc: 2.2, cd: 0.34, rarity: 'rare', type: 'keris', model: 'kerisPanjang', blade: '#cfd8dc', desc: 'A long straight keris of the Minangkabau warriors of Negeri Sembilan. Pierces like a sword.' },
  badik: { name: 'Badik Bugis', dmg: 225, range: 34, arc: 2.0, cd: 0.24, rarity: 'epic', type: 'keris', model: 'badik', blade: '#cfd8dc', desc: 'The belly-bladed dagger of the Bugis sea lords of Johor. Very fast stabs.' },
  sumpit: { name: 'Sumpit Rimba', dmg: 240, range: 270, cd: 0.42, rarity: 'rare', type: 'bow', model: 'sumpit', wood: '#8d6e3a', desc: 'An Orang Asli blowpipe from the forests of Pahang. Silent darts fly far and fast.' },
  lading: { name: 'Lading Terengganu', dmg: 265, range: 46, arc: 2.6, cd: 0.38, rarity: 'rare', type: 'blade', model: 'lading', blade: '#dfe5e8', desc: 'A Terengganu blade with a heavy flared tip. Devastating chopping swings.' },
  tekpi: { name: 'Tekpi Kelantan', dmg: 285, range: 36, arc: 2.2, cd: 0.22, rarity: 'epic', type: 'keris', model: 'tekpi', blade: '#d5dde2', desc: 'The three-pronged silat weapon of Kelantan. Catches blades and strikes in a blur.' },
  sewar: { name: 'Sewar Kedah', dmg: 330, range: 36, arc: 2.1, cd: 0.24, rarity: 'epic', type: 'keris', model: 'sewar', blade: '#e0e6ea', desc: 'A slim curved dagger of the northern Malay courts of Kedah and Perlis.' },
  tombakBenderang: { name: 'Tombak Benderang', dmg: 375, range: 70, arc: 1.0, cd: 0.4, rarity: 'epic', type: 'spear', model: 'benderang', blade: '#e8eaec', tassel: '#ffd600', desc: 'The royal banner spear of Perak, carried before the Sultan.' },
  kampilan: { name: 'Kampilan', dmg: 440, range: 60, arc: 2.8, cd: 0.48, rarity: 'epic', type: 'blade', model: 'kampilan', blade: '#d8dee2', desc: 'The great two-handed sword of the Iranun warriors of Sabah. Huge sweeping arcs.' },
  mandau: { name: 'Mandau Dayak', dmg: 465, range: 48, arc: 2.6, cd: 0.36, rarity: 'legendary', type: 'blade', model: 'mandau', blade: '#dfe5e8', desc: 'The headhunter sword of the Dayak of Sarawak, its antler hilt hung with hair tufts.' },
  kerisWarisan: { name: 'Keris Panca Warisan', dmg: 620, range: 56, arc: 2.8, cd: 0.28, rarity: 'legendary', type: 'keris', model: 'kerisWarisan', blade: '#fff3c4', glow: '#ffd54f', story: true, desc: 'The Keris of Heritage, forged by the Bunian from the light of every Malaysian state you saved.' },
};
const weaponValue = id => WEAPONS[id].price || WEAPONS[id].dmg * 25;

const PAL = {
  bandit: { baju: '#3e3a36', sampin: '#5d4037', tanjak: '#8e1b1b', trim: '#6d2a2a', skin: '#a8714a' },
  bchief: { baju: '#1c1a18', sampin: '#8e1b1b', tanjak: '#000', trim: '#ff5252', skin: '#9c6644' },
  pirate: { baju: '#e8e2d0', sampin: '#1565c0', tanjak: '#c62828', trim: '#263238', skin: '#a8714a' },
  pcapt: { baju: '#4a148c', sampin: '#d4a82a', tanjak: '#111', trim: '#d4a82a', skin: '#9c6644' },
  toyol: { baju: '#5f8f4e', sampin: '#3b5a30', tanjak: '#5f8f4e', trim: '#2a3d22', skin: '#7fae62' },
  sihir: { baju: '#1b1426', sampin: '#5a1e6e', tanjak: '#3a1050', trim: '#b388ff', skin: '#8a6a7a' },
  lanunNaga: { baju: '#2a1a14', sampin: '#b71c1c', tanjak: '#d84315', trim: '#ffab40', skin: '#9c6644' },
  lanunPanah: { baju: '#4e342e', sampin: '#ff6f00', tanjak: '#3e2723', trim: '#ffcc80', skin: '#a8714a' },
  bayang: { baju: '#1a1626', sampin: '#2e2640', tanjak: '#120e1c', trim: '#7c4dff', skin: '#3a3450' },
  pengawal: { baju: '#e8eaf6', sampin: '#5c6bc0', tanjak: '#c5cae9', trim: '#80deea', skin: '#e0c0a0' },
  panglima: { baju: '#fafafa', sampin: '#8e24aa', tanjak: '#ffd54f', trim: '#80deea', skin: '#e8c8a8' },
};
// col: colour overrides for the shared low-poly models; scale: model size
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
  // ---- Chapter 2: Kampung Bendahara
  boar2: { name: 'Babi Tunggal', hp: 260, dmg: 20, spd: 70, r: 13, xp: 70, ai: 'charge', look: 'boar', col: { body: '#3a2a22', head: '#4a362a', mane: '#1e1410' }, scale: 1.2 },
  toyol: { name: 'Toyol', hp: 230, dmg: 18, spd: 92, r: 9, xp: 80, ai: 'melee', look: 'human', pal: PAL.toyol, scale: 0.62 },
  pelesit: { name: 'Pelesit', hp: 210, dmg: 22, spd: 58, r: 10, xp: 90, ai: 'ranged', look: 'wisp', proj: 'orb', fly: true, col: { shell: '#b04cff', core: '#ffe6ff' } },
  beruang: { name: 'Beruang Rimba', hp: 520, dmg: 28, spd: 50, r: 14, xp: 130, ai: 'melee', look: 'golem', col: { body: '#3e2c22', head: '#4e382a', limb: '#33241c', eye: '#ffb300', moss: '#2a1e16' } },
  jadian: { name: 'Harimau Jadian', hp: 6000, dmg: 34, spd: 92, r: 13, xp: 1100, ai: 'boss', look: 'tiger', boss: true, col: { fur: '#5b4a8a', stripe: '#16101f' }, scale: 1.7, moves: ['pounce', 'spin', 'pounce', 'summon'], summon: 'toyol' },
  sihir: { name: 'Tok Sihir Kelam', hp: 8000, dmg: 36, spd: 60, r: 12, xp: 1500, ai: 'boss', look: 'human', pal: PAL.sihir, weapon: 'keris', boss: true, fly: false, moves: ['ring', 'knives', 'summon', 'ring', 'spin'], summon: 'pelesit', orbs: true },
  // ---- Chapter 3: Pulau Naga
  lanunNaga: { name: 'Lanun Naga', hp: 700, dmg: 38, spd: 66, r: 11, xp: 190, ai: 'melee', look: 'human', pal: PAL.lanunNaga, weapon: 'gada' },
  lanunPanah: { name: 'Pemanah Lanun', hp: 560, dmg: 34, spd: 58, r: 11, xp: 180, ai: 'ranged', look: 'human', pal: PAL.lanunPanah, weapon: 'busur', proj: 'arrow' },
  biawak: { name: 'Biawak', hp: 880, dmg: 42, spd: 52, r: 14, xp: 220, ai: 'melee', look: 'croc', col: { skin: '#6d5a3a', ridge: '#3e3020' }, scale: 0.9 },
  rohApi: { name: 'Roh Api', hp: 640, dmg: 40, spd: 54, r: 10, xp: 210, ai: 'ranged', look: 'wisp', proj: 'fire', fly: true, col: { shell: '#ff6d00', core: '#fff3e0' } },
  biawakG: { name: 'Biawak Gergasi', hp: 12000, dmg: 48, spd: 56, r: 15, xp: 2400, ai: 'boss', look: 'croc', boss: true, col: { skin: '#7a6040', ridge: '#3e3020' }, scale: 2.0, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'biawak' },
  ular: { name: 'Ular Lava', hp: 14000, dmg: 52, spd: 70, r: 14, xp: 2800, ai: 'boss', look: 'snake', boss: true, col: { skin: '#d84315', belly: '#ffca28', glow: '#ff6d00' }, scale: 1.6, moves: ['ring', 'pounce', 'knives', 'pounce', 'summon'], summon: 'rohApi', orbs: 'fire' },
  naga: { name: 'Naga Emas', hp: 18000, dmg: 58, spd: 62, r: 16, xp: 3600, ai: 'boss', look: 'croc', boss: true, col: { skin: '#d4a82a', ridge: '#ff7043', horns: true }, scale: 2.4, moves: ['ring', 'charge', 'spin', 'knives', 'summon'], summon: 'rohApi', orbs: 'fire' },
  // ---- Chapter 4: Kota Bunian
  bayang: { name: 'Bayang', hp: 1300, dmg: 54, spd: 74, r: 11, xp: 330, ai: 'melee', look: 'human', pal: PAL.bayang, weapon: 'kerambit', ghost: true },
  pengawal: { name: 'Pengawal Bunian', hp: 1500, dmg: 56, spd: 60, r: 11, xp: 350, ai: 'melee', look: 'human', pal: PAL.pengawal, weapon: 'tombakKristal' },
  golemKecil: { name: 'Golem Kristal', hp: 1800, dmg: 60, spd: 44, r: 14, xp: 380, ai: 'melee', look: 'golem', col: { body: '#7fc8d8', head: '#a8e4f0', limb: '#5fa8bc', eye: '#e040fb', moss: '#4dd0e1' } },
  rohKristal: { name: 'Roh Kristal', hp: 1200, dmg: 52, spd: 56, r: 10, xp: 320, ai: 'ranged', look: 'wisp', proj: 'orb', fly: true, col: { shell: '#4dd0e1', core: '#ffffff' } },
  golemAgung: { name: 'Golem Kristal Agung', hp: 22000, dmg: 66, spd: 46, r: 16, xp: 4800, ai: 'boss', look: 'golem', boss: true, col: { body: '#6ab8cc', head: '#a8e4f0', limb: '#4f98ac', eye: '#e040fb', moss: '#b388ff' }, scale: 2.1, moves: ['spin', 'charge', 'ring', 'summon'], summon: 'golemKecil' },
  panglimaB: { name: 'Panglima Bunian', hp: 26000, dmg: 70, spd: 78, r: 12, xp: 5600, ai: 'boss', look: 'human', pal: PAL.panglima, weapon: 'sundang', boss: true, moves: ['pounce', 'spin', 'knives', 'pounce', 'summon'], summon: 'pengawal' },
  raja: { name: 'Raja Bayang', hp: 34000, dmg: 76, spd: 62, r: 15, xp: 8000, ai: 'boss', look: 'guardian', boss: true, fly: true, col: { robe: '#140e22', head: '#0a0712', gold: '#7c4dff', eye: '#e040fb', aura: '#7c4dff' }, scale: 1.6, moves: ['ring', 'pounce', 'summon', 'ring', 'knives', 'spin'], summon: 'bayang' },
};
const MISSIONS = [
  { id: 'jebat', title: 'Mission 1: Finding Jebat', hint: 'Jebat was taken by bandits in the Eastern Jungle.', boss: 'bchief' },
  { id: 'lekir', title: 'Mission 2: Finding Lekir', hint: 'Lekir is held by pirates at the Pirate Cove (south-west).', boss: 'pcapt' },
  { id: 'lekiu', title: 'Mission 3: Finding Lekiu', hint: 'Lekiu went up Mount Ledang Pass (north) and never returned.', boss: 'btiger' },
  { id: 'kasturi', title: 'Mission 4: Finding Kasturi', hint: 'Kasturi is lost in the Misty Swamp (west).', boss: 'bcroc' },
  { id: 'taming', title: 'Mission 5: The Keris Taming Sari', hint: 'All five warriors must enter the Forgotten Temple (north-east).', boss: 'guardian' },
];
const CAPTOR = { jebat: 'bchief', lekir: 'pcapt', lekiu: 'btiger', kasturi: 'bcroc' };

// ---- Chapters 2 to 4: four missions each. type 'hunt' (kill n of target) or 'boss' (defeat boss at site)
const CHAPTERS = {
  2: {
    title: 'Chapter 2: The Curse of Hutan Larangan', map: 'bendahara', giver: 'Tok Penghulu',
    intro: [['Tok Penghulu', 'Laksamana Tuah! Thank heavens. Ever since a sorcerer settled deep in Hutan Larangan, our kampung has had no peace.'], ['Tok Penghulu', 'Little toyol steal our rice, pelesit spirits sting our children, and a weretiger prowls Bukit Batu at night.'], ['Hang Jebat', 'Then we clear them out, one by one. Point the way, Tok.']],
    missions: [
      { title: '2-1 The Toyol Thieves', type: 'hunt', target: ['toyol'], n: 8, site: 'toyol', hint: 'Hunt 8 Toyol at the edge of Hutan Larangan (north-west).', reward: { skill: 'api' },
        done: [['Tok Penghulu', 'The rice stores are safe again! Here, our bomoh wants you to have this.'], ['', 'You learned the magic Api Sakti! Throw fireballs from your hotbar.']] },
      { title: '2-2 The Weretiger of Bukit Batu', type: 'boss', boss: 'jadian', site: 'harimau', hint: 'Defeat the Harimau Jadian on Bukit Batu (north-east).', reward: { weapon: 'kerambit' },
        done: [['Hang Lekiu', 'That was no ordinary tiger. Look, it dropped a claw-shaped blade.'], ['', 'You obtained the Kerambit Harimau!']] },
      { title: '2-3 The Pelesit Swarm', type: 'hunt', target: ['pelesit'], n: 6, site: 'pelesit', hint: 'Destroy 6 Pelesit spirits in Hutan Larangan.', reward: { skill: 'penawar' },
        done: [['Tok Penghulu', 'The spirits are fading. The bomoh says the sorcerer is weakened. Take this healing charm.'], ['', 'You learned the magic Penawar! It heals you.']] },
      { title: '2-4 Tok Sihir Kelam', type: 'boss', boss: 'sihir', site: 'sihir', hint: 'Face the sorcerer at the stone shrine deep in Hutan Larangan.', reward: { unlock: 'naga', gold: 3000 },
        done: [['Tok Sihir Kelam', 'Fools... my master on Pulau Naga will burn your Melaka to ash...'], ['Hang Kasturi', 'Pulau Naga? The dragon island across the sea.'], ['Tok Penghulu', 'Pak Kemudi will sail you there. Take this reward, Laksamana, with the gratitude of the whole kampung.']] },
    ],
  },
  3: {
    title: 'Chapter 3: Fire of Pulau Naga', map: 'naga', giver: 'Syahbandar',
    intro: [['Syahbandar', 'You are the warriors of Melaka? Then the sea gods heard our prayers.'], ['Syahbandar', 'Dragon-flag pirates raid our port, a giant monitor lizard rules the eastern forest, and something golden sleeps in the volcano.'], ['Hang Lekir', 'Pirates again. This time I owe them one.']],
    missions: [
      { title: '3-1 The Dragon-Flag Pirates', type: 'hunt', target: ['lanunNaga', 'lanunPanah'], n: 10, site: 'lanun', hint: 'Defeat 10 dragon-flag pirates on Pantai Karang (south-east beach).', reward: { skill: 'petir' },
        done: [['Syahbandar', 'The beaches are ours again! An old pawang taught me a storm prayer. Let me pass it to you.'], ['', 'You learned the magic Petir! Call lightning on nearby enemies.']] },
      { title: '3-2 Biawak Gergasi', type: 'boss', boss: 'biawakG', site: 'biawak', hint: 'Slay the giant monitor lizard in Hutan Biawak (east).', reward: { weapon: 'tombak' },
        done: [['Hang Jebat', 'In its lair... a spear with a glowing tip!'], ['', 'You obtained the Tombak Api!']] },
      { title: '3-3 Ular Lava', type: 'boss', boss: 'ular', site: 'ular', hint: 'Defeat the lava serpent on the western slopes of Gunung Berapi.', reward: { weapon: 'pedang' },
        done: [['Hang Kasturi', 'The serpent guarded a sword. It is still warm from the lava.'], ['', 'You obtained the Pedang Naga!']] },
      { title: '3-4 Naga Emas', type: 'boss', boss: 'naga', site: 'naga', hint: 'Climb into the crater (Kawah Naga) and face the Golden Dragon.', reward: { unlock: 'bunian', gold: 6000 },
        done: [['Naga Emas', 'Warriors... I was bound by the Shadow King of the Bunian. You have freed me.'], ['Naga Emas', 'He hides in Kota Bunian, a realm mortals cannot see. Sail into the mist beyond this island and it will reveal itself.'], ['Hang Tuah', 'Then that is where we go. For Melaka.']] },
    ],
  },
  4: {
    title: 'Chapter 4: The Shadow of Kota Bunian', map: 'bunian', giver: 'Puteri Bunian',
    intro: [['Puteri Bunian', 'Humans in Kota Bunian? Then the dragon has sent you. I am the daughter of the true Bunian king.'], ['Puteri Bunian', 'Raja Bayang, the Shadow King, stole my father\'s throne. His shadows walk our gardens and his golems guard the crystal forests.'], ['Hang Tuah', 'We will give your father\'s throne back, Tuan Puteri.']],
    missions: [
      { title: '4-1 Shadows in the Garden', type: 'hunt', target: ['bayang'], n: 10, site: 'bayang', hint: 'Banish 10 Bayang from Taman Bayang (north of the city).', reward: { skill: 'perisai' },
        done: [['Puteri Bunian', 'The garden breathes again. Take this blessing of the Bunian: a shield of light.'], ['', 'You learned the magic Perisai! It halves the damage you take.']] },
      { title: '4-2 Golem Kristal Agung', type: 'boss', boss: 'golemAgung', site: 'golem', hint: 'Shatter the great crystal golem in the eastern crystal forest.', reward: { gold: 8000 },
        done: [['Puteri Bunian', 'The crystal forest is free! The Shadow King\'s guard will come for you now.']] },
      { title: '4-3 Panglima Bunian', type: 'boss', boss: 'panglimaB', site: 'panglima', hint: 'Defeat the Bunian commander in the western crystal forest.', reward: { weapon: 'sundang' },
        done: [['Panglima Bunian', 'Forgive me... the Shadow King held my mind. Take my blade and end this.'], ['', 'You obtained the Sundang Bunian!']] },
      { title: '4-4 Raja Bayang', type: 'boss', boss: 'raja', site: 'raja', hint: 'Storm Istana Bayang (north) and defeat the Shadow King.', reward: { weapon: 'kerisBunian', end: true },
        done: [['Raja Bayang', 'Impossible... the light of mortals...'], ['Puteri Bunian', 'The shadows are gone! My father\'s keris, the Keris Bunian, now belongs to you, Laksamana.'], ['Hang Tuah', 'Melaka and the Bunian will be friends for as long as the sun rises.']] },
    ],
  },
};

// ---- magic and skills (unlocked through chapter rewards)
const SKILLS = {
  silat: { name: 'Silat Spin', sp: 8, cd: 5, kind: 'silat', desc: 'Spin through every enemy around you for 160% weapon damage, briefly untouchable.' },
  tikam: { name: 'Tikam Kilat', sp: 14, cd: 6, kind: 'silat', lvl: 8, desc: 'Dash forward like lightning and stab every enemy in your path for 220% weapon damage.' },
  api: { name: 'Api Sakti', sp: 12, cd: 1.2, desc: 'Hurl a fireball at the nearest enemy. It explodes and burns everything close by.' },
  penawar: { name: 'Penawar', sp: 20, cd: 8, desc: 'A healing charm: restores 35% of your max HP plus more with INT.' },
  petir: { name: 'Petir', sp: 24, cd: 5, desc: 'Call lightning down on up to 5 enemies near you.' },
  perisai: { name: 'Perisai', sp: 16, cd: 18, desc: 'A shield of light that halves all damage you take for 10 seconds.' },
  bayang: { name: 'Langkah Bayang', sp: 18, cd: 9, kind: 'silat', lvl: 14, desc: 'Vanish and reappear behind the nearest enemy with a critical strike for 300% weapon damage.' },
  hempas: { name: 'Hempas Bumi', sp: 22, cd: 10, kind: 'silat', lvl: 20, desc: 'Slam the ground for 250% weapon damage around you. Enemies are stunned for 1.5 seconds.' },
  harimau: { name: 'Semangat Harimau', sp: 20, cd: 25, kind: 'silat', desc: 'The spirit of the tiger: +40% attack damage and faster movement for 12 seconds.' },
  panah: { name: 'Hujan Panah', sp: 22, cd: 7, desc: 'A rain of arrows falls on the enemies nearest you.' },
  ombak: { name: 'Gelombang Ombak', sp: 24, cd: 7, desc: 'A crashing sea wave in front of you. Hits hard and throws enemies far back.' },
  angin: { name: 'Puting Beliung', sp: 26, cd: 9, desc: 'Send a whirlwind forward that drags in and shreds every enemy it passes.' },
  naga: { name: 'Nafas Naga', sp: 45, cd: 30, desc: 'Ultimate: breathe dragon fire in a wide cone for 2 seconds.' },
};
const SKILL_ORDER = ['silat', 'tikam', 'api', 'penawar', 'petir', 'perisai', 'bayang', 'hempas', 'harimau', 'panah', 'ombak', 'angin', 'naga'];

const ITEMS = {
  jamu: { name: 'Jamu Potion', rarity: 'common', desc: 'A bitter herbal remedy. Restores 50% of max HP.', price: 40 },
};
// shop stock per map (Tok Besi in Melaka opens his shop from Chapter 2)
const SHOPS = {
  melaka: ['jamu', 'golok'],
  bendahara: ['jamu', 'golok', 'busur'],
  naga: ['jamu', 'gada', 'busurNaga'],
  bunian: ['jamu', 'tombakKristal', 'busurNaga'],
};
const RARITY = { common: '#e0e0e0', uncommon: '#5fd068', rare: '#4fa3ff', epic: '#c77dff', legendary: '#ffa726' };

// ---- NPC looks (also used for dialogue portraits)
const NPC_PALS = {
  'Bendahara': { baju: '#f5f0e1', sampin: '#6d4c41', tanjak: '#c9a227', trim: '#c9a227', skin: '#c08a5c' },
  'Pak Mat': { baju: '#8d6e63', sampin: '#a1887f', tanjak: '#5d4037', trim: '#d7ccc8' },
  'Mak Som': { baju: '#ec407a', sampin: '#7b1fa2', tanjak: '#ec407a', trim: '#f8bbd0', skin: '#d29a6a' },
  'Tok Besi': { baju: '#455a64', sampin: '#ff7043', tanjak: '#263238', trim: '#ffab91', skin: '#b97f50' },
  'Pak Kemudi': { baju: '#0277bd', sampin: '#ffffff', tanjak: '#01579b', trim: '#b3e5fc', skin: '#a8714a' },
  'Tok Penghulu': { baju: '#fff8e1', sampin: '#2e7d32', tanjak: '#1b5e20', trim: '#ffd54f', skin: '#b97f50' },
  'Mak Limah': { baju: '#ff8a65', sampin: '#6a1b9a', tanjak: '#ff8a65', trim: '#ffe0b2', skin: '#c99062' },
  'Syahbandar': { baju: '#4a148c', sampin: '#ffb300', tanjak: '#311b92', trim: '#ffe082', skin: '#a8714a' },
  'Nyonya Kim': { baju: '#e53935', sampin: '#263238', tanjak: '#212121', trim: '#ffcdd2', skin: '#e0b48a' },
  'Puteri Bunian': { baju: '#f3e5f5', sampin: '#ab47bc', tanjak: '#ffd54f', trim: '#80deea', skin: '#ecd0b4' },
  'Pedagang Bunian': { baju: '#e0f7fa', sampin: '#26a69a', tanjak: '#b2ebf2', trim: '#7c4dff', skin: '#e8c8a8' },
  'Tok Sihir Kelam': PAL.sihir, 'Raja Bayang': { baju: '#140e22', sampin: '#2e2640', tanjak: '#7c4dff', trim: '#e040fb', skin: '#3a3450' },
  'Panglima Bunian': PAL.panglima,
};
