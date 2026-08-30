/** SelectScreen — presentation component (Imperative Shell, Vue 2 object syntax). */
import { onAvatarError } from '../services/avatarFallback.js';
import { SPECIAL_FX } from '../services/signatureFx.js';

export default {
  name: 'select-screen',
  template: `
    <div class="screen-select fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Choose Fighter</p>

        <div class="select-layout">
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

          <div v-if="detailFighter" class="fighter-detail" :key="detailFighter.id">
            <img class="detail-avatar" :src="'./img/players/' + detailFighter.avatar" :alt="detailFighter.name" width="80" height="80" @error="onAvatarError" />
            <p class="detail-name">{{ detailFighter.name }}</p>
            <div class="detail-signature">
              <span class="detail-signature-label">Signature</span>
              <span class="detail-signature-move">{{ signatureName(detailFighter.id) }}</span>
            </div>
            <p class="detail-lore">{{ detailFighter.lore || 'A mysterious challenger.' }}</p>
            <div class="detail-stats" v-if="fighterStats[detailFighter.id]">
              <div class="detail-stat">
                <span class="detail-stat-value">{{ fighterStats[detailFighter.id].wins || 0 }}W</span>
                <span class="detail-stat-value">{{ fighterStats[detailFighter.id].losses || 0 }}L</span>
              </div>
              <div class="detail-stat" v-if="fighterStats[detailFighter.id].maxCombo">
                <span class="detail-stat-label">Best combo</span>
                <span class="detail-stat-value">x{{ fighterStats[detailFighter.id].maxCombo }}</span>
              </div>
              <div class="detail-stat" v-if="fighterStats[detailFighter.id].rounds">
                <span class="detail-stat-label">Rounds</span>
                <span class="detail-stat-value">{{ fighterStats[detailFighter.id].rounds }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="select-actions">
          <button type="button" class="nes-btn" @mousedown.prevent @click="$emit('random-pick')">
            <span style="font-size: 14px">?</span> Random <span class="key-hint">[SPACE]</span>
          </button>
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
  computed: {
    detailFighter() {
      return this.tempSelection || this.players[this.focusedIndex] || null;
    },
  },
  methods: {
    onAvatarError,
    signatureName(id) {
      const fx = SPECIAL_FX[id];
      return fx ? fx.move : 'UNKNOWN';
    },
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
