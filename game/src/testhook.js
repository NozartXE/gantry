// Screenshot staging (?shot=play|title|draft|results&seed=N): builds one deterministic frame
// per screen from the real sim — the play frame is found by letting the bot work MV PETREL
// until the harbour is genuinely busy, never by painting a fake state.
(function () {
  if (globalThis.GT_Testhook) return;
  const S = () => globalThis.GT_Save;

  function stagedSave() {
    S().stageRecord({
      best: 48210, bestGrade: 'A', wins: 3, runs: 9,
      feats: { first: true, chain8: true, perfect: true, storm: true, harbour: true, orders: true, heavy: true, glass: true, squall: true, fast: true },
      trials: { firstlight: 'GOLD', heavyday: 'SILVER' },
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

  function freshPlayRun(seed) {
    const run = globalThis.GT_Sim.createRun('stage-' + seed, 'busy', false);
    globalThis.GT_Sim.startShip(run, 7); // MV FRIGATE, shift 3: glass, gulls, swell, squall lines
    // A mid-run harbour: four rigs already drafted, so the frame shows what they do — the
    // spotter's predicted landing, the manifest's five-box rack, the tug on standby.
    run.rigs = ['ballast', 'spotter', 'manifest', 'tug'];
    run.score = 4310; run.hull = 8; run.chain = 0;
    return run;
  }

  function buildPlay(seed) {
    // Pass 1 — scout: play the deterministic run and find the frame that shows the game at
    // its busiest: a box mid-fall, a chain alive, at least nine boxes down, the banner down,
    // and the squall line over the hook. The sim is deterministic, so pass 2 replays the
    // same seed to the same tick and freezes there — the weather is in the frame because it
    // was really there, not because anyone painted it.
    const scout = freshPlayRun(seed);
    let heldTick = -1, fallTick = -1, busyTick = -1, ticks = 0;
    while (ticks < 60 * 200 && scout.screen === 'play') {
      globalThis.GT_Sim.update(scout, globalThis.GT_Config.STEP, globalThis.GT_Bot.control(scout));
      scout.events.length = 0;
      ticks += 1;
      if (scout.screen !== 'play') break;
      const busy = scout.placed.length >= 9 && scout.chain >= 2 && scout.bannerT <= 0 &&
        Math.abs(scout.crane.angle) < 0.5; // a sane swing: the box must be in the open, not behind a panel
      if (!busy) continue;
      if (busyTick < 0) busyTick = ticks;
      const hook = globalThis.GT_Crane.hookPos(scout.crane);
      const inSquall = globalThis.GT_Hazards.squallAt(scout.hazards, hook.x) > 0.25;
      if (!inSquall) continue;
      if (scout.crane.held && heldTick < 0) { heldTick = ticks; break; } // spotter ghost + squall: the full frame
      if (scout.crane.falling && fallTick < 0) fallTick = ticks;
    }
    const target = heldTick > 0 ? heldTick : fallTick > 0 ? fallTick : busyTick;
    const run = freshPlayRun(seed);
    if (target > 0) {
      for (let i = 0; i < target; i++) {
        globalThis.GT_Sim.update(run, globalThis.GT_Config.STEP, globalThis.GT_Bot.control(run));
        if (i < target - 1) run.events.length = 0; // keep the last tick's floaters for the frame
      }
    } else {
      let t = 0;
      while (t < 60 * 60 && run.screen === 'play' && run.placed.length < 9) {
        globalThis.GT_Sim.update(run, globalThis.GT_Config.STEP, globalThis.GT_Bot.control(run));
        run.events.length = 0;
        t += 1;
      }
    }
    run.staged = true;
    return run;
  }

  function stageDraft(seed) {
    const run = globalThis.GT_Sim.createRun('stage-' + seed, 'busy', false);
    globalThis.GT_Sim.startShip(run, 3);
    run.rigs = ['magnet', 'counter', 'ballast'];
    run.rigsPicked = 3; run.offersSeen = 12;
    run.score = 16200; run.hull = 9; run.chain = 4; run.bestChain = 6;
    run.shipScores = [3150, 6900, 11400, 16200];
    run.screen = 'draft';
    run.offers = ['tug', 'spotter', 'priority'];
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
        const cls = (c + r * 3) % 7 === 0 ? 'heavy' : (c * 2 + r) % 9 === 0 ? 'fragile' : 'std';
        run.placed.push({ col: c, row: r, colorId, serial: 400 + c * 8 + r, wild: false, cls, cracked: false, weight: cls === 'heavy' ? 2 : 1 });
        run.filled[r][c] = colorId;
        run.filledCount += 1; run.trueCount += 1;
      }
    }
    run.score = 48210; run.bestChain = 8; run.hull = 4;
    run.rigs = ['magnet', 'counter', 'chains', 'grease', 'ballast', 'tug', 'spotter', 'priority'];
    run.rigsPicked = 8; run.offersSeen = 24;
    run.shipScores = [3150, 6900, 11400, 16200, 21800, 28900, 35600, 41900, 48210];
    const trueByShip = [7, 8, 11, 13, 14, 18, 19, 18, 20];
    const timeByShip = [96, 118, 150, 131, 148, 152, 160, 178, 164];
    const ordersByShip = ['1/1', '1/2', '0/2', '2/2', '1/2', '0/2', '1/2', '1/2', '0/2'];
    run.shipLog = globalThis.GT_Config.SHIPS.map((s, i) => ({
      name: s.name, true: trueByShip[i], total: s.cols * s.rows, time: timeByShip[i],
      orders: ordersByShip[i], delta: run.shipScores[i] - (i ? run.shipScores[i - 1] : 0),
    }));
    run.featsEarned = ['first', 'chain8', 'perfect', 'dry', 'storm', 'harbour', 'orders', 'heavy', 'glass', 'squall', 'fast'];
    run.stats = { drops: 186, trueStows: 128, splashes: 4, slides: 2, ordersDone: 7, heavyStows: 14, glassStows: 9, squallStows: 2 };
    run.elapsed = 1087;
    run.over = true; run.screen = 'results';
    run.result = {
      result: 'CLEARED', grade: 'A', score: 48210, shipsCleared: 9,
      rigsPicked: 8, offersSeen: 24, bestChain: 8,
      stats: run.stats, difficulty: 'BUSY', seed: 'stage-' + seed, endless: false,
      trial: null, trialName: null, medal: null,
    };
    run.staged = true;
    return run;
  }

  globalThis.GT_Testhook = { stagePlay, stageDraft, stageResults, stagedSave };
})();
