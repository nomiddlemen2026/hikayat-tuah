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
  if (save.chapter >= 5) return say([['Bendahara', 'Kampung Bendahara, Pulau Naga, even the hidden Bunian... and now a journey through time itself. Your hikayat will be told for a thousand years, Tuah.'], ['Bendahara', 'Pak Kemudi waits with the Bunian ship at the jetty.']]);
  if (save.chapter >= 2) { const ch = curChapter(); return say([['Bendahara', ch.title + '. Pak Kemudi waits at the jetty south of the town to sail you to ' + MAPS[ch.map].name + '.'], ['Bendahara', 'Tok Besi has new weapons for sale, and Mak Som will always heal you.']]); }
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
  else if (c.item.startsWith('gold')) { const n = +c.item.slice(4); save.gold += n; toast('Found ' + n.toLocaleString() + ' ' + CURRENCY + '!'); }
  else {
    if (!save.owned.includes(c.item)) save.owned.push(c.item);
    const w = WEAPONS[c.item];
    if (w.dmg > WEAPONS[save.weapon].dmg || (c.item === 'lembing' && save.chapter < 2)) save.weapon = c.item;
    toast('Obtained ' + w.name + '!');
    if (c.item === 'keris' && !save.prologue) {
      save.prologue = true; save.weapon = 'keris';
      say([['Hang Tuah', 'My old keris. It has not lost its edge.'], ['Hang Tuah', 'Wait for me, brothers. First, Jebat. The Bendahara said bandits took him to the Eastern Jungle.']], () => toast(MISSIONS[0].title));
    }
  }
  writeSave();
}


// ---------------------------------------------------------------- chapters 2 to 4
// Called when the player taps past an ending screen.
function afterEnding() {
  state = 'play';
  if (save.chapter >= 5 && !save.statesIntro) { setTimeout(startStatesArc, 300); return; }
  if (save.chapter === 1 && save.taming) {
    save.chapter = 2; save.ci = 0; save.hunt = 0;
    if (!save.unlocked.includes('bendahara')) save.unlocked.push('bendahara');
    writeSave();
    setTimeout(() => say([
      ['Bendahara', 'Tuah! Forgive me for spoiling the celebration, but a messenger has come from Kampung Bendahara, up the coast.'],
      ['Bendahara', 'A dark sorcerer has cursed the forest there, Hutan Larangan. The villagers beg for the Laksamana of Melaka.'],
      ['Hang Tuah', 'Then our hikayat is not over yet. Brothers, to the jetty!'],
      ['', 'CHAPTER 2 begins. Talk to Pak Kemudi at the jetty south of Kota Melaka to sail.'],
    ], () => toast(CHAPTERS[2].title)), 300);
  }
}
function checkChapterIntro() {
  if (save.chapter >= 5 && !save.statesIntro) { if (state === 'play') startStatesArc(); return; }
  const ch = curChapter();
  if (!ch || MAP !== ch.map || state !== 'play') return checkPendingMission();
  if (!save.chIntro[save.chapter]) {
    say(ch.intro, () => { save.chIntro[save.chapter] = true; writeSave(); const m = curMission(); if (m) toast(m.title); checkPendingMission(); });
  } else checkPendingMission();
}
// a mission whose goal was reached but not handed in (for example the game was closed)
function checkPendingMission() {
  const ch = curChapter(), m = curMission();
  if (!ch || !m || MAP !== ch.map) return;
  if ((m.type === 'hunt' && save.hunt >= m.n) || (m.type === 'boss' && save.bossDead[m.boss])) setTimeout(completeMission, 600);
}
function spawnMissionBoss() {
  const ch = curChapter(), m = curMission();
  if (!ch || !m || MAP !== ch.map || m.type !== 'boss' || save.bossDead[m.boss]) return;
  if (enemies.some(e => e.type === m.boss && e.hp > 0)) return;
  const s = SITES[m.site];
  spawnEnemy(m.boss, (s.x + 0.5) * TS, (s.y + 0.5) * TS, true);
}
function missionKill(e) {
  const ch = curChapter(), m = curMission();
  if (!ch || !m || MAP !== ch.map) return;
  if (m.type === 'hunt' && m.target.includes(e.type) && save.hunt < m.n) {
    save.hunt++;
    log(m.title + ': ' + save.hunt + ' / ' + m.n, 'sys');
    if (save.hunt >= m.n) { toast('Mission goal reached!'); setTimeout(completeMission, 900); }
  }
  if (m.type === 'boss' && e.type === m.boss) setTimeout(completeMission, 1400);
}
let completing = -1;
function completeMission() {
  const m = curMission(); if (!m) return;
  const key = save.chapter * 10 + save.ci;
  if (completing === key) return;
  if (state !== 'play') { setTimeout(completeMission, 700); return; }
  completing = key;
  say(m.done, () => {
    completing = -1;
    giveReward(m.reward);
    save.ci++; save.hunt = 0;
    audio.fanfare();
    const ch = curChapter();
    if (!ch || save.ci >= ch.missions.length) finishChapter(m.reward);
    else { const nm = curMission(); toast(nm.title); spawnMissionBoss(); }
    writeSave();
  });
}
function learnSkill(id, quiet) {
  if (!SKILLS[id] || save.skills.includes(id)) return;
  save.skills.push(id);
  const free = save.hotkeys.indexOf(null); if (free >= 0 && !save.hotkeys.includes(id)) save.hotkeys[free] = id;
  if (!quiet) { log('New ' + (SKILLS[id].kind === 'silat' ? 'silat skill' : 'magic') + ': ' + SKILLS[id].name + '. It is on your skill buttons.', 'item'); toast('New skill: ' + SKILLS[id].name + '!'); }
}
// skills that come with experience
function levelSkills(quiet) { for (const id of SKILL_ORDER) if (SKILLS[id].lvl && save.lvl >= SKILLS[id].lvl) learnSkill(id, quiet); }
function giveReward(r) {
  if (!r) return;
  if (r.skill) learnSkill(r.skill);
  if (r.weapon) {
    if (!save.owned.includes(r.weapon)) save.owned.push(r.weapon);
    if (WEAPONS[r.weapon].dmg > WEAPONS[save.weapon].dmg) save.weapon = r.weapon;
    log('Obtained ' + WEAPONS[r.weapon].name + '.', 'item');
  }
  if (r.gold) { save.gold += r.gold; log('Reward: ' + r.gold.toLocaleString() + ' ' + CURRENCY + '.', 'item'); }
  if (r.unlock && !save.unlocked.includes(r.unlock)) { save.unlocked.push(r.unlock); log('New destination for Pak Kemudi: ' + MAPS[r.unlock].name + '.', 'sys'); }
  gainXP(Math.round(xpNeed(save.lvl) * 0.25));
}
function finishChapter(r) {
  const n = save.chapter, prev = CHAPTERS[n];
  save.chapter = n + 1; save.ci = 0; save.hunt = 0;
  if (r && r.end) { writeSave(); state = 'ending'; endingT = 0; return; } // end of the Bunian arc (Chapter 4)
  ensureUnlocked();
  const next = CHAPTERS[save.chapter];
  writeSave();
  if (!next) { state = 'ending'; endingT = 0; return; } // the last state written so far
  if (next.map === MAP) { refreshGiver(); setTimeout(() => say([['', 'CHAPTER ' + save.chapter + ': ' + next.short + ' (' + next.title.split('(').pop()]], () => checkChapterIntro()), 500); return; }
  const where = MAPS[next.map].name;
  setTimeout(() => say([['', (prev && prev.state ? prev.state.name + ' is safe. ' : '') + 'CHAPTER ' + save.chapter + ' begins: ' + (next.short || next.title.split(': ')[1]) + '.'], ['', 'Talk to Pak Kemudi at the jetty to sail to ' + where + '.']], () => toast(next.title)), 400);
}
// every map that the current chapter needs is open to Pak Kemudi
function ensureUnlocked() {
  if (save.chapter >= 5 && !save.statesIntro) return;
  for (let c = 2; c <= save.chapter; c++) { const ch = CHAPTERS[c]; if (ch && !save.unlocked.includes(ch.map)) { save.unlocked.push(ch.map); if (c === save.chapter && player) log('New destination for Pak Kemudi: ' + MAPS[ch.map].name + '.', 'sys'); } }
}
// the journey through the Malaysian states begins after the Bunian arc
function startStatesArc() {
  say([
    ['Puteri Bunian', 'Laksamana, wait! The Shadow King is gone, but his shadow did not die. It split into a thousand pieces and fled into the river of time.'],
    ['Puteri Bunian', 'We call them the Bayang Masa, the Time Shadows. They will try to unmake the history of every Malay land, from Melaka to Sabah and Sarawak.'],
    ['Puteri Bunian', 'Take our mist ship. It sails through the years as easily as through the waves. Pak Kemudi knows how to steer it.'],
    ['Hang Tuah', 'Then we will sail through every state and every age, and make sure history happens as it should.'],
    ['', 'A NEW JOURNEY begins: the states of Malaysia, three chapters in each. Talk to Pak Kemudi at the jetty to sail to Melaka.'],
  ], () => { save.statesIntro = true; ensureUnlocked(); writeSave(); const ch = curChapter(); if (ch) toast(ch.title); });
}
function talkBoatman() {
  if (save.chapter >= 5 && !save.statesIntro) return startStatesArc();
  const lines = [['Pak Kemudi', save.unlocked.length > 1 ? 'Where shall we sail, Laksamana? The wind is good today.' : 'The seas are rough, Laksamana. Finish your work in Melaka first, then I will take you anywhere.']];
  say(lines, () => { if (save.unlocked.length > 1) ui.open('travel'); });
}
function talkGiver(mapId) {
  const nums = Object.keys(CHAPTERS).map(Number).filter(c => CHAPTERS[c].map === mapId), last = Math.max(...nums);
  const ch = CHAPTERS[Math.min(Math.max(save.chapter, nums[0]), last)], giver = ch.map === mapId && save.chapter <= last ? ch.giver : (STATE_BY_MAP[mapId] ? STATE_BY_MAP[mapId].host : ch.giver);
  restoreParty();
  if (save.chapter > last) return say([[giver, 'Our home is at peace thanks to you, Laksamana. Rest here whenever you like.'], ['', 'Your HP and SP are restored.']]);
  const m = curMission();
  if (!save.chIntro[save.chapter]) return checkChapterIntro();
  say([[giver, m ? m.hint + (m.type === 'hunt' ? ' So far: ' + Math.min(save.hunt, m.n) + ' of ' + m.n + '.' : '') : 'Be careful out there.'], ['', 'Your HP and SP are restored.']]);
}
