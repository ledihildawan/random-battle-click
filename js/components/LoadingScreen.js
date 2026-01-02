export default {
  name: 'loading-screen',
  template: `
    <div class="screen-loading text-center">
      <p style="margin-bottom: 10px">Preparing battle...</p>
      <progress class="nes-progress is-pattern" :value="progress" max="100"></progress>
    </div>
  `,
  props: {
    progress: { type: Number, default: 0 },
  },
};
