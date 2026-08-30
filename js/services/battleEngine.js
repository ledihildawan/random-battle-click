// Battle Engine Service (ES module)
import UIEffects from './uiEffects.js';
import { SPECIAL_FX } from './signatureFx.js';
import Sound from './soundEngine.js';
import deepFreeze from '../utils/deepFreeze.js';

/**
 * Combat rules — the single source of truth both sides obey.
 * Frozen at module load: mutation attempts fail silently in strict mode.
 */
export const BALANCE = deepFreeze({
  lifesteal: 0.25,
  attack: { min: 6, max: 10, critChance: 0.15, critMult: 2, missChance: 0.07 },
  special: { min: 12, max: 20, missChance: 0.25, meterMax: 100, meterGainHit: 30, meterGainWhiff: 10 },
  heal: { min: 12, max: 20, charges: 3, failChances: [0.05, 0.15, 0.3] },
  defend: { reduction: 0.5, meterGain: 25 },
});

const calcDamage = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const other = (side) => (side === 'player1' ? 'player2' : 'player1');
const isPlayer = (side) => side === 'player1';

function createLog(app, { text, severity = null, icon = null }) {
  if (typeof app.createLog === 'function') app.createLog({ text, severity, icon });
}

function clearTurnTimer(app) {
  if (app._enemyTurnTimer) {
    clearTimeout(app._enemyTurnTimer);
    app._enemyTurnTimer = null;
  }
}

function scheduleEnemyTurn(app, delay) {
  clearTurnTimer(app);
  app._enemyTurnTimer = setTimeout(() => {
    app._enemyTurnTimer = null;
    enemyTurn(app);
  }, delay);
}

function gameOver(app) {
  clearTurnTimer(app);
  app.status.play = false;
  app.status.winner = true;
  app.turnInProgress = false;
  app.battleMenuIndex = 0;
}

function announceMatchPoint(app, needed) {
  if (app.roundWins.player2 === needed - 1) {
    createLog(app, { text: 'MATCH POINT — CPU! This is your last stand!', severity: 'log-enemy', icon: 'warning-diamond' });
    Sound.play('matchPoint');
  } else if (app.roundWins.player1 === needed - 1) {
    createLog(app, { text: 'MATCH POINT — YOU! Finish it!', severity: 'log-special', icon: 'trophy' });
    Sound.play('matchPoint');
  }
}

function checkWinner(app) {
  const needed = Math.ceil((app.roundsPerMatch || 1) / 2);

  if (app.health.player2 <= 0) {
    app.health.player2 = 0;
    app.roundWins.player1 += 1;
    if (app.roundWins.player1 >= needed) {
      app.selectedPlayer.player1.isChampion = true;
      recordResult(app, true);
      createLog(app, {
        text: `VICTORY! You dismantled ${app.selectedPlayer.player2.name}!`,
        severity: 'log-victory',
        icon: 'trophy',
      });
      gameOver(app);
      return true;
    }
    createLog(app, {
      text: `ROUND ${app.currentRound} — YOURS! (${app.roundWins.player1}-${app.roundWins.player2})`,
      severity: 'log-special',
      icon: 'trophy',
    });
    announceMatchPoint(app, needed);
    clearTurnTimer(app);
    app.turnInProgress = true;
    // Fairness: the round loser gets the next initiative
    app._nextInitiative = 'player2';
    app.roundIntro = true;
    return true;
  }

  if (app.health.player1 <= 0) {
    app.health.player1 = 0;
    app.roundWins.player2 += 1;
    if (app.roundWins.player2 >= needed) {
      app.selectedPlayer.player2.isChampion = true;
      recordResult(app, false);
      createLog(app, { text: 'DEFEAT! Run it back.', severity: 'log-defeat', icon: 'skull' });
      gameOver(app);
      return true;
    }
    createLog(app, {
      text: `ROUND ${app.currentRound} — ${app.selectedPlayer.player2.name} steals it! (${app.roundWins.player1}-${app.roundWins.player2})`,
      severity: 'log-special',
      icon: 'skull',
    });
    announceMatchPoint(app, needed);
    clearTurnTimer(app);
    app.turnInProgress = true;
    // Fairness: the round loser gets the next initiative
    app._nextInitiative = 'player1';
    app.roundIntro = true;
    return true;
  }
  return false;
}

function beginNextRound(app) {
  clearTurnTimer(app);
  app.currentRound += 1;
  app.combo = { player1: 0, player2: 0 };
  app.specialPity = { player1: false, player2: false };
  app.guard = { player1: false, player2: false };
  // Super meter carries across rounds — bank it for the decider
  createLog(app, { text: `ROUND ${app.currentRound}`, severity: 'log-round' });
  if (BALANCE.heal.charges - app.tracker.playerHeal <= 0) {
    createLog(app, { text: 'No medkits left. Bleed for it.', icon: 'warning-diamond' });
  }
  // Initiative: the previous round's loser strikes first (round 1 stays a coin flip)
  const starter = app._nextInitiative || (Math.random() < 0.5 ? 'player1' : 'player2');
  app._nextInitiative = null;
  if (starter === 'player1') {
    app.turnInProgress = false;
    createLog(app, { text: `ROUND ${app.currentRound} — you strike first! Make it count!`, icon: 'arrow-big-up' });
  } else {
    app.turnInProgress = true;
    createLog(app, {
      text: `ROUND ${app.currentRound} — ${app.selectedPlayer.player2.name} strikes first — brace yourself!`,
      icon: 'warning-diamond',
    });
    scheduleEnemyTurn(app, 2400);
  }
}

function isGod(app, side) {
  return isPlayer(side) && app.selectedPlayer.player1.id === 999;
}

function godMultiplier(app, side) {
  return isGod(app, side) ? 2 : 1;
}

function beginTurn(app, side) {
  if (isPlayer(side)) app.roundCount += 1;
  // A guard lasts exactly one enemy turn: it expires when its owner acts again
  app.guard[side] = false;
}

function gainMeter(app, { side, amount }) {
  const M = BALANCE.special;
  const before = app.specialMeter[side];
  app.specialMeter[side] = Math.min(M.meterMax, before + amount);
  if (before < M.meterMax && app.specialMeter[side] >= M.meterMax) {
    if (side === 'player1') {
      createLog(app, { text: 'SPECIAL READY — press X!', severity: 'log-special', icon: 'sparkles' });
      Sound.play('turnReady');
    } else {
      createLog(app, { text: `${app.selectedPlayer.player2.name}'s special is CHARGED!`, severity: 'log-enemy', icon: 'sparkles' });
      Sound.play('matchPoint');
    }
  }
}

function specialReady(app, side) {
  return app.specialMeter[side] >= BALANCE.special.meterMax;
}

function applyDamage(app, { side, dmg, type, isCrit, moveName = null }) {
  const defender = other(side);
  const enemyName = app.selectedPlayer.player2.name;

  // Combo momentum: consecutive hits boost damage at tiers
  app.combo[side] += 1;
  const combo = app.combo[side];
  if (combo > (app.battleMaxCombo || 0)) app.battleMaxCombo = combo;
  const comboMult = combo >= 5 ? 1.2 : combo >= 3 ? 1.1 : 1;

  let finalDmg = Math.round(dmg * comboMult);
  // Guard: braced fighters halve the incoming blow (guard is consumed)
  let guarded = false;
  if (app.guard[defender]) {
    app.guard[defender] = false;
    guarded = true;
    finalDmg = Math.max(1, Math.floor(finalDmg * (1 - BALANCE.defend.reduction)));
  }
  // God mode: incoming damage halved
  if (isGod(app, defender)) finalDmg = Math.floor(finalDmg / 2);
  app.health[defender] = Math.max(0, app.health[defender] - finalDmg);

  // Battle summary tracking
  if (isPlayer(side)) {
    app.battleSummary.damageDealt += finalDmg;
    app.battleSummary.biggestHit = Math.max(app.battleSummary.biggestHit, finalDmg);
    app.battleSummary.hitsLanded += 1;
  } else {
    app.battleSummary.damageTaken += finalDmg;
  }

  // Lifesteal: landing a hit drains 25% of the damage dealt (both sides, no overheal)
  const lifesteal = Math.round(finalDmg * BALANCE.lifesteal);
  if (lifesteal > 0 && app.health[side] < 100) {
    app.health[side] = Math.min(100, app.health[side] + lifesteal);
    UIEffects.spawnFloatingText(app, { target: side, text: `+${lifesteal}`, type: 'heal' });
  }

  // Super meter: only your own actions charge it (landing hits, whiffing, defending)
  gainMeter(app, { side, amount: BALANCE.special.meterGainHit });

  UIEffects.triggerVisualEffect(defender);
  UIEffects.triggerAttackLunge(side);
  const dmgLabel = combo >= 3 ? `-${finalDmg} x${combo}` : `-${finalDmg}`;
  const fxType = type === 'special' ? 'special' : isCrit || combo >= 5 ? 'crit' : 'damage';
  UIEffects.spawnFloatingText(app, { target: defender, text: dmgLabel, type: fxType });
  if (guarded) {
    UIEffects.spawnFloatingText(app, { target: defender, text: 'GUARD!', type: 'miss' });
    createLog(app, {
      text: isPlayer(defender) ? 'Guarded! The blow is halved.' : `${enemyName} guards the blow!`,
      icon: 'shield',
    });
    Sound.play('block');
  }

  if (type === 'special') {
    const label = moveName ? `SPECIAL: ${moveName}! ` : 'SPECIAL! ';
    Sound.play('special');
    createLog(app, {
      text: isPlayer(side)
        ? `${label}You blasted ${enemyName} for ${finalDmg} DMG!`
        : `${label}${enemyName} blasted you for ${finalDmg} DMG!`,
      severity: 'log-special',
      icon: 'sparkles',
    });
  } else if (isCrit) {
    createLog(app, {
      text: isPlayer(side)
        ? `CRITICAL HIT! You smashed ${enemyName} for ${finalDmg} DMG!`
        : `CRITICAL HIT! ${enemyName} smashed you for ${finalDmg} DMG!`,
      severity: 'log-crit',
      icon: 'bomb',
    });
    Sound.play('crit');
    UIEffects.triggerGlobalShake(app);
  } else {
    createLog(app, {
      text: isPlayer(side) ? `You hit ${enemyName} for ${finalDmg} DMG.` : `${enemyName} hit you for ${finalDmg} DMG.`,
      severity: isPlayer(side) ? null : 'log-enemy',
      icon: isPlayer(side) ? 'sword' : 'shield',
    });
    Sound.play('attack');
  }

  const heatingLine = isPlayer(side) ? `You're heating up!` : `${enemyName} is heating up — stop them!`;
  const berserkLine = isPlayer(side) ? `RUTHLESS!` : `${enemyName} is going berserk!`;
  if (combo === 3) {
    createLog(app, { text: `COMBO x3! ${heatingLine}`, severity: 'log-special', icon: 'sparkles' });
    Sound.play('combo');
  }
  if (combo === 5) {
    createLog(app, { text: `COMBO x5! ${berserkLine}`, severity: 'log-special', icon: 'sparkles' });
    Sound.play('combo');
  }
  if (combo >= 5) UIEffects.triggerGlobalShake(app);
}

function resolveAction(app, { side, action }) {
  const enemyName = app.selectedPlayer.player2.name;
  if (isPlayer(side) && (action === 'attack' || action === 'special')) {
    app.battleSummary.hitsAttempted += 1;
  }

  if (action === 'heal') {
    // Healing sacrifices combo momentum
    app.combo[side] = 0;
    // Medkits get riskier as the match drains the supplies
    const used = Math.min(app.tracker[isPlayer(side) ? 'playerHeal' : 'enemyHeal'], BALANCE.heal.failChances.length - 1);
    const failChance = BALANCE.heal.failChances[used];
    if (!isGod(app, side) && Math.random() < failChance) {
      UIEffects.spawnFloatingText(app, { target: side, text: 'FAIL', type: 'miss' });
      createLog(app, {
        text: isPlayer(side) ? `The medkit was EMPTY! (+0 HP)` : `${enemyName}'s medkit was empty!`,
        icon: 'wind',
      });
      Sound.play('healFail');
      return;
    }
    Sound.play('heal');
    const healAmount = calcDamage(BALANCE.heal.min, BALANCE.heal.max);
    app.health[side] = Math.min(100, app.health[side] + healAmount);
    UIEffects.spawnFloatingText(app, { target: side, text: `+${healAmount}`, type: 'heal' });
    const left = BALANCE.heal.charges - app.tracker[isPlayer(side) ? 'playerHeal' : 'enemyHeal'];
    const leftLabel = left > 0 ? ` (${left} left)` : ' (final medkit!)';
    createLog(app, {
      text: isPlayer(side)
        ? `You used a Medkit (+${healAmount} HP).${leftLabel}`
        : `${enemyName} used a Medkit (+${healAmount} HP).${leftLabel}`,
      severity: 'log-heal',
      icon: 'heart',
    });
    return;
  }

  if (action === 'defend') {
    // Bracing sacrifices offence and combo, but banks meter safely
    app.combo[side] = 0;
    app.guard[side] = true;
    gainMeter(app, { side, amount: BALANCE.defend.meterGain });
    UIEffects.spawnFloatingText(app, { target: side, text: 'GUARD', type: 'miss' });
    createLog(app, {
      text: isPlayer(side) ? `You raise your guard! Next hit -50%` : `${enemyName} raises their guard!`,
      icon: 'shield',
    });
    Sound.play('defend');
    return;
  }

  if (action === 'special') {
    // Pity rule: a missed special guarantees the next one connects
    const guaranteed = app.specialPity[side];
    app.specialPity[side] = false;
    const missed = !guaranteed && !isGod(app, side) && Math.random() < BALANCE.special.missChance;
    if (missed) {
      app.specialPity[side] = true;
      app.combo[side] = 0;
      UIEffects.spawnFloatingText(app, { target: other(side), text: 'MISS', type: 'miss' });
      createLog(app, {
        text: isPlayer(side) ? `WHIFF! Your Special missed! (next one can't miss)` : `${enemyName}'s Special WHIFFED!`,
        icon: 'wind',
      });
      Sound.play('miss');
      app.specialMeter[side] = 0;
      return;
    }
    const attacker = app.selectedPlayer[side];
    const signature = attacker && attacker.id ? SPECIAL_FX[attacker.id] : null;
    const willCombo = (app.combo[side] || 0) + 1;
    if (signature) UIEffects.spawnSpecialFx(attacker.id, willCombo >= 3);
    const dmg = calcDamage(BALANCE.special.min, BALANCE.special.max) * godMultiplier(app, side);
    applyDamage(app, { side, dmg, type: 'special', isCrit: false, moveName: signature ? signature.move : null });
    // A special costs the full bar: zeroed after resolve so landing gains cannot refund it
    app.specialMeter[side] = 0;
    return;
  }

  // Normal attack (god mode: doubled crit chance, never misses)
  if (!isGod(app, side) && Math.random() < BALANCE.attack.missChance) {
    app.combo[side] = 0;
    gainMeter(app, { side, amount: BALANCE.special.meterGainWhiff });
    UIEffects.spawnFloatingText(app, { target: other(side), text: 'MISS', type: 'miss' });
    createLog(app, { text: isPlayer(side) ? `You swung at air!` : `${enemyName} swung at air!`, icon: 'wind' });
    Sound.play('miss');
    return;
  }
  const critChance = BALANCE.attack.critChance * (isGod(app, side) ? 2 : 1);
  const isCrit = Math.random() < critChance;
  let dmg = calcDamage(BALANCE.attack.min, BALANCE.attack.max) * godMultiplier(app, side);
  if (isCrit) dmg *= BALANCE.attack.critMult;
  applyDamage(app, { side, dmg, type: 'attack', isCrit });
}

/**
 * CPU decision engine — follows the same strategic flowchart the player should.
 * Reads only public state (HP, meter, combo, guard, charges) — zero information asymmetry.
 *
 * Tier 1 READ:    Player special charged → defend (swings the math by ~16 HP)
 * Tier 2 SURVIVE: HP critical → heal (medkit risk-aware)
 * Tier 3 FINISH:  Meter full + player not guarding → special (lethal / combo / tempo)
 * Tier 4 DEFAULT: Attack — builds meter, maintains combo, lifesteals
 */
function chooseEnemyAction(app) {
  const enemyHp = app.health.player2;
  const playerHp = app.health.player1;
  const canHeal = app.tracker.enemyHeal < BALANCE.heal.charges;
  const usedKits = Math.min(app.tracker.enemyHeal, BALANCE.heal.failChances.length - 1);
  const kitRisk = BALANCE.heal.failChances[usedKits];
  const ready = specialReady(app, 'player2');
  const playerReady = specialReady(app, 'player1');
  const playerGuarding = app.guard.player1;
  const enemyCombo = app.combo.player2;
  const avgSpecial = (BALANCE.special.min + BALANCE.special.max) / 2;

  // TIER 1 — READ: brace when the player's special is loaded and CPU is exposed.
  // Defending a charged special changes the outcome from -5.3 to +11.0 HP swing.
  if (playerReady && !playerGuarding) {
    if (enemyHp <= 25 && Math.random() < 0.75) return 'defend';
    if (enemyHp <= 50 && Math.random() < 0.55) return 'defend';
  }

  // TIER 2 — SURVIVE: heal when critically low, but respect escalating medkit risk.
  if (canHeal) {
    if (kitRisk >= 0.3) {
      if (enemyHp <= 12 && Math.random() < 0.7) return 'heal';
    } else {
      if (enemyHp <= 18 && Math.random() < 0.85) return 'heal';
      if (enemyHp <= 35 && Math.random() < 0.5) return 'heal';
    }
  }

  // TIER 3 — FINISH: spend the full meter, but never into a guard.
  // A guarded special (16 × 0.5 = 8) is equivalent to a free attack — meter wasted.
  if (ready && !playerGuarding) {
    if (playerHp > 0 && playerHp <= avgSpecial && Math.random() < 0.9) return 'special';
    if (enemyCombo >= 3 && Math.random() < 0.7) return 'special';
    if (Math.random() < 0.35) return 'special';
  }

  // TIER 4 — DEFAULT: attack builds meter (+30), sustains via lifesteal (+25% dmg), keeps combo.
  return 'attack';
}

function recordResult(app, won) {
  // Cheat battles never touch the records
  if (app.selectedPlayer.player1.id === 999) return;

  if (won) app.stats.win.player1 += 1;
  else app.stats.win.player2 += 1;

  // Streaks & all-time best combo
  if (won) {
    app.stats.streak = (app.stats.streak || 0) + 1;
    if (app.stats.streak > (app.stats.bestStreak || 0)) app.stats.bestStreak = app.stats.streak;
  } else {
    app.stats.streak = 0;
  }
  if (app.battleMaxCombo > (app.stats.maxCombo || 0)) app.stats.maxCombo = app.battleMaxCombo;

  const readEntry = (id) => app.fighterStats[id] || { wins: 0, losses: 0 };

  // Your fighter's record (as played by you)
  const fighter = app.selectedPlayer.player1;
  if (fighter && fighter.id) {
    const entry = readEntry(fighter.id);
    const updated = {
      wins: (entry.wins || 0) + (won ? 1 : 0),
      losses: (entry.losses || 0) + (won ? 0 : 1),
      cpuWins: entry.cpuWins || 0,
      cpuLosses: entry.cpuLosses || 0,
      rounds: (entry.rounds || 0) + (app.roundCount || 0),
      maxCombo: Math.max(entry.maxCombo || 0, app.battleMaxCombo || 0),
    };
    if (typeof app.$set === 'function') app.$set(app.fighterStats, fighter.id, updated);
    else app.fighterStats[fighter.id] = updated;
  }

  // Opponent character's record (as CPU facing you)
  const opponent = app.selectedPlayer.player2;
  if (opponent && opponent.id && !opponent.isSecret) {
    const entry = readEntry(opponent.id);
    const updated = {
      wins: entry.wins || 0,
      losses: entry.losses || 0,
      cpuWins: (entry.cpuWins || 0) + (won ? 0 : 1),
      cpuLosses: (entry.cpuLosses || 0) + (won ? 1 : 0),
    };
    if (typeof app.$set === 'function') app.$set(app.fighterStats, opponent.id, updated);
    else app.fighterStats[opponent.id] = updated;
  }

  if (typeof app.saveStats === 'function') app.saveStats();
}

function surrender(app) {
  clearTurnTimer(app);
  app.surrenderHp = app.health.player1;
  app.surrenderEnemyHp = app.health.player2;
  app.health.player1 = 0;
  app.isSurrender = true;
  recordResult(app, false);
  createLog(app, { text: 'SIGNAL LOST: You surrendered.', severity: 'log-surrender', icon: 'flag' });
  gameOver(app);
}

function pickOpponent(app) {
  const pool = app.players.filter((candidate) => candidate.id !== app.selectedPlayer.player1.id && !candidate.isSecret);
  return pool[Math.floor(Math.random() * pool.length)];
}

function startNewBattle(app, rematch = false) {
  clearTurnTimer(app);
  const currentOpponent = app.selectedPlayer.player2;
  const keepOpponent =
    rematch && currentOpponent && currentOpponent.id && currentOpponent.id !== app.selectedPlayer.player1.id;
  if (!keepOpponent) app.selectedPlayer.player2 = pickOpponent(app);
  app.selectedPlayer.player1.isChampion = false;
  app.selectedPlayer.player2.isChampion = false;
  app.status.play = true;
  app.status.winner = false;
  app.health.player1 = 100;
  app.health.player2 = 100;
  app.tracker.playerHeal = 0;
  app.tracker.enemyHeal = 0;
  app.specialMeter = { player1: 0, player2: 0 };
  app.specialPity = { player1: false, player2: false };
  app.guard = { player1: false, player2: false };
  app.combo = { player1: 0, player2: 0 };
  app.isSurrender = false;
  app.surrenderHp = 0;
  app.surrenderEnemyHp = 0;
  app.roundCount = 0;
  app.battleMaxCombo = 0;
  app.roundWins = { player1: 0, player2: 0 };
  app.currentRound = 1;
  app.roundIntro = false;
  app._nextInitiative = null;
  app.battleSummary = { damageDealt: 0, damageTaken: 0, biggestHit: 0, hitsLanded: 0, hitsAttempted: 0 };
  app.logs = [];
  app.activeFx = { player1: [], player2: [] };
  UIEffects.clearWeather();
  app.battleMenuIndex = 0;

  createLog(app, { text: 'A NEW CHALLENGER APPROACHES!', icon: 'zap' });

  const playerStarts = Math.random() < 0.5;
  if (playerStarts) {
    app.turnInProgress = false;
    createLog(app, { text: 'You strike first — make it count!', icon: 'arrow-big-up' });
  } else {
    app.turnInProgress = true;
    createLog(app, {
      text: `${app.selectedPlayer.player2.name} strikes first — brace yourself!`,
      icon: 'warning-diamond',
    });
    scheduleEnemyTurn(app, 2400);
  }
}

function playerAttack(app, type) {
  if (app.turnInProgress) return;
  if (type === 'special' && !specialReady(app, 'player1')) return;
  beginTurn(app, 'player1');
  app.turnInProgress = true;
  resolveAction(app, { side: 'player1', action: type === 'special' ? 'special' : 'attack' });
  if (!checkWinner(app)) scheduleEnemyTurn(app, 1200);
}

function playerHeal(app) {
  if (app.turnInProgress || app.tracker.playerHeal >= BALANCE.heal.charges || app.health.player1 >= 100) return;
  beginTurn(app, 'player1');
  app.turnInProgress = true;
  app.tracker.playerHeal++;
  resolveAction(app, { side: 'player1', action: 'heal' });
  scheduleEnemyTurn(app, 1200);
}

function playerDefend(app) {
  if (app.turnInProgress) return;
  beginTurn(app, 'player1');
  app.turnInProgress = true;
  resolveAction(app, { side: 'player1', action: 'defend' });
  scheduleEnemyTurn(app, 1200);
}

function enemyTurn(app) {
  if (app.status.winner || !app.status.play) return;
  beginTurn(app, 'player2');
  const action = chooseEnemyAction(app);
  if (action === 'heal') app.tracker.enemyHeal++;
  resolveAction(app, { side: 'player2', action });
  if (!checkWinner(app)) {
    app.turnInProgress = false;
    Sound.play('turnReady');
  }
}

function executeBattleAction(app) {
  if (app.turnInProgress) return;
  if (app.battleMenuIndex === 0) playerAttack(app, 'normal');
  else if (app.battleMenuIndex === 1) playerAttack(app, 'special');
  else if (app.battleMenuIndex === 2) playerHeal(app);
  else if (app.battleMenuIndex === 3) playerDefend(app);
}

function reBattle(app) {
  clearTurnTimer(app);
  app.status.winner = false;
  if (typeof app.startLoading === 'function') app.startLoading(true);
}

/**
 * Battle engine — deterministic combat resolution over the shared reactive app state.
 * Functions take `(app, payload)` — the reactive root as receiver, a single options object.
 * Public API: { startNewBattle, beginNextRound, playerAttack, playerHeal,
 * playerDefend, executeBattleAction, reBattle, surrender, cancelTurn }.
 */
export default {
  startNewBattle,
  beginNextRound,
  playerAttack,
  playerHeal,
  playerDefend,
  executeBattleAction,
  reBattle,
  surrender,
  cancelTurn: clearTurnTimer,
};
