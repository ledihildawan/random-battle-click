/** PlayerCard — presentation component (Imperative Shell, Vue 2 object syntax). */

import { onAvatarError } from '../services/avatarFallback.js';

export default {
  name: 'player-card',
  template: `
    <div
      class="player-card nes-container is-rounded"
      :class="['player-card--' + side, { 'active-turn': activeTurn, 'ko-defeated': ko }]"
    >
      <span v-if="combo >= 2" class="combo-badge">x{{ combo }}</span>
      <span v-if="guarded" class="guard-badge" title="Guarding"><pixel-icon name="shield" :size="10"></pixel-icon></span>
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
          @error="onAvatarError"
          width="100"
          height="100"
        />
      </div>
      <p class="player__name" :class="{ 'secret-text': isSecret }">
        <pixel-icon v-if="player && player.isChampion" name="crown" :size="10"></pixel-icon> {{ player && player.name }}
      </p>
      <div class="hp-text">{{ hp }} / 100</div>
      <progress class="nes-progress" :class="healthBarColorStatus(hp)" :value="hp" max="100"></progress>
      <div
        class="super-meter"
        :class="{ 'is-full': meter >= 100 }"
        :title="meter >= 100 ? 'Special ready!' : 'Special charging'"
        aria-hidden="true"
      >
        <div class="super-meter-fill" :style="{ width: meter + '%' }"></div>
      </div>
    </div>
  `,
  props: {
    side: { type: String, required: true },
    player: { type: Object, default: () => ({}) },
    hp: { type: Number, default: 100 },
    fx: { type: Array, default: () => [] },
    activeTurn: { type: Boolean, default: false },
    imgClass: { type: String, default: '' },
    isSecret: { type: Boolean, default: false },
    combo: { type: Number, default: 0 },
    ko: { type: Boolean, default: false },
    meter: { type: Number, default: 0 },
    guarded: { type: Boolean, default: false },
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
      return this.side === 'p1' ? 'badge-p1' : 'badge-p2';
    },
  },
  methods: {
    onAvatarError,
    healthBarColorStatus(value) {
      return {
        'is-success': value > 50,
        'is-warning': value > 20 && value <= 50,
        'is-error': value <= 20,
      };
    },
  },
};
