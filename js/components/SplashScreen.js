export default {
  name: 'splash-screen',
  template: `
    <div class="splash-screen" @click="skip" tabindex="0" role="dialog" aria-modal="true">
      <div class="splash-content">
        <h1 class="splash-logo">
          <span class="line1">RETRO</span>
          <span class="line2">BATTLE</span>
        </h1>
        <div class="splash-loader-box" ref="loader">
          <div class="splash-loader-bar"></div>
        </div>
        <p class="splash-hint">Press any key or click to continue</p>
        <div class="splash-crt"></div>
      </div>
    </div>
  `,

  mounted() {
    // Auto-complete splash when loader animation finishes (match CSS timing)
    this._autoTimer = setTimeout(this.finish, 2800);
    window.addEventListener('keydown', this.onKey);
    // focus for keyboard users / screen readers so keydown is captured
    try {
      this.$el && this.$el.focus && this.$el.focus();
    } catch (e) {
      // ignore if focus not available
    }
  },

  beforeDestroy() {
    clearTimeout(this._autoTimer);
    window.removeEventListener('keydown', this.onKey);
  },

  methods: {
    finish() {
      const evt = new CustomEvent('splash:skip', { detail: { from: 'auto' } });
      window.dispatchEvent(evt);
    },
    skip() {
      clearTimeout(this._autoTimer);
      const evt = new CustomEvent('splash:skip', { detail: { from: 'user' } });
      window.dispatchEvent(evt);
    },
    onKey(e) {
      // accept any key; ignore modifier-only presses
      if (!e || (e.key && (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta'))) return;
      this.skip();
    },
  },
};
