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
      els: {
        logs: document.querySelector('.logs'),
      },
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
      this.stats.win.player1 = 0;
      this.stats.win.player2 = 0;
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
      if (this.health.player1 <= 0 && this.health.player2 <= 0) {
        this.createLog('DOUBLE KO! NO ONE WINS THIS BATTLE ⚔️');
        this.gameOver();
        return true;
      }

      if (this.health.player1 <= 0) {
        const name = this.selectedPlayer.player2.name.toUpperCase();
        this.selectedPlayer.player2.name = `👑 ${name}`;
        this.stats.win.player2 += 1;
        this.health.player1 = 0;
        this.createLog(`${name} HAS WON THE BATTLE ⚔️`);
        this.gameOver();
        return true;
      }

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

    triggerVisualEffect(targetPlayer) {
      const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
      const el = document.querySelector(selector);
      if (el) {
        el.classList.remove('shake'); // reset
        void el.offsetWidth; // trigger reflow
        el.classList.add('shake');
        el.classList.add('hit-flash');
        setTimeout(() => el.classList.remove('hit-flash'), 200);
      }
    },

    calcDemage(min, max) {
      return Math.max(Math.floor(Math.random() * max) + 1, min);
    },

    createLog(message) {
      const logs = document.querySelector('.logs');
      this.logs.push(message); // Pushing direct message or object logic handled in HTML

      // Auto scroll
      setTimeout(() => {
        logs.scrollTo({ left: 0, top: logs.scrollHeight, behavior: 'smooth' });
      }, 0);
    },

    // Standard Attack: Reliable, Low Damage, small Crit chance
    attack() {
      const player1 = this.selectedPlayer.player1.name;
      const player2 = this.selectedPlayer.player2.name;

      // Calculate Base Damage
      let dmg1 = this.calcDemage(3, 10);
      let dmg2 = this.calcDemage(3, 10);

      // 15% Chance for Critical Hit (2x Damage)
      const crit1 = Math.random() < 0.15;
      const crit2 = Math.random() < 0.15;

      if (crit1) dmg1 *= 2;
      if (crit2) dmg2 *= 2;

      // Apply Damage
      this.health.player1 -= dmg1;
      this.health.player2 -= dmg2;

      // Visuals
      this.triggerVisualEffect('player1');
      this.triggerVisualEffect('player2');

      // Logs
      if (crit2) this.createLog(`💥 CRITICAL! ${player1} hits ${player2} for ${dmg2}!!`);
      else this.createLog(`${player1} hits ${player2} for ${dmg2}`);

      if (crit1) this.createLog(`💥 CRITICAL! ${player2} hits ${player1} for ${dmg1}!!`);
      else this.createLog(`${player2} hits ${player1} for ${dmg1}`);

      if (this.determineTheWinner()) return;
      this.determineTheWinner();
    },

    // Special Attack: High Damage, but 20% Chance to MISS
    specialAttack() {
      const player1 = this.selectedPlayer.player1.name;
      const player2 = this.selectedPlayer.player2.name;

      let dmg1 = this.calcDemage(15, 30);
      let dmg2 = this.calcDemage(15, 30);

      // 20% Chance to Miss completely
      const miss1 = Math.random() < 0.2;
      const miss2 = Math.random() < 0.2;

      // Apply Damage logic
      if (!miss1) {
        this.health.player2 -= dmg2;
        this.triggerVisualEffect('player2');
        this.createLog(`✨ ${player1} BLASTS ${player2} for ${dmg2}`);
      } else {
        this.createLog(`💨 ${player1} used Special Attack but MISSED!`);
      }

      if (!miss2) {
        this.health.player1 -= dmg1;
        this.triggerVisualEffect('player1');
        this.createLog(`✨ ${player2} BLASTS ${player1} for ${dmg1}`);
      } else {
        this.createLog(`💨 ${player2} used Special Attack but MISSED!`);
      }

      if (this.determineTheWinner()) return;
      this.determineTheWinner();
    },

    heal() {
      const isHealthBarFull = this.health.player1 < 90 && this.health.player2 < 90;

      if (this.tracker.heal < this.limit.heal && isHealthBarFull) {
        this.tracker.heal++;

        const player1 = this.selectedPlayer.player1.name;
        const player2 = this.selectedPlayer.player2.name;

        // Random heal amount between 10 and 25
        const heal1 = Math.floor(Math.random() * 15) + 10;
        const heal2 = Math.floor(Math.random() * 15) + 10;

        if (this.health.player1 >= 100) this.health.player1 = 100;
        else this.health.player1 += heal1;

        if (this.health.player2 >= 100) this.health.player2 = 100;
        else this.health.player2 += heal2;

        this.createLog(`💚 ${player1} heals himself for ${heal1}`);
        this.createLog(`💚 ${player2} heals himself for ${heal2}`);
      }
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
      document.getElementById('give-up-dialog').removeAttribute('open');
      document.querySelector('.give-up-dialog-backdrop').remove();
    },

    giveUp() {
      const winStats = this.stats.win;
      const player1 = this.selectedPlayer.player1.name;
      const player2 = this.selectedPlayer.player2.name;
      const player1Win = winStats.player1 > winStats.player2;
      const player2Win = winStats.player2 > winStats.player1;
      const tie = winStats.player1 > 0 && winStats.player2 > 0 && winStats.player1 === winStats.player2;
      const equalWinStatsAndNotFullHealthBar =
        winStats.player1 === winStats.player2 && this.health.player1 < 100 && this.health.player2 < 100;

      if (player1Win) {
        this.createLog(`${player1} WON! ${player2} RAN AWAY!`);
      } else if (player2Win) {
        this.createLog(`${player2} WON! ${player1} RAN AWAY!`);
      } else if (tie) {
        this.createLog(`THE BATTLE ⚔️ ENDED IN A TIE.`);
      } else {
        this.createLog(`🏳️ BATTLE CANCELLED. PEACE WAS CHOSEN.`);
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
