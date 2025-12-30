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
        player1: { id: 4, name: '', avatar: '' },
        player2: { id: 2, name: '', avatar: '' },
      },
      health: {
        player1: 100,
        player2: 100,
      },
      // New: Stores floating text objects
      activeFx: {
        player1: [],
        player2: [],
      },
      status: {
        play: false,
        winner: false,
        giveUp: false,
      },
      limit: {
        heal: 3,
      },
      tracker: {
        heal: 0,
      },
      stats: {
        win: {
          player1: 0,
          player2: 0,
        },
      },
      logs: [],
    };
  },

  created() {
    this.selectRandPlayers();
  },

  methods: {
    getRandPlayers() {
      return this.players[Math.floor(Math.random() * this.players.length)];
    },

    selectRandPlayers() {
      const rand = setInterval(() => {
        if (this.status.play) clearInterval(rand);

        this.selectedPlayer.player1 = this.getRandPlayers();
        this.selectedPlayer.player2 = this.getRandPlayers();

        if (this.selectedPlayer.player1 === this.selectedPlayer.player2) {
          this.selectedPlayer.player2 = this.getRandPlayers();
        }
      }, 1000);
    },

    resetCrown(players) {
      players.forEach((player) => {
        if (this.selectedPlayer[player].name.includes('👑')) {
          this.selectedPlayer[player].name = this.selectedPlayer[player].name
            .split('👑')
            .filter((n) => n)
            .join(' ')
            .trim();
        }
      });
    },

    startNewGame() {
      this.resetCrown(['player1', 'player2']);
      this.status.play = true;
      this.status.winner = false;
      this.status.giveUp = false;
      this.health.player1 = 100;
      this.health.player2 = 100;
      this.tracker.heal = 0;
      this.logs = [];
      this.activeFx.player1 = [];
      this.activeFx.player2 = [];
    },

    reBattle() {
      this.resetCrown(['player1', 'player2']);
      this.status.play = true;
      this.status.winner = false;
      this.status.giveUp = false;
      this.health.player1 = 100;
      this.health.player2 = 100;
      this.tracker.heal = 0;
      this.logs = [];
      this.activeFx.player1 = [];
      this.activeFx.player2 = [];
    },

    exitGame() {
      this.resetCrown(['player1', 'player2']);
      this.selectRandPlayers();
      this.stats.win.player1 = 0;
      this.stats.win.player2 = 0;
      this.status.play = false;
      this.status.winner = false;
      this.status.giveUp = false;
    },

    gameOver() {
      this.status.play = false;
      this.status.winner = true;
      this.status.giveUp = false;
    },

    determineTheWinner() {
      // Double KO
      if (this.health.player1 <= 0 && this.health.player2 <= 0) {
        this.health.player1 = 0;
        this.health.player2 = 0;
        this.createLog('DOUBLE KO! NO ONE WINS THIS BATTLE ⚔️');
        this.gameOver();
        return true;
      }

      // Player 2 Wins
      if (this.health.player1 <= 0) {
        const name = this.selectedPlayer.player2.name.toUpperCase();
        this.selectedPlayer.player2.name = `👑 ${name}`;
        this.stats.win.player2 += 1;
        this.health.player1 = 0;
        this.createLog(`${name} HAS WON THE BATTLE ⚔️`);
        this.gameOver();
        return true;
      }

      // Player 1 Wins
      if (this.health.player2 <= 0) {
        const name = this.selectedPlayer.player1.name.toUpperCase();
        this.selectedPlayer.player1.name = `👑 ${name}`;
        this.stats.win.player1 += 1;
        this.health.player2 = 0;
        this.createLog(`${name} HAS WON THE BATTLE ⚔️`);
        this.gameOver();
        return true;
      }

      return false;
    },

    calcDamage(min = 2, max = 10) {
      return Math.max(Math.floor(Math.random() * max) + 1, min);
    },

    createLog(message) {
      const logsContainer = document.querySelector('.logs');
      this.logs.push(message);
      if (logsContainer) {
        setTimeout(() => {
          logsContainer.scrollTo({
            left: 0,
            top: logsContainer.scrollHeight,
            behavior: 'smooth',
          });
        }, 50);
      }
    },

    triggerVisualEffect(targetPlayer) {
      const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
      const el = document.querySelector(selector);
      if (el) {
        el.classList.remove('shake');
        el.classList.remove('hit-flash');
        void el.offsetWidth;
        el.classList.add('shake');
        el.classList.add('hit-flash');
        setTimeout(() => el.classList.remove('hit-flash'), 200);
      }
    },

    // --- UX: Floating Combat Text ---
    spawnFloatingText(targetPlayer, text, type) {
      const id = Date.now() + Math.random();
      const fxObj = { id, text, type };

      // Add to array
      this.activeFx[targetPlayer].push(fxObj);

      // Remove after animation (1s)
      setTimeout(() => {
        this.activeFx[targetPlayer] = this.activeFx[targetPlayer].filter((fx) => fx.id !== id);
      }, 1000);
    },

    attack() {
      const p1Name = this.selectedPlayer.player1.name;
      const p2Name = this.selectedPlayer.player2.name;

      let dmgTakenByP1 = this.calcDamage(3, 10);
      let dmgTakenByP2 = this.calcDamage(3, 10);

      const p1Crit = Math.random() < 0.15;
      const p2Crit = Math.random() < 0.15;

      if (p1Crit) dmgTakenByP2 *= 2;
      if (p2Crit) dmgTakenByP1 *= 2;

      // Apply Damage
      this.health.player1 -= dmgTakenByP1;
      this.health.player2 -= dmgTakenByP2;

      this.triggerVisualEffect('player1');
      this.triggerVisualEffect('player2');

      // Floating Text UX
      this.spawnFloatingText('player1', `-${dmgTakenByP1}`, p2Crit ? 'crit' : 'damage');
      this.spawnFloatingText('player2', `-${dmgTakenByP2}`, p1Crit ? 'crit' : 'damage');

      // Logs
      if (p1Crit)
        this.createLog(`<span class="log-crit">💥 CRITICAL! ${p1Name} hits ${p2Name} for ${dmgTakenByP2}!!</span>`);
      else this.createLog(`${p1Name} hits ${p2Name} for ${dmgTakenByP2}`);

      if (p2Crit)
        this.createLog(`<span class="log-crit">💥 CRITICAL! ${p2Name} hits ${p1Name} for ${dmgTakenByP1}!!</span>`);
      else this.createLog(`${p2Name} hits ${p1Name} for ${dmgTakenByP1}`);

      if (this.determineTheWinner()) return;
      this.determineTheWinner();
    },

    specialAttack() {
      const p1Name = this.selectedPlayer.player1.name;
      const p2Name = this.selectedPlayer.player2.name;

      const dmgTakenByP1 = this.calcDamage(15, 30);
      const dmgTakenByP2 = this.calcDamage(15, 30);

      const p1Miss = Math.random() < 0.2;
      const p2Miss = Math.random() < 0.2;

      // P1 Attacks P2
      if (!p1Miss) {
        this.health.player2 -= dmgTakenByP2;
        this.triggerVisualEffect('player2');
        this.spawnFloatingText('player2', `-${dmgTakenByP2}`, 'special');
        this.createLog(`✨ ${p1Name} BLASTS ${p2Name} for ${dmgTakenByP2}`);
      } else {
        this.spawnFloatingText('player2', `MISS`, 'miss');
        this.createLog(`<span class="log-miss">💨 ${p1Name} used Special Attack but MISSED!</span>`);
      }

      // P2 Attacks P1
      if (!p2Miss) {
        this.health.player1 -= dmgTakenByP1;
        this.triggerVisualEffect('player1');
        this.spawnFloatingText('player1', `-${dmgTakenByP1}`, 'special');
        this.createLog(`✨ ${p2Name} BLASTS ${p1Name} for ${dmgTakenByP1}`);
      } else {
        this.spawnFloatingText('player1', `MISS`, 'miss');
        this.createLog(`<span class="log-miss">💨 ${p2Name} used Special Attack but MISSED!</span>`);
      }

      if (this.determineTheWinner()) return;
      this.determineTheWinner();
    },

    heal() {
      if (this.tracker.heal >= this.limit.heal) return;

      this.tracker.heal++;
      const p1Name = this.selectedPlayer.player1.name;
      const p2Name = this.selectedPlayer.player2.name;

      const healP1 = Math.floor(Math.random() * 15) + 10;
      const healP2 = Math.floor(Math.random() * 15) + 10;

      this.health.player1 += healP1;
      if (this.health.player1 > 100) this.health.player1 = 100;

      this.health.player2 += healP2;
      if (this.health.player2 > 100) this.health.player2 = 100;

      // Floating Text UX
      this.spawnFloatingText('player1', `+${healP1}`, 'heal');
      this.spawnFloatingText('player2', `+${healP2}`, 'heal');

      this.createLog(`💚 ${p1Name} heals for ${healP1}`);
      this.createLog(`💚 ${p2Name} heals for ${healP2}`);
    },

    showDialogGiveUp() {
      const giveUpDialogBackdrop = document.createElement('div');
      giveUpDialogBackdrop.className = 'give-up-dialog-backdrop';
      document.getElementById('give-up-dialog').setAttribute('open', 'true');
      document.body.appendChild(giveUpDialogBackdrop);
      giveUpDialogBackdrop.addEventListener('click', () => {
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
      const winStats = this.stats.win;
      const p1Name = this.selectedPlayer.player1.name;
      const p2Name = this.selectedPlayer.player2.name;
      const player1Win = winStats.player1 > winStats.player2;
      const player2Win = winStats.player2 > winStats.player1;
      const tie = winStats.player1 === winStats.player2;

      if (player1Win) {
        this.createLog(`${p1Name} HAS WON! ${p2Name} SURRENDERED.`);
      } else if (player2Win) {
        this.createLog(`${p2Name} HAS WON! ${p1Name} SURRENDERED.`);
      } else if (tie) {
        this.createLog(`THE BATTLE ⚔️ ENDED IN A DRAW.`);
      } else {
        this.createLog(`PEACE WAS CHOSEN.`);
      }

      this.status.giveUp = true;
      this.status.play = false;
      this.status.winner = false;
      this.tracker.heal = 0;
      this.hideDialogGiveUp();
      this.selectRandPlayers();
    },

    healthBarColorStatus(value) {
      return {
        'is-primary': value > 50 && value <= 80,
        'is-success': value > 30 && value <= 50,
        'is-warning': value > 10 && value <= 30,
        'is-error': value <= 10,
      };
    },
  },
});
