/** WinnerScreen — presentation component (Imperative Shell, Vue 2 object syntax). */

import UIEffects from '../services/uiEffects.js';
import Sound from '../services/soundEngine.js';
import { onAvatarError } from '../services/avatarFallback.js';

export default {
  name: 'winner-screen',
  template: `
    <div
      class="winner-screen"
      :class="[victory ? 'is-victory' : 'is-defeat', surrendered ? 'is-surrender' : '']"
      role="dialog"
      aria-label="Battle result"
    >
      <div class="winner-atmosphere" aria-hidden="true"></div>
      <div class="winner-content">
        <h2 class="winner-title"><pixel-icon :name="titleIcon" :size="24"></pixel-icon> {{ titleText }}</h2>
        <div class="winner-card">
          <span class="winner-ribbon"><pixel-icon :name="ribbonIcon" :size="10"></pixel-icon> {{ ribbonText }}</span>
          <img class="winner-avatar" :src="'./img/players/' + fighter.avatar" :alt="fighter.name" width="100" height="100" @error="onAvatarError" />
          <p class="winner-name">{{ fighter.name }}</p>
        </div>
        <div class="winner-stats">
          <span v-if="victory">HP LEFT {{ hpLeft }}</span>
          <span v-else>TURNS {{ rounds }}</span>
          <template v-if="maxCombo > 1">
            <span class="winner-stats-sep">•</span>
            <span>COMBO x{{ maxCombo }}</span>
          </template>
          <span class="winner-stats-sep">•</span>
          <span v-if="victory">STREAK {{ streak }}</span>
          <span v-else>RECORD {{ wins }}W - {{ losses }}L</span>
        </div>
        <p v-if="roundScore" class="winner-rounds">ROUNDS {{ roundScore }}</p>
        <p v-if="surrendered" class="winner-tag" :class="'winner-tag--' + surrenderStory.key">{{ surrenderStory.label }}</p>
        <p class="winner-sub">{{ subtitle }}</p>
        <div class="winner-menu-wrap">
          <p class="winner-menu-title">{{ menuTitle }}</p>
          <div class="winner-menu" :class="{ 'two-items': !rematchAvailable }">
            <button
              v-if="rematchAvailable"
              type="button"
              class="nes-btn is-primary"
              :class="{ 'focused': index === 0 }"
              @mousedown.prevent
              @keydown.enter.stop
              @click="$emit('rematch')"
              @mouseover="$emit('hover-index', 0)"
            >
              Rematch <span class="key-hint">[R]</span>
            </button>
            <button
              type="button"
              class="nes-btn"
              :class="[rematchAvailable ? '' : 'is-primary', { 'focused': rematchAvailable ? index === 1 : index === 0 }]"
              @mousedown.prevent
              @keydown.enter.stop
              @click="$emit('new')"
              @mouseover="$emit('hover-index', rematchAvailable ? 1 : 0)"
            >
              New Match <span class="key-hint">[{{ rematchAvailable ? 'N' : 'ENTER' }}]</span>
            </button>
            <button
              type="button"
              class="nes-btn is-error"
              :class="{ 'focused': rematchAvailable ? index === 2 : index === 1 }"
              @mousedown.prevent
              @keydown.enter.stop
              @click="$emit('exit')"
              @mouseover="$emit('hover-index', rematchAvailable ? 2 : 1)"
            >
              Back to Menu <span class="key-hint">[ESC]</span>
            </button>
          </div>
        </div>
      </div>
      <div class="splash-crt"></div>
    </div>
  `,
  props: {
    victory: { type: Boolean, default: false },
    surrendered: { type: Boolean, default: false },
    surrenderHp: { type: Number, default: 0 },
    surrenderEnemyHp: { type: Number, default: 0 },
    fighter: { type: Object, required: true },
    opponent: { type: String, default: '' },
    hpLeft: { type: Number, default: 0 },
    rounds: { type: Number, default: 0 },
    maxCombo: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    roundScore: { type: String, default: '' },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    index: { type: Number, default: 0 },
  },
  computed: {
    titleIcon() {
      if (this.victory) return 'trophy';
      if (this.surrendered) return 'flag';
      return 'skull';
    },
    titleText() {
      if (this.victory) return 'Victory';
      if (this.surrendered) return 'Surrender';
      return 'Defeat';
    },
    ribbonIcon() {
      if (this.victory) return 'crown';
      if (this.surrendered) return 'flag';
      return 'skull';
    },
    ribbonText() {
      if (this.victory) return 'Champion';
      if (this.surrendered) return 'Surrendered';
      return 'Defeated';
    },
    // Multi-parameter surrender archetype: your HP x enemy HP x rounds
    surrenderStory() {
      if (!this.surrendered) return { key: 'none', label: '', text: '', weather: 'none' };
      const hp = this.surrenderHp;
      const ehp = this.surrenderEnemyHp;
      const rounds = this.rounds;

      if (ehp <= 20) {
        return {
          key: 'so-close',
          label: 'SO CLOSE',
          text: `${this.opponent} was at ${ehp} HP — victory was within reach...`,
          weather: 'rain-heavy',
        };
      }
      if (rounds <= 2) {
        return {
          key: 'rage-quit',
          label: 'EARLY EXIT',
          text: `Quit after only ${rounds} round${rounds === 1 ? '' : 's'}`,
          weather: 'fog',
        };
      }
      if (hp <= 25) {
        return {
          key: 'cornered',
          label: 'CORNERED',
          text: `Badly wounded at ${hp} HP — no way out`,
          weather: 'rain-heavy',
        };
      }
      if (rounds >= 12) {
        return {
          key: 'exhausted',
          label: 'EXHAUSTED',
          text: `${rounds} rounds of war — nothing left to give`,
          weather: 'rain',
        };
      }
      if (ehp >= 80 && hp <= 40) {
        return {
          key: 'hopeless',
          label: 'OUTMATCHED',
          text: `${this.opponent} was nearly untouched at ${ehp} HP — no path to victory`,
          weather: 'fog',
        };
      }
      return {
        key: 'tactical',
        label: 'TACTICAL RETREAT',
        text: `You surrendered at ${hp} HP`,
        weather: 'fog',
      };
    },
    // Rematch is only offered when the matchup was worth fighting: never after being swept
    rematchAvailable() {
      return !this.roundScore || !this.roundScore.startsWith('0-');
    },
    menuTitle() {
      return this.rematchAvailable ? 'Run it back?' : 'New fighter time?';
    },
    subtitle() {
      if (this.victory) {
        if (this.roundScore.endsWith('-0')) return `PERFECT — ${this.opponent} didn't take a single round`;
        return `${this.opponent} never stood a chance`;
      }
      if (this.surrendered) return this.surrenderStory.text;
      if (this.roundScore.startsWith('0-')) return `PERFECTED — you never took a single round`;
      return `${this.opponent} was stronger. For now.`;
    },
  },
  mounted() {
    if (this.victory) {
      UIEffects.spawnConfetti();
      Sound.play('victory');
    } else if (this.surrendered) {
      const weather = this.surrenderStory.weather;
      if (weather === 'rain-heavy') UIEffects.spawnRain({ count: 130, fast: true });
      else if (weather === 'rain') UIEffects.spawnRain({ count: 90 });
      else UIEffects.spawnFog();
      Sound.play('surrender');
    } else {
      UIEffects.spawnRain();
      Sound.play('defeat');
    }
  },
  beforeDestroy() {
    UIEffects.clearWeather();
  },
  methods: {
    onAvatarError,
  },
};
