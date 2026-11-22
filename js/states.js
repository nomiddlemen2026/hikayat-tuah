'use strict';
// ---------------------------------------------------------------- the journey through the Malaysian states (Chapter 5 onwards)
// After the Shadow King falls, his Bayang Masa (time shadows) flee into the river of time to unmake the history of
// the Malay lands. The Bunian lend Tuah a mist ship, and Pak Kemudi sails it from state to state, era to era.
// Every state is one map with three chapters of two missions each, based on real Malaysian history.
// Real historical figures appear only as allies; the enemies are time shadows, beasts and spirits.
//
// Each state map uses one shared layout: a town on the south coast and five areas around it
// (nw, n, ne, sw, se), each with its own biome, name and optional landmark.

const STATE_FIRST_CH = 5;
const SLOT = {
  nw: { x0: 0, y0: 4, x1: 30, y1: 40, site: { x: 15, y: 20 } },
  n: { x0: 32, y0: 0, x1: 64, y1: 26, site: { x: 48, y: 11 } },
  ne: { x0: 66, y0: 4, x1: 95, y1: 40, site: { x: 80, y: 20 } },
  sw: { x0: 0, y0: 42, x1: 30, y1: 64, site: { x: 15, y: 52 } },
  se: { x0: 66, y0: 42, x1: 95, y1: 64, site: { x: 80, y: 52 } },
};
// biome look: fog, relief [amplitude, scale, offset], dark music, rocky ground, and its creatures
const BIOME = {
  jungle: { fog: '#a9c9a4', relief: [0.45, 5], foes: ['harimau', 'askar'] },
  forest: { fog: '#bfd8c0', relief: [0.4, 6], foes: ['babi', 'askar'] },
  hill: { fog: '#c9d6e3', relief: [1.5, 6], rocky: true, foes: ['harimau', 'gergasi'] },
  swamp: { fog: '#8fa892', near: 11, far: 26, relief: [0.15, 5, -0.05], dark: true, foes: ['buaya', 'hantu'] },
  beach: { fog: '#d8e4ec', relief: [0, 1], foes: ['askar', 'pemanah'] },
  paddy: { fog: '#d8e6c0', relief: [0.05, 4], foes: ['babi', 'askar'] },
  mine: { fog: '#cdbfa8', relief: [0.3, 5], foes: ['gergasi', 'askar'] },
  ruins: { fog: '#7a7060', near: 10, far: 25, relief: [0.4, 5], dark: true, foes: ['hantu', 'gergasi', 'askar'] },
  highland: { fog: '#d0dde6', relief: [1.8, 7], foes: ['beruang', 'harimau'] },
  plantation: { fog: '#b8d0b0', relief: [0.3, 6], foes: ['askar', 'babi'] },
  lake: { fog: '#b8d8e0', relief: [0.1, 5], foes: ['buaya', 'hantu'] },
  cave: { fog: '#5a5060', near: 9, far: 24, relief: [1.2, 5], rocky: true, dark: true, foes: ['hantu', 'gergasi'] },
};
// creature templates; stats grow with the state's tier
const FOE = {
  askar: { name: 'Askar Bayang', hp: 1, dmg: 1, spd: 66, r: 11, ai: 'melee', look: 'human', weapon: 'golok' },
  pemanah: { name: 'Pemanah Bayang', hp: 0.8, dmg: 0.9, spd: 58, r: 11, ai: 'ranged', look: 'human', weapon: 'busur', proj: 'arrow' },
  harimau: { name: 'Harimau Belang', hp: 1.1, dmg: 1.1, spd: 84, r: 13, ai: 'charge', look: 'tiger' },
  babi: { name: 'Babi Hutan Bayang', hp: 0.9, dmg: 1, spd: 72, r: 13, ai: 'charge', look: 'boar', col: { body: '#2e2430', head: '#3a2e3e', mane: '#7c4dff' }, scale: 1.15 },
  buaya: { name: 'Buaya Tembaga', hp: 1.3, dmg: 1.1, spd: 48, r: 14, ai: 'melee', look: 'croc', col: { skin: '#5d6b3a', ridge: '#2e3a1e' } },
  hantu: { name: 'Hantu Masa', hp: 0.85, dmg: 1, spd: 54, r: 10, ai: 'ranged', look: 'wisp', proj: 'orb', fly: true, col: { shell: '#9575cd', core: '#ede7f6' } },
  gergasi: { name: 'Gergasi Batu', hp: 1.4, dmg: 1.15, spd: 42, r: 14, ai: 'melee', look: 'golem', col: { body: '#7d7468', head: '#958b7d', limb: '#655d52', eye: '#b388ff', moss: '#5b6b3a' } },
  beruang: { name: 'Beruang Bayang', hp: 1.3, dmg: 1.1, spd: 50, r: 14, ai: 'melee', look: 'golem', col: { body: '#2e2420', head: '#3e302a', limb: '#261c18', eye: '#e040fb', moss: '#1a1412' } },
};
const SHADOW_PAL = (trim, sampin) => ({ baju: '#1c1826', sampin: sampin || '#2e2640', tanjak: '#120e1c', trim: trim || '#7c4dff', skin: '#4a4060' });

// ---------------------------------------------------------------- the states (batch 1: Melaka, Negeri Sembilan, Johor, Pahang)
const STATES = [
  {
    id: 'melaka', name: 'Melaka', town: 'Bandar Melaka', palace: 'Istana Kesultanan', style: null,
    host: 'Datuk Bandar', shopkeeper: 'Baba Tan', shop: ['jamu', 'golok', 'busurNaga', 'tombakKristal'], trim: '#7c4dff',
    areas: {
      nw: { name: 'Hutan Bertam', biome: 'forest' },
      n: { name: 'Bukit St. Paul', biome: 'ruins', landmark: 'fort' },
      ne: { name: 'Muara Sungai Melaka', biome: 'swamp' },
      sw: { name: 'Pantai Klebang', biome: 'beach' },
      se: { name: 'Bukit Cina', biome: 'forest', landmark: 'shrine' },
    },
    chapters: [
      {
        title: 'The Mouse-deer of Bertam', era: 'c. 1400', giver: 'Parameswara',
        intro: [['', 'The mist parts. The Bunian ship has carried you back to around the year 1400, to a quiet fishing village by the Bertam River.'],
          ['Parameswara', 'Strangers from the sea? I am Parameswara, a prince of Palembang and Temasek. My people and I are looking for a new home.'],
          ['Parameswara', 'But dark shapes stalk this forest. My hunters say the very animals have turned to shadow.'],
          ['Hang Tuah', 'The Bayang Masa. They want to stop Melaka from ever being founded. Brothers, we protect this prince!']],
        missions: [
          { type: 'hunt', area: 'nw', n: 10, title: 'Shadows in the Bertam Forest', hint: 'Drive out 10 shadow creatures in Hutan Bertam (north-west).', reward: { gold: 4000 },
            done: [['Parameswara', 'The forest breathes again. Come, I was resting beneath a tree by the river when my hunting dogs found something strange.']] },
          { type: 'boss', area: 'nw', title: 'The Shadow Hound', hint: 'Defeat the Shadow Hound by the Bertam River before it scares away the mouse-deer.', reward: { gold: 5000 },
            boss: { name: 'Anjing Bayang', look: 'tiger', col: { fur: '#3a3150', stripe: '#120e1c' }, scale: 1.6, moves: ['pounce', 'spin', 'pounce', 'summon'], summon: 'harimau' },
            done: [['', 'With the shadow gone, a small mouse-deer (pelanduk) turns and kicks one of the prince\'s hunting dogs into the river.'],
              ['Parameswara', 'The weakest creature stood up to the strongest. This is a fine place for a kingdom. I will name it after the tree I rest under: Melaka.'],
              ['', 'History safe: Parameswara founded Melaka around 1400. It grew into the greatest trading port in South-East Asia.']] },
        ],
      },
      {
        title: 'The Fall of Melaka', era: '1511', giver: 'Sultan Ahmad Shah',
        intro: [['', 'The mist carries you forward to August 1511. A Portuguese fleet under Afonso de Albuquerque has attacked Melaka.'],
          ['Sultan Ahmad Shah', 'Laksamana! My father Sultan Mahmud Shah and I held the bridge over the river for weeks, but the city cannot last.'],
          ['Sultan Ahmad Shah', 'Worse, shadow warriors are hunting the royal family. If our line is cut today, there will be no Johor and no Perak tomorrow.'],
          ['Hang Jebat', 'Then we clear the river so the royal boats can escape upstream.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 12, title: 'Clear the River Mouth', hint: 'Defeat 12 shadow creatures at Muara Sungai Melaka (north-east).', reward: { gold: 5000 },
            done: [['Sultan Ahmad Shah', 'The river is open! The royal boats are ready. But a shadow captain blocks the way upstream.']] },
          { type: 'boss', area: 'ne', title: 'Hulubalang Bayang', hint: 'Defeat the shadow captain at the river mouth so the royal family can escape.', reward: { gold: 6000 },
            boss: { name: 'Hulubalang Bayang', look: 'human', weapon: 'pedang', scale: 1.25, moves: ['spin', 'knives', 'pounce', 'summon'], summon: 'askar' },
            done: [['Sultan Ahmad Shah', 'Go, father! To Muar, to Pahang, to Bintan. Melaka has fallen, but the Malay rulers will rise again.'],
              ['', 'History safe: Melaka fell on 24 August 1511. The royal family escaped, and Sultan Mahmud Shah\'s sons later founded the Johor and Perak sultanates.']] },
        ],
      },
      {
        title: 'The Gate of A Famosa', era: '1641 to 1807', giver: 'Datuk Bandar',
        intro: [['', 'The mist swirls through the centuries. The Portuguese built a great fortress here, A Famosa, on the hill of St. Paul.'],
          ['Datuk Bandar', 'The Dutch took the fort in 1641 after a long siege, and now the British plan to tear it down. Its stones remember everything.'],
          ['Datuk Bandar', 'The Bayang Masa have woken a giant inside the ruined walls. They want to crush the last gate, Porta de Santiago, so no one remembers.'],
          ['Hang Kasturi', 'A gate that tells four hundred years of history. It must stand.']],
        missions: [
          { type: 'hunt', area: 'n', n: 12, title: 'Ghosts of the Fortress', hint: 'Defeat 12 creatures in the ruins on Bukit St. Paul (north).', reward: { gold: 6000 },
            done: [['Datuk Bandar', 'The ghosts are quiet. Listen... the walls are shaking. The giant is coming for the gate!']] },
          { type: 'boss', area: 'n', title: 'Gergasi Kota', hint: 'Defeat the stone giant inside the walls of A Famosa (north).', reward: { weapon: 'jenawi' },
            boss: { name: 'Gergasi Kota', look: 'golem', col: { body: '#9e9488', head: '#b5aa9c', limb: '#7d7468', eye: '#e040fb', moss: '#6d7a4a' }, scale: 2.1, moves: ['spin', 'charge', 'ring', 'summon'], summon: 'gergasi' },
            done: [['Datuk Bandar', 'The gate stands! In 1807 the British blew up most of the fort, but Stamford Raffles persuaded them to spare this gate.'],
              ['Datuk Bandar', 'Porta de Santiago still stands in Melaka today. Take this blade, the Jenawi of the old palace guard.'],
              ['', 'You obtained the Jenawi Melaka! Melaka is safe. Pak Kemudi can now sail to Negeri Sembilan.']] },
        ],
      },
    ],
  },
  {
    id: 'ns', name: 'Negeri Sembilan', town: 'Seri Menanti', palace: 'Istana Lama', style: 'kampung',
    host: 'Ibu Soko', shopkeeper: 'Mak Siti', shop: ['jamu', 'jenawi', 'gada', 'tombakKristal'], trim: '#ffb300',
    areas: {
      nw: { name: 'Sawah Rembau', biome: 'paddy' },
      n: { name: 'Gunung Angsi', biome: 'highland' },
      ne: { name: 'Hutan Jelebu', biome: 'jungle' },
      sw: { name: 'Pantai Port Dickson', biome: 'beach' },
      se: { name: 'Bukit Linggi', biome: 'forest', landmark: 'shrine' },
    },
    chapters: [
      {
        title: 'Adat Perpatih', era: '1400s to 1600s', giver: 'Ibu Soko',
        intro: [['', 'The mist lands you among the hills behind the Melaka coast. Settlers from Minangkabau in Sumatra have made their home here.'],
          ['Ibu Soko', 'Welcome, Laksamana. We live by Adat Perpatih: land passes from mother to daughter, and our chiefs are chosen by agreement, not by force.'],
          ['Ibu Soko', 'Nine districts, nine luak, share this custom. That is why one day this land will be called Negeri Sembilan, the Nine States.'],
          ['Ibu Soko', 'But shadow beasts are trampling the rice fields of Rembau. Without rice there is no harvest, and without a harvest there is no community.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 12, title: 'Save the Rembau Harvest', hint: 'Drive out 12 creatures from Sawah Rembau (north-west).', reward: { gold: 6500 },
            done: [['Ibu Soko', 'The padi stands tall again. But their leader still roams the far end of the fields.']] },
          { type: 'boss', area: 'nw', title: 'Babi Tunggal Bayang', hint: 'Defeat the giant shadow boar in Sawah Rembau.', reward: { gold: 7500 },
            boss: { name: 'Babi Tunggal Bayang', look: 'boar', col: { body: '#241c2a', head: '#30263a', mane: '#ffb300' }, scale: 2.0, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'babi' },
            done: [['Ibu Soko', 'The fields are safe. In our custom, everyone shares the harvest. Tonight you eat with us, Laksamana.'],
              ['', 'History safe: Adat Perpatih is still practised in Negeri Sembilan today, one of the few matrilineal customs in the world.']] },
        ],
      },
      {
        title: 'Raja Melewar', era: '1773', giver: 'Raja Melewar',
        intro: [['', 'The mist moves to 1773. The nine luak have invited a prince from Pagaruyung in Minangkabau to be their ruler.'],
          ['Raja Melewar', 'I am Raja Melewar. The chiefs will install me at Rembau as the first Yang di-Pertuan Besar of Negeri Sembilan.'],
          ['Raja Melewar', 'My procession must cross Gunung Angsi, but shadow tigers wait in the forests of Jelebu and on the mountain.'],
          ['Hang Lekiu', 'Tigers again! Leave them to us, Tuanku.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 12, title: 'Secure the Jelebu Road', hint: 'Defeat 12 creatures in Hutan Jelebu (north-east).', reward: { gold: 7500 },
            done: [['Raja Melewar', 'The road is clear. Only the great tiger of Gunung Angsi remains.']] },
          { type: 'boss', area: 'n', title: 'Harimau Bayang Angsi', hint: 'Defeat the shadow tiger on Gunung Angsi (north) to protect the royal procession.', reward: { gold: 8500 },
            boss: { name: 'Harimau Bayang Angsi', look: 'tiger', col: { fur: '#c77800', stripe: '#1a1020' }, scale: 1.9, moves: ['pounce', 'pounce', 'spin', 'summon'], summon: 'harimau' },
            done: [['Raja Melewar', 'The way is open. The luak chiefs will crown me as they agreed, by custom and not by conquest.'],
              ['', 'History safe: Raja Melewar became the first Yang di-Pertuan Besar of Negeri Sembilan in 1773. His line still rules from Seri Menanti.']] },
        ],
      },
      {
        title: 'The Palace Without Nails', era: '1902 to 1908', giver: 'Tukang Kahar',
        intro: [['', 'The mist brings you to Seri Menanti in the early 1900s. Master carpenters are building a new palace for the Yang di-Pertuan Besar.'],
          ['Tukang Kahar', 'Ninety-nine pillars of chengal hardwood, Laksamana, one for each warrior of the old luak. And not a single nail. Every joint is pegged and slotted.'],
          ['Tukang Kahar', 'But a monster of rotten wood has crawled out of the Linggi hills. Where it walks, timber turns to dust.'],
          ['Hang Lekir', 'A palace without nails, eaten by a monster? Not while we are here.']],
        missions: [
          { type: 'hunt', area: 'se', n: 12, title: 'Rot in the Linggi Hills', hint: 'Defeat 12 creatures on Bukit Linggi (south-east).', reward: { gold: 8500 },
            done: [['Tukang Kahar', 'The rot is spreading less. The monster itself hides by the old shrine in the hills.']] },
          { type: 'boss', area: 'se', title: 'Gergasi Kayu Reput', hint: 'Destroy the rotten wood giant at the shrine on Bukit Linggi.', reward: { weapon: 'kerisPanjang' },
            boss: { name: 'Gergasi Kayu Reput', look: 'golem', col: { body: '#5d4a32', head: '#6d5a40', limb: '#4a3a26', eye: '#ffb300', moss: '#3a5a2a' }, scale: 2.1, moves: ['charge', 'spin', 'ring', 'summon'], summon: 'gergasi' },
            done: [['Tukang Kahar', 'The palace is safe! Istana Lama Seri Menanti will stand for more than a hundred years.'],
              ['Ibu Soko', 'Our luak chiefs want you to carry this long keris of the Minangkabau warriors.'],
              ['', 'You obtained the Keris Panjang! Negeri Sembilan is safe. Pak Kemudi can now sail to Johor.']] },
        ],
      },
    ],
  },
  {
    id: 'johor', name: 'Johor', town: 'Johor Bahru', palace: 'Istana Besar', style: 'port',
    host: 'Tok Penghulu Johor', shopkeeper: 'Pak Kassim', shop: ['jamu', 'jenawi', 'kerisPanjang', 'busurNaga'], trim: '#26c6da',
    areas: {
      nw: { name: 'Ladang Gambir', biome: 'plantation' },
      n: { name: 'Hutan Kota Tinggi', biome: 'jungle' },
      ne: { name: 'Kota Johor Lama', biome: 'forest', landmark: 'fort' },
      sw: { name: 'Paya Pontian', biome: 'swamp' },
      se: { name: 'Pantai Desaru', biome: 'beach' },
    },
    chapters: [
      {
        title: 'Johor Lama', era: '1528 to 1587', giver: 'Sultan Alauddin',
        intro: [['', 'The mist sails up the Johor River to around 1530. The son of Melaka\'s last sultan has built a new capital here.'],
          ['Sultan Alauddin', 'I am Sultan Alauddin Riayat Shah II. When Melaka fell, my family carried its crown here. Johor is Melaka reborn.'],
          ['Sultan Alauddin', 'The Portuguese and Aceh both want this river. Now shadow raiders have joined them, attacking our fort at Johor Lama.'],
          ['Hang Tuah', 'Melaka\'s heir needs Melaka\'s Laksamana. We will hold the fort.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 12, title: 'Defend Johor Lama', hint: 'Defeat 12 raiders around Kota Johor Lama (north-east).', reward: { skill: 'panah' },
            done: [['Sultan Alauddin', 'Our archers taught you their art. Let your arrows fall like rain on our enemies.'], ['', 'You learned Hujan Panah! Rain arrows on the nearest group of enemies.']] },
          { type: 'boss', area: 'ne', title: 'Nakhoda Bayang', hint: 'Defeat the shadow sea captain attacking Kota Johor Lama.', reward: { gold: 9500 },
            boss: { name: 'Nakhoda Bayang', look: 'human', weapon: 'golok', scale: 1.25, moves: ['knives', 'spin', 'knives', 'summon'], summon: 'pemanah' },
            done: [['Sultan Alauddin', 'The river is ours again. Johor will survive every attack and outlast every enemy.'],
              ['', 'History safe: the Johor Sultanate, founded around 1528, carried on the line of the Melaka sultans. Its capital moved many times along the river.']] },
        ],
      },
      {
        title: 'The Five Bugis Brothers', era: '1722', giver: 'Daeng Merewah',
        intro: [['', 'The mist brings you to 1722. Five warrior brothers have sailed from Bugis lands in Sulawesi: Daeng Parani, Daeng Merewah, Daeng Chelak, Daeng Menambun and Daeng Kemasi.'],
          ['Daeng Merewah', 'We have come to help Raja Sulaiman take back the throne of Johor. In return, a Bugis will stand beside the Sultan as Yang Dipertuan Muda.'],
          ['Daeng Merewah', 'Five brothers, like you, Laksamana! But shadow beasts in the Pontian swamps are sinking our boats.'],
          ['Hang Jebat', 'Five brothers helping five brothers. I like these Bugis already.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 12, title: 'The Pontian Swamp', hint: 'Defeat 12 creatures in Paya Pontian (south-west).', reward: { gold: 10000 },
            done: [['Daeng Merewah', 'Our boats can land. But something huge is hunting along Pantai Desaru.']] },
          { type: 'boss', area: 'se', title: 'Buaya Laut Bayang', hint: 'Defeat the giant shadow crocodile on Pantai Desaru (south-east).', reward: { weapon: 'badik' },
            boss: { name: 'Buaya Laut Bayang', look: 'croc', col: { skin: '#2e3a4a', ridge: '#26c6da' }, scale: 2.2, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'buaya' },
            done: [['Daeng Merewah', 'Take my badik, Laksamana. Every Bugis warrior carries one. You have earned yours.'],
              ['', 'You obtained the Badik Bugis! History safe: in 1722 the Bugis brothers helped Sultan Sulaiman, and Daeng Merewah became the first Yang Dipertuan Muda of Johor-Riau.']] },
        ],
      },
      {
        title: 'Father of Modern Johor', era: '1866 to 1895', giver: 'Sultan Abu Bakar',
        intro: [['', 'The mist moves to the 1860s. A busy new town of wide streets and a grand palace has grown at Tanjung Puteri.'],
          ['Sultan Abu Bakar', 'I have renamed this town Johor Bahru, New Johor. Chinese settlers grow gambier and pepper along our rivers, and Johor is growing rich.'],
          ['Sultan Abu Bakar', 'I am writing a constitution so that Johor stays independent and well governed. But shadows are burning the plantations and a serpent hides in Kota Tinggi.'],
          ['Hang Lekir', 'A ruler with pen and plan. We will guard both, Tuanku.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 14, title: 'Guard the Gambier Farms', hint: 'Defeat 14 creatures in Ladang Gambir (north-west).', reward: { gold: 11000 },
            done: [['Sultan Abu Bakar', 'The farms are safe. Now the serpent of Kota Tinggi.']] },
          { type: 'boss', area: 'n', title: 'Ular Bayang Kota Tinggi', hint: 'Slay the shadow serpent in Hutan Kota Tinggi (north).', reward: { gold: 13000 },
            boss: { name: 'Ular Bayang Kota Tinggi', look: 'snake', col: { skin: '#3a2a50', belly: '#26c6da', glow: '#7c4dff' }, scale: 1.8, moves: ['ring', 'pounce', 'knives', 'pounce', 'summon'], summon: 'hantu', orbs: true },
            done: [['Sultan Abu Bakar', 'Johor is safe and modern. In 1895 I will give it a written constitution, the first of any Malay state.'],
              ['', 'History safe: Sultan Abu Bakar is called the Father of Modern Johor. Pak Kemudi can now sail to Pahang.']] },
        ],
      },
    ],
  },
  {
    id: 'pahang', name: 'Pahang', town: 'Pekan', palace: 'Istana Abu Bakar', style: 'kampung',
    host: 'Tok Batin', shopkeeper: 'Mak Esah', shop: ['jamu', 'kerisPanjang', 'badik', 'busurNaga'], trim: '#66bb6a',
    areas: {
      nw: { name: 'Tanah Tinggi Cameron', biome: 'highland' },
      n: { name: 'Hutan Taman Negara', biome: 'jungle' },
      ne: { name: 'Tasik Chini', biome: 'lake', landmark: 'lake' },
      sw: { name: 'Lombong Sungai Lembing', biome: 'mine' },
      se: { name: 'Pantai Cherating', biome: 'beach' },
    },
    chapters: [
      {
        title: 'People of the Forest', era: 'ancient times', giver: 'Tok Batin',
        intro: [['', 'The mist sails up the Pahang River, the longest river in the peninsula, into a rainforest older than the dinosaurs.'],
          ['Tok Batin', 'I am the Tok Batin, headman of our village. We Orang Asli are the first people of this land. Our ancestors hunted here before any kingdom.'],
          ['Tok Batin', 'The forest gives us everything: food, medicine, rattan, and wood for the sumpit. But shadows are poisoning Taman Negara.'],
          ['Hang Kasturi', 'Show us where they hide, Tok. We will be your hunters today.']],
        missions: [
          { type: 'hunt', area: 'n', n: 14, title: 'Heal the Ancient Forest', hint: 'Defeat 14 creatures in Hutan Taman Negara (north).', reward: { weapon: 'sumpit' },
            done: [['Tok Batin', 'You hunt well. Take this sumpit. Its darts fly silent and far.'], ['', 'You obtained the Sumpit Rimba!']] },
          { type: 'boss', area: 'n', title: 'Beruang Raksasa Bayang', hint: 'Defeat the giant shadow bear deep in Taman Negara.', reward: { gold: 13000 },
            boss: { name: 'Beruang Raksasa Bayang', look: 'golem', col: { body: '#2a2018', head: '#3a2c22', limb: '#221810', eye: '#66bb6a', moss: '#1a3a1a' }, scale: 2.2, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'beruang' },
            done: [['Tok Batin', 'The forest is clean. We Orang Asli still live in these forests today, as our ancestors did.'],
              ['', 'History safe: the Orang Asli, including the Batek, Semai and Jakun, are the oldest peoples of Peninsular Malaysia.']] },
        ],
      },
      {
        title: 'The Dragon of Tasik Chini', era: 'legend', giver: 'Tok Batin',
        intro: [['Tok Batin', 'My Jakun cousins at Tasik Chini tell an old story. Beneath the lake lies a sunken city, guarded by a dragon: Naga Seri Gumum.'],
          ['Tok Batin', 'The dragon has always protected the lake. But now the Bayang Masa have poisoned its heart, and it rages against everyone.'],
          ['Hang Tuah', 'Then we will not kill it. We will break the shadow\'s hold on it.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 14, title: 'Shadows on the Lake', hint: 'Defeat 14 creatures around Tasik Chini (north-east).', reward: { gold: 14000 },
            done: [['Tok Batin', 'The lotus flowers are opening again. Now, to the island where the dragon rises.']] },
          { type: 'boss', area: 'ne', title: 'Naga Seri Gumum', hint: 'Free the dragon of Tasik Chini from the shadows (the island in the lake).', reward: { skill: 'angin' },
            boss: { name: 'Naga Seri Gumum', look: 'croc', col: { skin: '#2e7d5a', ridge: '#ffd54f', horns: true }, scale: 2.5, moves: ['ring', 'charge', 'spin', 'knives', 'summon'], summon: 'hantu', orbs: true },
            done: [['', 'The shadow lifts. The great dragon bows its head, then sinks back beneath the lotus leaves.'],
              ['Tok Batin', 'The dragon thanks you. It has given you the power of the lake winds.'],
              ['', 'You learned Puting Beliung! Send a whirlwind through your enemies. Tasik Chini is a UNESCO Biosphere Reserve today.']] },
        ],
      },
      {
        title: 'Mat Kilau\'s Stand', era: '1891 to 1895', giver: 'Mat Kilau',
        intro: [['', 'The mist brings you to 1891. British rule has come to Pahang, and the chiefs are losing their old rights.'],
          ['Mat Kilau', 'I am Mat Kilau, son of Tok Gajah. With Dato\' Bahaman of Semantan, we have risen to defend Pahang\'s honour.'],
          ['Mat Kilau', 'Our fight is a human struggle, Laksamana. But the Bayang Masa want to erase our courage from history, so no one will remember we stood up.'],
          ['Hang Jebat', 'Courage forgotten is courage wasted. We will make sure Pahang remembers.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 14, title: 'The Tin Mines of Sungai Lembing', hint: 'Defeat 14 creatures at Lombong Sungai Lembing (south-west).', reward: { gold: 15000 },
            done: [['Mat Kilau', 'The shadows gather on the coast. Their general waits at Cherating.']] },
          { type: 'boss', area: 'se', title: 'Panglima Bayang Pahang', hint: 'Defeat the shadow general on Pantai Cherating (south-east).', reward: { skill: 'harimau' },
            boss: { name: 'Panglima Bayang Pahang', look: 'human', weapon: 'kampilan', scale: 1.3, moves: ['pounce', 'spin', 'knives', 'pounce', 'summon'], summon: 'askar' },
            done: [['Mat Kilau', 'You fight like the tigers of Pahang! Take their spirit with you.'],
              ['', 'You learned Semangat Harimau! History safe: Mat Kilau lived in hiding for decades and revealed himself in 1969. He is honoured as a national hero.']] },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------- build maps, enemies and chapters from STATES
const stateMapId = s => 'st_' + s.id;
const STATE_BY_MAP = {};
(function buildStates() {
  STATES.forEach((s, tier) => {
    const mid = stateMapId(s); STATE_BY_MAP[mid] = s; s.tier = tier; s.firstCh = STATE_FIRST_CH + tier * 3;
    // creatures of this state
    const foeId = k => mid + '_' + k, pal = SHADOW_PAL(s.trim);
    const used = new Set(['babi']); for (const a of Object.values(s.areas)) for (const f of BIOME[a.biome].foes) used.add(f);
    for (const c of s.chapters) for (const m of c.missions) if (m.boss) used.add(m.boss.summon);
    for (const k of used) {
      const f = FOE[k];
      EDEF[foeId(k)] = { ...f, hp: Math.round((1500 + 500 * tier) * f.hp), dmg: Math.round((60 + 6 * tier) * f.dmg), xp: Math.round((380 + 120 * tier) * (0.8 + f.hp * 0.2)), pal: f.look === 'human' ? pal : undefined };
    }
    // map definition
    const regions = { town: { x0: 34, y0: 44, x1: 62, y1: 62, name: s.town, fog: '#cfe0e8', relief: [0, 1] } }, spawns = { meadow: { list: [foeId('babi')], n: 5 } }, sites = {};
    for (const k in s.areas) {
      const a = s.areas[k], b = BIOME[a.biome], sl = SLOT[k];
      regions[k] = { x0: sl.x0, y0: sl.y0, x1: sl.x1, y1: sl.y1, name: a.name, fog: b.fog, near: b.near, far: b.far, relief: b.relief, dark: b.dark, rocky: b.rocky };
      spawns[k] = { list: b.foes.map(foeId), n: 12 };
      sites[k] = sl.site;
    }
    MAPS[mid] = {
      name: s.name, townName: s.town, chapter: s.firstCh, state: true,
      base: { name: s.name + ' Countryside', fog: '#c8dcc8', relief: [0.35, 7] },
      regions, spawns, sites, safe: { x: 48, y: 53, r: 13 }, respawn: { x: 48.5, y: 57.5 }, arrive: { x: 49.5, y: 62.5 }, boat: { x: 50.5, y: 63.5 },
      props: {}, gen: () => genState(s),
    };
    MAP_ORDER.push(mid);
    SHOPS[mid] = s.shop;
    // the people of this state
    const PALS = [{ baju: '#f5f0e1', sampin: '#6d4c41', tanjak: '#c9a227', trim: '#c9a227', skin: '#b97f50' }, { baju: '#1565c0', sampin: '#ffd54f', tanjak: '#0d47a1', trim: '#ffe082', skin: '#a8714a' }, { baju: '#2e7d32', sampin: '#f9a825', tanjak: '#1b5e20', trim: '#c5e1a5', skin: '#c68b59' }, { baju: '#6a1b9a', sampin: '#ffd54f', tanjak: '#4a148c', trim: '#e1bee7', skin: '#b97f50' }];
    const addPal = (name, i, extra) => { if (!NPC_PALS[name]) NPC_PALS[name] = { ...PALS[i % PALS.length], ...extra }; };
    addPal(s.host, tier); addPal(s.shopkeeper, tier + 1, { baju: '#8d6e63', tanjak: '#5d4037' });
    // chapters
    s.chapters.forEach((c, ci) => {
      const n = s.firstCh + ci;
      addPal(c.giver, tier + ci, c.pal);
      const missions = c.missions.map((m, mi) => {
        const out = { ...m, title: n + '-' + (mi + 1) + ' ' + m.title, site: m.area };
        if (m.type === 'hunt') out.target = spawns[m.area].list;
        if (m.type === 'boss') {
          const id = mid + '_boss' + ci, b = m.boss, k = 0.8 + 0.2 * ci;
          EDEF[id] = { name: b.name, hp: Math.round((24000 + 9000 * tier) * k), dmg: Math.round((70 + 7 * tier) + 3 * ci), spd: b.look === 'golem' ? 48 : b.look === 'croc' ? 56 : b.look === 'boar' ? 74 : 76, r: b.look === 'human' ? 12 : 15, xp: Math.round((5000 + 1500 * tier) * k), ai: 'boss', boss: true,
            look: b.look, col: b.col, pal: b.look === 'human' ? SHADOW_PAL(s.trim, '#4a1e4a') : undefined, weapon: b.weapon, scale: b.scale, moves: b.moves, summon: foeId(b.summon), orbs: b.orbs, fly: b.fly };
          out.boss = id;
        }
        return out;
      });
      CHAPTERS[n] = { title: 'Chapter ' + n + ': ' + c.title + ' (' + c.era + ')', short: c.title, map: mid, giver: c.giver, intro: c.intro, missions, state: s };
    });
  });
})();
const lastChapter = () => STATE_FIRST_CH + STATES.length * 3 - 1;
const storyDone = () => save.chapter > lastChapter();

// ---------------------------------------------------------------- state map generator
function biomeTile(b, x, y, n, h) {
  switch (b) {
    case 'jungle': return n > 0.5 || h < 0.1 ? T.JTREE : T.DARK;
    case 'forest': return n > 0.62 || h < 0.06 ? T.TREE : (h > 0.93 ? T.FLOWER : T.GRASS);
    case 'hill': return n > 0.58 || h < 0.07 ? T.ROCK : T.DIRT;
    case 'swamp': return n > 0.64 ? T.WATER : (h < 0.07 ? T.MANGROVE : T.SWAMP);
    case 'beach': return h < 0.05 ? T.PALM : T.SAND;
    case 'paddy': return (y % 5 === 0 && x % 9 !== 0) ? T.GRASS : T.PADDY;
    case 'mine': return n > 0.62 ? T.WATER : (h < 0.05 ? T.ROCK : T.DIRT);
    case 'ruins': return n > 0.66 || h < 0.05 ? T.JTREE : (h > 0.975 ? T.PILLAR : T.DARK);
    case 'highland': return n > 0.55 || h < 0.08 ? T.TREE : (h > 0.9 ? T.FLOWER : T.GRASS);
    case 'plantation': return (x % 3 === 0 && y % 3 === 0 && h < 0.9) ? T.TREE : (h > 0.96 ? T.FLOWER : T.GRASS);
    case 'lake': return h < 0.06 ? T.TREE : (h > 0.9 ? T.FLOWER : T.GRASS);
    case 'cave': return n > 0.6 || h < 0.07 ? T.ROCK : T.ASH;
  }
  return T.GRASS;
}
function genState(s) {
  const seed = 100 + s.tier * 7;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = regionAt(x, y), n = noise(x / 5, y / 5, seed), h = hash(x, y, seed + 1);
    let t;
    if (r === 'town') t = h < 0.06 ? T.FLOWER : T.GRASS;
    else if (r === 'meadow') t = (n > 0.7 || h < 0.03) ? T.TREE : (h > 0.95 ? T.FLOWER : T.GRASS);
    else t = biomeTile(s.areas[r].biome, x, y, n, h);
    setT(x, y, t);
  }
  // a river from the hills to the sea, east of the town
  for (let y = 0; y < MH; y++) { const rx = Math.floor(64 + Math.sin(y * 0.19 + s.tier) * 1.6); setT(rx, y, T.WATER); setT(rx + 1, y, T.WATER); }
  seaSouth();
  borders(T.JTREE, T.JTREE);
  // landmarks and clearings at each area's site
  for (const k in s.areas) {
    const a = s.areas[k], st = SLOT[k].site, b = a.biome;
    const ground = { jungle: T.DARK, forest: T.GRASS, hill: T.DIRT, swamp: T.SWAMP, beach: T.SAND, paddy: T.GRASS, mine: T.DIRT, ruins: T.DARK, highland: T.GRASS, plantation: T.GRASS, lake: T.GRASS, cave: T.ASH }[b] || T.GRASS;
    if (a.landmark === 'lake') { clearDisc(st.x, st.y, 10, T.WATER); clearDisc(st.x, st.y, 4, T.GRASS); for (let y = st.y + 4; y <= st.y + 11; y++) { setT(st.x, y, T.BRIDGE); setT(st.x + 1, y, T.BRIDGE); } }
    else clearDisc(st.x, st.y, 6, ground);
    if (a.landmark === 'fort') { // a walled fortress with a gate facing the town
      for (let y = st.y - 6; y <= st.y + 5; y++) for (let x = st.x - 8; x <= st.x + 8; x++) { const edge = x === st.x - 8 || x === st.x + 8 || y === st.y - 6 || y === st.y + 5; setT(x, y, edge ? T.WALL : T.FLOOR); }
      for (const [dx, dy] of [[-5, -3], [5, -3], [-5, 2], [5, 2]]) setT(st.x + dx, st.y + dy, T.PILLAR);
      for (let x = st.x - 1; x <= st.x + 2; x++) setT(x, st.y + 5, T.FLOOR);
    }
    if (a.landmark === 'shrine') { for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; setT(Math.round(st.x + Math.cos(an) * 4), Math.round(st.y + Math.sin(an) * 4), T.PILLAR); } for (let y = st.y - 1; y <= st.y + 1; y++) for (let x = st.x - 1; x <= st.x + 1; x++) setT(x, y, T.FLOOR); }
  }
  plaza(35, 45, 61, 62, (x, y) => hash(x, y, seed + 2) < 0.06 ? T.FLOWER : T.GRASS);
  // roads from the town to every area
  carve(48, 62, 48, 32); carve(48, 32, 15, 32); carve(15, 32, 15, 22); carve(48, 32, 48, 17); carve(48, 32, 80, 32); carve(80, 32, 80, 22);
  carve(40, 54, 15, 54); carve(56, 54, 80, 54);
  jetty(48, 63);
  addB(51, 46, 9, 5, 'palace', s.palace, s.style);
  addB(37, 46, 4, 3, 'house', null, s.style); addB(37, 51, 4, 3, 'house', null, s.style); addB(37, 57, 4, 3, 'house', null, s.style);
  addB(55, 56, 4, 3, 'house', 'Kedai', s.style); addB(56, 60, 3, 2, 'hut', null, s.style);
  // small huts out in the areas
  addB(22, 46, 3, 2, 'hut', null, s.style); addB(86, 45, 3, 2, 'hut', null, s.style); addB(24, 12, 3, 2, 'hut', null, s.style);
}
// chests on a state map: one per area, a little off the boss site
function stateChests(s) {
  return Object.keys(s.areas).map((k, i) => { const st = SLOT[k].site; return [st.x + (i % 2 ? 4.5 : -3.5), st.y + 4.5, i % 2 ? 'gold' + (3000 + 1500 * s.tier) : 'potion3', 'st' + s.tier + '_' + k]; });
}
