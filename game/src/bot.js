// The harbour bot: a deterministic crane operator used by the balance tools and the screenshot
// staging. Its policy is simple and honest — aim at a column whose next cell wants the held
// colour, prefer the side that levels the ship, wait for the swing to settle, then drop.
(function () {
  if (globalThis.GT_Bot) return;

  function chooseTarget(run) {
    const ship = run.ship;
    const held = run.crane.held;
    if (!held) return 640;
    const heights = [];
    for (let c = 0; c < ship.cols; c++) heights.push(globalThis.GT_Stack.columnHeight(run.placed, c));
    const list = globalThis.GT_Stack.listValue(run.placed, ship);
    let bestCol = -1, bestScore = -Infinity;
    for (let c = 0; c < ship.cols; c++) {
      const row = heights[c];
      if (row >= ship.rows) continue;
      let s = 0;
      const want = run.plan.grid[row][c];
      if (held.wild || want === held.colorId) s += 100;
      s -= Math.abs(heights[c] - (run.plan.total / ship.cols)) * 2;      // keep the deck even
      s -= Math.sign(c - (ship.cols - 1) / 2) * list * 30;               // lean against the list
      if (held.cls === 'heavy') s -= Math.abs(c - (ship.cols - 1) / 2) * 9; // steel belongs midships
      s -= Math.abs(globalThis.GT_Stack.columnCenter(ship, c) - run.crane.x) * 0.02;
      if (s > bestScore) { bestScore = s; bestCol = c; }
    }
    if (bestCol < 0) bestCol = Math.floor(ship.cols / 2);
    return globalThis.GT_Stack.columnCenter(ship, bestCol);
  }

  function control(run) {
    const crane = run.crane;
    const target = chooseTarget(run);
    const hook = globalThis.GT_Crane.hookPos(crane);
    let accel = (target - crane.x) * 0.03 - crane.v * 0.012;
    accel = Math.max(-1, Math.min(1, accel));
    const settled = Math.abs(crane.angle) < 0.055 && Math.abs(crane.angVel) < 0.3;
    // Glass rides gentler: the bot waits for a calmer swing before letting go of a fragile
    // box, the same judgement the crack rule asks of a human hand.
    const glassSettled = Math.abs(crane.angle) < 0.03 && Math.abs(crane.angVel) < 0.18;
    const aligned = Math.abs(hook.x - target) < 13;
    const drop = !!crane.held && !crane.falling && aligned &&
      (crane.held.cls === 'fragile' ? glassSettled : settled);
    return { accel, drop };
  }

  // Play a whole run headlessly at a chosen clumsiness (drop-window multiplier): returns the
  // run for inspection. Used by tools/balance — greedy is window 2.2, careful is window 1.0.
  function playRun(seed, difficultyId, windowMul) {
    const run = globalThis.GT_Sim.createRun(seed, difficultyId, false);
    let ticks = 0;
    const maxTicks = 60 * 60 * 45;
    while (!run.over && ticks < maxTicks) {
      if (run.screen === 'draft') {
        globalThis.GT_Sim.pickRig(run, run.offers[0]);
      } else {
        const ctrl = control(run);
        if (windowMul > 1) {
          // clumsy hands: drop as soon as the HOOK (not the trolley) is roughly over the
          // target and not flying sideways — impatient, but not blind
          const hook = globalThis.GT_Crane.hookPos(run.crane);
          const hv = globalThis.GT_Crane.hookVel(run.crane);
          const target = chooseTarget(run);
          ctrl.drop = !!run.crane.held && !run.crane.falling &&
            Math.abs(hook.x - target) < 14 * windowMul && Math.abs(hv.x) < 160 && Math.abs(run.crane.angle) < 0.12;
        }
        globalThis.GT_Sim.update(run, globalThis.GT_Config.STEP, ctrl);
      }
      ticks += 1;
    }
    return run;
  }

  globalThis.GT_Bot = { control, chooseTarget, playRun };
})();
