export const createBattleRuntimeState = (overrides = {}) => ({
  health: { player1: 100, player2: 100 },
  activeFx: { player1: [], player2: [] },
  turnInProgress: false,
  battleIntro: false,
  battleAssembling: false,
  koActive: false,
  koLoser: null,
  roundIntro: false,
  isSurrender: false,
  surrenderHp: 0,
  surrenderEnemyHp: 0,
  roundCount: 0,
  battleMaxCombo: 0,
  roundWins: { player1: 0, player2: 0 },
  currentRound: 1,
  _nextInitiative: null,
  battleSummary: { damageDealt: 0, damageTaken: 0, biggestHit: 0, hitsLanded: 0, hitsAttempted: 0 },
  logs: [],
  limit: { heal: 3 },
  tracker: { playerHeal: 0, enemyHeal: 0 },
  specialMeter: { player1: 0, player2: 0 },
  specialPity: { player1: false, player2: false },
  guard: { player1: false, player2: false },
  combo: { player1: 0, player2: 0 },
  battleMenuIndex: 0,
  ...overrides,
});

export const resetBattleRuntimeState = (app, { resetStatus = false } = {}) => {
  const fresh = createBattleRuntimeState();

  Object.assign(app, fresh);

  if (resetStatus) {
    app.status = { ...app.status, selecting: false, loading: false, play: false, winner: false };
  }

  return app;
};
