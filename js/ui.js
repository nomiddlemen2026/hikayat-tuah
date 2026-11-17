'use strict';
// ---------------------------------------------------------------- MMO-style window interface (HTML/CSS over the canvas)
// Fixed HUD: status window, minimap, quest tracker, chat log, hotkey bar.
// Floating windows: status/stats, items, equipment, skills, quests, world map, options, NPC dialogue.

// ---- icons, drawn in code and cached as data URLs
const iconCache = {};
function iconURL(id, size = 32) {
  const key = id + size;
  if (iconCache[key]) return iconCache[key];
  const c = mk(size * 2, size * 2, g => {
    g.scale(size / 16, size / 16);
    if (WEAPONS[id]) {
      if (id === 'fist') { g.fillStyle = '#c68b59'; g.beginPath(); g.arc(16, 17, 8, 0, 7); g.fill(); g.fillStyle = '#a06a3c'; for (let i = 0; i < 4; i++) g.fillRect(10 + i * 3.5, 11, 2.5, 5); }
      else { g.translate(7, 25); g.rotate(-0.8); g.scale(1.25, 1.25); drawWeapon(g, id, id === 'lembing' ? 16 : 14); }
    } else if (id === 'jamu') {
      g.fillStyle = '#8d5a2b'; g.fillRect(13, 4, 6, 4); g.fillStyle = '#cfe8dc'; g.fillRect(14, 8, 4, 5);
      g.fillStyle = '#2e9d6a'; g.beginPath(); g.arc(16, 20, 8, 0, 7); g.fill(); g.fillStyle = '#69f0ae'; g.beginPath(); g.arc(14, 18, 3, 0, 7); g.fill();
    } else if (id === 'silat') {
      g.strokeStyle = '#ffd54f'; g.lineWidth = 2.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(16, 16, 4 + i * 4, i * 2, i * 2 + 4.2); g.stroke(); }
      g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(16, 16, 2.5, 0, 7); g.fill();
    } else if (id === 'attack') {
      g.translate(6, 26); g.rotate(-0.8); drawWeapon(g, 'keris', 16);
    } else { // empty equipment slot silhouettes
      g.fillStyle = 'rgba(70,90,120,.35)';
      if (id === 'head') { g.beginPath(); g.moveTo(6, 22); g.lineTo(8, 10); g.lineTo(17, 5); g.lineTo(25, 11); g.lineTo(26, 22); g.fill(); }
      else if (id === 'armor') { g.fillRect(9, 8, 14, 18); g.fillRect(4, 9, 5, 10); g.fillRect(23, 9, 5, 10); }
      else if (id === 'acc') { g.lineWidth = 3; g.strokeStyle = 'rgba(70,90,120,.35)'; g.beginPath(); g.arc(16, 18, 7, 0, 7); g.stroke(); g.fillRect(14, 6, 4, 5); }
      else if (id === 'garment') { g.beginPath(); g.moveTo(8, 6); g.lineTo(24, 6); g.lineTo(27, 27); g.lineTo(5, 27); g.fill(); }
      else if (id === 'foot') { g.fillRect(7, 18, 8, 9); g.fillRect(17, 18, 8, 9); }
      else if (id === 'weapon') { g.translate(7, 25); g.rotate(-0.8); g.fillRect(0, -2, 22, 4); }
    }
  });
  return iconCache[key] = c.toDataURL();
}

const ui = (() => {
  const root = document.getElementById('ui');
  const wins = {};
  let z = 10, lastRefresh = 0, frameN = 0, sel = null;
  const logLines = [];
  const POS_KEY = 'hikayat_tuah_ui';
  let savedPos = {};
  try { savedPos = JSON.parse(localStorage.getItem(POS_KEY) || '{}'); } catch (e) { }

  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const prevMap = new WeakMap();
  const set = (el, prop, v) => { let m = prevMap.get(el); if (!m) prevMap.set(el, m = {}); if (m[prop] === v) return; m[prop] = v; if (prop === 'text') el.textContent = v; else if (prop === 'html') el.innerHTML = v; else if (prop === 'src') el.src = v; else el.style[prop] = v; };
  const $ = id => document.getElementById(id);
  const compact = () => isTouch || H < 520 || W < 760;

  function makeWin(id, title, opts = {}) {
    const w = document.createElement('div');
    w.className = 'win ' + (opts.cls || '') + (opts.float ? ' float' : '');
    w.id = 'w-' + id;
    w.innerHTML = `<div class="tb"><span class="tt">${title}</span>${opts.float ? '<button class="x" data-act="close" title="Close (Esc)">&times;</button>' : ''}</div><div class="bd"></div>`;
    root.appendChild(w);
    const win = { id, el: w, body: w.querySelector('.bd'), open: !opts.float, float: !!opts.float, render: opts.render, last: '' };
    wins[id] = win;
    if (opts.float) w.style.display = 'none';
    // drag by title bar
    const tb = w.querySelector('.tb');
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || compact()) return;
      e.preventDefault(); front(win);
      const r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const mv = ev => { w.style.left = clamp(ev.clientX - ox, 0, window.innerWidth - 60) + 'px'; w.style.top = clamp(ev.clientY - oy, 0, window.innerHeight - 24) + 'px'; w.style.right = 'auto'; w.style.bottom = 'auto'; };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); savedPos[id] = [w.style.left, w.style.top]; try { localStorage.setItem(POS_KEY, JSON.stringify(savedPos)); } catch (e) { } };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    w.addEventListener('pointerdown', () => front(win));
    w.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a) act(a.dataset.act, a.dataset.arg, win); });
    return win;
  }
  function front(win) { win.el.style.zIndex = ++z; }
  function place(win) {
    const w = win.el;
    if (compact()) { w.classList.add('sheet'); w.style.left = w.style.top = ''; return; }
    w.classList.remove('sheet');
    const p = savedPos[win.id];
    if (p) { w.style.left = p[0]; w.style.top = p[1]; }
    else {
      // sensible default spots so several windows can be open side by side
      const d = { stats: [250, 64], items: [W - 490, 64], equip: [250, 324], skills: [W - 510, 330], quests: [W / 2 - 170, 110], map: [W / 2 - 198, 80], options: [W / 2 - 180, H / 2 - 150] }[win.id] || [W / 2 - 170, 100];
      w.style.left = Math.max(8, d[0]) + 'px'; w.style.top = Math.max(8, d[1]) + 'px';
    }
    // keep on screen
    requestAnimationFrame(() => { const r = w.getBoundingClientRect(); if (r.right > W) w.style.left = Math.max(0, W - r.width - 8) + 'px'; if (r.bottom > H) w.style.top = Math.max(0, H - r.height - 8) + 'px'; });
  }
  function open(id) {
    const win = wins[id]; if (!win || state === 'title') return;
    if (compact()) for (const o of Object.values(wins)) if (o.float && o.open && o !== win) close(o.id);
    win.open = true; win.el.style.display = ''; win.last = ''; place(win); refresh(win); front(win);
    if (id === 'options' && state === 'play') state = 'menu';
    audio.tone && audio.tone(880, 0.04, 'sine', 0.05);
  }
  function close(id) {
    const win = wins[id]; if (!win || !win.float) return;
    win.open = false; win.el.style.display = 'none';
    if (id === 'options' && state === 'menu') state = 'play';
  }
  function toggle(id) { wins[id] && wins[id].open ? close(id) : open(id); }
  function back() {
    if (state === 'dialog') return;
    const top = Object.values(wins).filter(o => o.float && o.open).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
    if (top) close(top.id); else open('options');
  }
  function refresh(win) {
    if (!win.render || !win.open) return;
    const html = win.render();
    if (html !== win.last) { win.last = html; win.body.innerHTML = html; }
  }
  function refreshAll() { for (const w of Object.values(wins)) if (w.float) refresh(w); }

  // ---- actions from buttons (event delegation)
  function act(a, arg, win) {
    if (a === 'close') close(win.id);
    else if (a === 'open') toggle(arg);
    else if (a === 'stat') { if (!addStat(arg)) log('Not enough status points.', 'err'); refreshAll(); }
    else if (a === 'sel') { sel = arg; refreshAll(); }
    else if (a === 'equip') { if (save.owned.includes(arg)) { save.weapon = arg; log('Equipped ' + WEAPONS[arg].name + '.', 'item'); writeSave(); audio.pickup(); } refreshAll(); }
    else if (a === 'use') { if (arg === 'jamu') usePotion(); refreshAll(); }
    else if (a === 'skill') { if (arg === 'silat') doSkill(); }
    else if (a === 'hot') useHotkey(+arg);
    else if (a === 'sound') { muted = !muted; try { localStorage.setItem('hikayat_tuah_mute', muted ? '1' : '0'); } catch (e) { } audio.applyMute(); refreshAll(); }
    else if (a === 'resume') close('options');
    else if (a === 'full') mobile.goFull();
    else if (a === 'gfx') { gfxMode = gfxMode === '3d' ? '2d' : '3d'; try { localStorage.setItem('hikayat_tuah_gfx', gfxMode); } catch (e) { } log('Graphics: ' + (gfxMode === '3d' ? '3D' : 'Classic 2D') + '.', 'sys'); refreshAll(); }
    else if (a === 'resetui') { savedPos = {}; try { localStorage.removeItem(POS_KEY); } catch (e) { } for (const w of Object.values(wins)) if (w.float && w.open) place(w); log('Window positions reset.', 'sys'); }
    else if (a === 'next') { if (state === 'dialog') advanceDialog(); }
    else if (a === 'map') toggle('map');
  }

  // ---- window contents
  const bar = (cls, pct, label) => `<div class="bar ${cls}"><i style="width:${clamp(pct, 0, 100).toFixed(1)}%"></i><span>${label}</span></div>`;
  function rStats() {
    const s = save.stats;
    let rows = STATS.map(k => {
      const c = statCost(s[k]), can = save.statPts >= c && s[k] < 99;
      return `<tr title="${h(STAT_INFO[k][1])}"><th>${STAT_INFO[k][0]}</th><td class="num">${s[k]}</td><td><button class="plus" data-act="stat" data-arg="${k}" ${can ? '' : 'disabled'}>+</button></td><td class="cost">${c}</td></tr>`;
    }).join('');
    const derived = [['ATK', weaponAtk()], ['ASPD', aspd()], ['Max HP', maxHp()], ['Max SP', maxSp()], ['CRIT', Math.round(critChance() * 100) + '%'], ['FLEE', Math.round(dodgeChance() * 100) + '%'], ['Skill ×', skillMul().toFixed(2)], ['HP regen', hpRegen().toFixed(1) + '/s']];
    return `<div class="cols"><table class="stats"><tr class="hd"><th></th><th>Base</th><th></th><th>Cost</th></tr>${rows}</table>
      <table class="derived">${derived.map(d => `<tr><th>${d[0]}</th><td>${d[1]}</td></tr>`).join('')}</table></div>
      <div class="foot">Status Points: <b class="${save.statPts ? 'hl' : ''}">${save.statPts}</b><span class="sep"></span>${JOBS[save.job].name} · Base Lv ${save.lvl} · Job Lv ${save.jlvl}</div>
      <div class="hint">Hover a stat for its effect. You earn status points on every level up.</div>`;
  }
  function invList() {
    const list = [];
    if (save.potions > 0) list.push({ id: 'jamu', n: save.potions, item: ITEMS.jamu, kind: 'use' });
    for (const k of save.owned) if (k !== 'fist') list.push({ id: k, item: WEAPONS[k], kind: 'equip', eq: save.weapon === k });
    return list;
  }
  function itemInfo(it) {
    if (!it) return '<div class="info empty">Select an item to see its details.</div>';
    const i = it.item, col = RARITY[i.rarity];
    let stats = '';
    if (it.kind === 'equip') stats = `<div class="kv">Type: Weapon · ATK ${i.dmg} · Reach ${i.range} · Speed ${(1 / i.cd).toFixed(1)}/s</div>`;
    const btn = it.kind === 'use' ? `<button data-act="use" data-arg="${it.id}">Use</button>` : it.eq ? '<button disabled>Equipped</button>' : `<button data-act="equip" data-arg="${it.id}">Equip</button>`;
    return `<div class="info"><div class="nm" style="color:${col}">${h(i.name)}</div><div class="rar" style="color:${col}">${i.rarity}</div>${stats}<div class="ds">${h(i.desc)}</div><div class="btns">${btn}</div></div>`;
  }
  function rItems() {
    const list = invList(), cells = [];
    for (let i = 0; i < 24; i++) {
      const it = list[i];
      if (!it) { cells.push('<div class="slot"></div>'); continue; }
      cells.push(`<div class="slot ${sel === it.id ? 'sel' : ''}" data-act="sel" data-arg="${it.id}" title="${h(it.item.name)}" style="--rc:${RARITY[it.item.rarity]}"><img src="${iconURL(it.id)}" alt="">${it.n ? `<b>${it.n}</b>` : ''}${it.eq ? '<em>E</em>' : ''}</div>`);
    }
    return `<div class="grid">${cells.join('')}</div>${itemInfo(list.find(x => x.id === sel))}<div class="foot">${CURRENCY}: <b class="gold">${save.gold.toLocaleString()}</b><span class="sep"></span>Items ${list.length}/24</div>`;
  }
  function eqSlot(slot, label, id) {
    if (id) return `<div class="eq filled" data-act="open" data-arg="items" title="${h(WEAPONS[id].name)}"><div class="slot" style="--rc:${RARITY[WEAPONS[id].rarity]}"><img src="${iconURL(id)}" alt=""></div><div><small>${label}</small><span style="color:${RARITY[WEAPONS[id].rarity]}">${h(WEAPONS[id].name)}</span></div></div>`;
    return `<div class="eq"><div class="slot"><img src="${iconURL(slot)}" alt=""></div><div><small>${label}</small><span class="none">empty</span></div></div>`;
  }
  function rEquip() {
    const w = save.weapon === 'fist' ? null : save.weapon;
    return `<div class="eqwrap"><div class="eqcol">${eqSlot('head', 'Headgear')}${eqSlot('armor', 'Armour')}${eqSlot('weapon', 'Weapon', w)}</div>
      <div class="eqchar"><img src="${portraitURL(true)}" alt="Hang Tuah"></div>
      <div class="eqcol">${eqSlot('acc', 'Accessory')}${eqSlot('garment', 'Sampin')}${eqSlot('foot', 'Footgear')}</div></div>
      <div class="foot">ATK <b>${weaponAtk()}</b><span class="sep"></span>Weapon ${h(WEAPONS[save.weapon].name)}</div>
      <div class="hint">Armour and accessories will drop from monsters and bosses. Tap the weapon slot to switch weapons.</div>`;
  }
  function rSkills() {
    const rows = [
      ['attack', 'Basic Attack', 'Passive', '—', 'Strike with your weapon. Hold the attack key or button to keep swinging.'],
      ['silat', 'Silat Spin', 'Lv 1', SILAT_SP + ' SP', 'Spin through every enemy around you for 160% damage, briefly untouchable. 5s cooldown. Damage grows with INT.'],
    ];
    return `<div class="skills">${rows.map(r => `<div class="sk" ${r[0] === 'silat' ? 'data-act="skill" data-arg="silat"' : ''}><div class="slot"><img src="${iconURL(r[0])}" alt=""></div><div class="sd"><div><b>${r[1]}</b> <small>${r[2]}</small><span class="sp">${r[3]}</span></div><p>${r[4]}</p></div></div>`).join('')}</div>
      <div class="foot">Skill Points: <b>${save.skillPts}</b><span class="sep"></span>Job: ${JOBS[save.job].name}</div>
      <div class="hint">Skill points come from job levels and are spent on job skills once you take up a new job.</div>`;
  }
  function rQuests() {
    const rows = [{ t: 'Prologue: Find a Weapon', d: 'Open the chest beside your house in Kota Melaka.', done: save.prologue }];
    MISSIONS.forEach((m, i) => rows.push({ t: m.title, d: m.hint, done: i < 4 ? !!save.found[m.id] : !!save.taming }));
    const cur = rows.findIndex(r => !r.done);
    return `<div class="quests">${rows.map((r, i) => `<div class="q ${r.done ? 'done' : i === cur ? 'cur' : 'locked'}"><span class="st">${r.done ? '✔' : i === cur ? '▶' : '·'}</span><div><b>${h(r.t)}</b><p>${h(r.d)}</p></div></div>`).join('')}</div>
      <div class="foot">Main story ${rows.filter(r => r.done).length}/${rows.length}<span class="sep"></span>Brothers found ${foundCount()}/4</div>`;
  }
  function rMap() { return `<canvas id="worldmap" width="384" height="288"></canvas><div class="foot">Red: you · White: objective · Coloured: your brothers · Gold: temple</div>`; }
  function rOptions() {
    return `<div class="opts"><button data-act="sound">${muted ? 'Sound: Off' : 'Sound: On'}</button><button data-act="resetui">Reset window positions</button>${isTouch ? '<button data-act="full">Fullscreen</button>' : ''}${gfx.ok ? `<button data-act="gfx">Graphics: ${gfxMode === '3d' ? '3D' : 'Classic 2D'}</button>` : ''}<button class="pri" data-act="resume">Resume game</button></div>
      <table class="keys">
        <tr><th>Move</th><td>WASD / arrows · touch: drag on the left</td></tr>
        <tr><th>Camera</th><td>Right-drag or Z / X to rotate, mouse wheel to zoom · touch: rotate and zoom buttons</td></tr>
        <tr><th>Attack / talk</th><td>J, Space or left-click (hold to repeat)</td></tr>
        <tr><th>Hotkeys</th><td>1–8 or F1–F8 (Silat Spin, Jamu)</td></tr>
        <tr><th>Windows</th><td>C Status · I Items · U Equip · Y Skills · Q Quests · M Map · O Options</td></tr>
        <tr><th>Chat</th><td>Enter to type, /help for commands · Esc closes windows</td></tr>
      </table><div class="hint">The game is paused while this window is open. Progress saves automatically.</div>`;
  }

  // ---- portraits
  const portraitCache = {};
  function portraitURL(full) {
    if (!full && gfx.portrait('tuah')) return gfx.portrait('tuah');
    const key = (full ? 'f' : 'p') + save.weapon;
    if (portraitCache[key]) return portraitCache[key];
    const c = full ? mk(120, 150, g => { g.translate(60, 128); g.scale(3.4, 3.4); drawHero(g, 0, 0, HEROES.tuah, Math.PI / 2 + 0.35, 0, save.weapon, 0); })
      : mk(88, 88, g => { const gr = g.createLinearGradient(0, 0, 0, 88); gr.addColorStop(0, '#f8e7b0'); gr.addColorStop(1, '#c98d3a'); g.fillStyle = gr; g.fillRect(0, 0, 88, 88); g.translate(44, 128); g.scale(4.2, 4.2); drawHero(g, 0, 0, HEROES.tuah, Math.PI / 2, 0, null, 0); });
    return portraitCache[key] = c.toDataURL();
  }
  const headCache = {};
  function headURL(k) {
    if (gfx.portrait(k)) return gfx.portrait(k);
    if (headCache[k]) return headCache[k];
    return headCache[k] = mk(40, 40, g => { g.translate(20, 62); g.scale(2.2, 2.2); drawHero(g, 0, 0, HEROES[k], Math.PI / 2, 0, null, 0); }).toDataURL();
  }

  // ---- fixed HUD
  function buildHUD() {
    const st = makeWin('status', 'Basic Info', { cls: 'hud' });
    st.body.innerHTML = `<div class="who"><img class="portrait" id="s-port" alt=""><div class="meta"><div class="name">Hang Tuah</div><div class="job" id="s-job">Novice</div><div class="lv">Base Lv. <b id="s-lv">1</b> &nbsp; Job Lv. <b id="s-jlv">1</b></div></div></div>
      <div class="bars"><label>HP</label><div class="bar hp" id="s-hpb"><i id="s-hp"></i><span id="s-hpt"></span></div>
      <label>SP</label><div class="bar sp" id="s-spb"><i id="s-sp"></i><span id="s-spt"></span></div>
      <label>Base</label><div class="bar xp thin"><i id="s-xp"></i><span id="s-xpt"></span></div>
      <label>Job</label><div class="bar jx thin"><i id="s-jx"></i><span id="s-jxt"></span></div></div>
      <div class="money"><span id="s-gold">0</span> ${CURRENCY}<span class="pts" id="s-pts"></span></div>
      <div class="party" id="s-party"></div>
      <div class="menu">${[['stats', 'Status', 'C'], ['items', 'Items', 'I'], ['equip', 'Equip', 'U'], ['skills', 'Skills', 'Y'], ['quests', 'Quests', 'Q'], ['map', 'Map', 'M'], ['options', 'Options', 'O']].map(b => `<button data-act="open" data-arg="${b[0]}" title="${b[1]} (${b[2]})">${b[1]}</button>`).join('')}</div>`;
    const mm = makeWin('mini', 'Melaka', { cls: 'hud' });
    mm.body.innerHTML = `<canvas id="minimap" width="256" height="192" data-act="map" title="Open world map (M)"></canvas><div class="coords" id="mm-xy"></div>`;
    const tr = document.createElement('div'); tr.id = 'tracker'; tr.innerHTML = '<b id="tr-t"></b><span id="tr-d"></span>'; tr.addEventListener('click', () => toggle('quests')); root.appendChild(tr);
    const ch = makeWin('chat', 'Chat', { cls: 'hud' });
    ch.body.innerHTML = `<div class="log" id="chatlog"></div><form id="chatform" autocomplete="off"><input id="chatin" maxlength="120" placeholder="Press Enter to chat · /help"></form>`;
    $('chatform').addEventListener('submit', e => { e.preventDefault(); const v = $('chatin').value.trim(); $('chatin').value = ''; $('chatin').blur(); if (v) chat(v); });
    $('chatin').addEventListener('keydown', e => { if (e.key === 'Escape') { $('chatin').value = ''; $('chatin').blur(); } });
    const hb = document.createElement('div'); hb.id = 'hotbar';
    hb.innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="hk" id="hk${i}" data-i="${i}"><img alt=""><i class="cd"></i><b class="n"></b><small>F${i + 1}</small></div>`).join('');
    hb.addEventListener('click', e => { const k = e.target.closest('.hk'); if (k) useHotkey(+k.dataset.i); });
    root.appendChild(hb);
    const dlg = makeWin('dialog', '', { cls: 'dialog' });
    dlg.body.innerHTML = `<div class="dwrap"><img id="d-port" alt=""><div class="dtext" id="d-text"></div></div><div class="dbtn"><button id="d-next" data-act="next">Next</button></div>`;
    dlg.el.style.display = 'none';
    dlg.el.addEventListener('click', e => { if (!e.target.closest('button') && state === 'dialog') advanceDialog(); });
  }
  function chat(v) {
    if (v[0] !== '/') { log('Hang Tuah : ' + v, 'chat'); return; }
    const cmd = v.slice(1).split(' ')[0].toLowerCase();
    if (cmd === 'help') log('Commands: /where, /stats, /save, /clear, /help', 'sys');
    else if (cmd === 'where') { const tx = Math.floor(player.x / TS), ty = Math.floor(player.y / TS), r = regionAt(tx, ty); log('You are at ' + (r === 'meadow' ? 'Melaka Countryside' : REGIONS[r].name) + ' (' + tx + ', ' + ty + ').', 'sys'); }
    else if (cmd === 'stats') log(STATS.map(k => STAT_INFO[k][0] + ' ' + save.stats[k]).join(' · ') + ' · ATK ' + weaponAtk(), 'sys');
    else if (cmd === 'save') { writeSave(); log('Game saved.', 'sys'); }
    else if (cmd === 'clear') { logLines.length = 0; $('chatlog').innerHTML = ''; }
    else log('Unknown command. Type /help.', 'err');
  }
  function addLog(text, type) {
    logLines.push([text, type]);
    const box = $('chatlog'); if (!box) return;
    const d = document.createElement('div'); d.className = 'l ' + (type || ''); d.textContent = text; box.appendChild(d);
    while (box.children.length > 80) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  // ---- per-frame updates (only touch the DOM when a value changes)
  function frame() {
    if (state === 'title') return;
    frameN++;
    const p = player;
    root.classList.toggle('compact', compact());
    root.classList.toggle('touch', isTouch);
    if (frameN % 20 === 1) { root.style.setProperty('--status-h', wins.status.el.offsetHeight + 'px'); const mr = wins.mini.el.getBoundingClientRect(); $('tracker').style.top = (mr.bottom + 4) + 'px'; }
    const hp = Math.ceil(p.hp), mh = maxHp(), sp = Math.floor(p.sp), ms = maxSp();
    set($('s-hp'), 'width', (hp / mh * 100).toFixed(1) + '%'); set($('s-hpt'), 'text', hp + ' / ' + mh);
    $('s-hpb').classList.toggle('low', hp / mh < 0.25);
    set($('s-sp'), 'width', (sp / ms * 100).toFixed(1) + '%'); set($('s-spt'), 'text', sp + ' / ' + ms);
    const xn = xpNeed(save.lvl), jn = jobNeed(save.jlvl), jmax = save.jlvl >= JOBS[save.job].maxJob;
    set($('s-xp'), 'width', (save.xp / xn * 100).toFixed(1) + '%'); set($('s-xpt'), 'text', (save.xp / xn * 100).toFixed(1) + '%');
    set($('s-jx'), 'width', jmax ? '100%' : (save.jxp / jn * 100).toFixed(1) + '%'); set($('s-jxt'), 'text', jmax ? 'MAX' : (save.jxp / jn * 100).toFixed(1) + '%');
    set($('s-lv'), 'text', '' + save.lvl); set($('s-jlv'), 'text', '' + save.jlvl); set($('s-job'), 'text', JOBS[save.job].name);
    set($('s-gold'), 'text', save.gold.toLocaleString());
    set($('s-pts'), 'text', save.statPts ? '+' + save.statPts + ' status pts' : '');
    set($('s-port'), 'src', portraitURL(false));
    const party = ['tuah', 'jebat', 'lekir', 'lekiu', 'kasturi'].map(k => { const has = k === 'tuah' || save.found[k]; return `<img src="${headURL(k)}" class="${has ? '' : 'missing'}" title="${HEROES[k].name}${has ? '' : ' (missing)'}" alt="">`; }).join('');
    set($('s-party'), 'html', party);
    // minimap + tracker
    const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS), reg = regionAt(tx, ty);
    set(wins.mini.el.querySelector('.tt'), 'text', reg === 'meadow' ? 'Melaka Countryside' : REGIONS[reg].name);
    set($('mm-xy'), 'text', tx + ', ' + ty);
    if (frameN % 3 === 0) drawMinimap();
    const ot = objectiveText();
    set($('tr-t'), 'text', ot[0]); set($('tr-d'), 'text', ot[1]);
    // hotbar
    save.hotkeys.forEach((id, i) => {
      const el = $('hk' + i), img = el.querySelector('img');
      set(img, 'src', id ? iconURL(id) : '');
      img.style.visibility = id ? '' : 'hidden';
      let cd = 0, n = '', off = false;
      if (id === 'silat') { cd = Math.max(0, p.skillCd / 5); off = p.sp < SILAT_SP || save.weapon === 'fist'; }
      if (id === 'jamu') { n = '' + save.potions; off = save.potions <= 0; }
      el.querySelector('.cd').style.height = (cd * 100).toFixed(0) + '%';
      set(el.querySelector('.n'), 'text', n);
      el.classList.toggle('off', off);
    });
    // dialogue window
    const dw = wins.dialog.el;
    if (state === 'dialog' && dialog) {
      if (dw.style.display === 'none') { dw.style.display = ''; front(wins.dialog); }
      const l = dialog.lines[dialog.i];
      set(dw.querySelector('.tt'), 'text', l[0] ? '[' + l[0] + ']' : '');
      set($('d-text'), 'text', l[1].slice(0, Math.floor(dialog.ch)));
      const hk = Object.keys(HEROES).find(k => HEROES[k].name === l[0]);
      const pu = hk ? speakerURL(hk) : l[0] === 'Bendahara' ? speakerURL('bendahara') : l[0] ? speakerURL('npc:' + l[0]) : '';
      set($('d-port'), 'src', pu); $('d-port').style.display = pu ? '' : 'none';
      set($('d-next'), 'text', dialog.i >= dialog.lines.length - 1 ? 'Close' : 'Next');
    } else if (dw.style.display !== 'none') dw.style.display = 'none';
    // floating windows refresh twice a second
    if (time - lastRefresh > 0.5 || time < lastRefresh) { lastRefresh = time; refreshAll(); }
    if (wins.map.open && frameN % 6 === 0) drawWorldMap();
  }
  const speakerCache = {};
  function speakerURL(k) {
    if (gfx.portrait(k)) return gfx.portrait(k);
    if (speakerCache[k]) return speakerCache[k];
    return speakerCache[k] = mk(96, 96, g => {
      g.fillStyle = '#e9e2cf'; g.fillRect(0, 0, 96, 96); g.translate(48, 140); g.scale(4.6, 4.6);
      if (HEROES[k]) drawHero(g, 0, 0, HEROES[k], Math.PI / 2, 0, null, 0);
      else { const npc = { bendahara: 'bendahara', 'npc:Pak Mat': 'villager1', 'npc:Mak Som': 'villager2', 'npc:Tok Besi': 'smith' }[k]; if (npc) drawNPC(g, 0, 0, npc, 0); }
    }).toDataURL();
  }
  function drawMinimap() {
    const c = $('minimap'); if (!c) return;
    const g = c.getContext('2d'), mc = getMiniCanvas(), vw = 40, vh = 30, sc = c.width / vw;
    const cx = clamp(player.x / TS - vw / 2, 0, MW - vw), cy = clamp(player.y / TS - vh / 2, 0, MH - vh);
    g.imageSmoothingEnabled = false; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(mc, cx, cy, vw, vh, 0, 0, c.width, c.height);
    const dot = (x, y, col, r) => { g.fillStyle = col; g.beginPath(); g.arc((x - cx) * sc, (y - cy) * sc, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.5; g.stroke(); };
    for (const n of npcs) dot(n.x / TS, n.y / TS, n.kind === 'captive' ? '#90caf9' : '#7cf', 4);
    for (const e of enemies) if (e.def.boss) dot(e.x / TS, e.y / TS, '#ff9800', 5);
    const op = objectivePos(); if (op && Math.floor(time * 3) % 2) dot(op.x, op.y, '#fff', 6);
    dot(player.x / TS, player.y / TS, '#ff1744', 5);
  }
  function drawWorldMap() {
    const c = $('worldmap'); if (!c) return;
    const g = c.getContext('2d'), sc = c.width / MW;
    g.imageSmoothingEnabled = false; g.drawImage(getMiniCanvas(), 0, 0, c.width, c.height);
    g.font = 'bold 10px sans-serif'; g.textAlign = 'center';
    for (const k in REGIONS) { const r = REGIONS[k]; const x = (r.x0 + r.x1) / 2 * sc, y = (r.y0 + r.y1) / 2 * sc; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(r.name, x, y); g.fillStyle = '#fff'; g.fillText(r.name, x, y); }
    const dot = (x, y, col, r) => { g.fillStyle = col; g.beginPath(); g.arc(x * sc, y * sc, r, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); };
    for (const k of ['jebat', 'lekir', 'lekiu', 'kasturi']) if (!save.found[k]) dot(SITES[k].x + 0.5, SITES[k].y + 0.5, HEROES[k].baju, 5);
    dot(81.5, 9, '#ffd54f', 5);
    const op = objectivePos(); if (op && Math.floor(time * 3) % 2) dot(op.x, op.y, '#fff', 6);
    dot(player.x / TS, player.y / TS, '#ff1744', 5);
  }
  function flashHotkey(i) { const el = $('hk' + i); if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }

  return {
    init() {
      buildHUD();
      makeWin('stats', 'Status', { float: true, cls: 'w-stats', render: rStats });
      makeWin('items', 'Items', { float: true, cls: 'w-items', render: rItems });
      makeWin('equip', 'Equipment', { float: true, cls: 'w-equip', render: rEquip });
      makeWin('skills', 'Skills', { float: true, cls: 'w-skills', render: rSkills });
      makeWin('quests', 'Quest Journal', { float: true, cls: 'w-quests', render: rQuests });
      makeWin('map', 'World Map', { float: true, cls: 'w-map', render: rMap });
      makeWin('options', 'Options', { float: true, cls: 'w-options', render: rOptions });
      root.style.display = 'none';
      window.addEventListener('resize', () => { for (const w of Object.values(wins)) if (w.float && w.open) place(w); });
    },
    show(v) { root.style.display = v ? '' : 'none'; },
    open, close, toggle, back, refreshAll, frame, flashHotkey,
    focusChat() { if (!isTouch) $('chatin').focus(); },
    log: addLog,
    blocking() { return isTouch && Object.values(wins).some(w => w.float && w.open); },
    isOpen: id => !!(wins[id] && wins[id].open),
  };
})();
function log(text, type) { ui.log(text, type); }
