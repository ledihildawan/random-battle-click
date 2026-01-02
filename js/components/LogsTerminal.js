export default {
  name: 'logs-terminal',
  template: `
    <div class="logs-terminal" role="log" aria-live="polite">
      <p v-for="(log, index) in logs" :key="index" v-html="'> ' + log"></p>
      <p v-if="logs.length === 0">No activity yet.</p>
    </div>
  `,
  props: {
    logs: { type: Array, default: () => [] },
  },
  updated() {
    const el = this.$el;
    if (el) {
      el.scrollTo({ left: 0, top: el.scrollHeight, behavior: 'smooth' });
    }
  },
};
