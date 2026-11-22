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
  city: { fog: '#d8d4cc', relief: [0, 1], foes: ['askar', 'pemanah'] },
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

// ---------------------------------------------------------------- the states (batch 1: Melaka, Negeri Sembilan, Johor, Pahang; batch 2: Terengganu, Kelantan, Perlis, Kedah;
// batch 3: Pulau Pinang, Perak, Selangor, Labuan; batch 4: Sabah, Sarawak, Putrajaya, Kuala Lumpur)
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
  {
    id: 'terengganu', name: 'Terengganu', town: 'Kuala Terengganu', palace: 'Istana Maziah', style: 'kampung',
    host: 'Tok Penghulu Losong', shopkeeper: 'Mak Wan', shop: ['jamu', 'badik', 'sumpit', 'kerisPanjang'], trim: '#ef5350',
    areas: {
      nw: { name: 'Hulu Terengganu', biome: 'jungle', landmark: 'shrine' },
      n: { name: 'Bukit Puteri', biome: 'hill', landmark: 'fort' },
      ne: { name: 'Pulau Redang', biome: 'beach' },
      sw: { name: 'Tasik Kenyir', biome: 'lake', landmark: 'lake' },
      se: { name: 'Pulau Duyong', biome: 'forest' },
    },
    chapters: [
      {
        title: 'The Stone of Kuala Berang', era: '1303', giver: 'Tok Penghulu Berang',
        intro: [['', 'The mist sails up the Terengganu River to Kuala Berang, in the year 1303.'],
          ['Tok Penghulu Berang', 'Laksamana, our ruler has carved the new laws onto a great stone, in Malay written with Jawi letters.'],
          ['Tok Penghulu Berang', 'It speaks of justice and of the faith of Islam that has come to our coast. The Bayang Masa want to smash it before it can be read.'],
          ['Hang Tuah', 'A stone that will one day prove how old our writing is. We guard it with our lives.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 14, title: 'Shadows of Kuala Berang', hint: 'Defeat 14 creatures in Hulu Terengganu (north-west).', reward: { gold: 16000 },
            done: [['Tok Penghulu Berang', 'The forest is calmer. But a stone giant has come for the inscription itself!']] },
          { type: 'boss', area: 'nw', title: 'Gergasi Pemecah Batu', hint: 'Stop the stone-breaker giant at the shrine in Hulu Terengganu.', reward: { gold: 18000 },
            boss: { name: 'Gergasi Pemecah Batu', look: 'golem', col: { body: '#5f6a72', head: '#76838c', limb: '#4d575e', eye: '#ef5350', moss: '#3a4a2a' }, scale: 2.2, moves: ['spin', 'charge', 'ring', 'summon'], summon: 'gergasi' },
            done: [['Tok Penghulu Berang', 'The stone is safe. It will lie in the river mud for six hundred years until someone finds it again.'],
              ['', 'History safe: the Batu Bersurat Terengganu, dated 1303, is the oldest known Malay writing in Jawi script. It is now in the Terengganu State Museum.']] },
        ],
      },
      {
        title: 'The Boatbuilders of Duyong', era: '1800s', giver: 'Pak Su Awang',
        intro: [['', 'The mist carries you to Pulau Duyong, an island in the mouth of the Terengganu River, in the 1800s.'],
          ['Pak Su Awang', 'We build perahu and great sailing ships here, Laksamana, from chengal wood, with no drawings at all. The design lives in our hands and our heads.'],
          ['Pak Su Awang', 'But shadows are setting fire to the boatyards, and a sea serpent off Pulau Redang is sinking every boat that leaves.'],
          ['Hang Lekir', 'A sea serpent! Finally something worth a fight at sea.']],
        missions: [
          { type: 'hunt', area: 'se', n: 14, title: 'Save the Boatyards', hint: 'Defeat 14 creatures on Pulau Duyong (south-east).', reward: { weapon: 'lading' },
            done: [['Pak Su Awang', 'The yards are safe! Take this lading. We use it to shape the hulls, and our fighters use it for everything else.'], ['', 'You obtained the Lading Terengganu!']] },
          { type: 'boss', area: 'ne', title: 'Ular Laut Bayang', hint: 'Slay the shadow sea serpent off Pulau Redang (north-east).', reward: { gold: 19000 },
            boss: { name: 'Ular Laut Bayang', look: 'snake', col: { skin: '#1e3a5a', belly: '#4fc3f7', glow: '#ef5350' }, scale: 1.9, moves: ['ring', 'pounce', 'knives', 'pounce', 'summon'], summon: 'hantu', orbs: true },
            done: [['Pak Su Awang', 'The sea is open again. Terengganu boats will sail to Siam, Java and China.'],
              ['', 'History safe: Pulau Duyong boatbuilders still make traditional boats by hand, a skill passed down for generations.']] },
        ],
      },
      {
        title: 'The Bell of Bukit Puteri', era: '1830s to 1870s', giver: 'Baginda Omar',
        intro: [['', 'The mist brings you to the hill fort of Bukit Puteri in Kuala Terengganu, in the time of Sultan Omar.'],
          ['Baginda Omar', 'From this hill we watch the river mouth. When enemies come, we ring the great bell so the whole town can prepare.'],
          ['Baginda Omar', 'The Bayang Masa have stolen the bell\'s voice. Without its warning, the town will be taken by surprise.'],
          ['Hang Kasturi', 'Then we take the hill back and let the bell ring again.']],
        missions: [
          { type: 'hunt', area: 'n', n: 14, title: 'Climb Bukit Puteri', hint: 'Defeat 14 creatures on Bukit Puteri (north).', reward: { gold: 20000 },
            done: [['Baginda Omar', 'The slopes are clear. The shadow captain holds the fort itself.']] },
          { type: 'boss', area: 'n', title: 'Hulubalang Bukit Puteri', hint: 'Defeat the shadow captain inside the fort on Bukit Puteri.', reward: { skill: 'ombak' },
            boss: { name: 'Hulubalang Bukit Puteri', look: 'human', weapon: 'gada', scale: 1.3, moves: ['spin', 'knives', 'spin', 'summon'], summon: 'askar' },
            done: [['', 'The great bell rings out over the South China Sea.'],
              ['Baginda Omar', 'Hear that? The sea itself answers. Take the power of the waves, Laksamana.'],
              ['', 'You learned Gelombang Ombak! History safe: the bell and the old fort walls can still be seen on Bukit Puteri today.']] },
        ],
      },
    ],
  },
  {
    id: 'kelantan', name: 'Kelantan', town: 'Kota Bharu', palace: 'Istana Jahar', style: 'kampung',
    host: 'Tok Penghulu Kota', shopkeeper: 'Kak Siti', shop: ['jamu', 'lading', 'badik', 'sumpit'], trim: '#ffca28',
    areas: {
      nw: { name: 'Gua Musang', biome: 'cave' },
      n: { name: 'Pantai Cahaya Bulan', biome: 'beach' },
      ne: { name: 'Sawah Tumpat', biome: 'paddy' },
      sw: { name: 'Hutan Kuala Krai', biome: 'jungle' },
      se: { name: 'Bukit Marak', biome: 'hill', landmark: 'shrine' },
    },
    chapters: [
      {
        title: 'Cik Siti Wan Kembang', era: '1600s', giver: 'Cik Siti Wan Kembang', pal: { female: true, baju: '#f8bbd0', sampin: '#ad1457', tanjak: '#ffd54f', trim: '#ffd54f', skin: '#c99062' },
        intro: [['', 'The mist lands in Kelantan, in the time of a legendary queen.'],
          ['Cik Siti Wan Kembang', 'Welcome, Laksamana. I rule Kelantan, and I ride to battle myself. Traders from Arabia and China come to my port.'],
          ['Cik Siti Wan Kembang', 'I keep a pet kijang, a golden barking deer. Now shadow hunters stalk it in the forests of Kuala Krai.'],
          ['Hang Lekiu', 'A queen who fights her own battles. We will find your kijang, Tuanku.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 14, title: 'Hunters in Kuala Krai', hint: 'Defeat 14 creatures in Hutan Kuala Krai (south-west).', reward: { gold: 20000 },
            done: [['Cik Siti Wan Kembang', 'I hear my kijang calling! But a great python has coiled around the place where it hides.']] },
          { type: 'boss', area: 'sw', title: 'Ular Sawa Bayang', hint: 'Defeat the shadow python in Hutan Kuala Krai and free the golden kijang.', reward: { gold: 22000 },
            boss: { name: 'Ular Sawa Bayang', look: 'snake', col: { skin: '#4a3a1e', belly: '#ffca28', glow: '#7c4dff' }, scale: 1.9, moves: ['pounce', 'ring', 'pounce', 'knives', 'summon'], summon: 'harimau', orbs: true },
            done: [['Cik Siti Wan Kembang', 'My kijang is safe! From today the kijang will be the symbol of Kelantan.'],
              ['', 'History safe: the kijang is still on the Kelantan state crest, and also on the emblem of Bank Negara Malaysia.']] },
        ],
      },
      {
        title: 'The Moon Kite', era: 'traditional', giver: 'Pak Mat Wau',
        intro: [['', 'The mist brings you to Pantai Cahaya Bulan on the day of the kite festival.'],
          ['Pak Mat Wau', 'This is the wau bulan, the moon kite, Laksamana. Bamboo frame, paper cut like lace, and a hummer that sings in the wind.'],
          ['Pak Mat Wau', 'Tonight there is Mak Yong theatre and wayang kulit too. But a shadow spirit is tearing every kite from the sky.'],
          ['Hang Jebat', 'Spirits that hate kites? These Bayang Masa really do hate fun.']],
        missions: [
          { type: 'hunt', area: 'n', n: 14, title: 'Clear the Festival Beach', hint: 'Defeat 14 creatures on Pantai Cahaya Bulan (north).', reward: { weapon: 'tekpi' },
            done: [['Pak Mat Wau', 'Our silat master watched you fight. He says you have earned the tekpi of Kelantan silat.'], ['', 'You obtained the Tekpi Kelantan!']] },
          { type: 'boss', area: 'n', title: 'Hantu Wau', hint: 'Defeat the kite-tearing spirit over Pantai Cahaya Bulan.', reward: { gold: 23000 },
            boss: { name: 'Hantu Wau', look: 'guardian', fly: true, col: { robe: '#1a237e', head: '#0d1442', gold: '#ffca28', eye: '#ffeb3b', aura: '#ffca28' }, scale: 1.5, moves: ['ring', 'pounce', 'knives', 'ring', 'summon'], summon: 'hantu' },
            done: [['', 'Hundreds of kites rise into the evening sky, humming like a choir.'],
              ['', 'History safe: the wau bulan is a symbol of Malaysia, and Mak Yong theatre from Kelantan is recognised by UNESCO.']] },
        ],
      },
      {
        title: 'Tok Janggut', era: '1915', giver: 'Tok Janggut',
        intro: [['', 'The mist moves to 1915, to Pasir Puteh in southern Kelantan.'],
          ['Tok Janggut', 'People call me Tok Janggut, for my long beard. The new land taxes are crushing our farmers, so we have risen up.'],
          ['Tok Janggut', 'Our fight is our own, Laksamana. But the Bayang Masa want the people to forget why we stood up. They burn the rice fields of Tumpat.'],
          ['Hang Tuah', 'The reasons people fought should never be forgotten. We will guard the fields.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 15, title: 'The Burning Fields', hint: 'Defeat 15 creatures in Sawah Tumpat (north-east).', reward: { gold: 24000 },
            done: [['Tok Janggut', 'The fields are saved. Their general waits at the shrine on Bukit Marak.']] },
          { type: 'boss', area: 'se', title: 'Panglima Bayang Kelantan', hint: 'Defeat the shadow general at the shrine on Bukit Marak (south-east).', reward: { gold: 26000 },
            boss: { name: 'Panglima Bayang Kelantan', look: 'human', weapon: 'tekpi', scale: 1.3, moves: ['pounce', 'spin', 'knives', 'pounce', 'summon'], summon: 'askar' },
            done: [['Tok Janggut', 'The people will remember. That is all a fighter can ask.'],
              ['', 'History safe: the Tok Janggut uprising of 1915 is remembered as one of the early Malay stands against colonial rule.']] },
        ],
      },
    ],
  },
  {
    id: 'perlis', name: 'Perlis', town: 'Kangar', palace: 'Istana Arau', style: 'kampung',
    host: 'Tok Penghulu Arau', shopkeeper: 'Pak Din', shop: ['jamu', 'tekpi', 'lading', 'badik'], trim: '#ab47bc',
    areas: {
      nw: { name: 'Gua Kelam', biome: 'cave', landmark: 'shrine' },
      n: { name: 'Bukit Wang Kelian', biome: 'hill' },
      ne: { name: 'Hutan Nakawan', biome: 'jungle' },
      sw: { name: 'Sawah Arau', biome: 'paddy' },
      se: { name: 'Kebun Harumanis', biome: 'plantation' },
    },
    chapters: [
      {
        title: 'The Dark Cave', era: 'early 1900s', giver: 'Tok Lombong',
        intro: [['', 'The mist lands in Perlis, the smallest state, among its limestone hills in the early 1900s.'],
          ['Tok Lombong', 'I mine tin, Laksamana. We carry the ore through Gua Kelam, the Dark Cave, along a stream that runs right through the hill.'],
          ['Tok Lombong', 'But now something huge with leathery wings lives in the cave, and no miner who goes in comes out.'],
          ['Hang Kasturi', 'Something with wings in a dark cave. I already do not like it.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 15, title: 'Into Gua Kelam', hint: 'Defeat 15 creatures in Gua Kelam (north-west).', reward: { gold: 26000 },
            done: [['Tok Lombong', 'I can hear the stream again. The beast nests deeper inside, by the old shrine.']] },
          { type: 'boss', area: 'nw', title: 'Raja Kelawar Bayang', hint: 'Defeat the shadow bat king deep in Gua Kelam.', reward: { gold: 28000 },
            boss: { name: 'Raja Kelawar Bayang', look: 'wisp', fly: true, col: { shell: '#4a148c', core: '#e1bee7' }, scale: 2.4, moves: ['ring', 'knives', 'ring', 'summon'], summon: 'hantu', orbs: true },
            done: [['Tok Lombong', 'The cave is ours again. One day there will be a wooden walkway here so anyone can walk through it.'],
              ['', 'History safe: Gua Kelam was used by tin miners, and today visitors walk through it on a suspended walkway.']] },
        ],
      },
      {
        title: 'The Kingdom of Perlis', era: '1843', giver: 'Syed Hussain',
        intro: [['', 'The mist moves to 1843. Perlis is about to become a kingdom of its own, separate from Kedah.'],
          ['Syed Hussain', 'I am Syed Hussain Jamalullail. I will be the first Raja of Perlis, and my family will rule here for generations.'],
          ['Syed Hussain', 'But shadows are trampling the rice of Arau, and a stone giant has taken Bukit Wang Kelian on the northern border.'],
          ['Hang Lekiu', 'A new kingdom needs a clear border. We will clear the hill.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 15, title: 'The Fields of Arau', hint: 'Defeat 15 creatures in Sawah Arau (south-west).', reward: { gold: 28000 },
            done: [['Syed Hussain', 'Arau is safe. Now for the giant on the border hill.']] },
          { type: 'boss', area: 'n', title: 'Gergasi Wang Kelian', hint: 'Defeat the stone giant on Bukit Wang Kelian (north).', reward: { weapon: 'sewar' },
            boss: { name: 'Gergasi Wang Kelian', look: 'golem', col: { body: '#bdb5a6', head: '#d0c8b8', limb: '#9e9688', eye: '#ab47bc', moss: '#6d7a4a' }, scale: 2.3, moves: ['charge', 'spin', 'ring', 'summon'], summon: 'gergasi' },
            done: [['Syed Hussain', 'Carry this sewar, the dagger of the northern Malay courts. You have earned a place in Perlis history.'],
              ['', 'You obtained the Sewar Kedah! History safe: the Jamalullail family still rules Perlis, and the Raja of Perlis has his palace at Arau.']] },
        ],
      },
      {
        title: 'The Harumanis Orchards', era: 'today and always', giver: 'Mak Teh Kebun', pal: { female: true, baju: '#ffcc80', sampin: '#2e7d32', tanjak: '#ffcc80', trim: '#fff3e0', skin: '#c99062' },
        intro: [['Mak Teh Kebun', 'Laksamana! Have you tasted harumanis? The sweetest mango in the world grows only here in Perlis.'],
          ['Mak Teh Kebun', 'A shadow spirit has made its home in the orchards. The trees are wilting and the mangoes fall before they ripen.'],
          ['Hang Jebat', 'Fight for mangoes? Gladly. As long as we get to taste some afterwards.']],
        missions: [
          { type: 'hunt', area: 'se', n: 15, title: 'Save the Mango Trees', hint: 'Defeat 15 creatures in Kebun Harumanis (south-east).', reward: { gold: 29000 },
            done: [['Mak Teh Kebun', 'The trees are greener already. The spirit hides in the forest of Nakawan.']] },
          { type: 'boss', area: 'ne', title: 'Penunggu Nakawan', hint: 'Defeat the shadow spirit in Hutan Nakawan (north-east).', reward: { gold: 31000 },
            boss: { name: 'Penunggu Nakawan', look: 'guardian', fly: true, col: { robe: '#2a1a3a', head: '#120a1c', gold: '#ab47bc', eye: '#ffeb3b', aura: '#ab47bc' }, scale: 1.5, moves: ['ring', 'pounce', 'summon', 'ring', 'knives'], summon: 'harimau' },
            done: [['Mak Teh Kebun', 'Here, eat! Sweet as honey. Now you know why Perlis is proud of its harumanis.'],
              ['', 'Perlis harumanis is protected as a product that can only come from Perlis. Pak Kemudi can now sail to Kedah.']] },
        ],
      },
    ],
  },
  {
    id: 'kedah', name: 'Kedah', town: 'Alor Setar', palace: 'Balai Besar', style: 'kampung',
    host: 'Tok Penghulu Alor Setar', shopkeeper: 'Mak Senah', shop: ['jamu', 'sewar', 'tekpi', 'lading'], trim: '#ffee58',
    areas: {
      nw: { name: 'Pulau Langkawi', biome: 'beach' },
      n: { name: 'Gunung Jerai', biome: 'highland' },
      ne: { name: 'Jelapang Padi', biome: 'paddy' },
      sw: { name: 'Lembah Bujang', biome: 'ruins', landmark: 'shrine' },
      se: { name: 'Hutan Baling', biome: 'jungle' },
    },
    chapters: [
      {
        title: 'The Bujang Valley', era: 'over 2,000 years ago', giver: 'Sang Pendeta',
        intro: [['', 'The mist sails further back than ever before, more than two thousand years, to the Merbok River in Kedah.'],
          ['Sang Pendeta', 'Welcome to Kedah Tua, the old kingdom of the Bujang Valley. Ships from India, Arabia and China anchor here.'],
          ['Sang Pendeta', 'We smelt iron by the Sungai Batu and build stone temples called candi. But a stone guardian has woken and turned on us.'],
          ['Hang Tuah', 'This may be the oldest kingdom we have ever seen. It must not be erased.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 15, title: 'Shadows Among the Candi', hint: 'Defeat 15 creatures in Lembah Bujang (south-west).', reward: { gold: 30000 },
            done: [['Sang Pendeta', 'The traders can land again. The guardian waits at the great candi.']] },
          { type: 'boss', area: 'sw', title: 'Penunggu Candi', hint: 'Defeat the corrupted guardian at the candi in Lembah Bujang.', reward: { gold: 32000 },
            boss: { name: 'Penunggu Candi', look: 'guardian', fly: true, col: { robe: '#5d4037', head: '#3e2723', gold: '#ffee58', eye: '#ff7043', aura: '#ffb300' }, scale: 1.6, moves: ['ring', 'pounce', 'summon', 'ring', 'knives'], summon: 'gergasi' },
            done: [['Sang Pendeta', 'The guardian sleeps peacefully again. Our temples will stand for a thousand years.'],
              ['', 'History safe: the Bujang Valley is one of the oldest civilisations in South-East Asia. The iron works at Sungai Batu are around 2,500 years old.']] },
        ],
      },
      {
        title: 'The Eagle of Langkawi', era: 'legend', giver: 'Penghulu Langkawi',
        intro: [['', 'The mist lands on the island of Langkawi. Its name is said to come from helang, eagle, and kawi, the reddish-brown colour of the eagle.'],
          ['Penghulu Langkawi', 'Our island has many legends, Laksamana, like the story of Mahsuri, the innocent woman whose curse lasted seven generations.'],
          ['Penghulu Langkawi', 'Now a giant shadow eagle hunts our fishermen. It flies from the beaches of Langkawi.'],
          ['Hang Lekir', 'An eagle the size of a ship? This journey gets stranger every day.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 15, title: 'The Beaches of Langkawi', hint: 'Defeat 15 creatures on Pulau Langkawi (north-west).', reward: { gold: 32000 },
            done: [['Penghulu Langkawi', 'The beaches are safe. Look up! The eagle is circling!']] },
          { type: 'boss', area: 'nw', title: 'Helang Bayang', hint: 'Defeat the giant shadow eagle on Pulau Langkawi.', reward: { gold: 34000 },
            boss: { name: 'Helang Bayang', look: 'guardian', fly: true, col: { robe: '#6d3a1a', head: '#f5f0e1', gold: '#ffb300', eye: '#ffeb3b', aura: '#ff7043' }, scale: 1.7, moves: ['pounce', 'ring', 'pounce', 'knives', 'summon'], summon: 'pemanah' },
            done: [['Penghulu Langkawi', 'The fishermen can go out again. One day there will be a great eagle statue by our harbour.'],
              ['', 'Langkawi is a UNESCO Global Geopark today, and Dataran Lang, the Eagle Square, welcomes visitors by the sea.']] },
        ],
      },
      {
        title: 'The Rice Bowl of Malaysia', era: '1136 to today', giver: 'Sultan Kedah',
        intro: [['', 'The mist moves through the centuries of the Kedah Sultanate, one of the oldest royal lines in the world, said to begin in 1136.'],
          ['Sultan Kedah', 'Our green fields feed the nation, Laksamana. They call Kedah the Rice Bowl of Malaysia.'],
          ['Sultan Kedah', 'The Bayang Masa want to poison the fields of Jelapang Padi, and a dragon has woken on Gunung Jerai, the mountain that guides every sailor home.'],
          ['Hang Tuah', 'Rice for the people and a light for the sailors. We will protect both.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 16, title: 'Guard the Rice Bowl', hint: 'Defeat 16 creatures in Jelapang Padi (north-east).', reward: { gold: 34000 },
            done: [['Sultan Kedah', 'The harvest is safe. Now climb Gunung Jerai.']] },
          { type: 'boss', area: 'n', title: 'Naga Bayang Jerai', hint: 'Defeat the shadow dragon on Gunung Jerai (north).', reward: { gold: 38000 },
            boss: { name: 'Naga Bayang Jerai', look: 'croc', col: { skin: '#3a3a1e', ridge: '#ffee58', horns: true }, scale: 2.5, moves: ['ring', 'charge', 'spin', 'knives', 'summon'], summon: 'beruang', orbs: 'fire' },
            done: [['Sultan Kedah', 'Kedah is safe, from the Bujang Valley to the top of Jerai.'],
              ['', 'History safe: Kedah\'s rice fields still feed much of Malaysia. Tunku Abdul Rahman, the first Prime Minister, was born in Alor Setar in 1903.']] },
        ],
      },
    ],
  },
  {
    id: 'penang', name: 'Pulau Pinang', town: 'George Town', palace: 'Dewan Bandaran', style: 'port',
    host: 'Penghulu George Town', shopkeeper: 'Nyonya Lim', shop: ['jamu', 'sewar', 'tekpi', 'lading'], trim: '#42a5f5',
    areas: {
      nw: { name: 'Bukit Bendera', biome: 'highland', landmark: 'shrine' },
      n: { name: 'Batu Ferringhi', biome: 'beach' },
      ne: { name: 'Kota Cornwallis', biome: 'forest', landmark: 'fort' },
      sw: { name: 'Seberang Perai', biome: 'paddy' },
      se: { name: 'Balik Pulau', biome: 'plantation' },
    },
    chapters: [
      {
        title: 'Kedah\'s Island', era: '1786', giver: 'Sultan Abdullah',
        intro: [['', 'The mist lands on a green island off the coast of Kedah, in 1786.'],
          ['Sultan Abdullah', 'I am Sultan Abdullah of Kedah. This island, Pulau Pinang, belongs to Kedah. I have let the British trading company use it, hoping they will protect us from our enemies.'],
          ['Sultan Abdullah', 'They are building a fort by the cape. But shadows are swarming over it, and something huge is moving inside the walls.'],
          ['Hang Tuah', 'Whatever the treaties say, the Bayang Masa have no place here. We will clear the fort.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 16, title: 'The Cape Fort', hint: 'Defeat 16 creatures around Kota Cornwallis (north-east).', reward: { gold: 36000 },
            done: [['Sultan Abdullah', 'The walls are quieter. But the giant still stands guard over the old cannon inside.']] },
          { type: 'boss', area: 'ne', title: 'Gergasi Meriam', hint: 'Defeat the cannon giant inside Kota Cornwallis.', reward: { potions: 10, gold: 38000 },
            boss: { name: 'Gergasi Meriam', look: 'golem', col: { body: '#4a4e52', head: '#5f656a', limb: '#3a3e42', eye: '#42a5f5', moss: '#6d5a3a' }, scale: 2.3, moves: ['charge', 'ring', 'spin', 'summon'], summon: 'gergasi' },
            done: [['Sultan Abdullah', 'The island is safe for now. Its future will be very different from what any of us expect.'],
              ['', 'History safe: Fort Cornwallis still stands in George Town. Its famous old cannon is called Seri Rambai.']] },
        ],
      },
      {
        title: 'The Spice Gardens', era: '1800s', giver: 'Pak Hamid Pala',
        intro: [['', 'The mist moves into the 1800s, to the quiet valleys of Balik Pulau on the far side of the island.'],
          ['Pak Hamid Pala', 'Smell that, Laksamana? Nutmeg and cloves! Spices were worth more than gold once, and they grow beautifully here.'],
          ['Pak Hamid Pala', 'A shadow giant of rotten wood has made a nest among the nutmeg trees. Our harvest is dying.'],
          ['Hang Lekir', 'Nutmeg... I remember Melaka\'s spice markets. We will save it.']],
        missions: [
          { type: 'hunt', area: 'se', n: 16, title: 'Save the Nutmeg Trees', hint: 'Defeat 16 creatures in Balik Pulau (south-east).', reward: { gold: 38000 },
            done: [['Pak Hamid Pala', 'The trees are breathing again. The giant waits in the middle of the gardens.']] },
          { type: 'boss', area: 'se', title: 'Gergasi Pala', hint: 'Defeat the spice garden giant in Balik Pulau.', reward: { potions: 10, gold: 40000 },
            boss: { name: 'Gergasi Pala', look: 'golem', col: { body: '#6d4c2a', head: '#8d6a3e', limb: '#5a3e22', eye: '#ffca28', moss: '#4a7a3a' }, scale: 2.2, moves: ['spin', 'charge', 'ring', 'summon'], summon: 'babi' },
            done: [['Pak Hamid Pala', 'Take some nutmeg candy for the road! Balik Pulau will always be famous for it.'],
              ['', 'History safe: Penang nutmeg is still grown in Balik Pulau and sold as candied nutmeg and balm.']] },
        ],
      },
      {
        title: 'City of Many Peoples', era: '1800s to 2008', giver: 'Baba Chong',
        intro: [['', 'The mist brings you into the streets of George Town, full of shophouses, temples, mosques and churches.'],
          ['Baba Chong', 'Welcome to George Town! Malays, Chinese, Indians, Peranakan, Eurasians... we all live side by side here.'],
          ['Baba Chong', 'On one street you will find a mosque, a church, a Chinese temple and a Hindu temple. People call it the Street of Harmony.'],
          ['Baba Chong', 'The Bayang Masa hate that. A shadow spirit on Bukit Bendera is spreading fear and suspicion across the whole city.'],
          ['Hang Kasturi', 'Different peoples living in peace. That is worth protecting more than any fort.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 16, title: 'Climb Bukit Bendera', hint: 'Defeat 16 creatures on Bukit Bendera (north-west).', reward: { gold: 40000 },
            done: [['Baba Chong', 'The fear is fading. The spirit sits at the old shrine on top of the hill.']] },
          { type: 'boss', area: 'nw', title: 'Hantu Syak Wasangka', hint: 'Defeat the spirit of suspicion on top of Bukit Bendera.', reward: { gold: 44000 },
            boss: { name: 'Hantu Syak Wasangka', look: 'guardian', fly: true, col: { robe: '#1a2a3a', head: '#0a121a', gold: '#42a5f5', eye: '#ff5252', aura: '#42a5f5' }, scale: 1.6, moves: ['ring', 'knives', 'summon', 'ring', 'pounce'], summon: 'harimau' },
            done: [['Baba Chong', 'Listen to the city! Temple bells, the call to prayer and church bells, all together.'],
              ['', 'History safe: in 2008 George Town and Melaka became a UNESCO World Heritage Site together.']] },
        ],
      },
    ],
  },
  {
    id: 'perak', name: 'Perak', town: 'Kuala Kangsar', palace: 'Istana Iskandariah', style: 'kampung',
    host: 'Tok Penghulu Kangsar', shopkeeper: 'Pak Yeop', shop: ['jamu', 'sewar', 'tekpi', 'kerisPanjang'], trim: '#ffd600',
    areas: {
      nw: { name: 'Pulau Pangkor', biome: 'beach' },
      n: { name: 'Gua Lenggong', biome: 'cave', landmark: 'shrine' },
      ne: { name: 'Hutan Belum', biome: 'jungle' },
      sw: { name: 'Lombong Kinta', biome: 'mine' },
      se: { name: 'Pasir Salak', biome: 'paddy', landmark: 'shrine' },
    },
    chapters: [
      {
        title: 'Perak Man', era: '11,000 years ago', giver: 'Ketua Puak Lenggong',
        intro: [['', 'The mist sails further back than ever: eleven thousand years, to the limestone caves of the Lenggong Valley.'],
          ['Ketua Puak Lenggong', 'Strangers with shining blades! We are hunters. We make stone tools here by the river and bury our elders with honour in the caves.'],
          ['Ketua Puak Lenggong', 'But a stone monster lives in the cave of our ancestors now. It wants to crush their bones and every trace of our people.'],
          ['Hang Tuah', 'The oldest people we have ever met. Their story must survive.']],
        missions: [
          { type: 'hunt', area: 'n', n: 16, title: 'The Caves of Lenggong', hint: 'Defeat 16 creatures in Gua Lenggong (north).', reward: { gold: 44000 },
            done: [['Ketua Puak Lenggong', 'The valley is safe. The monster waits by the burial shrine.']] },
          { type: 'boss', area: 'n', title: 'Gergasi Gua Runtuh', hint: 'Defeat the cave giant at the burial shrine in Gua Lenggong.', reward: { potions: 10, gold: 46000 },
            boss: { name: 'Gergasi Gua Runtuh', look: 'golem', col: { body: '#a89a86', head: '#bcae98', limb: '#8a7e6c', eye: '#ffd600', moss: '#5a6a3a' }, scale: 2.3, moves: ['charge', 'spin', 'ring', 'summon'], summon: 'gergasi' },
            done: [['Ketua Puak Lenggong', 'Our elders can rest. Thank you, strangers from the future.'],
              ['', 'History safe: in 1990 archaeologists found an 11,000-year-old skeleton here, Perak Man. The Lenggong Valley is a UNESCO World Heritage Site.']] },
        ],
      },
      {
        title: 'Tin of the Kinta Valley', era: '1848 to 1900s', giver: 'Long Jaafar',
        intro: [['', 'The mist moves to the middle of the 1800s. Perak has discovered a treasure in its rivers: tin.'],
          ['Long Jaafar', 'I am Long Jaafar, chief of Larut. My men found rich tin here, and now miners are coming from everywhere, especially from China.'],
          ['Long Jaafar', 'Tin will build towns like Taiping and Ipoh. But a shadow serpent has flooded the Kinta mines and swallows anyone who goes near.'],
          ['Hang Jebat', 'A serpent in a tin mine. I hope it tastes better than it sounds.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 16, title: 'The Flooded Mines', hint: 'Defeat 16 creatures at Lombong Kinta (south-west).', reward: { gold: 46000 },
            done: [['Long Jaafar', 'The miners are coming back. The serpent hides in the deepest mining pool.']] },
          { type: 'boss', area: 'sw', title: 'Naga Lombong', hint: 'Slay the mine serpent at Lombong Kinta.', reward: { potions: 10, gold: 50000 },
            boss: { name: 'Naga Lombong', look: 'snake', col: { skin: '#5a5a62', belly: '#ffd600', glow: '#7c4dff' }, scale: 2.0, moves: ['pounce', 'ring', 'knives', 'pounce', 'summon'], summon: 'gergasi', orbs: true },
            done: [['Long Jaafar', 'The mines will feed the world\'s tin for a hundred years.'],
              ['', 'History safe: the Kinta Valley was once the richest tin field in the world, and Ipoh grew into a great city from tin.']] },
        ],
      },
      {
        title: 'Maharaja Lela of Pasir Salak', era: '1875', giver: 'Maharaja Lela',
        intro: [['', 'The mist brings you to 1875, to the village of Pasir Salak on the Perak River.'],
          ['Maharaja Lela', 'I am Maharaja Lela. The British now say how Perak must be ruled. Many of us chiefs say Perak\'s customs belong to Perak.'],
          ['Maharaja Lela', 'That is a struggle between people, Laksamana, and it will be settled by people. But the Bayang Masa want to wipe out our stand from history.'],
          ['Hang Lekiu', 'Then we will make sure history remembers Pasir Salak.']],
        missions: [
          { type: 'hunt', area: 'se', n: 16, title: 'The Fields of Pasir Salak', hint: 'Defeat 16 creatures in Pasir Salak (south-east).', reward: { gold: 50000 },
            done: [['Maharaja Lela', 'Our village is clear. Their general waits by the old shrine.']] },
          { type: 'boss', area: 'se', title: 'Panglima Bayang Perak', hint: 'Defeat the shadow general at the shrine in Pasir Salak.', reward: { weapon: 'tombakBenderang' },
            boss: { name: 'Panglima Bayang Perak', look: 'human', weapon: 'tombakBenderang', scale: 1.3, moves: ['pounce', 'spin', 'knives', 'pounce', 'summon'], summon: 'askar' },
            done: [['Maharaja Lela', 'Carry this royal banner spear of Perak. Let it remind you that Perak never forgets its own.'],
              ['', 'You obtained the Tombak Benderang! History safe: Pasir Salak has a historical complex today that remembers Maharaja Lela and his fighters.']] },
        ],
      },
    ],
  },
  {
    id: 'selangor', name: 'Selangor', town: 'Klang', palace: 'Istana Alam Shah', style: 'port',
    host: 'Tok Penghulu Klang', shopkeeper: 'Mak Jah', shop: ['jamu', 'tombakBenderang', 'sewar', 'tekpi'], trim: '#ef5350',
    areas: {
      nw: { name: 'Bukit Melawati', biome: 'forest', landmark: 'fort' },
      n: { name: 'Batu Caves', biome: 'cave', landmark: 'shrine' },
      ne: { name: 'Hulu Selangor', biome: 'jungle' },
      sw: { name: 'Pelabuhan Klang', biome: 'beach' },
      se: { name: 'Ladang Getah', biome: 'plantation' },
    },
    chapters: [
      {
        title: 'The Fireflies of Melawati', era: '1784', giver: 'Sultan Ibrahim',
        intro: [['', 'The mist lands at Kuala Selangor in 1784, below a hill crowned with a fort.'],
          ['Sultan Ibrahim', 'I am Sultan Ibrahim of Selangor. My father, Sultan Salehuddin, a prince of Bugis blood, was the first Sultan of Selangor.'],
          ['Sultan Ibrahim', 'The Dutch took our fort on Bukit Melawati. We are taking it back. But a swarm of shadow fireflies has filled the hill with poison light.'],
          ['Hang Kasturi', 'The fireflies of Kuala Selangor are supposed to be beautiful, not deadly. Let us fix that.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 16, title: 'Up Bukit Melawati', hint: 'Defeat 16 creatures on Bukit Melawati (north-west).', reward: { gold: 50000 },
            done: [['Sultan Ibrahim', 'The slopes are ours. The swarm gathers inside the fort walls.']] },
          { type: 'boss', area: 'nw', title: 'Hantu Kelip-kelip', hint: 'Destroy the shadow firefly swarm inside the fort on Bukit Melawati.', reward: { potions: 10, gold: 54000 },
            boss: { name: 'Hantu Kelip-kelip', look: 'wisp', fly: true, col: { shell: '#76ff03', core: '#f4ff81' }, scale: 2.4, moves: ['ring', 'knives', 'ring', 'summon'], summon: 'hantu', orbs: true },
            done: [['', 'The poison light fades. Down by the river, thousands of real fireflies begin to blink in the mangrove trees.'],
              ['Sultan Ibrahim', 'The fort is ours again, and Selangor\'s night sky is back.'],
              ['', 'History safe: Sultan Ibrahim retook Kuala Selangor from the Dutch in 1785. The fireflies of Kampung Kuantan still glow there today.']] },
        ],
      },
      {
        title: 'The Rubber Estates', era: '1890s to 1950s', giver: 'Encik Muthu',
        intro: [['', 'The mist moves to the start of the 1900s. Endless rows of rubber trees now cover the Selangor hills.'],
          ['Encik Muthu', 'Good morning, Laksamana! I lead the tappers on this estate. We start before dawn, cutting the bark so the white latex drips into cups.'],
          ['Encik Muthu', 'Workers came from India, China and every Malay state. Rubber from Malaya makes the tyres of the whole world. But a shadow bear is attacking the tappers.'],
          ['Hang Lekiu', 'People working before dawn deserve to work in peace. Lead the way.']],
        missions: [
          { type: 'hunt', area: 'se', n: 16, title: 'Dawn Patrol', hint: 'Defeat 16 creatures in Ladang Getah (south-east).', reward: { gold: 54000 },
            done: [['Encik Muthu', 'The tappers are safe. The big one is still out among the trees.']] },
          { type: 'boss', area: 'se', title: 'Beruang Getah Bayang', hint: 'Defeat the shadow bear in Ladang Getah.', reward: { potions: 10, gold: 58000 },
            boss: { name: 'Beruang Getah Bayang', look: 'golem', col: { body: '#1e1a16', head: '#2e2620', limb: '#16120e', eye: '#ef5350', moss: '#e8e2d0' }, scale: 2.3, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'babi' },
            done: [['Encik Muthu', 'Thank you! Tomorrow we tap again before the sun comes up.'],
              ['', 'History safe: Malaya became the world\'s biggest rubber producer in the early 1900s, built by workers from many communities.']] },
        ],
      },
      {
        title: 'The 272 Steps', era: 'ancient hills to today', giver: 'Encik Thambi',
        intro: [['', 'The mist brings you to the great limestone hill of Batu Caves, hundreds of millions of years old.'],
          ['Encik Thambi', 'Inside this hill is a cave temple, reached by 272 steps. Every year at Thaipusam, crowds of devotees climb them.'],
          ['Encik Thambi', 'But a shadow guardian has taken the caves. The monkeys have fled, and no one can climb the steps.'],
          ['Hang Lekir', '272 steps? After all these years of fighting, that is nothing.']],
        missions: [
          { type: 'hunt', area: 'n', n: 16, title: 'Clear the Caves', hint: 'Defeat 16 creatures in Batu Caves (north).', reward: { gold: 58000 },
            done: [['Encik Thambi', 'The caves are clearing. The guardian waits in the great chamber.']] },
          { type: 'boss', area: 'n', title: 'Penunggu Batu Caves', hint: 'Defeat the shadow guardian in the great chamber of Batu Caves.', reward: { gold: 62000 },
            boss: { name: 'Penunggu Batu Caves', look: 'guardian', fly: true, col: { robe: '#3a1a1a', head: '#1a0a0a', gold: '#ffd54f', eye: '#ef5350', aura: '#ff7043' }, scale: 1.7, moves: ['ring', 'pounce', 'summon', 'ring', 'knives'], summon: 'hantu' },
            done: [['Encik Thambi', 'The steps are open again. Everyone can climb them, whoever they are.'],
              ['', 'History safe: Batu Caves has been a Hindu temple since 1891, and Thaipusam there draws over a million people every year.']] },
        ],
      },
    ],
  },
  {
    id: 'labuan', name: 'Labuan', town: 'Victoria', palace: 'Dewan Victoria', style: 'port',
    host: 'Penghulu Victoria', shopkeeper: 'Ah Seng', shop: ['jamu', 'tombakBenderang', 'sewar', 'badik'], trim: '#26a69a',
    areas: {
      nw: { name: 'Pulau Papan', biome: 'beach' },
      n: { name: 'Bukit Kubong', biome: 'highland' },
      ne: { name: 'Lombong Arang', biome: 'mine', landmark: 'shrine' },
      sw: { name: 'Paya Bebuloh', biome: 'swamp' },
      se: { name: 'Pantai Layang-Layangan', biome: 'beach', landmark: 'shrine' },
    },
    chapters: [
      {
        title: 'The Island of Coal', era: '1847 to 1911', giver: 'Mandur Arang',
        intro: [['', 'The mist sails east across the South China Sea to Labuan, an island off the coast of Borneo.'],
          ['Mandur Arang', 'Labuan sits on coal, Laksamana. Steamships stop here to fill up on their way between China and India.'],
          ['Mandur Arang', 'We have built a tall brick chimney for the mine. But a giant of black coal has crawled out of the shafts.'],
          ['Hang Jebat', 'A coal giant. At least it will be easy to see in the daylight.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 16, title: 'The Coal Shafts', hint: 'Defeat 16 creatures at Lombong Arang (north-east).', reward: { gold: 62000 },
            done: [['Mandur Arang', 'The shafts are quiet. The giant sits by the old chimney.']] },
          { type: 'boss', area: 'ne', title: 'Gergasi Arang', hint: 'Defeat the coal giant by the chimney at Lombong Arang.', reward: { potions: 10, gold: 66000 },
            boss: { name: 'Gergasi Arang', look: 'golem', col: { body: '#1a1a1e', head: '#2a2a30', limb: '#121216', eye: '#ff7043', moss: '#3a2a1a' }, scale: 2.3, moves: ['charge', 'ring', 'spin', 'summon'], summon: 'gergasi' },
            done: [['Mandur Arang', 'The mine is safe. One day the coal will run out, but the chimney will still stand.'],
              ['', 'History safe: the Chimney at Tanjung Kubong is a landmark of Labuan\'s coal mining days.']] },
        ],
      },
      {
        title: 'Pearl of Brunei Bay', era: '1846', giver: 'Nakhoda Labuan',
        intro: [['', 'The mist moves to 1846. Labuan has just been handed by the Sultan of Brunei to the British as a free port.'],
          ['Nakhoda Labuan', 'Ships from everywhere trade here, Laksamana, without paying taxes. Malays, Kadazan, Chinese, Bruneians... a busy little island.'],
          ['Nakhoda Labuan', 'But the mangroves of Bebuloh hide a shadow crocodile that drags whole boats under.'],
          ['Hang Tuah', 'A port needs safe water. We will hunt it down.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 16, title: 'The Bebuloh Mangroves', hint: 'Defeat 16 creatures in Paya Bebuloh (south-west).', reward: { gold: 66000 },
            done: [['Nakhoda Labuan', 'The boats are moving again. The big crocodile still lurks in the deep mangroves.']] },
          { type: 'boss', area: 'sw', title: 'Buaya Bayang Bebuloh', hint: 'Defeat the giant shadow crocodile in Paya Bebuloh.', reward: { potions: 10, gold: 70000 },
            boss: { name: 'Buaya Bayang Bebuloh', look: 'croc', col: { skin: '#2a3a2a', ridge: '#26a69a' }, scale: 2.4, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'buaya' },
            done: [['Nakhoda Labuan', 'Labuan will always be a meeting place of the seas.'],
              ['', 'History safe: Labuan is a Federal Territory of Malaysia today and still an international business centre.']] },
        ],
      },
      {
        title: 'The End of the War', era: '1945', giver: 'Penghulu Victoria',
        intro: [['', 'The mist brings you to September 1945. The Second World War is ending, after years of occupation and suffering.'],
          ['Penghulu Victoria', 'Here at Layang-Layangan, the Japanese army in Borneo will surrender. After so much pain, peace is finally coming.'],
          ['Penghulu Victoria', 'But the Bayang Masa have woken a spirit made of war itself. It wants the fighting never to end.'],
          ['Hang Kasturi', 'We have fought for hundreds of years in this journey. Let us fight once more, for peace.']],
        missions: [
          { type: 'hunt', area: 'se', n: 16, title: 'The Beach of Peace', hint: 'Defeat 16 creatures on Pantai Layang-Layangan (south-east).', reward: { gold: 70000 },
            done: [['Penghulu Victoria', 'The beach is clear. The war spirit waits at the memorial stone.']] },
          { type: 'boss', area: 'se', title: 'Roh Perang', hint: 'Defeat the spirit of war at the memorial on Pantai Layang-Layangan.', reward: { gold: 76000 },
            boss: { name: 'Roh Perang', look: 'guardian', fly: true, col: { robe: '#2a2a1a', head: '#121208', gold: '#9e9e9e', eye: '#ff1744', aura: '#ff5252' }, scale: 1.8, moves: ['ring', 'knives', 'pounce', 'ring', 'summon'], summon: 'askar' },
            done: [['', 'The war spirit fades into the sea wind. The beach is silent and peaceful.'],
              ['Penghulu Victoria', 'The war is over. Now the people of these lands must decide their own future.'],
              ['', 'History safe: the Japanese surrender in Borneo was signed on Labuan on 10 September 1945. The Labuan War Cemetery honours those who died.']] },
        ],
      },
    ],
  },
  {
    id: 'sabah', name: 'Sabah', town: 'Kota Kinabalu', palace: 'Rumah Besar', style: 'port',
    host: 'Ketua Kampung Likas', shopkeeper: 'Inah', shop: ['jamu', 'tombakBenderang', 'sewar', 'badik'], trim: '#ff7043',
    areas: {
      nw: { name: 'Pulau Sipadan', biome: 'beach' },
      n: { name: 'Gunung Kinabalu', biome: 'highland', landmark: 'shrine' },
      ne: { name: 'Sungai Kinabatangan', biome: 'swamp' },
      sw: { name: 'Sawah Tambunan', biome: 'paddy', landmark: 'shrine' },
      se: { name: 'Hutan Danum', biome: 'jungle' },
    },
    chapters: [
      {
        title: 'The Sacred Mountain', era: 'ancient belief', giver: 'Bobohizan', pal: { female: true, baju: '#1a1a1a', sampin: '#c62828', tanjak: '#ffd54f', trim: '#ffd54f', skin: '#c99062' },
        intro: [['', 'The mist sails across the sea to the land below the wind: Sabah, in northern Borneo. Above it towers Gunung Kinabalu.'],
          ['Bobohizan', 'I am a bobohizan, a priestess of the Kadazan Dusun. For us, Kinabalu is sacred. It is where the spirits of our ancestors rest.'],
          ['Bobohizan', 'The Bayang Masa have climbed the mountain and twisted a guardian spirit into something cruel. The ancestors cannot rest.'],
          ['Hang Tuah', 'Then we climb with respect, and we set the guardian free.']],
        missions: [
          { type: 'hunt', area: 'n', n: 16, title: 'The Slopes of Kinabalu', hint: 'Defeat 16 creatures on Gunung Kinabalu (north).', reward: { gold: 76000 },
            done: [['Bobohizan', 'The mountain breathes easier. The guardian waits at the shrine near the peak.']] },
          { type: 'boss', area: 'n', title: 'Roh Penjaga Kinabalu', hint: 'Free the guardian spirit at the shrine on Gunung Kinabalu.', reward: { potions: 10, gold: 80000 },
            boss: { name: 'Roh Penjaga Kinabalu', look: 'guardian', fly: true, col: { robe: '#1e2a3a', head: '#0e141c', gold: '#ff7043', eye: '#ffeb3b', aura: '#80deea' }, scale: 1.8, moves: ['ring', 'pounce', 'summon', 'ring', 'knives'], summon: 'beruang' },
            done: [['Bobohizan', 'The guardian is itself again. The ancestors are at peace.'],
              ['', 'Gunung Kinabalu, 4,095 m, is the highest mountain in Malaysia, and Kinabalu Park is a UNESCO World Heritage Site.']] },
        ],
      },
      {
        title: 'Kaamatan', era: 'harvest festival', giver: 'Ketua Kampung Tambunan',
        intro: [['Ketua Kampung Tambunan', 'Welcome to Tambunan, Laksamana! Every May we celebrate Kaamatan, the harvest festival, to thank the rice spirit, Bambaazon.'],
          ['Ketua Kampung Tambunan', 'There will be sumazau dancing, music of gongs, and the Unduk Ngadau pageant. But shadow beasts are trampling the fields before the harvest.'],
          ['Hang Lekir', 'No harvest, no festival. We cannot let that happen.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 16, title: 'Guard the Tambunan Fields', hint: 'Defeat 16 creatures in Sawah Tambunan (south-west).', reward: { gold: 80000 },
            done: [['Ketua Kampung Tambunan', 'The rice is safe! But their leader is still loose near the shrine of the rice spirit.']] },
          { type: 'boss', area: 'sw', title: 'Babi Raja Tambunan', hint: 'Defeat the giant shadow boar at the shrine in Sawah Tambunan.', reward: { potions: 10, gold: 84000 },
            boss: { name: 'Babi Raja Tambunan', look: 'boar', col: { body: '#2a1e18', head: '#3a2a20', mane: '#ff7043' }, scale: 2.2, moves: ['charge', 'spin', 'charge', 'summon'], summon: 'babi' },
            done: [['', 'The gongs ring out and the sumazau begins, dancers moving their arms like birds in flight.'],
              ['', 'Kaamatan is celebrated across Sabah every May, a thanksgiving for the rice harvest.']] },
        ],
      },
      {
        title: 'Mat Salleh', era: '1894 to 1900', giver: 'Mat Salleh',
        intro: [['', 'The mist moves to the 1890s. A trading company now rules North Borneo and taxes its peoples heavily.'],
          ['Mat Salleh', 'I am Datu Muhammad Salleh. People call me Mat Salleh. I have risen against the company\'s rule and built forts across this land.'],
          ['Mat Salleh', 'The Bayang Masa want my people\'s stand forgotten. They have sent a great crocodile to the Kinabatangan to cut us off.'],
          ['Hang Jebat', 'A fighter after my own heart. Leave the crocodile to us, Datu.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 17, title: 'The Kinabatangan River', hint: 'Defeat 17 creatures along Sungai Kinabatangan (north-east).', reward: { gold: 84000 },
            done: [['Mat Salleh', 'The river is clear. The great crocodile waits in the deep bend.']] },
          { type: 'boss', area: 'ne', title: 'Buaya Raja Kinabatangan', hint: 'Defeat the giant crocodile in Sungai Kinabatangan.', reward: { weapon: 'kampilan' },
            boss: { name: 'Buaya Raja Kinabatangan', look: 'croc', col: { skin: '#3a3a26', ridge: '#ff7043' }, scale: 2.5, moves: ['charge', 'spin', 'charge', 'ring', 'summon'], summon: 'buaya' },
            done: [['Mat Salleh', 'Take this kampilan, the great sword of our coasts. Swing it for justice.'],
              ['', 'You obtained the Kampilan! History safe: Mat Salleh fell at Tambunan in 1900. A memorial stands there today, and he is remembered as a hero of Sabah.']] },
        ],
      },
    ],
  },
  {
    id: 'sarawak', name: 'Sarawak', town: 'Kuching', palace: 'Astana', style: 'kampung',
    host: 'Tok Penghulu Kuching', shopkeeper: 'Mak Dayang', shop: ['jamu', 'kampilan', 'tombakBenderang', 'sewar'], trim: '#ffeb3b',
    areas: {
      nw: { name: 'Gua Niah', biome: 'cave', landmark: 'shrine' },
      n: { name: 'Gunung Santubong', biome: 'highland', landmark: 'shrine' },
      ne: { name: 'Rumah Panjang Batang Ai', biome: 'jungle', landmark: 'shrine' },
      sw: { name: 'Paya Bako', biome: 'swamp' },
      se: { name: 'Hutan Mulu', biome: 'jungle' },
    },
    chapters: [
      {
        title: 'The Deep Skull of Niah', era: '40,000 years ago', giver: 'Pemburu Niah',
        intro: [['', 'The mist sails into the deepest past of all: forty thousand years ago, to a vast cave in Sarawak.'],
          ['Pemburu Niah', 'You walk like people, but you shine like spirits! We hunt in this forest and shelter in this great cave.'],
          ['Pemburu Niah', 'A shadow spirit has come into the cave. It wants to swallow us, so that no one will ever know we lived here.'],
          ['Hang Kasturi', 'Forty thousand years... these may be the first people of all. We will not let them be forgotten.']],
        missions: [
          { type: 'hunt', area: 'nw', n: 17, title: 'The Great Cave', hint: 'Defeat 17 creatures in Gua Niah (north-west).', reward: { gold: 86000 },
            done: [['Pemburu Niah', 'The cave is calm. The spirit hides deep inside, by our sacred stones.']] },
          { type: 'boss', area: 'nw', title: 'Roh Gua Niah', hint: 'Defeat the shadow spirit at the sacred stones in Gua Niah.', reward: { potions: 10, gold: 90000 },
            boss: { name: 'Roh Gua Niah', look: 'wisp', fly: true, col: { shell: '#5d4037', core: '#ffeb3b' }, scale: 2.5, moves: ['ring', 'knives', 'ring', 'summon'], summon: 'hantu', orbs: 'fire' },
            done: [['Pemburu Niah', 'We are safe. Go well, shining strangers.'],
              ['', 'History safe: in 1958 archaeologists found the Deep Skull in the Niah Caves, about 40,000 years old, among the oldest modern human remains in South-East Asia.']] },
        ],
      },
      {
        title: 'The Princesses of Santubong', era: 'legend', giver: 'Tok Penglipur Lara',
        intro: [['Tok Penglipur Lara', 'Sit, sit, Laksamana. I am a storyteller. Look at that mountain by the sea: Gunung Santubong.'],
          ['Tok Penglipur Lara', 'Long ago two heavenly princesses, Santubong and Sejinjang, lived here in peace, until they quarrelled over a prince. They were cursed and turned into mountains.'],
          ['Tok Penglipur Lara', 'Now the Bayang Masa have woken that old curse. It walks the mountain, turning everyone it meets against each other.'],
          ['Hang Lekiu', 'A curse born from a quarrel. Let us end it before it starts another one.']],
        missions: [
          { type: 'hunt', area: 'n', n: 17, title: 'The Slopes of Santubong', hint: 'Defeat 17 creatures on Gunung Santubong (north).', reward: { gold: 90000 },
            done: [['Tok Penglipur Lara', 'Good! The curse itself waits at the shrine on the mountain.']] },
          { type: 'boss', area: 'n', title: 'Sumpahan Santubong', hint: 'Break the curse at the shrine on Gunung Santubong.', reward: { potions: 10, gold: 94000 },
            boss: { name: 'Sumpahan Santubong', look: 'guardian', fly: true, col: { robe: '#4a148c', head: '#1a0a2a', gold: '#ffeb3b', eye: '#ff4081', aura: '#e040fb' }, scale: 1.8, moves: ['ring', 'pounce', 'knives', 'ring', 'summon'], summon: 'harimau' },
            done: [['Tok Penglipur Lara', 'The curse is broken, but the mountains stay, so we always remember what quarrels cost.'],
              ['', 'The legend of Puteri Santubong is one of Sarawak\'s best-loved stories, and it has its own famous song.']] },
        ],
      },
      {
        title: 'The Longhouse', era: 'Iban tradition', giver: 'Tuai Rumah',
        intro: [['', 'The mist brings you up the Batang Ai river to an Iban longhouse: a whole village under one long roof.'],
          ['Tuai Rumah', 'I am the tuai rumah, chief of this longhouse. Fifty families live here, each with a door onto one shared gallery, the ruai.'],
          ['Tuai Rumah', 'Soon it will be Gawai, our harvest festival, with tuak and ngajat dances. But a shadow clouded leopard is stalking the forest paths.'],
          ['Hang Tuah', 'A whole village under one roof. That is a home worth defending.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 17, title: 'The Forest Paths', hint: 'Defeat 17 creatures around Rumah Panjang Batang Ai (north-east).', reward: { gold: 94000 },
            done: [['Tuai Rumah', 'The paths are safe. The leopard waits near our shrine.']] },
          { type: 'boss', area: 'ne', title: 'Harimau Dahan Bayang', hint: 'Defeat the shadow clouded leopard by the longhouse shrine.', reward: { weapon: 'mandau' },
            boss: { name: 'Harimau Dahan Bayang', look: 'tiger', col: { fur: '#8a8270', stripe: '#1a1620' }, scale: 1.9, moves: ['pounce', 'pounce', 'spin', 'summon'], summon: 'harimau' },
            done: [['Tuai Rumah', 'You fight like a true Iban warrior. Take this mandau, and join us for Gawai!'],
              ['', 'You obtained the Mandau Dayak! Gawai Dayak is celebrated across Sarawak on 1 June every year.']] },
        ],
      },
    ],
  },
  {
    id: 'putrajaya', name: 'Putrajaya', town: 'Presint 1', palace: 'Perdana Putra', style: null,
    host: 'Penjawat Awam', shopkeeper: 'Encik Farid', shop: ['jamu', 'mandau', 'kampilan', 'tombakBenderang'], trim: '#90caf9',
    areas: {
      nw: { name: 'Taman Botani', biome: 'forest' },
      n: { name: 'Tasik Putrajaya', biome: 'lake', landmark: 'lake' },
      ne: { name: 'Taman Wetland', biome: 'swamp' },
      sw: { name: 'Ladang Prang Besar', biome: 'plantation' },
      se: { name: 'Bukit Presint', biome: 'hill' },
    },
    chapters: [
      {
        title: 'From Rubber Estate to City', era: '1995 to 1999', giver: 'Arkitek Aminah', pal: { female: true, baju: '#90caf9', sampin: '#1565c0', tanjak: '#e3f2fd', trim: '#ffffff', skin: '#d2a070' },
        intro: [['', 'The mist sails into recent times: 1995. On an old rubber estate called Prang Besar, a brand new city is being planned.'],
          ['Arkitek Aminah', 'Welcome, Laksamana! I am one of the architects. Here we will build Putrajaya, the new home of the federal government.'],
          ['Arkitek Aminah', 'But shadows have come out of the old rubber trees. They want the city never to be built.'],
          ['Hang Jebat', 'Even the future needs guarding, it seems.']],
        missions: [
          { type: 'hunt', area: 'sw', n: 17, title: 'The Old Estate', hint: 'Defeat 17 creatures in Ladang Prang Besar (south-west).', reward: { gold: 96000 },
            done: [['Arkitek Aminah', 'The surveyors can work again. But something big is moving among the old trees.']] },
          { type: 'boss', area: 'sw', title: 'Gergasi Getah Tua', hint: 'Defeat the old rubber giant in Ladang Prang Besar.', reward: { potions: 10, gold: 100000 },
            boss: { name: 'Gergasi Getah Tua', look: 'golem', col: { body: '#5a4a3a', head: '#6d5a48', limb: '#4a3a2a', eye: '#90caf9', moss: '#e8e2d0' }, scale: 2.3, moves: ['charge', 'spin', 'ring', 'summon'], summon: 'askar' },
            done: [['Arkitek Aminah', 'Now we can build. In 1999 the Prime Minister\'s office will move here.'],
              ['', 'History safe: Putrajaya became the federal administrative centre of Malaysia in 1999, and a Federal Territory in 2001.']] },
        ],
      },
      {
        title: 'The Wetland of Birds', era: '1997 to today', giver: 'Arkitek Aminah',
        intro: [['Arkitek Aminah', 'Putrajaya is a garden city. We have built wetlands to clean the water before it reaches the lake, and birds have come from everywhere.'],
          ['Arkitek Aminah', 'But a shadow heron as big as a house is hunting the wetlands. The birds are fleeing.'],
          ['Hang Lekir', 'A giant heron. Of course it is.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 17, title: 'The Wetland Paths', hint: 'Defeat 17 creatures in Taman Wetland (north-east).', reward: { gold: 100000 },
            done: [['Arkitek Aminah', 'The birds are coming back. The heron is somewhere deeper in the marsh.']] },
          { type: 'boss', area: 'ne', title: 'Bangau Bayang', hint: 'Defeat the giant shadow heron in Taman Wetland.', reward: { potions: 10, gold: 104000 },
            boss: { name: 'Bangau Bayang', look: 'guardian', fly: true, col: { robe: '#eceff1', head: '#263238', gold: '#ffca28', eye: '#ff1744', aura: '#90caf9' }, scale: 1.8, moves: ['pounce', 'ring', 'pounce', 'knives', 'summon'], summon: 'hantu' },
            done: [['Arkitek Aminah', 'Listen to them sing! The wetlands are alive.'],
              ['', 'Putrajaya Wetlands is one of the largest man-made freshwater wetlands in the tropics.']] },
        ],
      },
      {
        title: 'The Lake of Bridges', era: 'today', giver: 'Penjawat Awam',
        intro: [['Penjawat Awam', 'Laksamana, our city sits around a great lake, crossed by beautiful bridges. The pink-domed Putra Mosque stands on its shore.'],
          ['Penjawat Awam', 'Something old has crawled into the new lake: a shadow dragon. It rises from the water at the island in the middle.'],
          ['Hang Tuah', 'We have fought dragons in Pahang and Kedah. One more will not stop us.']],
        missions: [
          { type: 'hunt', area: 'n', n: 17, title: 'The Lakeshore', hint: 'Defeat 17 creatures around Tasik Putrajaya (north).', reward: { gold: 104000 },
            done: [['Penjawat Awam', 'The shore is safe. The dragon waits on the island.']] },
          { type: 'boss', area: 'n', title: 'Naga Tasik Bayang', hint: 'Defeat the shadow dragon on the island in Tasik Putrajaya.', reward: { potions: 15, gold: 110000 },
            boss: { name: 'Naga Tasik Bayang', look: 'croc', col: { skin: '#1e3a5a', ridge: '#90caf9', horns: true }, scale: 2.5, moves: ['ring', 'charge', 'spin', 'knives', 'summon'], summon: 'buaya', orbs: true },
            done: [['Penjawat Awam', 'The lake is calm. One last journey remains, Laksamana: Kuala Lumpur, and the day this nation was born.'],
              ['', 'Pak Kemudi can now sail to Kuala Lumpur for the final chapters.']] },
        ],
      },
    ],
  },
  {
    id: 'kl', name: 'Kuala Lumpur', town: 'Kuala Lumpur', palace: 'Bangunan Sultan Abdul Samad', style: null,
    host: 'Tok Penghulu Kuala Lumpur', shopkeeper: 'Uncle Lim', shop: ['jamu', 'mandau', 'kampilan', 'tombakBenderang'], trim: '#ffd54f',
    areas: {
      nw: { name: 'Bukit Nanas', biome: 'forest' },
      n: { name: 'Lombong Ampang', biome: 'mine' },
      ne: { name: 'Kuala Sungai Gombak', biome: 'swamp', landmark: 'shrine' },
      sw: { name: 'Dataran Merdeka', biome: 'city', landmark: 'shrine' },
      se: { name: 'Stadium Merdeka', biome: 'city', landmark: 'fort' },
    },
    chapters: [
      {
        title: 'The Muddy Confluence', era: '1857 to 1880s', giver: 'Yap Ah Loy',
        intro: [['', 'The mist sails up the Klang River to 1857, where it meets the Gombak. Tin miners have just arrived in the jungle here.'],
          ['Yap Ah Loy', 'This place has no name yet, so the miners call it Kuala Lumpur: the muddy confluence. I am Yap Ah Loy, Kapitan Cina of this town.'],
          ['Yap Ah Loy', 'Fires, floods and wars have burned it down again and again, but we keep rebuilding in brick. Now a mud dragon rises from the Ampang mines!'],
          ['Hang Tuah', 'A muddy village that will become a capital. We will make sure it gets the chance.']],
        missions: [
          { type: 'hunt', area: 'n', n: 18, title: 'The Ampang Tin Mines', hint: 'Defeat 18 creatures at Lombong Ampang (north).', reward: { gold: 110000 },
            done: [['Yap Ah Loy', 'The miners are safe. The dragon waits in the deepest pit.']] },
          { type: 'boss', area: 'n', title: 'Naga Lumpur', hint: 'Defeat the mud dragon at Lombong Ampang.', reward: { potions: 15, gold: 116000 },
            boss: { name: 'Naga Lumpur', look: 'croc', col: { skin: '#5d4a32', ridge: '#ffd54f', horns: true }, scale: 2.6, moves: ['ring', 'charge', 'spin', 'knives', 'summon'], summon: 'gergasi', orbs: 'fire' },
            done: [['Yap Ah Loy', 'Kuala Lumpur will grow. In 1896 it will become the capital of the Federated Malay States.'],
              ['', 'History safe: Kuala Lumpur grew from a tin-mining village at the meeting of the Klang and Gombak rivers into Malaysia\'s capital.']] },
        ],
      },
      {
        title: 'Merdeka!', era: '31 August 1957', giver: 'Tunku Abdul Rahman',
        intro: [['', 'The mist brings you to the night of 30 August 1957, on the padang in front of the Sultan Abdul Samad Building.'],
          ['Tunku Abdul Rahman', 'Laksamana Tuah! I have heard stories of you all my life. Tonight, at midnight, the Union Jack comes down and our own flag goes up.'],
          ['Tunku Abdul Rahman', 'Tomorrow at Stadium Merdeka I will declare that the Federation of Malaya is independent. But the shadows have come in force to stop it.'],
          ['Hang Jebat', 'Hundreds of years of history have been leading to this. Let us finish it, brothers!']],
        missions: [
          { type: 'hunt', area: 'sw', n: 18, title: 'Midnight on the Padang', hint: 'Defeat 18 shadows on Dataran Merdeka (south-west) before midnight.', reward: { gold: 120000 },
            done: [['', 'The clock strikes midnight. The new flag of Malaya rises over the padang as the crowd cheers.'],
              ['Tunku Abdul Rahman', 'Now to the stadium! But the shadow lord himself is waiting there.']] },
          { type: 'boss', area: 'se', title: 'Raja Bayang Masa', hint: 'Defeat the Lord of the Time Shadows at Stadium Merdeka (south-east).', reward: { skill: 'naga' },
            boss: { name: 'Raja Bayang Masa', look: 'guardian', fly: true, col: { robe: '#0e0a1a', head: '#05030a', gold: '#ffd54f', eye: '#ff1744', aura: '#7c4dff' }, scale: 2.1, moves: ['ring', 'pounce', 'summon', 'knives', 'ring', 'spin'], summon: 'askar' },
            done: [['', 'The morning of 31 August 1957. The stadium is full. Tunku Abdul Rahman raises his hand and cries out, seven times:'],
              ['Tunku Abdul Rahman', 'MERDEKA! MERDEKA! MERDEKA! MERDEKA! MERDEKA! MERDEKA! MERDEKA!'],
              ['', 'The fire of the old dragons answers your courage. You learned the ultimate skill Nafas Naga!']] },
        ],
      },
      {
        title: 'Malaysia Day', era: '16 September 1963', giver: 'Tunku Abdul Rahman',
        intro: [['', 'The mist moves six years on, to 16 September 1963.'],
          ['Tunku Abdul Rahman', 'Today Malaya, Sabah, Sarawak and Singapore join together as one new nation: Malaysia.'],
          ['Tunku Abdul Rahman', 'You have walked through every one of these lands, Laksamana. You know better than anyone what this union means.'],
          ['Tunku Abdul Rahman', 'But the very last of the Bayang Masa has gathered all its strength at the river confluence. It wants to tear the new nation apart.'],
          ['Hang Tuah', 'Brothers. One last fight, for all the states at once.']],
        missions: [
          { type: 'hunt', area: 'ne', n: 20, title: 'The Gathering Shadows', hint: 'Defeat 20 shadows at Kuala Sungai Gombak (north-east).', reward: { gold: 130000 },
            done: [['Hang Kasturi', 'They are breaking! There, at the confluence: the last shadow!']] },
          { type: 'boss', area: 'ne', title: 'Bayang Masa Terakhir', hint: 'Defeat the last Time Shadow at the shrine of Kuala Sungai Gombak.', reward: { weapon: 'kerisWarisan', gold: 200000 },
            boss: { name: 'Bayang Masa Terakhir', look: 'guardian', fly: true, col: { robe: '#000000', head: '#000000', gold: '#e040fb', eye: '#ffffff', aura: '#e040fb' }, scale: 2.4, moves: ['ring', 'pounce', 'summon', 'knives', 'ring', 'spin', 'summon'], summon: 'hantu' },
            done: [['', 'The last shadow shatters into light. Across every state, from Perlis to Sabah, the river of time flows clear.'],
              ['Puteri Bunian', 'You did it, Laksamana. The history of these lands is safe. My people forged this keris from the light of every state you saved.'],
              ['', 'You obtained the Keris Panca Warisan, the Keris of Heritage!'],
              ['Hang Tuah', '"Takkan Melayu hilang di dunia." And now, this nation will not be lost either. Let us go home, brothers.'],
              ['', 'History safe: Malaysia was formed on 16 September 1963. Singapore left in 1965. Malaysia Day is celebrated every year on 16 September.']] },
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
    case 'hill': return n > 0.64 || h < 0.045 ? T.ROCK : T.DIRT;
    case 'swamp': return n > 0.64 ? T.WATER : (h < 0.07 ? T.MANGROVE : T.SWAMP);
    case 'beach': return h < 0.05 ? T.PALM : T.SAND;
    case 'paddy': return (y % 5 === 0 && x % 9 !== 0) ? T.GRASS : T.PADDY;
    case 'mine': return n > 0.62 ? T.WATER : (h < 0.05 ? T.ROCK : T.DIRT);
    case 'ruins': return n > 0.66 || h < 0.05 ? T.JTREE : (h > 0.975 ? T.PILLAR : T.DARK);
    case 'highland': return n > 0.55 || h < 0.08 ? T.TREE : (h > 0.9 ? T.FLOWER : T.GRASS);
    case 'plantation': return (x % 3 === 0 && y % 3 === 0 && h < 0.9) ? T.TREE : (h > 0.96 ? T.FLOWER : T.GRASS);
    case 'lake': return h < 0.06 ? T.TREE : (h > 0.9 ? T.FLOWER : T.GRASS);
    case 'cave': return n > 0.6 || h < 0.07 ? T.ROCK : T.ASH;
    case 'city': return (x % 6 === 0 && y % 6 === 0) ? T.TREE : (h > 0.96 ? T.FLOWER : (x % 6 === 3 || y % 6 === 3 ? T.PATH : T.FLOOR));
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
    const ground = { jungle: T.DARK, forest: T.GRASS, hill: T.DIRT, swamp: T.SWAMP, beach: T.SAND, paddy: T.GRASS, mine: T.DIRT, ruins: T.DARK, highland: T.GRASS, plantation: T.GRASS, lake: T.GRASS, cave: T.ASH, city: T.FLOOR }[b] || T.GRASS;
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
