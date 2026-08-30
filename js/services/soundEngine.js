// Sound Engine — procedural chiptune (Web Audio API, zero audio assets)
const STORAGE_KEY = 'rbc-muted';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      this.muted = false;
    }
    if (typeof window !== 'undefined') this.autoUnlock();

    this.sounds = {
      // --- UI navigation ---
      move: () => this.tone({ freq: 560, endFreq: 480, dur: 0.05, vol: 0.22 }),
      select: () => {
        this.tone({ freq: 660, dur: 0.06, vol: 0.28 });
        this.tone({ freq: 990, dur: 0.08, vol: 0.28, delay: 0.06 });
      },
      back: () => {
        this.tone({ freq: 440, dur: 0.06, vol: 0.22 });
        this.tone({ freq: 294, dur: 0.09, vol: 0.22, delay: 0.06 });
      },
      tick: () => this.tone({ freq: 880, dur: 0.03, vol: 0.1, type: 'triangle' }),

      // --- Combat ---
      attack: () => {
        this.tone({ freq: 240, endFreq: 120, dur: 0.09, vol: 0.32 });
        this.noise({ dur: 0.06, vol: 0.14, from: 2400, to: 400 });
      },
      crit: () => {
        this.tone({ freq: 300, endFreq: 70, dur: 0.18, vol: 0.42 });
        this.noise({ dur: 0.15, vol: 0.28, from: 3200, to: 200 });
      },
      special: () => {
        this.tone({ freq: 220, endFreq: 880, dur: 0.22, vol: 0.32 });
        this.noise({ dur: 0.2, vol: 0.2, from: 1200, to: 4000 });
      },
      miss: () => this.noise({ dur: 0.18, vol: 0.2, from: 2400, to: 150 }),
      heal: () => {
        [523, 659, 784].forEach((f, i) => this.tone({ freq: f, dur: 0.07, vol: 0.2, type: 'triangle', delay: i * 0.07 }));
      },
      healFail: () => {
        this.tone({ freq: 196, dur: 0.1, vol: 0.28 });
        this.tone({ freq: 147, dur: 0.14, vol: 0.28, delay: 0.1 });
      },
      combo: () => {
        [659, 880, 1175].forEach((f, i) => this.tone({ freq: f, dur: 0.05, vol: 0.24, delay: i * 0.05 }));
      },
      turnReady: () => this.tone({ freq: 1046, dur: 0.04, vol: 0.14, type: 'triangle' }),
      fight: () => {
        this.tone({ freq: 392, dur: 0.09, vol: 0.3 });
        this.tone({ freq: 523, dur: 0.12, vol: 0.3, delay: 0.09 });
        this.noise({ dur: 0.25, vol: 0.25, from: 4000, to: 300, delay: 0.09 });
      },
      ko: () => {
        this.tone({ freq: 180, endFreq: 40, dur: 0.5, vol: 0.5 });
        this.noise({ dur: 0.4, vol: 0.35, from: 2500, to: 100 });
        this.tone({ freq: 90, endFreq: 45, dur: 0.7, vol: 0.4, type: 'triangle', delay: 0.05 });
      },
      matchPoint: () => {
        this.tone({ freq: 784, dur: 0.08, vol: 0.3 });
        this.tone({ freq: 784, dur: 0.08, vol: 0.3, delay: 0.12 });
        this.tone({ freq: 1046, dur: 0.16, vol: 0.32, delay: 0.24 });
      },
      defend: () => {
        this.tone({ freq: 196, dur: 0.12, vol: 0.28, type: 'triangle' });
        this.tone({ freq: 147, dur: 0.16, vol: 0.28, type: 'triangle', delay: 0.08 });
      },
      block: () => {
        this.tone({ freq: 523, dur: 0.06, vol: 0.3 });
        this.tone({ freq: 392, dur: 0.09, vol: 0.28, delay: 0.05 });
        this.noise({ dur: 0.08, vol: 0.15, from: 3000, to: 800 });
      },

      // --- Dialog ---
      dialogOpen: () => {
        this.tone({ freq: 660, dur: 0.05, vol: 0.24 });
        this.tone({ freq: 550, dur: 0.06, vol: 0.24, delay: 0.05 });
      },

      // --- Outcomes ---
      victory: () => {
        [523, 659, 784, 1046].forEach((f, i) =>
          this.tone({ freq: f, dur: i === 3 ? 0.35 : 0.1, vol: 0.28, delay: i * 0.11 })
        );
      },
      defeat: () => {
        [392, 349, 311, 262].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.22, vol: 0.26, type: 'triangle', delay: i * 0.2 })
        );
      },
      surrender: () => {
        [330, 262].forEach((f, i) => this.tone({ freq: f, dur: 0.3, vol: 0.24, type: 'triangle', delay: i * 0.22 }));
      },
      cheat: () => {
        [659, 784, 988, 1319, 1568].forEach((f, i) => this.tone({ freq: f, dur: 0.06, vol: 0.26, delay: i * 0.06 }));
      },
    };
  }

  ensure() {
    if (this.muted) return false;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    // Never schedule while locked: prevents stale sounds bursting on unlock
    return this.ctx.state === 'running';
  }

  // Auto-unlock on the first natural user gesture — no activation button needed
  autoUnlock() {
    const unlock = () => {
      this.ensure();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  tone(opts = {}) {
    if (!this.ensure()) return;
    const { freq = 440, endFreq = null, dur = 0.08, type = 'square', vol = 0.5, delay = 0 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(opts = {}) {
    if (!this.ensure()) return;
    const { dur = 0.15, vol = 0.3, delay = 0, from = 3000, to = 300 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(to, 40), t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  play(name) {
    const fn = this.sounds[name];
    if (fn) fn();
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
    } catch (e) {
      // storage unavailable: session-only preference
    }
    if (!this.muted) this.play('select');
    return this.muted;
  }
}

export default new SoundEngine();
