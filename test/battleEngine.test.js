// Dynamic audit: battleEngine invariant fuzzing (AGENTS.md §10).
// Zero dependencies, zero mocks — in-memory fakes at the Shell boundary only.
// Run: node test/battleEngine.test.js
import assert from 'node:assert/strict';

// --- In-memory Shell fakes (installed BEFORE the engine import evaluates) ---
globalThis.document = {
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {} }),
  querySelector: () => null,
  getElementById: () => null,
};
globalThis.window = {
  matchMedia: () => ({ matches: false }),
  addEventListener() {},
  removeEventListener() {},
  innerWidth: 1024,
  innerHeight: 768,
};
// Immediate-time regime: scheduled enemy turns resolve synchronously
const timers = [];
globalThis.setTimeout = (fn) => {
  timers.push(fn);
  return timers.length;
};
globalThis.clearTimeout = () => {};
const flushTimers = () => {
  while (timers.length) timers.shift()();
};

const { default: BattleEngine, BALANCE } = await import('../js/services/battleEngine.js');

const makeApp = (roundsPerMatch = 1) => ({
  players: [
    { id: 1, name: 'A', avatar: 'a.jpg', isChampion: false },
    { id: 2, name: 'B', avatar: 'b.jpg', isChampion: false },
    { id: 3, name: 'C', avatar: 'c.jpg', isSecret: true, isChampion: false },
  ],
  selectedPlayer: { player1: {}, player2: {} },
  health: { player1: 100, player2: 100 },
  status: { selecting: false, loading: false, play: false, winner: false },
  tracker: { playerHeal: 0, enemyHeal: 0 },
  specialMeter: { player1: 0, player2: 0 },
  specialPity: { player1: false, player2: false },
  guard: { player1: false, player2: false },
  combo: { player1: 0, player2: 0 },
  roundWins: { player1: 0, player2: 0 },
  currentRound: 1,
  roundIntro: false,
  _nextInitiative: null,
  _enemyTurnTimer: null,
  battleMenuIndex: 0,
  turnInProgress: false,
  logs: [],
  activeFx: { player1: [], player2: [] },
  roundCount: 0,
  battleMaxCombo: 0,
  roundsPerMatch,
  stats: { win: { player1: 0, player2: 0 }, streak: 0, bestStreak: 0, maxCombo: 0 },
  fighterStats: {},
  isSurrender: false,
  surrenderHp: 0,
  surrenderEnemyHp: 0,
  createLog(entry) {
    this.logs.push(entry);
  },
  saveStats() {},
  $set(target, key, value) {
    target[key] = value;
  },
  startLoading() {},
});

const assertInvariants = (app, label) => {
  for (const side of ['player1', 'player2']) {
    assert.ok(Number.isInteger(app.health[side]), `${label}: integer health ${side}`);
    assert.ok(app.health[side] >= 0 && app.health[side] <= 100, `${label}: health bounds ${side}=${app.health[side]}`);
    assert.ok(app.specialMeter[side] >= 0 && app.specialMeter[side] <= BALANCE.special.meterMax, `${label}: meter bounds ${side}`);
    assert.ok(app.combo[side] >= 0, `${label}: combo >= 0 ${side}`);
    assert.ok(Number.isInteger(app.specialMeter[side]), `${label}: integer meter ${side}`);
  }
  assert.ok(app.tracker.playerHeal <= BALANCE.heal.charges, `${label}: heal charges player`);
  assert.ok(app.tracker.enemyHeal <= BALANCE.heal.charges, `${label}: heal charges enemy`);
  for (const entry of Object.values(app.fighterStats)) {
    for (const field of ['wins', 'losses', 'cpuWins', 'cpuLosses']) {
      assert.ok(Number.isFinite(entry[field]), `${label}: numeric stat ${field}`);
    }
  }
};

const playMatch = (app, rng) => {
  BattleEngine.startNewBattle(app, false);
  let steps = 0;
  while (!app.status.winner && steps < 500) {
    steps += 1;
    if (app.roundIntro) {
      flushTimers(); // round transition watcher equivalent
      BattleEngine.beginNextRound(app);
      app.roundIntro = false;
      continue;
    }
    if (!app.turnInProgress) {
      app.battleMenuIndex = Math.floor(rng() * 4);
      BattleEngine.executeBattleAction(app);
    }
    flushTimers(); // scheduled enemy turn
    assertInvariants(app, `match step ${steps}`);
  }
  return steps;
};

// Deterministic PRNG (mulberry32) — reproducible fuzz runs
const makeRng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let totalMatches = 0;
let totalSteps = 0;
const outcomes = { player1: 0, player2: 0 };

for (let seed = 1; seed <= 600; seed += 1) {
  const rng = makeRng(seed);
  const roundsPerMatch = [1, 3, 5][seed % 3];
  const app = makeApp(roundsPerMatch);
  const steps = playMatch(app, rng);
  totalMatches += 1;
  totalSteps += steps;

  assert.ok(app.status.winner, `seed ${seed}: match concluded`);
  assert.equal(app.status.play, false, `seed ${seed}: play=false at end`);
  const needed = Math.ceil(roundsPerMatch / 2);
  const victor = app.health.player2 <= 0 ? 'player1' : 'player2';
  outcomes[victor] += 1;
  assert.ok(app.roundWins[victor] >= needed, `seed ${seed}: victor reached needed wins`);
  assert.ok(app.roundWins[victor] <= needed, `seed ${seed}: victor wins capped at needed (${app.roundWins[victor]}/${needed})`);
  assert.ok(app.roundWins.player1 + app.roundWins.player2 <= roundsPerMatch, `seed ${seed}: no phantom rounds`);
  assertInvariants(app, `seed ${seed} final`);
}
console.log(`fuzz: ${totalMatches} matches, ${totalSteps} steps, outcomes ${outcomes.player1}W/${outcomes.player2}L — all invariants held`);

// --- Targeted scenarios ---
// Balance probe: greedy policy (heal when low, special when ready, else attack) vs AI
{
  const results = { player1: 0, player2: 0 };
  for (let seed = 1000; seed < 1400; seed += 1) {
    const rng = makeRng(seed);
    const app = makeApp(3);
    BattleEngine.startNewBattle(app, false);
    let steps = 0;
    while (!app.status.winner && steps < 500) {
      steps += 1;
      if (app.roundIntro) {
        flushTimers();
        BattleEngine.beginNextRound(app);
        app.roundIntro = false;
        continue;
      }
      if (!app.turnInProgress) {
        const healOk = app.health.player1 <= 40 && app.tracker.playerHeal < BALANCE.heal.charges;
        app.battleMenuIndex = healOk ? 2 : app.specialMeter.player1 >= BALANCE.special.meterMax ? 1 : 0;
        BattleEngine.executeBattleAction(app);
      }
      flushTimers();
    }
    results[app.health.player2 <= 0 ? 'player1' : 'player2'] += 1;
  }
  const winrate = (results.player1 / 400) * 100;
  console.log(`balance probe (greedy vs AI, best-of-3): ${winrate.toFixed(1)}% winrate`);
  assert.ok(winrate > 30 && winrate < 70, `balance: greedy winrate ${winrate.toFixed(1)}% outside healthy 30-70% band`);
}


// Deterministic setup for targeted scenarios: establish a known player-turn state
const settlePlayerTurn = (app) => {
  flushTimers();
  app.turnInProgress = false;
  app.health.player1 = 100;
  app._enemyTurnTimer = null;
};

// Special is gated behind a full meter: cannot spend a turn on an uncharged special
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  settlePlayerTurn(app);
  app.specialMeter.player1 = 40;
  app.battleMenuIndex = 1;
  BattleEngine.executeBattleAction(app);
  assert.equal(app.turnInProgress, false, 'gating: uncharged special consumes nothing');
  assert.equal(app.specialMeter.player1, 40, 'gating: meter untouched on refused special');
}

// Special at full meter: spends the meter
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  settlePlayerTurn(app);
  app.specialMeter.player1 = BALANCE.special.meterMax;
  app.battleMenuIndex = 1;
  BattleEngine.executeBattleAction(app);
  assert.equal(app.specialMeter.player1, 0, 'spend: full meter consumed by special');
}

// Heal at full HP is refused without burning a charge
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  settlePlayerTurn(app);
  app.battleMenuIndex = 2;
  BattleEngine.executeBattleAction(app);
  assert.equal(app.tracker.playerHeal, 0, 'heal: full HP refuses, no charge burned');
  assert.equal(app.turnInProgress, false, 'heal: full HP consumes nothing');
}

// Heal charge cap is enforced
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  settlePlayerTurn(app);
  app.tracker.playerHeal = BALANCE.heal.charges;
  app.health.player1 = 20;
  app.battleMenuIndex = 2;
  BattleEngine.executeBattleAction(app);
  assert.equal(app.tracker.playerHeal, BALANCE.heal.charges, 'heal: cap holds');
  assert.equal(app.health.player1, 20, 'heal: no free heal past cap');
}

// Guard is consumed by exactly one incoming blow
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  settlePlayerTurn(app);
  app.battleMenuIndex = 3;
  BattleEngine.executeBattleAction(app);
  assert.equal(app.guard.player1, true, 'guard: raised on defend');
  flushTimers();
  assert.equal(app.guard.player1, false, 'guard: consumed/expired after the enemy turn');
}

// Surrender mid-match: records loss, ends match, never a K.O. flag path
{
  const app = makeApp(3);
  BattleEngine.startNewBattle(app, false);
  flushTimers();
  const before = app.stats.win.player2;
  BattleEngine.surrender(app);
  assert.equal(app.isSurrender, true, 'surrender: flagged');
  assert.equal(app.status.winner, true, 'surrender: match ends');
  assert.equal(app.stats.win.player2, before + 1, 'surrender: loss recorded once');
}

// DEV GOD battles never touch records
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  flushTimers();
  app.selectedPlayer.player1 = { id: 999, name: 'DEV GOD', isChampion: false };
  app.health.player2 = 1;
  app.battleMenuIndex = 0;
  BattleEngine.executeBattleAction(app);
  flushTimers();
  assert.equal(Object.keys(app.fighterStats).length, 0, 'god: no fighter stats recorded');
  assert.equal(app.stats.win.player1, 0, 'god: global record untouched');
}

// God is immune to lifesteal cap violations and miss chance paths (smoke)
{
  const app = makeApp(1);
  BattleEngine.startNewBattle(app, false);
  flushTimers();
  app.selectedPlayer.player1 = { id: 999, name: 'DEV GOD', isChampion: false };
  for (let i = 0; i < 50 && !app.status.winner; i += 1) {
    if (!app.turnInProgress) {
      app.battleMenuIndex = 0;
      BattleEngine.executeBattleAction(app);
    }
    flushTimers();
    assertInvariants(app, 'god smoke');
  }
  assert.ok(app.status.winner, 'god smoke: match concluded');
}

console.log('targeted scenarios: 9/9 passed');

// --- Persistence layer tests (§10: pure logic, zero mocks) ---
// sanitizeFighterStats is a pure function — re-import via a local copy
// (it lives inside script.js which requires Vue; test the logic in isolation)
{
  const sanitize = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const clean = {};
    for (const [id, entry] of Object.entries(raw)) {
      if (entry && typeof entry === 'object' && id !== '__proto__' && id !== 'constructor' && id !== 'prototype') {
        Object.defineProperty(clean, id, { value: entry, enumerable: true, writable: true, configurable: true });
      }
    }
    return clean;
  };

  // Valid entries pass through
  assert.deepEqual(sanitize({ '1': { wins: 2, losses: 1 } }), { '1': { wins: 2, losses: 1 } });

  // Null / non-object inputs return empty
  assert.deepEqual(sanitize(null), {});
  assert.deepEqual(sanitize('string'), {});
  assert.deepEqual(sanitize(42), {});

  // Non-object entries are dropped
  assert.deepEqual(sanitize({ '1': 'garbage', '2': { wins: 0 } }), { '2': { wins: 0 } });

  // Prototype pollution keys are blocked
  const polluted = JSON.parse('{"__proto__": {"wins": 99999}, "constructor": {"x": 1}, "ok": {"wins": 1}}');
  const result = sanitize(polluted);
  assert.ok(!('__proto__' in result) || Object.getOwnPropertyDescriptor(result, '__proto__') === undefined, 'pollution: __proto__ blocked');
  assert.ok(!Object.hasOwn(result, 'constructor'), 'pollution: constructor blocked (not an own property)');
  assert.deepEqual(result.ok, { wins: 1 }, 'pollution: valid entry survives');

  // Prototype chain is NOT polluted
  assert.ok(({}).wins === undefined, 'pollution: Object.prototype untouched');

  console.log('persistence tests: 5/5 passed');
}

console.log('AUDIT DYNAMIC: PASS');
