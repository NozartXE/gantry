// Screenshot staging (?shot=play|title|draft|results&seed=N): builds one deterministic frame
// per screen from the real sim — the play frame is found by letting the bot work MV PETREL
// until the harbour is genuinely busy, never by painting a fake state.
(function () {
  if (globalThis.GT_Testhook) return;
  const S = () => globalThis.GT_Save;

  function stagedSave() {
    S().stageRecord({
      best: 48210, bestGrade: 'A', wins: 3, runs: 9,
      feats: { first: true, chain8: true, perfect: true, storm: true, harbour: true },
      settings: { music: 0.7, sfx: 0.8, shake: 0.5 },
      endlessUnlocked: true,
      history: [
        { score: 48210, grade: 'A', result: 'CLEARED', ship: 9, difficulty: 'BUSY' },
        { score: 15210, grade: 'C', result: 'HULL LOST', ship: 6, difficulty: 'BUSY' },
        { score: 9860, grade: 'D', result: 'SAILED SHORT', ship: 5, difficulty: 'BUSY' },
      ],
    });
  }

  function stagePlay(seed) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const run = buildPlay(seed + (attempt ? '-' + attempt : ''));
      if (run.screen === 'play' && run.placed.length >= 9 && run.chain >= 2) return run;
    }
    return buildPlay(seed);
  }

  function buildPlay(seed) {
    const run = globalThis.GT_Sim.createRun('stage-' + seed, 'busy', false);
    globalThis.GT_Sim.startShip(run, 4); // MV PETREL, shift 2: gulls, swell, 6x3 plan
    run.score = 4310; run.hull = 8; run.chain = 0;
    // Let the bot work; keep the first genuinely busy tick: a box mid-fall, a chain alive,
    // at least nine boxes down. Deterministic — the same seed finds the same tick.
    let ticks = 0;
    while (ticks < 60 * 240) {
      const ctrl = globalThis.GT_Bot.control(run);
      globalThis.GT_Sim.update(run, globalThis.GT_Config.STEP, ctrl);
      run.events.length = 0;
      ticks += 1;
      if (run.placed.length >= 9 && run.crane.falling && run.chain >= 2) break;
      if (run.screen !== 'play') break;
    }
    // One more true stow lands within the next second in most seeds; step a little so a fresh
    // floater is in the air for the capture, then freeze.
    for (let i = 0; i < 26 && run.screen === 'play'; i++) {
      const ctrl = globalThis.GT_Bot.control(run);
      globalThis.GT_Sim.update(run, globalThis.GT_Config.STEP, ctrl);
    }
    run.staged = true;
    return run;
  }

  function stageDraft(seed) {
    const run = globalThis.GT_Sim.createRun('stage-' + seed, 'busy', false);
    globalThis.GT_Sim.startShip(run, 3);
    run.rigs = ['magnet', 'counter'];
    run.rigsPicked = 2; run.offersSeen = 12;
    run.score = 16200; run.hull = 9; run.chain = 4; run.bestChain = 6;
    run.shipScores = [3150, 6900, 11400, 16200];
    run.screen = 'draft';
    run.offers = ['chains', 'paint', 'spreader'];
    run.staged = true;
    return run;
  }

  function stageResults(seed) {
    stagedSave();
    const run = globalThis.GT_Sim.createRun('stage-' + seed, 'busy', false);
    globalThis.GT_Sim.startShip(run, 8); // the TYPHOON FREIGHTER, fully loaded as hero art
    for (let c = 0; c < run.ship.cols; c++) {
      for (let r = 0; r < run.ship.rows; r++) {
        const colorId = run.plan.grid[r][c];
        run.placed.push({ col: c, row: r, colorId, serial: 400 + c * 8 + r, wild: false });
        run.filled[r][c] = colorId;
        run.filledCount += 1; run.trueCount += 1;
      }
    }
    run.score = 48210; run.bestChain = 8; run.hull = 4;
    run.rigs = ['magnet', 'counter', 'chains', 'grease', 'scarer', 'nets', 'paint'];
    run.rigsPicked = 7; run.offersSeen = 21;
    run.shipScores = [3150, 6900, 11400, 16200, 21800, 28900, 35600, 41900, 48210];
    run.featsEarned = ['first', 'chain8', 'perfect', 'storm', 'harbour'];
    run.stats = { drops: 171, trueStows: 128, splashes: 4, slides: 2 };
    run.elapsed = 1087;
    run.over = true; run.screen = 'results';
    run.result = {
      result: 'CLEARED', grade: 'A', score: 48210, shipsCleared: 9,
      rigsPicked: 7, offersSeen: 21, bestChain: 8,
      stats: run.stats, difficulty: 'BUSY', seed: 'stage-' + seed, endless: false,
    };
    run.staged = true;
    return run;
  }

  globalThis.GT_Testhook = { stagePlay, stageDraft, stageResults, stagedSave };
})();
