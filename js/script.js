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
      selectedPlayer: {
        player1: { id: null, name: '', avatar: '' },
        player2: { id: null, name: '', avatar: '' },
      },
      health: { player1: 100, player2: 100 },
      activeFx: { player1: [], player2: [] },
      status: {
        selecting: false,
        loading: false,
        play: false,
        winner: false,
        giveUp: false,
      },
      tempSelection: null,
      focusedCharIndex: 0, // NEW: Tracks keyboard selection focus
      loadingProgress: 0,

      turnInProgress: false,
      globalShake: false,

      limit: { heal: 3 },
      tracker: { playerHeal: 0, enemyHeal: 0 },
      stats: { win: { player1: 0, player2: 0 } },
      logs: [],
    };
  },

  computed: {
    isTitleScreen() {
      return !this.status.selecting && !this.status.loading && !this.status.play && !this.status.winner;
    },
  },

  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    // === KEYBOARD MASTER CONTROLLER ===
    handleKeydown(e) {
      if (this.status.loading) return; // Block input during loading

      // 1. TITLE SCREEN
      if (this.isTitleScreen) {
        if (e.key === 'Enter') this.goToSelectScreen();
        return;
      }

      // 2. CHARACTER SELECTION
      if (this.status.selecting) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.moveFocus(1);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.moveFocus(-1);
        if (e.key === 'Enter') this.confirmSelection();
        if (e.key === 'Escape') this.backToTitle();
        return;
      }

      // 3. DIALOG (Surrender)
      if (this.status.giveUp) {
        // Only if using custom logic var, but here we use dialog visibility
        const dialog = document.getElementById('give-up-dialog');
        if (dialog && dialog.getAttribute('open')) {
          if (e.key === 'Escape') this.hideDialogGiveUp();
          if (e.key === 'Enter') this.giveUp();
          return;
        }
      }

      // 4. BATTLE STATE
      if (this.status.play && !this.status.winner && !this.turnInProgress) {
        if (e.key === '1') this.playerAttack('normal');
        if (e.key === '2') this.playerAttack('special');
        if (e.key === '3') this.playerHeal();
        if (e.key === 'Escape') this.showDialogGiveUp();
      }

      // 5. GAME OVER
      if (this.status.winner) {
        if (e.key === 'r' || e.key === 'R') this.reBattle();
        if (e.key === 'Enter') this.goToSelectScreen();
        if (e.key === 'Escape') this.backToTitle();
      }
    },

    // Keyboard Focus Helper
    moveFocus(dir) {
      let newIndex = this.focusedCharIndex + dir;
      // Wrap around logic
      if (newIndex < 0) newIndex = this.players.length - 1;
      if (newIndex >= this.players.length) newIndex = 0;

      this.focusedCharIndex = newIndex;
      // Auto-select when moving focus (Optional, but good for UX)
      this.tempSelection = this.players[newIndex];
    },

    // --- NAVIGATION ---
    goToSelectScreen() {
      this.status.selecting = true;
      this.status.play = false;
      this.status.winner = false;
      this.tempSelection = this.players[0]; // Default Select First
      this.focusedCharIndex = 0; // Reset Focus
    },

    // Mouse click support
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
      let opponent;
      do {
        opponent = this.players[Math.floor(Math.random() * this.players.length)];
      } while (opponent.id === this.selectedPlayer.player1.id);

      this.selectedPlayer.player2 = opponent;
      this.status.play = true;
      this.status.winner = false;
      this.health.player1 = 100;
      this.health.player2 = 100;
      this.tracker.playerHeal = 0;
      this.tracker.enemyHeal = 0;
      this.logs = [];
      this.activeFx = { player1: [], player2: [] };
      this.clearConfetti();

      this.createLog('System Initialized. Battle Start!');

      const playerStarts = Math.random() < 0.5;
      if (playerStarts) {
        this.turnInProgress = false;
        this.createLog('🚀 INITIATIVE: You attack first!');
      } else {
        this.turnInProgress = true;
        this.createLog('⚠️ WARNING: Enemy attacks first!');
        setTimeout(() => {
          this.enemyTurn();
        }, 1500);
      }
    },

    reBattle() {
      this.status.winner = false;
      this.startLoading();
    },

    // --- GAME LOGIC ---

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
    },

    calcDamage(min, max) {
      return Math.max(Math.floor(Math.random() * max) + 1, min);
    },

    createLog(message) {
      const logsContainer = document.querySelector('.logs-terminal');
      this.logs.push(message);
      if (logsContainer) {
        setTimeout(() => {
          logsContainer.scrollTo({ left: 0, top: logsContainer.scrollHeight, behavior: 'smooth' });
        }, 50);
      }
    },

    triggerVisualEffect(targetPlayer) {
      const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
      const el = document.querySelector(selector);
      if (el) {
        el.classList.remove('shake', 'hit-flash');
        void el.offsetWidth;
        el.classList.add('shake', 'hit-flash');
        setTimeout(() => el.classList.remove('hit-flash'), 200);
      }
    },

    triggerGlobalShake() {
      this.globalShake = true;
      setTimeout(() => {
        this.globalShake = false;
      }, 500);
    },

    spawnFloatingText(targetPlayer, text, type) {
      const id = Date.now() + Math.random();
      this.activeFx[targetPlayer].push({ id, text, type });
      setTimeout(() => {
        this.activeFx[targetPlayer] = this.activeFx[targetPlayer].filter((fx) => fx.id !== id);
      }, 1000);
    },

    spawnConfetti() {
      const container = document.getElementById('confetti-container');
      const colors = ['#f7d51d', '#e76e55', '#209cee', '#92cc41'];
      for (let i = 0; i < 50; i++) {
        const div = document.createElement('div');
        div.className = 'confetti';
        div.style.left = Math.random() * 100 + 'vw';
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        div.style.animationDuration = Math.random() * 3 + 2 + 's';
        container.appendChild(div);
      }
    },

    clearConfetti() {
      const container = document.getElementById('confetti-container');
      container.innerHTML = '';
    },

    // --- ACTIONS ---

    playerAttack(type) {
      if (this.turnInProgress) return;
      this.turnInProgress = true;
      const p2Name = this.selectedPlayer.player2.name;
      let damage = 0,
        isCrit = false,
        isMiss = false;

      if (type === 'normal') {
        damage = this.calcDamage(3, 10);
        if (Math.random() < 0.15) {
          damage *= 2;
          isCrit = true;
        }
      } else if (type === 'special') {
        damage = this.calcDamage(10, 25);
        if (Math.random() < 0.2) {
          damage = 0;
          isMiss = true;
        }
      }

      if (isMiss) {
        this.spawnFloatingText('player2', 'MISS', 'miss');
        this.createLog(`💨 Attack MISSED on ${p2Name}!`);
      } else {
        this.health.player2 -= damage;
        this.triggerVisualEffect('player2');
        if (type === 'special') {
          this.spawnFloatingText('player2', `-${damage}`, 'special');
          this.createLog(`✨ <span style="color:#f7d51d">SPECIAL!</span> You blasted ${p2Name} for ${damage} DMG!`);
        } else {
          this.spawnFloatingText('player2', `-${damage}`, isCrit ? 'crit' : 'damage');
          if (isCrit) {
            this.createLog(`<span style="color:#e76e55">💥 CRITICAL HIT!</span> You dealt ${damage} DMG!`);
            this.triggerGlobalShake();
          } else {
            this.createLog(`🗡️ You hit ${p2Name} for ${damage} DMG.`);
          }
        }
      }

      if (!this.checkWinner())
        setTimeout(() => {
          this.enemyTurn();
        }, 1200);
    },

    playerHeal() {
      if (this.turnInProgress || this.tracker.playerHeal >= this.limit.heal) return;
      this.turnInProgress = true;
      this.tracker.playerHeal++;

      const healAmount = Math.floor(Math.random() * 15) + 10;
      this.health.player1 += healAmount;
      if (this.health.player1 > 100) this.health.player1 = 100;

      this.spawnFloatingText('player1', `+${healAmount}`, 'heal');
      this.createLog(`💊 REPAIR: You restored ${healAmount} HP.`);
      setTimeout(() => {
        this.enemyTurn();
      }, 1200);
    },

    enemyTurn() {
      if (this.status.winner) return;
      const p2Name = this.selectedPlayer.player2.name;
      let action = 'attack';

      const canHeal = this.tracker.enemyHeal < this.limit.heal;
      const isLowHp = this.health.player2 < 40;

      if (isLowHp && canHeal && Math.random() < 0.4) action = 'heal';
      else if (Math.random() < 0.25) action = 'special';

      if (action === 'heal') {
        this.tracker.enemyHeal++;
        const healAmount = Math.floor(Math.random() * 15) + 10;
        this.health.player2 += healAmount;
        if (this.health.player2 > 100) this.health.player2 = 100;
        this.spawnFloatingText('player2', `+${healAmount}`, 'heal');
        this.createLog(`💊 <span style="color:#e76e55">${p2Name}</span> used a Medkit (+${healAmount} HP).`);
      } else {
        let damage = 0,
          isCrit = false,
          isMiss = false;
        if (action === 'special') {
          damage = this.calcDamage(10, 25);
          if (Math.random() < 0.2) isMiss = true;
        } else {
          damage = this.calcDamage(3, 10);
          if (Math.random() < 0.15) {
            damage *= 2;
            isCrit = true;
          }
        }

        if (isMiss) {
          this.spawnFloatingText('player1', 'MISS', 'miss');
          this.createLog(`💨 ${p2Name} tried a Special Attack but MISSED!`);
        } else {
          this.health.player1 -= damage;
          this.triggerVisualEffect('player1');
          if (action === 'special') {
            this.spawnFloatingText('player1', `-${damage}`, 'special');
            this.createLog(`✨ ${p2Name} used <span style="color:#f7d51d">SPECIAL ATTACK</span> for ${damage} DMG!`);
          } else {
            this.spawnFloatingText('player1', `-${damage}`, isCrit ? 'crit' : 'damage');
            if (isCrit) {
              this.createLog(`<span style="color:#e76e55">⚠️ CRITICAL HIT!</span> ${p2Name} hit you for ${damage}!`);
              this.triggerGlobalShake();
            } else {
              this.createLog(`🛡️ ${p2Name} attacks! You took ${damage} damage.`);
            }
          }
        }
      }
      if (!this.checkWinner()) this.turnInProgress = false;
    },

    showDialogGiveUp() {
      const backdrop = document.createElement('div');
      backdrop.className = 'give-up-dialog-backdrop';
      document.getElementById('give-up-dialog').setAttribute('open', 'true');
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', () => {
        this.hideDialogGiveUp();
      });
    },

    hideDialogGiveUp() {
      const dialog = document.getElementById('give-up-dialog');
      const backdrop = document.querySelector('.give-up-dialog-backdrop');
      if (dialog) dialog.removeAttribute('open');
      if (backdrop) backdrop.remove();
    },

    giveUp() {
      this.createLog(`🏳️ SIGNAL LOST: Player surrendered.`);
      this.health.player1 = 0;
      this.status.play = false;
      this.status.winner = true;
      this.hideDialogGiveUp();
    },

    healthBarColorStatus(value) {
      return {
        'is-primary': value > 50,
        'is-warning': value > 20 && value <= 50,
        'is-error': value <= 20,
      };
    },
  },
});
