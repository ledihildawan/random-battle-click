export default {
  name: 'player-card',
  template: `
    <div class="player-card nes-container is-rounded" :class="{ 'active-turn': activeTurn }">
      <span class="identity-badge" :class="badgeClass">
        <span class="is-dark">{{ sideLabelLeft }}</span><span :class="sideLabelRightClass">{{ sideLabelRight }}</span>
      </span>
      <div class="player__media">
        <div class="visual-fx-container">
          <transition-group name="float-up" tag="div">
            <span v-for="fxItem in fx" :key="fxItem.id" class="floating-text" :class="fxItem.type">{{ fxItem.text }}</span>
          </transition-group>
        </div>
        <img
          class="player__avatar"
          :class="[imgClass, { 'is-dead': hp <= 0 }]"
          :src="player && player.avatar ? ('./img/players/' + player.avatar) : ''"
          :alt="player && player.name ? player.name : ''"
          width="100"
          height="100"
        />
      </div>
      <p class="player__name" :class="{ 'secret-text': isSecret }">{{ player && player.name }}</p>
      <div class="hp-text">{{ hp }} / 100</div>
      <progress class="nes-progress" :class="[progressTheme, healthBarColorStatus(hp)]" :value="hp" max="100"></progress>
    </div>
  `,
  props: {
    side: { type: String, required: true },
    player: { type: Object, default: () => ({}) },
    hp: { type: Number, default: 100 },
    fx: { type: Array, default: () => [] },
    activeTurn: { type: Boolean, default: false },
    progressTheme: { type: String, default: 'is-primary' },
    imgClass: { type: String, default: '' },
    isSecret: { type: Boolean, default: false },
  },
  computed: {
    sideLabelLeft() {
      return this.side === 'p1' ? 'PLAYER' : 'CPU';
    },
    sideLabelRight() {
      return this.side === 'p1' ? 'YOU' : 'OPPONENT';
    },
    sideLabelRightClass() {
      return this.side === 'p1' ? 'is-primary' : 'is-error';
    },
    badgeClass() {
      return this.side === 'p1' ? 'badge-p1 nes-badge is-splited' : 'badge-p2 nes-badge is-splited';
    },
  },
  methods: {
    healthBarColorStatus(value) {
      return {
        'is-primary': value > 50,
        'is-warning': value > 20 && value <= 50,
        'is-error': value <= 20,
      };
    },
  },
};
