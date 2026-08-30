export default {
  name: 'title-screen',
  template: `
    <div class="screen-title text-center fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Insert Coin</p>
        <p class="title-lead">The CPU shows no mercy.</p>
        <p class="title-record" v-if="wins + losses > 0">
          RECORD {{ wins }}W - {{ losses }}L<span v-if="streak >= 2"> • STREAK {{ streak }}</span><span v-else-if="bestStreak >= 3"> • BEST {{ bestStreak }}</span>
        </p>
        <button type="button" class="nes-btn is-primary title-cta blink-anim" @click="$emit('start')">
          Press Start <span class="key-hint">[ENTER]</span>
        </button>
      </div>
      <div class="title-footer">
        v6.0 Console Edition<br />
        SECRET CODE: ↑ ↑ ↓ ↓ ← → ← → B A
      </div>
    </div>
  `,
  props: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
  },
};
