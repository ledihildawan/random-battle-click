/** CommandCenter — presentation component (Imperative Shell, Vue 2 object syntax). */

import { BALANCE } from '../services/battleEngine.js';

export default {
  name: 'command-center',
  template: `
    <div class="actions">
      <div class="combat-buttons">
        <button type="button" class="nes-btn is-error actions__btn" :class="{ 'is-disabled': turnInProgress, 'focused': battleMenuIndex === 0 }" :disabled="turnInProgress" @mousedown.prevent @click="$emit('attack-normal')" @mouseover="$emit('hover-index', 0)">
          <div><pixel-icon name="sword" :size="12"></pixel-icon> Attack <span class="key-hint">[Z]</span></div>
          <div class="btn-subtext">Low risk</div>
        </button>
        <button type="button" class="nes-btn is-warning actions__btn" :class="{ 'is-disabled': turnInProgress || !specialReady, 'focused': battleMenuIndex === 1 }" :disabled="turnInProgress || !specialReady" @mousedown.prevent @click="$emit('attack-special')" @mouseover="$emit('hover-index', 1)">
          <div><pixel-icon name="sparkles" :size="12"></pixel-icon> Special <span class="key-hint">[X]</span></div>
          <div class="btn-subtext">{{ specialSubtext }}</div>
        </button>
        <button type="button" class="nes-btn is-success actions__btn" :class="{ 'is-disabled': (health.player1 >= 100) || tracker.playerHeal >= limit.heal || turnInProgress, 'focused': battleMenuIndex === 2 }" :disabled="(health.player1 >= 100) || tracker.playerHeal >= limit.heal || turnInProgress" @mousedown.prevent @click="$emit('heal')" @mouseover="$emit('hover-index', 2)">
          <div><pixel-icon name="heart" :size="12"></pixel-icon> Heal <span class="key-hint">[C]</span></div>
          <div class="btn-subtext">{{ limit.heal - tracker.playerHeal }}/{{ limit.heal }} · {{ healRisk }}% fail</div>
        </button>
        <button type="button" class="nes-btn actions__btn" :class="{ 'is-disabled': turnInProgress, 'focused': battleMenuIndex === 3 }" :disabled="turnInProgress" @mousedown.prevent @click="$emit('defend')" @mouseover="$emit('hover-index', 3)">
          <div><pixel-icon name="shield" :size="12"></pixel-icon> Defend <span class="key-hint">[V]</span></div>
          <div class="btn-subtext">Brace -50%</div>
        </button>
      </div>
    </div>
  `,
  props: {
    turnInProgress: { type: Boolean, default: false },
    battleMenuIndex: { type: Number, default: 0 },
    health: { type: Object, required: true },
    limit: { type: Object, required: true },
    tracker: { type: Object, required: true },
    specialMeter: { type: Number, default: 0 },
    specialPity: { type: Boolean, default: false },
  },
  computed: {
    specialReady() {
      return this.specialMeter >= BALANCE.special.meterMax;
    },
    specialSubtext() {
      if (!this.specialReady) return `CHARGING ${this.specialMeter}%`;
      if (this.specialPity) return "CAN'T MISS!";
      return 'READY!';
    },
    healRisk() {
      const used = Math.min(this.tracker.playerHeal, BALANCE.heal.failChances.length - 1);
      return Math.round(BALANCE.heal.failChances[used] * 100);
    },
  },
};
