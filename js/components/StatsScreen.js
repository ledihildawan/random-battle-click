/** StatsScreen — presentation component (Imperative Shell, Vue 2 object syntax). */
import { onAvatarError } from '../services/avatarFallback.js';
import { SPECIAL_FX } from '../services/signatureFx.js';

export default {
  name: 'stats-screen',
  template: `
    <div class="screen-stats fade-in">
      <div class="nes-container is-dark with-title is-centered stats-header">
        <p class="title">Career Record</p>
        <div class="stats-global">
          <div class="global-stat">
            <span class="global-label">Wins</span>
            <span class="global-value is-success">{{ stats.win.player1 }}</span>
          </div>
          <div class="global-stat">
            <span class="global-label">Losses</span>
            <span class="global-value is-error">{{ stats.win.player2 }}</span>
          </div>
          <div class="global-stat">
            <span class="global-label">Win Rate</span>
            <span class="global-value">{{ winRate }}%</span>
          </div>
          <div class="global-stat">
            <span class="global-label">Streak</span>
            <span class="global-value">{{ stats.streak || 0 }}</span>
          </div>
          <div class="global-stat">
            <span class="global-label">Best Streak</span>
            <span class="global-value">{{ stats.bestStreak || 0 }}</span>
          </div>
          <div class="global-stat">
            <span class="global-label">Best Combo</span>
            <span class="global-value">x{{ stats.maxCombo || 0 }}</span>
          </div>
        </div>

        <div v-if="stats.arcade && stats.arcade.highScore > 0" class="arcade-records">
          <p class="arcade-records-title">ARCADE RECORDS</p>
          <div class="arcade-records-row">
            <div class="global-stat">
              <span class="global-label">High Score</span>
              <span class="global-value is-success">{{ stats.arcade.highScore }}</span>
            </div>
            <div class="global-stat">
              <span class="global-label">Best Stage</span>
              <span class="global-value">{{ stats.arcade.bestStage }}/9</span>
            </div>
            <div class="global-stat">
              <span class="global-label">Clears</span>
              <span class="global-value">{{ stats.arcade.clears }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="nemesis" class="nes-container is-dark stats-nemesis">
        <div class="nemesis-row">
          <pixel-icon name="skull" :size="16"></pixel-icon>
          <div class="nemesis-info">
            <span class="nemesis-label">NEMESIS</span>
            <span class="nemesis-name">{{ nemesis.name }}</span>
            <span class="nemesis-detail">owns you ×{{ nemesis.cpuWins }} · you beat them ×{{ nemesis.cpuLosses || 0 }}</span>
          </div>
          <img class="nemesis-avatar" :src="'./img/players/' + nemesis.avatar" :alt="nemesis.name" width="48" height="48" @error="onAvatarError" />
        </div>
      </div>

      <div class="nes-container is-dark with-title stats-roster">
        <p class="title">Fighter Roster</p>
        <div class="roster-table">
          <div class="roster-header">
            <span class="col-name">Fighter</span>
            <span class="col-record">W-L</span>
            <span class="col-rate">Rate</span>
            <span class="col-combo">Combo</span>
            <span class="col-rounds">Rnds</span>
          </div>
          <div v-for="entry in sortedRoster" :key="entry.id" class="roster-row" :class="{ 'is-best': entry.id === bestFighterId }">
            <span class="col-name">
              <img class="roster-avatar" :src="'./img/players/' + entry.avatar" :alt="entry.name" width="24" height="24" @error="onAvatarError" />
              {{ entry.name.split(' ')[0] }}
            </span>
            <span class="col-record">{{ entry.wins || 0 }}-{{ entry.losses || 0 }}</span>
            <span class="col-rate" :class="entry.winRate >= 50 ? 'is-success' : 'is-error'">{{ entry.winRate }}%</span>
            <span class="col-combo">{{ entry.maxCombo ? 'x' + entry.maxCombo : '—' }}</span>
            <span class="col-rounds">{{ entry.rounds || 0 }}</span>
          </div>
        </div>
      </div>

      <div v-if="achievements.length" class="nes-container is-dark with-title stats-achievements">
        <p class="title">Achievements</p>
        <div class="achievement-grid">
          <div v-for="ach in achievements" :key="ach.id" class="achievement-item">
            <pixel-icon :name="ach.unlocked ? 'star' : 'x'" :size="12"></pixel-icon>
            <div>
              <p class="achievement-item-name" :class="{ 'is-unlocked': ach.unlocked }">{{ ach.name }}</p>
              <p class="achievement-item-desc">{{ ach.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-actions">
        <button v-if="!confirmReset" type="button" class="nes-btn is-error" @mousedown.prevent @click="confirmReset = true">
          <pixel-icon name="x" :size="10"></pixel-icon> Reset Record
        </button>
        <template v-else>
          <span class="reset-warning">Delete ALL stats?</span>
          <button type="button" class="nes-btn is-error" @mousedown.prevent @click="$emit('reset')">YES</button>
          <button type="button" class="nes-btn" @mousedown.prevent @click="confirmReset = false">NO</button>
        </template>
        <button type="button" class="nes-btn" @click="$emit('back')">Back <span class="key-hint">[ESC]</span></button>
      </div>
    </div>
  `,
  props: {
    stats: { type: Object, required: true },
    fighterStats: { type: Object, default: () => ({}) },
    players: { type: Array, required: true },
    achievementList: { type: Array, default: () => [] },
  },
  data() {
    return {
      confirmReset: false,
    };
  },
  computed: {
    winRate() {
      const total = this.stats.win.player1 + this.stats.win.player2;
      return total > 0 ? Math.round((this.stats.win.player1 / total) * 100) : 0;
    },
    nemesis() {
      let worst = null;
      for (const player of this.players) {
        const entry = this.fighterStats[player.id];
        if (entry && entry.cpuWins > 0 && (!worst || entry.cpuWins > worst.cpuWins)) {
          worst = { ...player, cpuWins: entry.cpuWins, cpuLosses: entry.cpuLosses };
        }
      }
      return worst;
    },
    sortedRoster() {
      return this.players
        .filter((p) => !p.isSecret)
        .map((p) => {
          const entry = this.fighterStats[p.id] || {};
          const wins = entry.wins || 0;
          const losses = entry.losses || 0;
          const total = wins + losses;
          return {
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            wins,
            losses,
            winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
            maxCombo: entry.maxCombo || 0,
            rounds: entry.rounds || 0,
          };
        })
        .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
    },
    bestFighterId() {
      const played = this.sortedRoster.filter((r) => r.wins + r.losses > 0);
      if (!played.length) return null;
      return played[0].id;
    },
    achievements() {
      const unlocked = new Set(this.stats.achievements || []);
      return this.achievementList.map((a) => ({ ...a, unlocked: unlocked.has(a.id) }));
    },
  },
  methods: {
    onAvatarError,
  },
};
