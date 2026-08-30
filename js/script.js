import CommandCenter from './components/CommandCenter.js';
import GiveUpDialog from './components/GiveUpDialog.js';
import LogsTerminal from './components/LogsTerminal.js';
import BrandLogo from './components/BrandLogo.js';
import PixelIcon from './components/PixelIcon.js';
import PlayerCard from './components/PlayerCard.js';
import SelectScreen from './components/SelectScreen.js';
import SplashScreen from './components/SplashScreen.js';
import TitleScreen from './components/TitleScreen.js';
import WinnerScreen from './components/WinnerScreen.js';
import BattleEngine, { BALANCE } from './services/battleEngine.js';
import UIEffects from './services/uiEffects.js';
import Sound from './services/soundEngine.js';

const STATS_KEY = 'rbc-stats-v1';

const BATTLE_ACTION_KEYS = Object.freeze({ z: 0, x: 1, c: 2, v: 3 });

const DIFFICULTY_PRESETS = Object.freeze({
  easy: { label: 'EASY', defendMult: 0.4, healMult: 0.6, finisherMult: 0.6, comboRead: false, guardRead: false },
  normal: { label: 'NORMAL', defendMult: 1.0, healMult: 1.0, finisherMult: 1.0, comboRead: true, guardRead: true },
  hard: { label: 'HARD', defendMult: 1.3, healMult: 1.2, finisherMult: 1.0, comboRead: true, guardRead: true, bankMeter: true },
});

/**
 * Persistence edge (Imperative Shell): localStorage reads/writes return
 * an explicit Result value instead of throwing; corrupt shapes fall back
 * to session defaults.
 */
const readPersistedStats = () => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ok: false };
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
};

const writePersistedStats = (payload) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false };
  }
};

const sanitizeFighterStats = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  const clean = {};
  for (const [id, entry] of Object.entries(raw)) {
    // defineProperty bypasses the __proto__ setter: prototype-pollution-safe
    if (entry && typeof entry === 'object' && id !== '__proto__' && id !== 'constructor' && id !== 'prototype') {
      Object.defineProperty(clean, id, { value: entry, enumerable: true, writable: true, configurable: true });
    }
  }
  return clean;
};

// Register components (using global Vue provided by ./js/vue.js)
Vue.component('brand-logo', BrandLogo);
Vue.component('pixel-icon', PixelIcon);
Vue.component('splash-screen', SplashScreen);
Vue.component('title-screen', TitleScreen);
Vue.component('winner-screen', WinnerScreen);
Vue.component('select-screen', SelectScreen);
Vue.component('player-card', PlayerCard);
Vue.component('command-center', CommandCenter);
Vue.component('logs-terminal', LogsTerminal);
Vue.component('give-up-dialog', GiveUpDialog);

const app = new Vue({
  el: '#app',

  data() {
    return {
      players: [
        { id: 1, name: 'Spencer Horton', avatar: 'player-1.jpg', isChampion: false, lore: 'A retired duelist who never stopped practicing.' },
        { id: 2, name: 'Glen Rouse', avatar: 'player-2.jpg', isChampion: false, lore: 'A prospector who fights with the weight of his fortune.' },
        { id: 3, name: 'Phoenix Walker', avatar: 'player-3.jpg', isChampion: false, lore: 'Rises from every defeat hotter than before.' },
        { id: 4, name: 'Judy Sewell', avatar: 'player-4.jpg', isChampion: false, lore: 'Loves hard, fights harder.' },
        { id: 5, name: 'Victor Hansen', avatar: 'player-5.jpg', isChampion: false, lore: 'Delivers judgment with a million volts.' },
        { id: 6, name: 'Alisa Hester', avatar: 'player-6.jpg', isChampion: false, lore: 'Cultivates toxins that bloom in silence.' },
        { id: 7, name: 'Kelis Ford', avatar: 'player-7.jpg', isChampion: false, lore: 'Moves faster than the wind can follow.' },
        { id: 8, name: 'Rene Wells', avatar: 'player-8.jpg', isChampion: false, lore: 'Wishes upon stars, then knocks them down.' },
        { id: 9, name: 'Calla Wang', avatar: 'player-9.jpg', isChampion: false, lore: 'Cold precision sharpened to a razor\u2019s patience.' },
        { id: 10, name: 'Dorian Cordova', avatar: 'player-10.jpg', isChampion: false, lore: 'Every step leaves a crater.' },
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
      },

      tempSelection: null,
      focusedCharIndex: 0,
      battleMenuIndex: 0,
      turnInProgress: false,
      battleIntro: false,
      battleAssembling: false,
      koActive: false,
      koLoser: null,
      cheatGlitch: false,
      selectConfirm: null,
      turnBanner: null,
      globalShake: false,
      loadingProgress: 0,
      isDialogOpen: false,

      // Cheats
      inputBuffer: [],
      konamiCode: [
        'arrowup',
        'arrowup',
        'arrowdown',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'arrowleft',
        'arrowright',
        'b',
        'a',
      ],
      cheatActivated: false,

      limit: { heal: BALANCE.heal.charges },
      tracker: { playerHeal: 0, enemyHeal: 0 },
      specialMeter: { player1: 0, player2: 0 },
      specialPity: { player1: false, player2: false },
      guard: { player1: false, player2: false },
      combo: { player1: 0, player2: 0 },
      isSurrender: false,
      surrenderHp: 0,
      surrenderEnemyHp: 0,
      roundCount: 0,
      stats: { win: { player1: 0, player2: 0 }, streak: 0, bestStreak: 0, maxCombo: 0 },
      battleMaxCombo: 0,
      battleSummary: { damageDealt: 0, damageTaken: 0, biggestHit: 0, hitsLanded: 0, hitsAttempted: 0 },
      roundsPerMatch: 1,
      difficulty: 'normal',
      arcade: { active: false, stage: 0, totalStages: 5, ladder: [], hpCarry: 100 },
      arcadeStageClear: false,
      arcadeCleared: false,
      roundWins: { player1: 0, player2: 0 },
      currentRound: 1,
      roundIntro: false,
      fighterStats: {},
      logs: [],
    };
  },

  created() {
    this.loadStats();
  },

  computed: {
    isTitleScreen() {
      return (
        !this.showSplash && !this.status.selecting && !this.status.loading && !this.status.play && !this.status.winner
      );
    },
    isVictory() {
      return this.health.player2 <= 0;
    },
    winsNeeded() {
      return Math.ceil(this.roundsPerMatch / 2);
    },
    battleIntroText() {
      return this.currentRound > 1 ? `ROUND ${this.currentRound}` : 'FIGHT!';
    },
    rematchAvailable() {
      return this.roundsPerMatch <= 1 || this.roundWins.player1 > 0;
    },
  },

  watch: {
    'status.winner'(val) {
      if (!val) {
        UIEffects.clearWeather();
        Sound.stopBattleMusic();
        return;
      }
      Sound.stopBattleMusic();
      // K.O. beat before the winner screen (white flag surrender skips it)
      if (this.isSurrender) return;
      this.koActive = true;
      this.koLoser = this.isVictory ? 'p2' : 'p1';
      Sound.play('ko');
      clearTimeout(this._koTimer);
      this._koTimer = setTimeout(() => {
        this.koActive = false;
        this.koLoser = null;
      }, 1400);
    },
    roundIntro(val) {
      if (!val) return;
      this.koActive = true;
      this.koLoser = this.isVictory ? 'p2' : 'p1';
      Sound.play('ko');
      clearTimeout(this._roundTimer);
      this._roundTimer = setTimeout(() => {
        this.koActive = false;
        this.koLoser = null;
        BattleEngine.beginNextRound(this);
        this.playBattleIntro();
        // Bars recharge from wherever they are (already-full bars stay still)
        this.animateHealthToFull();
        this.roundIntro = false;
      }, 1400);
    },
    arcadeStageClear(val) {
      if (!val) return;
      Sound.stopBattleMusic();
      this.koActive = true;
      this.koLoser = 'p2';
      Sound.play('ko');
      clearTimeout(this._arcadeTimer);
      this._arcadeTimer = setTimeout(() => {
        this.koActive = false;
        this.koLoser = null;
        this.arcadeStageClear = false;
        Sound.play('victory');
        this.advanceArcadeStage();
      }, 2200);
    },
    turnInProgress(val) {
      if (this.battleIntro || this.roundIntro || this.koActive || !this.status.play || this.status.winner) return;
      this.showTurnBanner(val);
    },
  },

  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    UIEffects.initSnow();

    // Splash closes only via user input (splash:skip event from SplashScreen)
    window.addEventListener('splash:skip', this._onSplashSkip);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('splash:skip', this._onSplashSkip);
  },

  methods: {
    _onSplashSkip() {
      this.showSplash = false;
    },
    loadStats() {
      const result = readPersistedStats();
      if (!result.ok) return;
      const saved = result.value;
      if (saved && saved.stats && saved.stats.win) this.stats = { ...this.stats, ...saved.stats };
      if (saved && saved.fighterStats) this.fighterStats = sanitizeFighterStats(saved.fighterStats);
        if (saved && saved.settings) {
          if ([1, 3, 5].includes(saved.settings.rounds)) this.roundsPerMatch = saved.settings.rounds;
          if (['easy', 'normal', 'hard'].includes(saved.settings.difficulty)) this.difficulty = saved.settings.difficulty;
        }
    },
    saveStats() {
      writePersistedStats({
        stats: this.stats,
        fighterStats: this.fighterStats,
        settings: { rounds: this.roundsPerMatch, difficulty: this.difficulty },
      });
    },
    cycleRounds() {
      const options = [1, 3, 5];
      const idx = options.indexOf(this.roundsPerMatch);
      this.roundsPerMatch = options[(idx + 1) % options.length];
      Sound.play('tick');
      this.saveStats();
    },
    pickRandomFighter() {
      const pool = this.players.filter((p) => !p.isSecret);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      Sound.play('select');
      this.clickSelectPlayer(pick, this.players.indexOf(pick));
    },
    cycleDifficulty() {
      const options = ['easy', 'normal', 'hard'];
      const idx = options.indexOf(this.difficulty);
      this.difficulty = options[(idx + 1) % options.length];
      Sound.play('tick');
      this.saveStats();
    },
    startArcade() {
      if (this.isTitleScreen) {
        Sound.play('select');
        const pool = this.players.filter((p) => !p.isSecret);
        const fighter = pool[Math.floor(Math.random() * pool.length)];
        const ladder = pool
          .filter((p) => p.id !== fighter.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        this.selectedPlayer.player1 = { ...fighter, isChampion: false };
        this.arcade = { active: true, stage: 0, totalStages: ladder.length, ladder, hpCarry: 100 };
        this.status.selecting = false;
        this.status.play = false;
        this.status.winner = false;
        this.startArcadeStage();
      }
    },
    startArcadeStage() {
      const opponent = this.arcade.ladder[this.arcade.stage];
      if (!opponent) {
        this.endArcade(true);
        return;
      }
      Sound.play('fight');
      this.status.winner = false;
      this.startLoading();
    },
    advanceArcadeStage() {
      this.arcade.stage += 1;
      this.arcade.hpCarry = Math.min(100, this.arcade.hpCarry + 25);
      this.startArcadeStage();
    },
    endArcade(cleared) {
      const stage = this.arcade.stage + 1;
      this.arcade.active = false;
      this.arcadeCleared = cleared;
      this.status.winner = true;
      if (cleared) Sound.play('victory');
    },
    // === KEYBOARD CONTROLLER ===
    handleKeydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'm') {
        this.toggleMute();
        return;
      }
      if (this.showSplash || this.status.loading) return;
      if (e.repeat) return;

      if (this.isTitleScreen) {
        this.inputBuffer.push(key);
        if (this.inputBuffer.length > 20) this.inputBuffer.shift();
        const bufferString = this.inputBuffer.slice(-this.konamiCode.length).join(',');
        const codeString = this.konamiCode.join(',');
        if (bufferString === codeString) this.activateCheat();

        if (e.key === 'Enter') this.goToSelectScreen();
        if (key === 'a') this.startArcade();
        if (key === 'd') this.cycleDifficulty();
        return;
      }

      if (this.status.selecting) {
        if (e.key === 'ArrowRight') this.moveGridFocus(1, 0);
        if (e.key === 'ArrowLeft') this.moveGridFocus(-1, 0);
        if (e.key === 'ArrowDown') this.moveGridFocus(0, 1);
        if (e.key === 'ArrowUp') this.moveGridFocus(0, -1);
        if (key === 'r') this.cycleRounds();
        if (e.key === ' ') this.pickRandomFighter();
        if (e.key === 'Enter') this.confirmSelection();
        if (e.key === 'Escape') this.backToTitle();
        return;
      }

      // Dialog: Escape cancels; Enter confirms the focused (safe default) button
      if (this.isDialogOpen) {
        if (e.key === 'Escape') {
          Sound.play('back');
          this.hideDialogGiveUp();
        }
        return;
      }

      if (this.status.play && !this.status.winner && !this.turnInProgress && !this.battleIntro) {
        const actionIndex = BATTLE_ACTION_KEYS[key];
        if (actionIndex !== undefined) {
          this.battleMenuIndex = actionIndex;
          this.executeBattleAction();
        }

        if (e.key === 'ArrowRight') {
          this.battleMenuIndex = Math.min(this.battleMenuIndex + 1, 3);
          Sound.play('move');
        }
        if (e.key === 'ArrowLeft') {
          this.battleMenuIndex = Math.max(this.battleMenuIndex - 1, 0);
          Sound.play('move');
        }

        if (e.key === 'Enter') this.executeBattleAction();
        if (e.key === 'Escape') {
          Sound.play('dialogOpen');
          this.showDialogGiveUp();
        }
      }

      if (this.status.winner) {
        const menuCount = this.rematchAvailable ? 3 : 2;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          this.battleMenuIndex = (this.battleMenuIndex + 1) % menuCount;
          Sound.play('move');
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          this.battleMenuIndex = (this.battleMenuIndex - 1 + menuCount) % menuCount;
          Sound.play('move');
        }

        if (key === 'r') {
          if (this.rematchAvailable) this.reBattle();
          return;
        }
        if (e.key === 'Escape') {
          this.backToTitle();
          return;
        }
        if (key === 'n') {
          this.goToSelectScreen();
          return;
        }

        if (e.key === 'Enter') {
          if (this.rematchAvailable) {
            if (this.battleMenuIndex === 0) this.reBattle();
            else if (this.battleMenuIndex === 1) this.goToSelectScreen();
            else this.backToTitle();
          } else {
            if (this.battleMenuIndex === 0) this.goToSelectScreen(); // New Match
            else this.backToTitle(); // Back to Menu
          }
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
      Sound.play('move');
    },

    toggleMute() {
      Sound.toggleMute();
    },

    activateCheat() {
      if (this.cheatActivated || this.players.some((p) => p.id === 999)) return;
      this.cheatActivated = true;
      this.cheatGlitch = true;
      Sound.play('cheat');
      setTimeout(() => {
        this.cheatGlitch = false;
      }, 500);
      this.players.push({
        id: 999,
        name: 'DEV GOD',
        avatar: 'player-10.jpg',
        isSecret: true,
        isChampion: false,
      });
      setTimeout(() => {
        this.cheatActivated = false;
      }, 3000);
    },

    executeBattleAction() {
      BattleEngine.executeBattleAction(this);
    },

    goToSelectScreen() {
      Sound.play('select');
      this.status.selecting = true;
      this.status.play = false;
      this.status.winner = false;
      this.selectConfirm = null;
      this.arcade.active = false;
      this.arcadeStageClear = false;
      this.arcadeCleared = false;
      this.tempSelection = this.players[0];
      this.focusedCharIndex = 0;
    },

    clickSelectPlayer(player, index) {
      this.tempSelection = player;
      this.focusedCharIndex = index;
    },

    resetCharFocus() {
      const idx = this.players.indexOf(this.tempSelection);
      this.focusedCharIndex = idx >= 0 ? idx : 0;
    },

    confirmSelection() {
      if (!this.tempSelection || this.selectConfirm !== null) return;
      Sound.play('select');
      this.selectConfirm = this.tempSelection.id;
      setTimeout(() => {
        this.selectedPlayer.player1 = { ...this.tempSelection, isChampion: false };
        this.status.selecting = false;
        this.selectConfirm = null;
        this.startLoading();
      }, 380);
    },

    backToTitle() {
      Sound.play('back');
      Sound.stopBattleMusic();
      this.battleIntro = false;
      this.battleAssembling = false;
      this.koActive = false;
      this.koLoser = null;
      this.roundIntro = false;
      this.turnBanner = null;
      this.arcade.active = false;
      this.arcadeStageClear = false;
      this.arcadeCleared = false;
      clearTimeout(this._introTimer);
      clearTimeout(this._fightSoundTimer);
      clearTimeout(this._koTimer);
      clearTimeout(this._roundTimer);
      clearTimeout(this._arcadeTimer);
      clearTimeout(this._bannerTimer);
      clearInterval(this._hpAnimInterval);
      this.cancelLoadingTimers();
      BattleEngine.cancelTurn(this);
      this.status.selecting = false;
      this.status.play = false;
      this.status.winner = false;
      this.status.loading = false;
      this.battleMenuIndex = 0;
    },

    startLoading(rematch = false) {
      this.cancelLoadingTimers();
      this.status.loading = true;
      this.loadingProgress = 0;
      this._loadInterval = setInterval(() => {
        this.loadingProgress += 5;
        if (this.loadingProgress >= 100) {
          this.cancelLoadingTimers();
          this.status.loading = false;
          this.startNewBattle(rematch);
        }
      }, 50);
    },

    cancelLoadingTimers() {
      if (this._loadInterval) {
        clearInterval(this._loadInterval);
        this._loadInterval = null;
      }
    },

    playBattleIntro() {
      this.battleIntro = true;
      this.turnBanner = null;
      clearTimeout(this._introTimer);
      clearTimeout(this._fightSoundTimer);
      this._fightSoundTimer = setTimeout(() => Sound.play('fight'), 1300);
      this._introTimer = setTimeout(() => {
        this.battleIntro = false;
        this.battleAssembling = false;
        if (this.status.play && !this.status.winner && !this.turnInProgress) this.showTurnBanner(false);
      }, 2100);
    },

    startNewBattle(rematch = false) {
      this.roundIntro = false;
      this.battleAssembling = true;
      BattleEngine.startNewBattle(this, rematch);
      if (this.arcade.active && this.arcade.hpCarry < 100) {
        this.health.player1 = this.arcade.hpCarry;
      }
      Sound.startBattleMusic();
      this.playBattleIntro();
    },

    animateHealthToFull() {
      clearInterval(this._hpAnimInterval);
      this._hpAnimInterval = setInterval(() => {
        let done = true;
        ['player1', 'player2'].forEach((side) => {
          if (this.health[side] < 100) {
            this.health[side] = Math.min(100, this.health[side] + 20);
            done = false;
          }
        });
        if (done) {
          clearInterval(this._hpAnimInterval);
          this._hpAnimInterval = null;
        }
      }, 50);
    },

    showTurnBanner(isEnemy) {
      this.turnBanner = { key: Date.now(), label: isEnemy ? 'ENEMY TURN' : 'YOUR TURN', side: isEnemy ? 'enemy' : 'you' };
      clearTimeout(this._bannerTimer);
      this._bannerTimer = setTimeout(() => {
        this.turnBanner = null;
      }, 950);
    },

    reBattle() {
      BattleEngine.reBattle(this);
    },

    createLog(entry) {
      this.logs.push({ id: Date.now() + Math.random(), text: entry.text, severity: entry.severity, icon: entry.icon });
      if (this.logs.length > 60) this.logs.splice(0, this.logs.length - 60);
    },

    playerAttack(type) {
      BattleEngine.playerAttack(this, type);
    },

    playerHeal() {
      BattleEngine.playerHeal(this);
    },

    playerDefend() {
      BattleEngine.playerDefend(this);
    },

    showDialogGiveUp() {
      this.isDialogOpen = true;
    },

    hideDialogGiveUp() {
      this.isDialogOpen = false;
    },

    giveUp() {
      BattleEngine.surrender(this);
      this.hideDialogGiveUp();
    },
  },
});
