// Sound Engine — procedural chiptune (Web Audio API, zero audio assets)
import deepFreeze from '../utils/deepFreeze.js';

const STORAGE_KEY = 'rbc-muted';
const MASTER_GAIN = 0.22;

const readMutedPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Creates the chiptune sound engine.
 * Auto-unlocks the AudioContext on the first user gesture (no activation UI);
 * the mute preference persists in localStorage.
 * @returns {Readonly<{play: (name: string) => void, toggleMute: () => boolean, muted: boolean}>}
 */
const createSoundEngine = () => {
  let ctx = null;
  let master = null;
  let muted = readMutedPreference();

  function ensure() {
    if (muted) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Never schedule while locked: prevents stale sounds bursting on unlock
    return ctx.state === 'running';
  }

  function tone(opts = {}) {
    if (!ensure()) return;
    const { freq = 440, endFreq = null, dur = 0.08, type = 'square', vol = 0.5, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(opts = {}) {
    if (!ensure()) return;
    const { dur = 0.15, vol = 0.3, delay = 0, from = 3000, to = 300 } = opts;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(to, 40), t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  const sounds = {
    // --- UI navigation ---
    move: () => tone({ freq: 560, endFreq: 480, dur: 0.05, vol: 0.22 }),
    select: () => {
      tone({ freq: 660, dur: 0.06, vol: 0.28 });
      tone({ freq: 990, dur: 0.08, vol: 0.28, delay: 0.06 });
    },
    back: () => {
      tone({ freq: 440, dur: 0.06, vol: 0.22 });
      tone({ freq: 294, dur: 0.09, vol: 0.22, delay: 0.06 });
    },
    tick: () => tone({ freq: 880, dur: 0.03, vol: 0.1, type: 'triangle' }),

    // --- Combat ---
    attack: () => {
      tone({ freq: 240, endFreq: 120, dur: 0.09, vol: 0.32 });
      noise({ dur: 0.06, vol: 0.14, from: 2400, to: 400 });
    },
    crit: () => {
      tone({ freq: 300, endFreq: 70, dur: 0.18, vol: 0.42 });
      noise({ dur: 0.15, vol: 0.28, from: 3200, to: 200 });
    },
    special: () => {
      tone({ freq: 220, endFreq: 880, dur: 0.22, vol: 0.32 });
      noise({ dur: 0.2, vol: 0.2, from: 1200, to: 4000 });
    },
    miss: () => noise({ dur: 0.18, vol: 0.2, from: 2400, to: 150 }),
    heal: () => {
      [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.07, vol: 0.2, type: 'triangle', delay: i * 0.07 }));
    },
    healFail: () => {
      tone({ freq: 196, dur: 0.1, vol: 0.28 });
      tone({ freq: 147, dur: 0.14, vol: 0.28, delay: 0.1 });
    },
    combo: () => {
      [659, 880, 1175].forEach((f, i) => tone({ freq: f, dur: 0.05, vol: 0.24, delay: i * 0.05 }));
    },
    turnReady: () => tone({ freq: 1046, dur: 0.04, vol: 0.14, type: 'triangle' }),

    // --- Dialog ---
    dialogOpen: () => {
      tone({ freq: 660, dur: 0.05, vol: 0.24 });
      tone({ freq: 550, dur: 0.06, vol: 0.24, delay: 0.05 });
    },

    // --- Outcomes ---
    victory: () => {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, dur: i === 3 ? 0.35 : 0.1, vol: 0.28, delay: i * 0.11 })
      );
    },
    defeat: () => {
      [392, 349, 311, 262].forEach((f, i) =>
        tone({ freq: f, dur: 0.22, vol: 0.26, type: 'triangle', delay: i * 0.2 })
      );
    },
    surrender: () => {
      [330, 262].forEach((f, i) => tone({ freq: f, dur: 0.3, vol: 0.24, type: 'triangle', delay: i * 0.22 }));
    },
    cheat: () => {
      [659, 784, 988, 1319, 1568].forEach((f, i) => tone({ freq: f, dur: 0.06, vol: 0.26, delay: i * 0.06 }));
    },
    fight: () => {
      tone({ freq: 392, dur: 0.09, vol: 0.3 });
      tone({ freq: 523, dur: 0.12, vol: 0.3, delay: 0.09 });
      noise({ dur: 0.25, vol: 0.25, from: 4000, to: 300, delay: 0.09 });
    },
    ko: () => {
      tone({ freq: 180, endFreq: 40, dur: 0.5, vol: 0.5 });
      noise({ dur: 0.4, vol: 0.35, from: 2500, to: 100 });
      tone({ freq: 90, endFreq: 45, dur: 0.7, vol: 0.4, type: 'triangle', delay: 0.05 });
    },
    matchPoint: () => {
      tone({ freq: 784, dur: 0.08, vol: 0.3 });
      tone({ freq: 784, dur: 0.08, vol: 0.3, delay: 0.12 });
      tone({ freq: 1046, dur: 0.16, vol: 0.32, delay: 0.24 });
    },
    defend: () => {
      tone({ freq: 196, dur: 0.12, vol: 0.28, type: 'triangle' });
      tone({ freq: 147, dur: 0.16, vol: 0.28, type: 'triangle', delay: 0.08 });
    },
    block: () => {
      tone({ freq: 523, dur: 0.06, vol: 0.3 });
      tone({ freq: 392, dur: 0.09, vol: 0.28, delay: 0.05 });
      noise({ dur: 0.08, vol: 0.15, from: 3000, to: 800 });
    },
  };

  function play(name) {
    const fn = sounds[name];
    if (fn) fn();
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // storage unavailable: session-only preference
    }
    if (!muted) play('select');
    return muted;
  }

  // Auto-unlock on the first natural user gesture — no activation button needed
  function autoUnlock() {
    const unlock = () => {
      ensure();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  // --- Battle music: procedural chiptune loop ---
  let musicTimer = null;
  let musicStep = 0;

  const BASS_PATTERN = deepFreeze([110, 110, 0, 110, 87, 87, 0, 87, 98, 98, 0, 98, 82, 82, 0, 82]);
  const MELODY_PATTERN = deepFreeze([440, 0, 523, 0, 440, 0, 392, 0, 349, 0, 440, 0, 392, 0, 330, 0]);

  function playMusicStep() {
    if (!ensure()) return;
    const bass = BASS_PATTERN[musicStep % BASS_PATTERN.length];
    const melody = MELODY_PATTERN[musicStep % MELODY_PATTERN.length];
    if (bass) tone({ freq: bass, dur: 0.12, vol: 0.12, type: 'square' });
    if (melody) tone({ freq: melody, dur: 0.08, vol: 0.08, type: 'triangle', delay: 0.06 });
    if (musicStep % 4 === 0) noise({ dur: 0.03, vol: 0.06, from: 8000, to: 4000 });
    musicStep += 1;
  }

  function startBattleMusic() {
    stopBattleMusic();
    if (muted) return;
    musicStep = 0;
    playMusicStep();
    musicTimer = setInterval(playMusicStep, 150);
  }

  function stopBattleMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  autoUnlock();

  return Object.freeze({
    play,
    toggleMute,
    startBattleMusic,
    stopBattleMusic,
    get muted() {
      return muted;
    },
  });
};

export default createSoundEngine();
