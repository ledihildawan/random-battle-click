Vue.component('splash-screen', {
  template: /* html */ `
    <div class="splash-screen">
      <div class="splash-content">
        <h1 class="splash-logo">RETRO<br />BATTLE<br />SYSTEM</h1>
        <p class="splash-sub blink-anim">> CONNECTING TO SERVER...</p>
        <div class="splash-loader-box">
          <div class="splash-loader-bar"></div>
        </div>
        <p style="margin-top: 10px; font-size: 8px; color: #666; letter-spacing: 1px">
          © 2025 VUE CORP. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  `,
});
