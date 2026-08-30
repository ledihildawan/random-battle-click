// UI Effects Service (ES module)
import deepFreeze from '../utils/deepFreeze.js';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Per-character signature special attacks, keyed by fighter id.
 * Frozen at module load. `move` doubles as the log-facing move name.
 */
export const SPECIAL_FX = deepFreeze({
  1: { type: 'slash', color: '#209cee', move: 'BLADE WALTZ' },
  2: { type: 'coins', color: '#f7d51d', move: 'GOLD RUSH' },
  3: { type: 'flame', color: '#e76e55', move: 'PHOENIX INFERNO' },
  4: { type: 'hearts', color: '#ff6b9d', move: 'HEARTBREAK STORM' },
  5: { type: 'bolt', color: '#7be0ff', move: 'THUNDER VERDICT' },
  6: { type: 'poison', color: '#92cc41', move: 'VENOM GARDEN' },
  7: { type: 'wind', color: '#ffffff', move: 'GALE SLICER' },
  8: { type: 'stars', color: '#f7d51d', move: 'STARFALL' },
  9: { type: 'ice', color: '#7be0ff', move: 'GLACIER EDGE' },
  10: { type: 'quake', color: '#b9b9c2', move: 'AFTERSHOCK' },
  999: { type: 'godrays', color: '#f7d51d', move: 'DIVINE JUDGMENT' },
});

const randRange = (a, b) => Math.random() * (b - a) + a;

function makeParticle(container, opts) {
  const p = document.createElement('div');
  p.className = 'sfx-particle sfx-' + (opts.shape || 'dot');
  const size = opts.size || 8;
  p.style.left = opts.x + 'px';
  p.style.top = opts.y + 'px';
  p.style.width = (opts.w || size) + 'px';
  p.style.height = (opts.h || size) + 'px';
  if (opts.shape === 'ring') p.style.borderColor = opts.color;
  else p.style.backgroundColor = opts.color;
  p.style.setProperty('--dx', (opts.dx || 0) + 'px');
  p.style.setProperty('--dy', (opts.dy || 0) + 'px');
  p.style.setProperty('--rot', (opts.rot || 0) + 'deg');
  p.style.animation = `${opts.anim || 'sfx-move'} ${opts.dur || 0.8}s ${opts.ease || 'ease-out'} ${opts.delay || 0}s forwards`;
  container.appendChild(p);
}

export default {
  spawnSpecialFx(characterId, amped = false) {
    if (prefersReducedMotion) return;
    const def = SPECIAL_FX[characterId];
    if (!def) return;
    const container = document.getElementById('specialfx-container');
    if (!container) return;

    const flash = document.createElement('div');
    flash.className = 'sfx-flash';
    flash.style.background = def.color;
    if (amped) flash.style.opacity = '0.45';
    container.appendChild(flash);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const gen = this._sfx[def.type];
    if (gen) {
      gen(container, def.color, W, H);
      // Amper special (combo x3+): double particles for an overwhelming burst
      if (amped) gen(container, def.color, W, H);
    }

    clearTimeout(this._sfxTimer);
    this._sfxTimer = setTimeout(() => {
      container.innerHTML = '';
    }, 1400);
  },

  _sfx: {
    slash(container, color, W, H) {
      for (let i = 0; i < 3; i++) {
        makeParticle(container, {
          shape: 'bar',
          color,
          x: -160,
          y: randRange(H * 0.2, H * 0.7),
          w: 160,
          h: 8,
          dx: W + 340,
          dy: randRange(-40, 40),
          rot: randRange(-10, 10),
          dur: 0.5,
          delay: i * 0.12,
        });
      }
      for (let i = 0; i < 10; i++) {
        makeParticle(container, {
          color,
          x: randRange(0, W),
          y: randRange(H * 0.2, H * 0.8),
          size: randRange(4, 8),
          dx: randRange(60, 160),
          dy: randRange(-20, 20),
          rot: 90,
          dur: 0.4,
          delay: randRange(0, 0.3),
        });
      }
    },
    coins(container, color, W, H) {
      for (let i = 0; i < 18; i++) {
        makeParticle(container, {
          color,
          x: randRange(W * 0.3, W * 0.7),
          y: randRange(-40, -10),
          dx: randRange(-160, 160),
          dy: randRange(H * 0.4, H * 0.8),
          rot: randRange(180, 540),
          size: randRange(6, 10),
          dur: randRange(0.6, 1),
        });
      }
    },
    flame(container, color, W, H) {
      for (let i = 0; i < 16; i++) {
        makeParticle(container, {
          color: i % 2 ? '#f7d51d' : color,
          x: randRange(0, W),
          y: H * 0.95,
          dx: randRange(-30, 30),
          dy: -randRange(H * 0.3, H * 0.6),
          size: randRange(6, 14),
          dur: randRange(0.6, 1.1),
        });
      }
    },
    hearts(container, color, W, H) {
      for (let i = 0; i < 10; i++) {
        makeParticle(container, {
          shape: i % 2 ? 'ring' : 'dot',
          color,
          x: randRange(0, W),
          y: randRange(H * 0.4, H * 0.95),
          dx: randRange(-60, 60),
          dy: -randRange(120, 260),
          size: randRange(8, 14),
          dur: randRange(0.9, 1.4),
        });
      }
    },
    bolt(container, color, W, H) {
      for (let i = 0; i < 5; i++) {
        makeParticle(container, {
          shape: 'bar',
          color,
          x: randRange(0, W),
          y: randRange(0, H * 0.4),
          w: 6,
          h: randRange(120, 220),
          anim: 'sfx-flicker',
          dur: 0.5,
          delay: i * 0.08,
        });
      }
    },
    poison(container, color, W, H) {
      for (let i = 0; i < 12; i++) {
        makeParticle(container, {
          shape: 'ring',
          color,
          x: randRange(0, W),
          y: randRange(H * 0.3, H),
          dx: randRange(-40, 40),
          dy: -randRange(100, 220),
          size: randRange(8, 16),
          dur: randRange(1, 1.5),
        });
      }
    },
    wind(container, color, W, H) {
      for (let i = 0; i < 8; i++) {
        const dir = i % 2 ? 1 : -1;
        makeParticle(container, {
          shape: 'bar',
          color,
          x: dir > 0 ? -160 : W + 20,
          y: randRange(0, H),
          w: randRange(80, 140),
          h: 4,
          dx: dir * (W + 340),
          dy: randRange(-15, 15),
          dur: 0.45,
          delay: i * 0.06,
        });
      }
    },
    stars(container, color, W, H) {
      for (let i = 0; i < 12; i++) {
        makeParticle(container, {
          color,
          x: randRange(0, W),
          y: -20,
          dx: randRange(-60, 60),
          dy: randRange(H * 0.4, H * 0.7),
          rot: randRange(90, 450),
          size: randRange(8, 12),
          dur: randRange(0.5, 0.9),
        });
      }
    },
    ice(container, color, W, H) {
      for (let i = 0; i < 14; i++) {
        makeParticle(container, {
          color,
          x: randRange(0, W),
          y: -20,
          dx: randRange(-30, 30),
          dy: randRange(H * 0.5, H * 0.8),
          rot: randRange(-120, 120),
          size: randRange(6, 10),
          dur: randRange(0.4, 0.7),
        });
      }
    },
    quake(container, color, W, H) {
      for (let i = 0; i < 16; i++) {
        makeParticle(container, {
          color: i % 3 ? color : '#7a7a85',
          x: randRange(0, W),
          y: -30,
          dx: randRange(-40, 40),
          dy: randRange(H * 0.4, H * 0.7),
          rot: randRange(-30, 30),
          size: randRange(10, 18),
          dur: randRange(0.5, 0.8),
        });
      }
    },
    godrays(container, color, W, H) {
      const rays = document.createElement('div');
      rays.className = 'sfx-rays';
      container.appendChild(rays);
      const cx = W / 2;
      const cy = H / 2;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = randRange(160, 480);
        makeParticle(container, {
          color,
          x: cx,
          y: cy,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: randRange(6, 12),
          dur: randRange(0.5, 0.9),
        });
      }
    },
  },

  triggerAttackLunge(sideKey) {
    const selector = sideKey === 'player1' ? '.player-card--p1' : '.player-card--cpu';
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove('lunge');
    void el.offsetWidth;
    el.classList.add('lunge');
    setTimeout(() => el.classList.remove('lunge'), 320);
  },

  triggerVisualEffect(targetPlayer) {
    const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
    const el = document.querySelector(selector);
    if (el) {
      el.classList.remove('shake', 'hit-flash');
      void el.offsetWidth;
      el.classList.add('shake', 'hit-flash');
      setTimeout(() => el.classList.remove('hit-flash'), 200);
    }
  },

  triggerGlobalShake(app) {
    app.globalShake = true;
    setTimeout(() => {
      app.globalShake = false;
    }, 500);
  },

  spawnFloatingText(app, targetPlayer, text, type) {
    const id = Date.now() + Math.random();
    app.activeFx[targetPlayer].push({ id, text, type });
    setTimeout(() => {
      app.activeFx[targetPlayer] = app.activeFx[targetPlayer].filter((fx) => fx.id !== id);
    }, 1000);
  },

  getAtmosphereHost() {
    return document.querySelector('.winner-atmosphere') || document.getElementById('confetti-container');
  },

  spawnConfetti() {
    if (prefersReducedMotion) return;
    // One continuous loop of staggered pieces (kept falling until cleared)
    this._spawnConfettiBurst(this.getAtmosphereHost());
  },

  _spawnConfettiBurst(container) {
    if (!container) return;
    const colors = ['#f7d51d', '#e76e55', '#209cee', '#92cc41'];
    const count = 110;

    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.className = 'confetti';

      const size = Math.random() * 8 + 4 + 'px';
      div.style.width = size;
      div.style.height = Math.random() * 10 + 5 + 'px';

      div.style.left = Math.random() * 100 + 'vw';
      div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      const fallDuration = Math.random() * 3 + 2 + 's';
      const swayDuration = Math.random() * 2 + 1 + 's';

      div.style.animation = `
        confetti-fall ${fallDuration} linear infinite,
        confetti-sway ${swayDuration} ease-in-out infinite alternate
      `;

      div.style.animationDelay = `${Math.random() * 4}s, ${Math.random() * 2}s`;
      container.appendChild(div);
    }
  },

  spawnRain(opts = {}) {
    if (prefersReducedMotion) return;
    const container = this.getAtmosphereHost();
    if (!container) return;
    const dropCount = opts.count || 70;
    const baseDuration = opts.fast ? 0.3 : 0.5;

    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';

      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.height = Math.random() * 8 + 12 + 'px';
      drop.style.opacity = Math.random() * 0.4 + 0.3;
      drop.style.animationDuration = Math.random() * 0.5 + baseDuration + 's';
      drop.style.animationDelay = Math.random() * 1.5 + 's';

      container.appendChild(drop);
    }
  },

  spawnFog() {
    if (prefersReducedMotion) return;
    const container = this.getAtmosphereHost();
    if (!container) return;

    for (let i = 0; i < 6; i++) {
      const fog = document.createElement('div');
      fog.className = 'fog-layer';

      fog.style.top = 10 + Math.random() * 75 + '%';
      fog.style.width = 55 + Math.random() * 45 + '%';
      fog.style.height = 70 + Math.random() * 70 + 'px';
      fog.style.opacity = 0.12 + Math.random() * 0.16;
      fog.style.animationDuration = 14 + Math.random() * 10 + 's';
      fog.style.animationDelay = -Math.random() * 12 + 's';

      container.appendChild(fog);
    }
  },

  clearWeather() {
    ['#confetti-container', '.winner-atmosphere'].forEach((selector) => {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = '';
    });
  },

  initSnow() {
    if (prefersReducedMotion) return;
    const container = document.getElementById('snow-container');
    if (!container) return;
    const snowCount = 60;
    for (let i = 0; i < snowCount; i++) {
      const snow = document.createElement('div');
      snow.className = 'snow-pixel';

      const sizeType = Math.random();
      let size = 4;
      let opacity = 0.8;
      let duration = Math.random() * 3 + 4;

      if (sizeType < 0.3) {
        size = 2;
        opacity = 0.4;
        duration = Math.random() * 5 + 7;
      } else if (sizeType > 0.8) {
        size = 6;
        opacity = 0.9;
        duration = Math.random() * 2 + 3;
      }

      snow.style.width = `${size}px`;
      snow.style.height = `${size}px`;
      snow.style.opacity = opacity;
      snow.style.left = Math.random() * 100 + 'vw';
      snow.style.animationDuration = `${duration}s, ${Math.random() * 2 + 2}s`;
      snow.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;
      container.appendChild(snow);
    }
  },
};
