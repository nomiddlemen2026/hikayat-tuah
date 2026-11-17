'use strict';
// ---------------------------------------------------------------- dialogue
function say(lines, done) { dialog = { lines, i: 0, ch: 0, done }; state = 'dialog'; }
function advanceDialog() {
  const l = dialog.lines[dialog.i];
  if (dialog.ch < l[1].length) { dialog.ch = l[1].length; return; }
  dialog.i++; dialog.ch = 0;
  if (dialog.i >= dialog.lines.length) { const d = dialog.done; dialog = null; state = 'play'; if (d) d(); }
}
function startIntro() {
  say([
    ['', 'Melaka, in the golden age of the Sultanate...'],
    ['', 'Hang Tuah, the bravest Laksamana of Melaka, returns from a long voyage. But the town is quiet. Too quiet.'],
    ['Bendahara', 'Tuah! Thank heavens you are back. Your four sworn brothers, Jebat, Lekir, Lekiu and Kasturi, have all vanished!'],
    ['Bendahara', 'Bandits, pirates and dark spirits roam the land. And the legendary Keris Taming Sari has been taken to the Forgotten Temple.'],
    ['Bendahara', 'Only the five of you, together, can reclaim it. But you cannot fight with bare hands.'],
    ['Bendahara', 'Your old keris is in the chest beside your house, just south of here. Follow the golden arrow.'],
  ], () => { save.intro = true; writeSave(); toast('Prologue: Find a Weapon'); });
}
function talkBendahara() {
  const m = currentMission();
  if (!save.prologue) return say([['Bendahara', 'Your keris is in the chest next to your house, south of the plaza.']]);
  if (m === 'done') return say([['Bendahara', 'The Keris Taming Sari is back in worthy hands. Melaka owes the five of you everything!']]);
  say([['Bendahara', m.title + '. ' + m.hint], ['Bendahara', 'You have found ' + foundCount() + ' of your 4 brothers. Visit Mak Som if you need healing.']]);
}
function talkCaptive(k) {
  const boss = CAPTOR[k];
  if (!save.bossDead[boss]) return say([[HEROES[k].name, 'Tuah! Defeat ' + EDEF[boss].name + ' first, then cut me free!']]);
  const lines = {
    jebat: [['Hang Jebat', 'Tuah! I knew you would come. Those bandits will regret ever tying me up.'], ['Hang Jebat', 'Lead on, brother. My blade fights beside yours.']],
    lekir: [['Hang Lekir', 'The pirates wanted to sell me across the sea! You came just in time.'], ['Hang Lekir', 'Where to next? I am with you.']],
    lekiu: [['Hang Lekiu', 'That white tiger of Ledang guarded me for days. What a fight that was, Tuah!'], ['Hang Lekiu', 'Let us find the others.']],
    kasturi: [['Hang Kasturi', 'I thought that swamp would be my grave. The five of us are together again!'], ['Hang Kasturi', 'Now, to the Forgotten Temple. The Taming Sari awaits!']],
  }[k];
  say(lines, () => {
    save.found[k] = true;
    npcs = npcs.filter(n => n.hero !== k);
    companions.push({ id: k, x: player.x, y: player.y, face: 0, walk: 0, moving: false, atkCd: 1, atk: 0, idx: companions.length });
    gainXP(30 * (companions.length));
    audio.fanfare();
    toast(HEROES[k].name + ' joined your party!');
    if (foundCount() === 4) {
      openGate();
      setTimeout(() => say([['', 'A deep rumble echoes from the north-east... The gate of the Forgotten Temple has opened!'], ['Hang Tuah', 'Brothers, together we go. Mission 5: the Keris Taming Sari!']]), 600);
    } else { const m = currentMission(); setTimeout(() => toast(m.title), 1800); }
    writeSave();
  });
}
function takeTamingSari() {
  say([
    ['', 'Upon the ancient altar lies a keris whose wavy blade glows like the morning sun.'],
    ['Hang Tuah', 'The Keris Taming Sari... It feels as if it chose us.'],
    ['Hang Jebat', 'Five brothers, one blade. No enemy of Melaka will stand against us now.'],
    ['Hang Kasturi', 'Let us bring it home.'],
    ['Hang Tuah', '"Takkan Melayu hilang di dunia." Never shall our people vanish from this earth.'],
  ], () => {
    save.taming = true; save.ended = true;
    if (!save.owned.includes('taming')) save.owned.push('taming');
    save.weapon = 'taming'; gainXP(200); audio.fanfare(); writeSave();
    state = 'ending'; endingT = 0;
  });
}
function openChest(c) {
  c.open = true; save.chests[c.id] = true; audio.pickup();
  for (let i = 0; i < 16; i++) parts.push({ x: c.x, y: c.y - 8, vx: rr(-60, 60), vy: rr(-120, -30), life: 0.8, col: '#ffd54f', sz: 3, g: 200 });
  if (c.item.startsWith('potion')) { const n = +c.item.slice(6); save.potions += n; toast('Found ' + n + ' Jamu potions!'); }
  else {
    if (!save.owned.includes(c.item)) save.owned.push(c.item);
    const w = WEAPONS[c.item];
    if (w.dmg > WEAPONS[save.weapon].dmg || c.item === 'lembing') save.weapon = c.item;
    toast('Obtained ' + w.name + '!');
    if (c.item === 'keris' && !save.prologue) {
      save.prologue = true; save.weapon = 'keris';
      say([['Hang Tuah', 'My old keris. It has not lost its edge.'], ['Hang Tuah', 'Wait for me, brothers. First, Jebat. The Bendahara said bandits took him to the Eastern Jungle.']], () => toast(MISSIONS[0].title));
    }
  }
  writeSave();
}

