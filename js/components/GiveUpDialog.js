Vue.component('give-up-dialog', {
  template: /* html */ `
    <dialog class="nes-dialog give-up-dialog" id="give-up-dialog" :open="open">
      <form method="dialog">
        <p class="title">Surrender?</p>
        <menu class="dialog-menu">
          <button class="nes-btn" @click.prevent="$emit('cancel')">Cancel <span class="key-hint">[ESC]</span></button>
          <button class="nes-btn is-error" @click="$emit('confirm')">Confirm <span class="key-hint">[ENTER]</span></button>
        </menu>
      </form>
    </dialog>
  `,
  props: {
    open: { type: Boolean, default: false },
  },
});
