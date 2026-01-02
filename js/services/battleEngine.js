// Battle Engine Service (global)
window.BattleEngine = (function () {
  const calcDamage = (min, max) => Math.max(Math.floor(Math.random() * max) + 1, min);

  function createLog(app, message) {
    if (typeof app.createLog === 'function') app.createLog(message);
  }

  function gameOver(app) {
    app.status.play = false;
    app.status.winner = true;
    app.turnInProgress = false;
    app.battleMenuIndex = 0;
  }

  function checkWinner(app) {
    if (app.health.player2 <= 0) {
      app.health.player2 = 0;
      app.selectedPlayer.player1.name = `👑 ${app.selectedPlayer.player1.name}`;
      app.stats.win.player1 += 1;
      createLog(
        app,
        `<span style="color:#209cee; font-weight:bold;">🏆 VICTORY! You defeated ${app.selectedPlayer.player2.name}!</span>`
      );
      UIEffects.spawnConfetti();
      gameOver(app);
      return true;
    }
    if (app.health.player1 <= 0) {
      app.health.player1 = 0;
      app.selectedPlayer.player2.name = `👑 ${app.selectedPlayer.player2.name}`;
      app.stats.win.player2 += 1;
      createLog(app, `<span style="color:#e76e55; font-weight:bold;">💀 DEFEAT! You were eliminated.</span>`);
      gameOver(app);
      return true;
    }
    return false;
  }

  function startNewBattle(app) {
    let opponent;
    do {
      opponent = app.players[Math.floor(Math.random() * app.players.length)];
    } while (opponent.id === app.selectedPlayer.player1.id);

    app.selectedPlayer.player2 = opponent;
    app.status.play = true;
    app.status.winner = false;
    app.health.player1 = 100;
    app.health.player2 = 100;
    app.tracker.playerHeal = 0;
    app.tracker.enemyHeal = 0;
    app.logs = [];
    app.activeFx = { player1: [], player2: [] };
    UIEffects.clearConfetti();
    app.battleMenuIndex = 0;

    createLog(app, 'System Initialized. Battle Start!');

    const playerStarts = Math.random() < 0.5;
    if (playerStarts) {
      app.turnInProgress = false;
      createLog(app, '🚀 INITIATIVE: You attack first!');
    } else {
      app.turnInProgress = true;
      createLog(app, '⚠️ WARNING: Enemy attacks first!');
      setTimeout(() => enemyTurn(app), 1500);
    }
  }

  function playerAttack(app, type) {
    if (app.turnInProgress) return;
    app.turnInProgress = true;
    const p2Name = app.selectedPlayer.player2.name;
    let damage = 0,
      isCrit = false,
      isMiss = false;

    const isGod = app.selectedPlayer.player1.id === 999;
    const multiplier = isGod ? 2 : 1;

    if (type === 'normal') {
      damage = calcDamage(3, 10) * multiplier;
      if (Math.random() < 0.15) {
        damage *= 2;
        isCrit = true;
      }
    } else if (type === 'special') {
      damage = calcDamage(10, 25) * multiplier;
      if (Math.random() < 0.2) {
        damage = 0;
        isMiss = true;
      }
    }

    if (isMiss) {
      UIEffects.spawnFloatingText(app, 'player2', 'MISS', 'miss');
      createLog(app, `💨 Attack MISSED on ${p2Name}!`);
    } else {
      app.health.player2 -= damage;
      if (app.health.player2 < 0) app.health.player2 = 0;

      UIEffects.triggerVisualEffect('player2');
      if (type === 'special') {
        UIEffects.spawnFloatingText(app, 'player2', `-${damage}`, 'special');
        createLog(app, `✨ <span style="color:#f7d51d">SPECIAL!</span> You blasted ${p2Name} for ${damage} DMG!`);
      } else {
        UIEffects.spawnFloatingText(app, 'player2', `-${damage}`, isCrit ? 'crit' : 'damage');
        if (isCrit) {
          createLog(app, `<span style="color:#e76e55">💥 CRITICAL HIT!</span> You dealt ${damage} DMG!`);
          UIEffects.triggerGlobalShake(app);
        } else {
          createLog(app, `🗡️ You hit ${p2Name} for ${damage} DMG.`);
        }
      }
    }

    if (!checkWinner(app)) setTimeout(() => enemyTurn(app), 1200);
  }

  function playerHeal(app) {
    if (app.turnInProgress || app.tracker.playerHeal >= app.limit.heal) return;
    app.turnInProgress = true;
    app.tracker.playerHeal++;

    const healAmount = Math.floor(Math.random() * 15) + 10;
    app.health.player1 += healAmount;
    if (app.health.player1 > 100) app.health.player1 = 100;

    UIEffects.spawnFloatingText(app, 'player1', `+${healAmount}`, 'heal');
    createLog(app, `💊 REPAIR: You restored ${healAmount} HP.`);
    setTimeout(() => enemyTurn(app), 1200);
  }

  function enemyTurn(app) {
    if (app.status.winner) return;
    const p2Name = app.selectedPlayer.player2.name;
    let action = 'attack';

    const canHeal = app.tracker.enemyHeal < app.limit.heal;
    const isLowHp = app.health.player2 < 40;

    if (isLowHp && canHeal && Math.random() < 0.4) action = 'heal';
    else if (Math.random() < 0.25) action = 'special';

    if (action === 'heal') {
      app.tracker.enemyHeal++;
      const healAmount = Math.floor(Math.random() * 15) + 10;
      app.health.player2 += healAmount;
      if (app.health.player2 > 100) app.health.player2 = 100;
      UIEffects.spawnFloatingText(app, 'player2', `+${healAmount}`, 'heal');
      createLog(app, `💊 <span style="color:#e76e55">${p2Name}</span> used a Medkit (+${healAmount} HP).`);
    } else {
      let damage = 0,
        isCrit = false,
        isMiss = false;
      if (action === 'special') {
        damage = calcDamage(10, 25);
        if (Math.random() < 0.2) isMiss = true;
      } else {
        damage = calcDamage(3, 10);
        if (Math.random() < 0.15) {
          damage *= 2;
          isCrit = true;
        }
      }

      if (isMiss) {
        UIEffects.spawnFloatingText(app, 'player1', 'MISS', 'miss');
        createLog(app, `💨 ${p2Name} tried a Special Attack but MISSED!`);
      } else {
        app.health.player1 -= damage;
        if (app.health.player1 < 0) app.health.player1 = 0;

        UIEffects.triggerVisualEffect('player1');
        if (action === 'special') {
          UIEffects.spawnFloatingText(app, 'player1', `-${damage}`, 'special');
          createLog(app, `✨ ${p2Name} used <span style="color:#f7d51d">SPECIAL ATTACK</span> for ${damage} DMG!`);
        } else {
          UIEffects.spawnFloatingText(app, 'player1', `-${damage}`, isCrit ? 'crit' : 'damage');
          if (isCrit) {
            createLog(app, `<span style="color:#e76e55">⚠️ CRITICAL HIT!</span> ${p2Name} hit you for ${damage}!`);
            UIEffects.triggerGlobalShake(app);
          } else {
            createLog(app, `🛡️ ${p2Name} attacks! You took ${damage} damage.`);
          }
        }
      }
    }

    if (!checkWinner(app)) app.turnInProgress = false;
  }

  function executeBattleAction(app) {
    if (app.battleMenuIndex === 0) playerAttack(app, 'normal');
    if (app.battleMenuIndex === 1) playerAttack(app, 'special');
    if (app.battleMenuIndex === 2) playerHeal(app);
  }

  function reBattle(app) {
    app.status.winner = false;
    if (typeof app.startLoading === 'function') app.startLoading();
  }

  return {
    startNewBattle,
    playerAttack,
    playerHeal,
    enemyTurn,
    checkWinner,
    executeBattleAction,
    reBattle,
  };
})();
