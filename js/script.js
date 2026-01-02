import CommandCenter from './components/CommandCenter.js';
import GiveUpDialog from './components/GiveUpDialog.js';
import LoadingScreen from './components/LoadingScreen.js';
import LogsTerminal from './components/LogsTerminal.js';
import PlayerCard from './components/PlayerCard.js';
import SelectScreen from './components/SelectScreen.js';
import SplashScreen from './components/SplashScreen.js';
import TitleScreen from './components/TitleScreen.js';

// Register components (using global Vue provided by ./js/vue.js)
Vue.component('splash-screen', SplashScreen);
Vue.component('title-screen', TitleScreen);
Vue.component('select-screen', SelectScreen);
Vue.component('loading-screen', LoadingScreen);
Vue.component('player-card', PlayerCard);
Vue.component('command-center', CommandCenter);
Vue.component('logs-terminal', LogsTerminal);
Vue.component('give-up-dialog', GiveUpDialog);

Vue.config.devtools = true;

const app = new Vue({
  el: '#app',

  data() {
    return {
      players: [
        { id: 1, name: 'Spencer Horton', avatar: 'player-1.jpg' },
        { id: 2, name: 'Glen Rouse', avatar: 'player-2.jpg' },
        { id: 3, name: 'Phoenix Walker', avatar: 'player-3.jpg' },
        { id: 4, name: 'Judy Sewell', avatar: 'player-4.jpg' },
        { id: 5, name: 'Victor Hansen', avatar: 'player-5.jpg' },
        { id: 6, name: 'Alisa Hester', avatar: 'player-6.jpg' },
        { id: 7, name: 'Kelis Ford', avatar: 'player-7.jpg' },
        { id: 8, name: 'Rene Wells', avatar: 'player-8.jpg' },
        { id: 9, name: 'Calla Wang', avatar: 'player-9.jpg' },
        { id: 10, name: 'Dorian Cordova', avatar: 'player-10.jpg' },
      ],
      selectedPlayer: { player1: {}, player2: {} },
      health: { player1: 100, player2: 100 },
      activeFx: { player1: [], player2: [] },

      showSplash: true,
      status: {
        selecting: false,
        loading: false,
        play: false,
        winner: false,
        giveUp: false,
      },

      tempSelection: null,
      focusedCharIndex: 0,
      battleMenuIndex: 0,
      turnInProgress: false,
      globalShake: false,
      loadingProgress: 0,
      isDialogOpen: false, // Extra flag for manual dialog handling

      // Cheats
      inputBuffer: [],
      konamiCode: [
        'ArrowUp',
        'ArrowUp',
        'ArrowDown',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowLeft',
        'ArrowRight',
        'b',
        'a',
      ],
      cheatActivated: false,

      limit: { heal: 3 },
      tracker: { playerHeal: 0, enemyHeal: 0 },
      stats: { win: { player1: 0, player2: 0 } },
      logs: [],
    };
  },

  computed: {
    isTitleScreen() {
      return (
        !this.showSplash && !this.status.selecting && !this.status.loading && !this.status.play && !this.status.winner
      );
    },
  },

  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    UIEffects.initSnow();
    // Splash Timer Matches CSS Animation (2.5s + buffer)
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);

    // Allow splash component to request an early skip
    window.addEventListener('splash:skip', this._onSplashSkip);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('splash:skip', this._onSplashSkip);
  },

  methods: {
    _onSplashSkip(e) {
      this.showSplash = false;
    },
    // === KEYBOARD CONTROLLER ===
    handleKeydown(e) {
      if (this.showSplash || this.status.loading) return;

      if (this.isTitleScreen) {
        this.inputBuffer.push(e.key);
        if (this.inputBuffer.length > 20) this.inputBuffer.shift();
        const bufferString = this.inputBuffer.slice(-this.konamiCode.length).join(',');
        const codeString = this.konamiCode.join(',');
        if (bufferString === codeString) this.activateCheat();

        if (e.key === 'Enter') this.goToSelectScreen();
        return;
      }

      if (this.status.selecting) {
        if (e.key === 'ArrowRight') this.moveGridFocus(1, 0);
        if (e.key === 'ArrowLeft') this.moveGridFocus(-1, 0);
        if (e.key === 'ArrowDown') this.moveGridFocus(0, 1);
        if (e.key === 'ArrowUp') this.moveGridFocus(0, -1);
        if (e.key === 'Enter') this.confirmSelection();
        if (e.key === 'Escape') this.backToTitle();
        return;
      }

      // Dialog Handling logic (Check visibility)
      if (this.isDialogOpen) {
        if (e.key === 'Escape') this.hideDialogGiveUp();
        if (e.key === 'Enter') this.giveUp();
        return;
      }

      if (this.status.play && !this.status.winner && !this.turnInProgress) {
        if (e.key === '1') {
          this.battleMenuIndex = 0;
          this.executeBattleAction();
        }
        if (e.key === '2') {
          this.battleMenuIndex = 1;
          this.executeBattleAction();
        }
        if (e.key === '3') {
          this.battleMenuIndex = 2;
          this.executeBattleAction();
        }

        if (e.key === 'ArrowRight') this.battleMenuIndex = Math.min(this.battleMenuIndex + 1, 2);
        if (e.key === 'ArrowLeft') this.battleMenuIndex = Math.max(this.battleMenuIndex - 1, 0);

        if (e.key === 'Enter') this.executeBattleAction();
        if (e.key === 'Escape') this.showDialogGiveUp();
      }

      if (this.status.winner) {
        // --- 1. Navigasi Panah (Multi-dimensi) ---
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          this.battleMenuIndex = (this.battleMenuIndex + 1) % 3;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          this.battleMenuIndex = (this.battleMenuIndex - 1 + 3) % 3;
        }

        // --- 2. Shortcut Key Instan ---
        // Tekan 'R' untuk Rematch
        if (e.key.toLowerCase() === 'r') {
          this.reBattle();
          return;
        }
        // Tekan 'Esc' untuk kembali ke Title
        if (e.key === 'Escape') {
          this.backToTitle();
          return;
        }
        // Tekan 'N' untuk New Character (Opsional)
        if (e.key.toLowerCase() === 'n') {
          this.goToSelectScreen();
          return;
        }

        // --- 3. Eksekusi Menu Berdasarkan Pilihan Index (Enter) ---
        if (e.key === 'Enter') {
          if (this.battleMenuIndex === 0) this.goToSelectScreen(); // New Fighter
          else if (this.battleMenuIndex === 1) this.reBattle(); // Rematch
          else if (this.battleMenuIndex === 2) this.backToTitle(); // Exit
        }
        return;
      }
    },

    moveGridFocus(x, y) {
      const cols = window.innerWidth > 600 ? 5 : 3;
      const total = this.players.length;
      let current = this.focusedCharIndex;

      if (x !== 0) {
        current += x;
        if (current < 0) current = total - 1;
        if (current >= total) current = 0;
      }

      if (y !== 0) {
        let next = current + y * cols;
        if (next >= total) next = next % cols;
        else if (next < 0) {
          next = total - (cols - (current % cols));
          if (next >= total) next -= cols;
        }
        current = next;
      }

      if (current < 0) current = 0;
      if (current >= total) current = total - 1;

      this.focusedCharIndex = current;
      this.tempSelection = this.players[current];
    },

    activateCheat() {
      if (this.cheatActivated) return;
      this.cheatActivated = true;
      this.players.push({
        id: 999,
        name: 'DEV GOD 👑',
        avatar: 'player-10.jpg',
        isSecret: true,
      });
      setTimeout(() => {
        this.cheatActivated = false;
      }, 3000);
    },

    executeBattleAction() {
      BattleEngine.executeBattleAction(this);
    },

    goToSelectScreen() {
      this.status.selecting = true;
      this.status.play = false;
      this.status.winner = false;
      this.tempSelection = this.players[0];
      this.focusedCharIndex = 0;
    },

    clickSelectPlayer(player, index) {
      this.tempSelection = player;
      this.focusedCharIndex = index;
    },

    confirmSelection() {
      if (!this.tempSelection) return;
      this.selectedPlayer.player1 = { ...this.tempSelection };
      this.status.selecting = false;
      this.startLoading();
    },

    backToTitle() {
      this.status.selecting = false;
      this.status.play = false;
      this.status.winner = false;
      this.status.loading = false;
      this.battleMenuIndex = 0;
    },

    startLoading() {
      this.status.loading = true;
      this.loadingProgress = 0;
      const interval = setInterval(() => {
        this.loadingProgress += 5;
        if (this.loadingProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            this.status.loading = false;
            this.startNewBattle();
          }, 500);
        }
      }, 50);
    },

    startNewBattle() {
      BattleEngine.startNewBattle(this);
    },

    reBattle() {
      BattleEngine.reBattle(this);
    },

    checkWinner() {
      if (this.health.player2 <= 0) {
        this.health.player2 = 0;
        this.selectedPlayer.player1.name = `👑 ${this.selectedPlayer.player1.name}`;
        this.stats.win.player1 += 1;
        this.createLog(
          `<span style="color:#209cee; font-weight:bold;">🏆 VICTORY! You defeated ${this.selectedPlayer.player2.name}!</span>`
        );
        this.spawnConfetti();
        this.gameOver();
        return true;
      }
      if (this.health.player1 <= 0) {
        this.health.player1 = 0;
        this.selectedPlayer.player2.name = `👑 ${this.selectedPlayer.player2.name}`;
        this.stats.win.player2 += 1;
        this.createLog(`<span style="color:#e76e55; font-weight:bold;">💀 DEFEAT! You were eliminated.</span>`);
        this.gameOver();
        return true;
      }
      return false;
    },

    gameOver() {
      this.status.play = false;
      this.status.winner = true;
      this.turnInProgress = false;
      this.battleMenuIndex = 0;
    },

    // Delegated to BattleEngine

    createLog(message) {
      const logsContainer = document.querySelector('.logs-terminal');
      this.logs.push(message);
      if (logsContainer) {
        this.$nextTick(() => {
          logsContainer.scrollTo({ left: 0, top: logsContainer.scrollHeight, behavior: 'smooth' });
        });
      }
    },

    // Visual effects delegated to UIEffects

    playerAttack(type) {
      BattleEngine.playerAttack(this, type);
    },

    playerHeal() {
      BattleEngine.playerHeal(this);
    },

    enemyTurn() {
      BattleEngine.enemyTurn(this);
    },

    showDialogGiveUp() {
      this.isDialogOpen = true;
    },

    hideDialogGiveUp() {
      this.isDialogOpen = false;
    },

    giveUp() {
      this.createLog(`🏳️ SIGNAL LOST: Player surrendered.`);
      this.health.player1 = 0;
      this.status.play = false;
      this.status.winner = true;
      this.hideDialogGiveUp();
    },

    // FUNCTION IS NOW CORRECTLY INSIDE METHODS
    healthBarColorStatus(value) {
      return {
        'is-primary': value > 50,
        'is-warning': value > 20 && value <= 50,
        'is-error': value <= 20,
      };
    },

    initSnow() {
      const container = document.getElementById('snow-container');
      const snowCount = 60; // Sedikit lebih banyak untuk kedalaman

      for (let i = 0; i < snowCount; i++) {
        const snow = document.createElement('div');
        snow.className = 'snow-pixel';

        // Mengatur "Depth" (Kedalaman) secara acak
        const sizeType = Math.random();
        let size = 4; // Ukuran pixel standar
        let opacity = 0.8;
        let duration = Math.random() * 3 + 4; // Lebih lambat

        if (sizeType < 0.3) {
          // Salju jauh (kecil & lambat)
          size = 2;
          opacity = 0.4;
          duration = Math.random() * 5 + 7;
        } else if (sizeType > 0.8) {
          // Salju dekat (besar & cepat)
          size = 6;
          opacity = 0.9;
          duration = Math.random() * 2 + 3;
        }

        // Terapkan Style
        snow.style.width = `${size}px`;
        snow.style.height = `${size}px`;
        snow.style.opacity = opacity;
        snow.style.left = Math.random() * 100 + 'vw';

        // Animasi
        snow.style.animationDuration = `${duration}s, ${Math.random() * 2 + 2}s`;
        snow.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;

        container.appendChild(snow);
      }
    },
  },
});
