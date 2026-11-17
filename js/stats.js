'use strict';
// ---------------------------------------------------------------- character stats (Stage 1 model)
// Six base stats, derived combat values, job level and status points.
// Defaults (all 5) reproduce the original game's balance.
const STATS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
const STAT_INFO = {
  str: ['STR', 'Strength: raises attack power.'],
  agi: ['AGI', 'Agility: faster attacks and a chance to dodge.'],
  vit: ['VIT', 'Vitality: raises max HP and HP recovery.'],
  int: ['INT', 'Intelligence: raises max SP, SP recovery and skill damage.'],
  dex: ['DEX', 'Dexterity: steadier, more reliable damage.'],
  luk: ['LUK', 'Luck: raises critical hit chance.'],
};
// Jobs are unlocked through quests in a later stage; Novice is the starting job.
const JOBS = {
  novice: { name: 'Novice', maxJob: 10 },
};
const CURRENCY = 'Pitis'; // tin coins of old Melaka

const statPtsForLevel = l => 3 + Math.floor(l / 5);       // points earned on reaching level l
const statCost = v => Math.floor((v - 1) / 10) + 2;        // raising a stat costs more as it grows
const jobNeed = l => 15 + l * l * 8;
const SILAT_SP = 8;

const maxHp = () => Math.round((100 + (save.lvl - 1) * 16) * (1 + (save.stats.vit - 5) * 0.03));
const maxSp = () => Math.round(20 + save.lvl * 3 + (save.stats.int - 5) * 3);
const atkBonus = () => (save.lvl - 1) * 1.5 + (save.stats.str - 5) * 1.0;
const atkSpeedMul = () => Math.max(0.55, 1 - (save.stats.agi - 5) * 0.012);
const critChance = () => Math.min(0.5, 0.08 + save.stats.luk * 0.006);
const dmgFloor = () => Math.min(1.1, 0.85 + (save.stats.dex - 5) * 0.006);
const dodgeChance = () => Math.min(0.35, (save.stats.agi - 5) * 0.008);
const skillMul = () => 1 + (save.stats.int - 5) * 0.02;
const hpRegen = () => maxHp() * 0.02 * (1 + (save.stats.vit - 5) * 0.05);
const spRegen = () => 0.6 + save.stats.int * 0.08;
const weaponAtk = () => Math.round(WEAPONS[save.weapon].dmg + atkBonus());
const aspd = () => Math.round(150 + (1 - atkSpeedMul()) * 100 + (0.45 - WEAPONS[save.weapon].cd) * 60);

function addStat(k) {
  const c = statCost(save.stats[k]);
  if (save.statPts < c || save.stats[k] >= 99) return false;
  const hpRatio = player.hp / maxHp();
  save.statPts -= c; save.stats[k]++;
  if (k === 'vit') player.hp = Math.min(maxHp(), Math.round(hpRatio * maxHp()));
  writeSave();
  return true;
}
function gainJobXP(n) {
  const job = JOBS[save.job];
  if (save.jlvl >= job.maxJob) return;
  save.jxp += n;
  while (save.jlvl < job.maxJob && save.jxp >= jobNeed(save.jlvl)) {
    save.jxp -= jobNeed(save.jlvl); save.jlvl++; save.skillPts++;
    log('Job level up! You are now Job Lv ' + save.jlvl + '.', 'sys');
  }
  if (save.jlvl >= job.maxJob) save.jxp = 0;
}
