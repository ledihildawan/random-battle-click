export default {
  name: 'command-center',
  template: `
    <div class="actions">
      <div class="combat-buttons" v-if="!winner">
        <button type="button" class="nes-btn is-error actions__btn" :class="{ 'is-disabled': turnInProgress, 'focused': battleMenuIndex === 0 }" @click="$emit('attack-normal')" @mouseover="$emit('hover-index', 0)">
          <div>🗡️ Attack <span class="key-hint">[1]</span></div>
          <div class="btn-subtext">Low risk</div>
        </button>
        <button type="button" class="nes-btn is-warning actions__btn" :class="{ 'is-disabled': turnInProgress, 'focused': battleMenuIndex === 1 }" @click="$emit('attack-special')" @mouseover="$emit('hover-index', 1)">
          <div>✨ Special <span class="key-hint">[2]</span></div>
          <div class="btn-subtext">High risk</div>
        </button>
        <button type="button" class="nes-btn is-success actions__btn" :class="{ 'is-disabled': (health.player1 >= 100) || tracker.playerHeal >= limit.heal || turnInProgress, 'focused': battleMenuIndex === 2 }" @click="$emit('heal')" @mouseover="$emit('hover-index', 2)">
          <div>💊 Heal <span class="key-hint">[3]</span></div>
          <div class="btn-subtext">{{ limit.heal - tracker.playerHeal }} uses left</div>
        </button>
      </div>
      <div class="combat-buttons" v-else>
        <button class="nes-btn is-primary" :class="{ 'focused': battleMenuIndex === 0 }" @click="$emit('new')" @mouseover="$emit('hover-index', 0)">New Match <span class="key-hint">[ENTER]</span></button>
        <button class="nes-btn" :class="{ 'focused': battleMenuIndex === 1 }" @click="$emit('rematch')" @mouseover="$emit('hover-index', 1)">Rematch <span class="key-hint">[R]</span></button>
        <button class="nes-btn is-error" :class="{ 'focused': battleMenuIndex === 2 }" @click="$emit('exit')" @mouseover="$emit('hover-index', 2)">Back to Title <span class="key-hint">[ESC]</span></button>
      </div>
    </div>
  `,
  props: {
    winner: { type: Boolean, default: false },
    turnInProgress: { type: Boolean, default: false },
    battleMenuIndex: { type: Number, default: 0 },
    health: { type: Object, required: true },
    limit: { type: Object, required: true },
    tracker: { type: Object, required: true },
  },
};
