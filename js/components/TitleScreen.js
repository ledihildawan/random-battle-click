export default {
  name: 'title-screen',
  template: `
    <div class="screen-title text-center fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Insert Coin</p>
        <p style="margin-bottom: 20px">Can you beat the CPU?</p>
        <button type="button" class="nes-btn is-primary blink-anim" style="font-size: 20px; width: 100%" @click="$emit('start')">
          Press Start <span class="key-hint">[ENTER]</span>
        </button>
      </div>
      <div style="margin-top: 20px; opacity: 0.6; font-size: 10px">
        v6.0 Console Edition<br />
        Code: UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A
      </div>
    </div>
  `,
};
