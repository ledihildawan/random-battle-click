export default {
  name: 'give-up-dialog',
  template: `
    <dialog class="nes-dialog give-up-dialog" id="give-up-dialog" :open="open" role="dialog" aria-label="Give up dialog">
      <form method="dialog">
        <p class="title">Give up?</p>
        <menu class="dialog-menu">
          <button class="nes-btn" @click.prevent="$emit('cancel')">Cancel <span class="key-hint">[ESC]</span></button>
          <button class="nes-btn is-error" @click="$emit('confirm')">Give Up <span class="key-hint">[ENTER]</span></button>
        </menu>
      </form>
    </dialog>
  `,
  props: {
    open: { type: Boolean, default: false },
  },
};
