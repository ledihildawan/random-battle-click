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
      // Menyimpan efek visual melayang (floating text)
      activeFx: {
        player1: [],
        player2: [],
      },
      status: {
        play: false,
        winner: false,
        giveUp: false,
      },
      // State untuk mengunci tombol saat giliran musuh
      turnInProgress: false,

      limit: { heal: 3 },
      tracker: { heal: 0 },
      stats: {
        win: { player1: 0, player2: 0 },
      },
      logs: [],
    };
  },

  created() {
    this.selectRandPlayers();
  },

  methods: {
    // --- UTILS & SETUP ---
    getRandPlayers() {
      return this.players[Math.floor(Math.random() * this.players.length)];
    },

    selectRandPlayers() {
      const rand = setInterval(() => {
        if (this.status.play) clearInterval(rand);
        this.selectedPlayer.player1 = this.getRandPlayers();
        this.selectedPlayer.player2 = this.getRandPlayers();

        // Pastikan Player 1 dan 2 tidak sama
        if (this.selectedPlayer.player1.id === this.selectedPlayer.player2.id) {
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

    // --- GAME STATES ---
    startNewGame() {
      this.resetCrown(['player1', 'player2']);
      this.status.play = true;
      this.status.winner = false;
      this.status.giveUp = false;
      this.turnInProgress = false;
      this.health.player1 = 100;
      this.health.player2 = 100;
      this.tracker.heal = 0;
      this.logs = [];
      this.activeFx.player1 = [];
      this.activeFx.player2 = [];
      this.createLog('System Initialized. Battle Start!');
    },

    reBattle() {
      this.resetCrown(['player1', 'player2']);
      this.status.play = true;
      this.status.winner = false;
      this.status.giveUp = false;
      this.turnInProgress = false;
      this.health.player1 = 100;
      this.health.player2 = 100;
      this.tracker.heal = 0;
      this.logs = [];
      this.activeFx.player1 = [];
      this.activeFx.player2 = [];
      this.createLog('Re-calibrating... New Battle Start!');
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
      this.turnInProgress = false;
    },

    checkWinner() {
      // Skenario Player 2 (Musuh) Mati -> Player 1 Menang
      if (this.health.player2 <= 0) {
        this.health.player2 = 0;
        const name = this.selectedPlayer.player1.name.toUpperCase();
        this.selectedPlayer.player1.name = `👑 ${name}`;
        this.stats.win.player1 += 1;

        this.createLog(
          `<span style="color:#209cee; font-weight:bold;">🏆 MISSION ACCOMPLISHED! You defeated ${this.selectedPlayer.player2.name}!</span>`
        );
        this.gameOver();
        return true;
      }

      // Skenario Player 1 (Kita) Mati -> Musuh Menang
      if (this.health.player1 <= 0) {
        this.health.player1 = 0;
        const name = this.selectedPlayer.player2.name.toUpperCase();
        this.selectedPlayer.player2.name = `👑 ${name}`;
        this.stats.win.player2 += 1;

        this.createLog(
          `<span style="color:#e76e55; font-weight:bold;">💀 MISSION FAILED! You were eliminated by ${name}.</span>`
        );
        this.gameOver();
        return true;
      }
      return false;
    },

    calcDamage(min, max) {
      return Math.max(Math.floor(Math.random() * max) + 1, min);
    },

    createLog(message) {
      // UPDATE: Selector disesuaikan dengan HTML baru (.logs-terminal)
      const logsContainer = document.querySelector('.logs-terminal');

      this.logs.push(message);

      if (logsContainer) {
        setTimeout(() => {
          logsContainer.scrollTo({ left: 0, top: logsContainer.scrollHeight, behavior: 'smooth' });
        }, 50);
      }
    },

    // --- VISUAL EFFECTS ---
    triggerVisualEffect(targetPlayer) {
      // Mencari gambar berdasarkan class di HTML baru
      const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
      const el = document.querySelector(selector);
      if (el) {
        el.classList.remove('shake', 'hit-flash');
        void el.offsetWidth; // Trigger reflow untuk restart animasi
        el.classList.add('shake', 'hit-flash');
        setTimeout(() => el.classList.remove('hit-flash'), 200);
      }
    },

    spawnFloatingText(targetPlayer, text, type) {
      const id = Date.now() + Math.random();
      this.activeFx[targetPlayer].push({ id, text, type });

      // Hapus text setelah 1 detik
      setTimeout(() => {
        this.activeFx[targetPlayer] = this.activeFx[targetPlayer].filter((fx) => fx.id !== id);
      }, 1000);
    },

    // --- TURN-BASED LOGIC ---

    // 1. Player Turn (Kita menyerang)
    playerAttack(type) {
      if (this.turnInProgress) return; // Mencegah spam klik

      this.turnInProgress = true; // Kunci tombol agar tidak bisa diklik

      const p2Name = this.selectedPlayer.player2.name;
      let damage = 0;
      let isCrit = false;
      let isMiss = false;

      // Logika Damage
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

      // Eksekusi ke Musuh
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
          if (isCrit)
            this.createLog(`<span style="color:#e76e55">💥 CRITICAL HIT!</span> You dealt ${damage} DMG to ${p2Name}!`);
          else this.createLog(`🗡️ You hit ${p2Name} for ${damage} DMG.`);
        }
      }

      // Cek Kemenangan
      if (this.checkWinner()) {
        return; // Game selesai
      } else {
        // Delay sebelum musuh menyerang balik (1 detik)
        setTimeout(() => {
          this.enemyTurn();
        }, 1000);
      }
    },

    // 2. Player Heal
    playerHeal() {
      if (this.turnInProgress || this.tracker.heal >= this.limit.heal) return;

      this.turnInProgress = true;
      this.tracker.heal++;

      const healAmount = Math.floor(Math.random() * 15) + 10;
      this.health.player1 += healAmount;
      if (this.health.player1 > 100) this.health.player1 = 100;

      this.spawnFloatingText('player1', `+${healAmount}`, 'heal');
      this.createLog(`💊 REPAIR: System integrity restored by ${healAmount}.`);

      // Musuh tetap menyerang setelah kita heal
      setTimeout(() => {
        this.enemyTurn();
      }, 1000);
    },

    // 3. Enemy Turn (CPU)
    enemyTurn() {
      if (this.status.winner) return;

      const p2Name = this.selectedPlayer.player2.name;

      // AI Sederhana: Random damage
      let damage = this.calcDamage(5, 12);
      let isCrit = Math.random() < 0.15;

      if (isCrit) damage *= 2;

      this.health.player1 -= damage;
      this.triggerVisualEffect('player1');

      this.spawnFloatingText('player1', `-${damage}`, isCrit ? 'crit' : 'damage');

      if (isCrit) {
        this.createLog(`<span style="color:#e76e55">⚠️ WARNING!</span> ${p2Name} landed a CRITICAL HIT of ${damage}!`);
      } else {
        this.createLog(`🛡️ ${p2Name} attacks! You took ${damage} damage.`);
      }

      // Cek apakah kita mati
      if (!this.checkWinner()) {
        // Jika masih hidup, buka kunci tombol (Giliran Player)
        this.turnInProgress = false;
      }
    },

    // --- DIALOGS ---
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
      this.status.winner = true;
      this.status.play = false;
      this.hideDialogGiveUp();
    },

    // --- HELPERS ---
    healthBarColorStatus(value) {
      // Mengembalikan class NES.css untuk warna progress bar
      return {
        'is-primary': value > 50,
        'is-warning': value > 20 && value <= 50,
        'is-error': value <= 20,
      };
    },
  },
});
