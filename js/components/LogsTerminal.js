/** LogsTerminal — presentation component (Imperative Shell, Vue 2 object syntax). */

export default {
  name: 'logs-terminal',
  template: `
    <div class="logs-terminal" role="log" aria-live="polite">
      <p v-for="(log, index) in logs" :key="index" :class="log.severity">
        <span v-if="log.icon" class="log-line-icon"><pixel-icon :name="log.icon" :size="10"></pixel-icon></span>{{ log.severity === 'log-round' ? log.text : '> ' + log.text }}
      </p>
      <p v-if="logs.length === 0" class="log-empty">No activity yet.</p>
      <p v-else class="log-cursor-line" aria-hidden="true">&gt; <span class="log-cursor"></span></p>
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
