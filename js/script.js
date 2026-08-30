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
import StatsScreen from './components/StatsScreen.js';
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

const ACHIEVEMENTS = Object.freeze([
  { id: 'first-blood', name: 'First Blood', desc: 'Win your first battle' },
  { id: 'getting-good', name: 'Getting Good', desc: 'Win 5 battles' },
  { id: 'champion', name: 'Champion', desc: 'Win 20 battles' },
  { id: 'perfect', name: 'Perfect Match', desc: 'Win without losing a round' },
  { id: 'untouchable', name: 'Untouchable', desc: 'Win with full HP remaining' },
  { id: 'speedrun', name: 'Speedrun', desc: 'Win in under 5 turns' },
  { id: 'combo-master', name: 'Combo Master', desc: 'Reach a x5 combo' },
  { id: 'streak-3', name: 'On Fire', desc: 'Win 3 in a row' },
  { id: 'streak-5', name: 'Unstoppable', desc: 'Win 5 in a row' },
  { id: 'arcade-clear', name: 'Arcade Champion', desc: 'Complete arcade mode' },
  { id: 'arcade-veteran', name: 'Arcade Veteran', desc: 'Reach stage 7 in arcade' },
  { id: 'nemesis-slayer', name: 'Nemesis Slayer', desc: 'Beat the character that owns you most' },
]);

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
Vue.component('stats-screen', StatsScreen);
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
      viewingStats: false,
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
      roundIntro: false,
      cheatGlitch: false,
      selectConfirm: null,
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
      stats: { win: { player1: 0, player2: 0 }, streak: 0, bestStreak: 0, maxCombo: 0, arcade: { highScore: 0, bestStage: 0, clears: 0 }, achievements: [] },
      battleMaxCombo: 0,
      battleSummary: { damageDealt: 0, damageTaken: 0, biggestHit: 0, hitsLanded: 0, hitsAttempted: 0 },
      roundsPerMatch: 1,
      difficulty: 'normal',
      achievementToast: null,
      colorblind: false,
      arcade: { active: false, stage: 0, totalStages: 5, ladder: [], hpCarry: 100 },
      arcadeStageClear: false,
      arcadeSelecting: false,
      arcadeScore: 0,
      arcadeContinue: false,
      arcadeContinueCount: 9,
      roundWins: { player1: 0, player2: 0 },
      currentRound: 1,
      roundIntro: false,
      fighterStats: {},
      logs: [],
    };
  },

  created() {
    this.loadStats();
    try {
      this.colorblind = localStorage.getItem('rbc-colorblind') === '1';
    } catch {
      this.colorblind = false;
    }
    if (this.colorblind) document.documentElement.classList.add('colorblind');
  },

  computed: {
    isTitleScreen() {
      return (
        !this.showSplash && !this.viewingStats && !this.status.selecting && !this.status.loading && !this.status.play && !this.status.winner
      );
    },
    isVictory() {
      return this.health.player2 <= 0;
    },
    achievements() {
      return ACHIEVEMENTS;
    },
    winsNeeded() {
      return Math.ceil(this.roundsPerMatch / 2);
    },
    battleIntroText() {
      return this.currentRound > 1 ? `ROUND ${this.currentRound}` : 'FIGHT!';
    },
    rematchAvailable() {
      if (this.arcade.active) return false;
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
      if (this.isSurrender) return;
      this.koActive = true;
      this.koLoser = this.isVictory ? 'p2' : 'p1';
      Sound.play('ko');
      clearTimeout(this._koTimer);
      this._koTimer = setTimeout(() => {
        this.koActive = false;
        this.koLoser = null;
        if (this.arcade.active && !this.isVictory) {
          this.arcadeContinue = true;
          this.arcadeContinueCount = 9;
          this.startContinueCountdown();
        } else {
          this.checkAchievements();
        }
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
    turnInProgress() {
      // Turn indicator is now persistent (VS column) — no toast needed
      if (!this.status.play || this.status.winner) return;
      if (!this.turnInProgress) Sound.play('turnReady');
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
        this.arcadeSelecting = true;
        this.goToSelectScreen();
      }
    },

    beginArcadeRun() {
      const pool = this.players.filter((p) => !p.isSecret && p.id !== this.selectedPlayer.player1.id);
      const ladder = pool.sort(() => Math.random() - 0.5);
      this.arcade = { active: true, stage: 0, totalStages: ladder.length, ladder, hpCarry: 100 };
      Sound.play('fight');
      this.status.winner = false;
      this.startLoading();
    },
    advanceArcadeStage() {
      this.arcade.stage += 1;
      this.arcade.hpCarry = Math.min(100, this.arcade.hpCarry + 25);
      this.addStageScore();
      this.startArcadeStage();
    },
    startArcadeStage() {
      const opponent = this.arcade.ladder[this.arcade.stage];
      if (!opponent) {
        this.finishArcade(true);
        return;
      }
      Sound.play('fight');
      this.status.winner = false;
      this.startLoading();
    },
    addStageScore() {
      const s = this.battleSummary;
      let score = s.damageDealt;
      score += this.roundWins.player1 * 50;
      if (this.roundWins.player2 === 0) score += 300;
      score += 200;
      if (this.arcade.stage === this.arcade.totalStages - 1) score += 500;
      this.arcadeScore += score;
    },
    finishArcade(cleared) {
      this.arcade.active = false;
      this.arcadeContinue = false;
      clearInterval(this._continueTimer);
      const stage = this.arcade.stage + 1;
      const arcadeStats = this.stats.arcade || { highScore: 0, bestStage: 0, clears: 0 };
      if (this.arcadeScore > arcadeStats.highScore) arcadeStats.highScore = this.arcadeScore;
      if (stage > arcadeStats.bestStage) arcadeStats.bestStage = stage;
      if (cleared) arcadeStats.clears += 1;
      this.stats.arcade = arcadeStats;
      this.saveStats();
      this.arcadeScore = 0;
      this.status.winner = true;
      if (cleared) Sound.play('victory');
    },
    startContinueCountdown() {
      clearInterval(this._continueTimer);
      this._continueTimer = setInterval(() => {
        this.arcadeContinueCount -= 1;
        Sound.play('tick');
        if (this.arcadeContinueCount <= 0) {
          this.declineContinue();
        }
      }, 1000);
    },
    acceptContinue() {
      clearInterval(this._continueTimer);
      this.arcadeContinue = false;
      this.arcadeScore = Math.max(0, this.arcadeScore - 500);
      this.arcade.hpCarry = 100;
      Sound.play('select');
      this.startArcadeStage();
    },
    declineContinue() {
      clearInterval(this._continueTimer);
      this.arcadeContinue = false;
      Sound.play('defeat');
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
        if (key === 's') this.viewingStats = true;
        if (key === 'c') this.toggleColorblind();
        return;
      }

      if (this.viewingStats) {
        if (e.key === 'Escape') {
          Sound.play('back');
          this.viewingStats = false;
        }
        return;
      }

      if (this.status.selecting) {
        if (e.key === 'ArrowRight') this.moveGridFocus(1, 0);
        if (e.key === 'ArrowLeft') this.moveGridFocus(-1, 0);
        if (e.key === 'ArrowDown') this.moveGridFocus(0, 1);
        if (e.key === 'ArrowUp') this.moveGridFocus(0, -1);
        if (key === 'r') this.cycleRounds();
        if (key === 'd') this.cycleDifficulty();
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

      if (this.arcadeContinue) {
        if (e.key === 'Enter') this.acceptContinue();
        if (e.key === 'Escape') this.declineContinue();
        return;
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

    toggleColorblind() {
      this.colorblind = !this.colorblind;
      document.documentElement.classList.toggle('colorblind', this.colorblind);
      try {
        localStorage.setItem('rbc-colorblind', this.colorblind ? '1' : '0');
      } catch {
        // storage unavailable
      }
      Sound.play('tick');
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
      this.arcadeSelecting = false;
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
        if (this.arcadeSelecting) {
          this.arcadeSelecting = false;
          this.beginArcadeRun();
        } else {
          this.startLoading();
        }
      }, 380);
    },

    resetAllStats() {
      this.stats = { win: { player1: 0, player2: 0 }, streak: 0, bestStreak: 0, maxCombo: 0, arcade: { highScore: 0, bestStage: 0, clears: 0 }, achievements: [] };
      this.fighterStats = {};
      this.saveStats();
      Sound.play('back');
    },

    checkAchievements() {
      if (!this.isVictory) return;
      const unlocked = new Set(this.stats.achievements || []);
      const s = this.stats;
      const bs = this.battleSummary;
      const newlyUnlocked = [];

      if (s.win.player1 >= 1 && !unlocked.has('first-blood')) newlyUnlocked.push('first-blood');
      if (s.win.player1 >= 5 && !unlocked.has('getting-good')) newlyUnlocked.push('getting-good');
      if (s.win.player1 >= 20 && !unlocked.has('champion')) newlyUnlocked.push('champion');
      if (this.roundWins.player2 === 0 && this.roundsPerMatch > 1 && !unlocked.has('perfect')) newlyUnlocked.push('perfect');
      if (this.health.player1 >= 100 && !unlocked.has('untouchable')) newlyUnlocked.push('untouchable');
      if (this.roundCount < 5 && !unlocked.has('speedrun')) newlyUnlocked.push('speedrun');
      if (this.battleMaxCombo >= 5 && !unlocked.has('combo-master')) newlyUnlocked.push('combo-master');
      if (s.streak >= 3 && !unlocked.has('streak-3')) newlyUnlocked.push('streak-3');
      if (s.streak >= 5 && !unlocked.has('streak-5')) newlyUnlocked.push('streak-5');
      if (s.arcade && s.arcade.clears > 0 && !unlocked.has('arcade-clear')) newlyUnlocked.push('arcade-clear');
      if (s.arcade && s.arcade.bestStage >= 7 && !unlocked.has('arcade-veteran')) newlyUnlocked.push('arcade-veteran');

      if (newlyUnlocked.length > 0) {
        this.stats.achievements = [...(this.stats.achievements || []), ...newlyUnlocked];
        this.saveStats();
        const first = ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0]);
        if (first) {
          this.achievementToast = first;
          Sound.play('cheat');
          clearTimeout(this._achievementTimer);
          this._achievementTimer = setTimeout(() => {
            this.achievementToast = null;
          }, 3000);
        }
      }
    },

    backToTitle() {
      Sound.play('back');
      Sound.stopBattleMusic();
      this.battleIntro = false;
      this.battleAssembling = false;
      this.koActive = false;
      this.koLoser = null;
      this.roundIntro = false;
      this.arcade.active = false;
      this.arcadeStageClear = false;
      this.arcadeSelecting = false;
      clearTimeout(this._introTimer);
      clearTimeout(this._fightSoundTimer);
      clearTimeout(this._koTimer);
      clearTimeout(this._roundTimer);
      clearTimeout(this._arcadeTimer);
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
      clearTimeout(this._introTimer);
      clearTimeout(this._fightSoundTimer);
      this._fightSoundTimer = setTimeout(() => Sound.play('fight'), 1300);
      this._introTimer = setTimeout(() => {
        this.battleIntro = false;
        this.battleAssembling = false;
      }, 2100);
    },

    startNewBattle(rematch = false) {
      this.roundIntro = false;
      this.battleAssembling = true;
      BattleEngine.startNewBattle(this, rematch);
      if (this.arcade.active) {
        if (this.arcade.hpCarry < 100) {
          this.health.player1 = this.arcade.hpCarry;
        }
        if (this.arcade.stage === this.arcade.totalStages - 1) {
          this.health.player2 = 150;
        }
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
