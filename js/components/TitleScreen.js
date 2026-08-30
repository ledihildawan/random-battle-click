/** TitleScreen — presentation component (Imperative Shell, Vue 2 object syntax). */
import { onAvatarError } from '../services/avatarFallback.js';
import { SPECIAL_FX } from '../services/signatureFx.js';

export default {
  name: 'title-screen',
  template: `
    <div class="screen-title text-center fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Insert Coin</p>
        <p class="title-lead">The CPU shows no mercy.</p>
        <p class="title-record" v-if="wins + losses > 0">
          RECORD {{ wins }}W - {{ losses }}L<span v-if="streak >= 2"> · STREAK {{ streak }}</span><span v-else-if="bestStreak >= 3"> · BEST {{ bestStreak }}</span>
        </p>
        <button type="button" class="nes-btn is-primary title-cta blink-anim" @click="$emit('start')">
          Press Start <span class="key-hint">[ENTER]</span>
        </button>
      </div>

      <transition name="carousel-swap" mode="out-in">
        <div :key="carouselIndex" class="title-carousel">
          <img class="carousel-avatar" :src="'./img/players/' + carouselFighter.avatar" :alt="carouselFighter.name" width="64" height="64" @error="onAvatarError" />
          <div class="carousel-info">
            <p class="carousel-name">{{ carouselFighter.name }}</p>
            <p class="carousel-move">{{ carouselMove }}</p>
          </div>
        </div>
      </transition>

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
    players: { type: Array, default: () => [] },
  },
  data() {
    return {
      carouselIndex: 0,
      _carouselTimer: null,
    };
  },
  computed: {
    carouselFighter() {
      return this.players[this.carouselIndex] || this.players[0] || { name: '...', avatar: '', id: 0 };
    },
    carouselMove() {
      const fx = SPECIAL_FX[this.carouselFighter.id];
      return fx ? fx.move : '';
    },
  },
  mounted() {
    this._carouselTimer = setInterval(() => {
      this.carouselIndex = (this.carouselIndex + 1) % Math.max(this.players.length, 1);
    }, 3000);
  },
  beforeDestroy() {
    clearInterval(this._carouselTimer);
  },
  methods: {
    onAvatarError,
  },
};
