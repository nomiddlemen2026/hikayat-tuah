'use strict';
// ---------------------------------------------------------------- audio (tiny synth)
const audio = {
  ctx: null, master: null, musicT: 0, step: 0,
  init() {
    if (this.ctx) { this.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); this.applyMute(); this.musicT = this.ctx.currentTime + 0.2; } catch (e) { this.ctx = null; }
  },
  applyMute() { if (this.master) this.master.gain.value = muted ? 0 : 0.5; },
  suspend() { if (this.ctx) this.ctx.suspend(); }, resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); },
  tone(f, d, type = 'square', v = 0.15, slide = 0, when = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, v = 0.2, hp = 800) {
    if (!this.ctx) return; const c = this.ctx, n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = hp; g.gain.value = v; s.buffer = b; s.connect(f); f.connect(g); g.connect(this.master); s.start();
  },
  swing() { this.noise(0.08, 0.12, 2500); }, hit() { this.tone(220, 0.08, 'square', 0.12, -120); this.noise(0.05, 0.15, 1200); },
  hurt() { this.tone(160, 0.2, 'sawtooth', 0.15, -90); }, dash() { this.noise(0.18, 0.15, 600); },
  throw() { this.tone(900, 0.1, 'triangle', 0.08, -500); },
  pickup() { [660, 880, 1320].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.12, 0, i * 0.07)); },
  level() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'square', 0.1, 0, i * 0.09)); },
  fanfare() { [392, 523, 659, 784, 659, 784].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.14, 0, i * 0.12)); },
  // gentle pentatonic gamelan-like loop
  music() {
    if (!this.ctx || muted) return;
    const c = this.ctx;
    const scale = [293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
    const reg = player ? regionAt(Math.floor(player.x / TS), Math.floor(player.y / TS)) : 'town';
    const dark = reg === 'swamp' || reg === 'temple';
    const bpm = bossBar ? 0.18 : 0.26;
    while (this.musicT < c.currentTime + 0.5) {
      const st = this.step++, when = this.musicT - c.currentTime;
      const pat = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 3, 4, 6, 4, 3, 1];
      const n = scale[(pat[st % 16] + (Math.floor(st / 32) % 2 ? 1 : 0)) % scale.length] * (dark ? 0.75 : 1);
      if (st % 2 === 0 || bossBar) this.tone(n, 0.5, 'sine', 0.05, 0, when);
      if (st % 8 === 0) this.tone(dark ? 73 : 98, 1.6, 'sine', 0.12, -10, when);  // gong
      if (st % 4 === 2) this.tone(n * 2, 0.15, 'triangle', 0.025, 0, when);
      this.musicT += bpm;
    }
  },
};

