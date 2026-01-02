Vue.component('loading-screen', {
  template: /* html */ `
    <div class="screen-loading text-center">
      <p style="margin-bottom: 10px">INITIALIZING BATTLE...</p>
      <progress class="nes-progress is-pattern" :value="progress" max="100"></progress>
    </div>
  `,
  props: {
    progress: { type: Number, default: 0 },
  },
});
