/** SplashScreen — presentation component (Imperative Shell, Vue 2 object syntax). */

import Sound from '../services/soundEngine.js';

export default {
  name: 'splash-screen',
  template: `
    <div class="splash-screen" @click="skip" tabindex="0" role="dialog" aria-modal="true">
      <div class="splash-content">
        <brand-logo></brand-logo>
        <div class="splash-footer">
          <transition name="splash-swap" mode="out-in">
            <p class="splash-state" v-if="!ready" key="state">{{ stateLabel }}</p>
            <p class="splash-hint" v-else key="hint">Press any key or click to continue</p>
          </transition>
          <transition name="splash-swap">
            <div class="splash-loader-box" v-if="!ready">
              <div class="splash-loader-bar" ref="loaderBar" :class="barClass" :style="barStyle"></div>
            </div>
          </transition>
        </div>
      </div>
      <div class="splash-crt"></div>
    </div>
  `,

  props: {
    progress: { type: Number, default: null },
    statusText: { type: String, default: null },
  },

  data() {
    return {
      loaded: false,
      ready: false,
      splashStateIndex: 0,
    };
  },

  computed: {
    // progress prop present => battle loading mode (JS-driven bar, no input wait)
    manual() {
      return typeof this.progress === 'number';
    },
    splashStates() {
      return ['BOOTING SYSTEM...', 'LOADING FIGHTERS...', 'LOADING ARENA...'];
    },
    battleStates() {
      return [
        { upTo: 40, text: 'LOADING FIGHTER DATA...' },
        { upTo: 75, text: 'PREPARING ARENA...' },
        { upTo: 100, text: 'LINKING COMBAT SYSTEMS...' },
      ];
    },
    stateLabel() {
      if (this.statusText) return this.statusText;
      if (this.manual) {
        if (this.progress >= 100) return 'READY!';
        const band = this.battleStates.find((s) => this.progress < s.upTo);
        return band ? band.text : this.battleStates[this.battleStates.length - 1].text;
      }
      const states = this.splashStates;
      return states[Math.min(this.splashStateIndex, states.length - 1)];
    },
    barClass() {
      return {
        'is-manual': this.manual,
        'is-done': this.manual ? this.progress >= 100 : this.loaded,
      };
    },
    barStyle() {
      return this.manual ? { width: `${this.progress}%` } : null;
    },
  },

  watch: {
    stateLabel() {
      Sound.play('tick');
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKey);
    try {
      this.$el && this.$el.focus && this.$el.focus();
    } catch (e) {
      // ignore if focus not available
    }

    if (this.manual) return;

    // Rotate splash state texts across the 2.5s fill animation
    this._stateTimer = setInterval(() => {
      if (this.splashStateIndex < this.splashStates.length - 1) this.splashStateIndex++;
    }, 830);

    this._safetyTimer = setTimeout(this.onLoadEnd, 3500);
    const bar = this.$refs.loaderBar;
    if (bar) bar.addEventListener('animationend', this.onBarAnimationEnd);
  },

  beforeDestroy() {
    clearInterval(this._stateTimer);
    clearTimeout(this._readyTimer);
    clearTimeout(this._safetyTimer);
    window.removeEventListener('keydown', this.onKey);
    const bar = this.$refs.loaderBar;
    if (bar) bar.removeEventListener('animationend', this.onBarAnimationEnd);
  },

  methods: {
    onBarAnimationEnd(e) {
      if (e && e.animationName !== 'loadProgress') return;
      this.onLoadEnd();
    },
    onLoadEnd() {
      if (this.loaded) return;
      this.loaded = true;
      clearInterval(this._stateTimer);
      clearTimeout(this._safetyTimer);
      this._readyTimer = setTimeout(() => {
        this.ready = true;
      }, 450);
    },
    skip() {
      if (!this.ready) return;
      Sound.play('select');
      window.dispatchEvent(new CustomEvent('splash:skip', { detail: { from: 'user' } }));
    },
    onKey(e) {
      if (!e || (e.key && (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta'))) return;
      if (!this.ready) return;
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      this.skip();
    },
  },
};
