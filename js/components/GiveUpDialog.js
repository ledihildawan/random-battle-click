export default {
  name: 'give-up-dialog',
  template: `
    <dialog
      class="nes-dialog give-up-dialog"
      id="give-up-dialog"
      :open="open"
      role="dialog"
      aria-label="Give up dialog"
      @keydown.tab.prevent="onTab"
      @keydown="onDialogKeydown"
    >
      <form method="dialog">
        <p class="title">Give up already?</p>
        <menu class="dialog-menu">
          <button type="button" ref="cancelBtn" class="nes-btn" @click.prevent="$emit('cancel')" @keydown.enter.stop>Cancel <span class="key-hint">[ENTER]</span></button>
          <button type="button" ref="confirmBtn" class="nes-btn is-error" @click="$emit('confirm')" @keydown.enter.stop>Give Up</button>
        </menu>
      </form>
    </dialog>
  `,
  props: {
    open: { type: Boolean, default: false },
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.cancelBtn) this.$refs.cancelBtn.focus();
        });
      }
    },
  },
  methods: {
    dialogButtons() {
      return [this.$refs.cancelBtn, this.$refs.confirmBtn].filter(Boolean);
    },
    onDialogKeydown(e) {
      const left = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
      const right = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      if (!left && !right) return;
      e.preventDefault();
      const buttons = this.dialogButtons();
      if (!buttons.length) return;
      const idx = buttons.indexOf(document.activeElement);
      const nextIdx = left ? (idx <= 0 ? buttons.length - 1 : idx - 1) : idx === buttons.length - 1 ? 0 : idx + 1;
      buttons[nextIdx].focus();
    },
    onTab(e) {
      const buttons = this.dialogButtons();
      if (!buttons.length) return;
      const idx = buttons.indexOf(document.activeElement);
      const nextIdx = e.shiftKey
        ? idx <= 0
          ? buttons.length - 1
          : idx - 1
        : idx === buttons.length - 1
        ? 0
        : idx + 1;
      buttons[nextIdx].focus();
    },
  },
};
