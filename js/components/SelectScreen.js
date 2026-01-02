export default {
  name: 'select-screen',
  template: `
    <div class="screen-select fade-in">
      <div class="nes-container is-dark with-title is-centered">
        <p class="title">Choose Fighter</p>
        <p style="font-size: 10px; margin-bottom: 15px">
          Use <span class="key-hint">[ARROWS]</span> to move, <span class="key-hint">[ENTER]</span> to select
        </p>

        <div class="character-grid">
          <div
            v-for="(player, index) in players"
            :key="player.id"
            class="char-card"
            :class="{ 'selected': tempSelection && tempSelection.id === player.id, 'focused': focusedIndex === index, 'is-secret': player.isSecret }"
            role="button"
            tabindex="0"
            @click="$emit('select', player, index)"
            @mouseover="$emit('select', player, index)"
            @keydown.enter="$emit('select', player, index)"
          >
            <img :src="'./img/players/' + player.avatar" :alt="player.name" width="100" height="100" />
            <p class="char-name">{{ player.name.split(' ')[0] }}</p>
          </div>
        </div>

        <div style="margin-top: 20px">
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
  },
};
