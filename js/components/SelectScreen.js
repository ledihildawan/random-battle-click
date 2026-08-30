import { onAvatarError } from '../services/avatarFallback.js';

export default {
  name: 'select-screen',
  template: `
    <div class="screen-select fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Choose Fighter</p>

        <div class="character-grid" @mouseleave="$emit('reset-focus')">
          <div
            v-for="(player, index) in players"
            :key="player.id"
            class="char-card"
            :class="{ 'selected': tempSelection && tempSelection.id === player.id, 'focused': focusedIndex === index, 'is-secret': player.isSecret, 'is-confirmed': confirmId === player.id }"
            role="button"
            tabindex="0"
            @click="$emit('select', player, index)"
            @mouseover="$emit('hover-index', index)"
            @keydown.enter="$emit('select', player, index)"
            @keydown.space.prevent="$emit('select', player, index)"
          >
            <img :src="'./img/players/' + player.avatar" :alt="player.name" width="100" height="100" @error="onAvatarError" />
            <p class="char-name">{{ player.name.split(' ')[0] }}</p>
            <p v-if="fighterRecord(player.id)" class="char-record">{{ fighterRecord(player.id) }}</p>
            <p v-if="cpuBeats(player.id)" class="char-cpu">owns you ×{{ cpuBeats(player.id) }}</p>
          </div>
        </div>

        <div class="select-actions">
          <button type="button" class="nes-btn rounds-toggle" @mousedown.prevent @click="$emit('cycle-rounds')">
            Rounds: {{ rounds }} <span class="key-hint">[R]</span>
          </button>
          <button class="nes-btn" @click="$emit('back')">Back <span class="key-hint">[ESC]</span></button>
          <button class="nes-btn is-success" :class="{ 'is-disabled': !tempSelection }" :disabled="!tempSelection" @click="$emit('confirm')">
            Confirm <span class="key-hint" v-if="tempSelection">[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  `,
  props: {
    players: { type: Array, required: true },
    tempSelection: { type: Object, default: null },
    focusedIndex: { type: Number, default: 0 },
    fighterStats: { type: Object, default: () => ({}) },
    confirmId: { type: Number, default: null },
    rounds: { type: Number, default: 1 },
  },
  methods: {
    onAvatarError,
    fighterRecord(id) {
      const entry = this.fighterStats[id];
      if (!entry || (entry.wins || 0) + (entry.losses || 0) === 0) return '';
      return `${entry.wins || 0}W-${entry.losses || 0}L`;
    },
    cpuBeats(id) {
      const entry = this.fighterStats[id];
      return entry && entry.cpuWins ? entry.cpuWins : 0;
    },
  },
};
