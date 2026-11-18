// The title-screen demo: a real run on MV PETREL, pre-loaded by hand, with the bot working the
// crane behind the wordmark — the title is a window into the actual game, not a painting.
(function () {
  if (globalThis.GT_TitleDemo) return;

  function build() {
    const run = globalThis.GT_Sim.createRun('gantry-demo', 'busy', false);
    globalThis.GT_Sim.startShip(run, 4); // MV PETREL: 6 cols x 3 rows, gulls and swell on
    // Pre-load the bottom two rows in plan colours, with one honest mistake.
    const plan = run.plan;
    for (let c = 0; c < run.ship.cols; c++) {
      for (let r = 0; r < 2; r++) {
        if ((c * 2 + r) % 5 === 4) continue; // leave gaps so the demo has work to do
        const colorId = (c === 2 && r === 0) ? (plan.grid[r][c] === 'red' ? 'blue' : 'red') : plan.grid[r][c];
        run.placed.push({ col: c, row: r, colorId, serial: 300 + c * 4 + r, wild: false });
        run.filled[r][c] = colorId;
        run.filledCount += 1;
        if (colorId === plan.grid[r][c]) run.trueCount += 1;
      }
    }
    run.score = 3150;
    run.chain = 2;
    run.hull = 9;
    run.banner = null; run.bannerT = 0;
    return run;
  }

  globalThis.GT_TitleDemo = { build };
})();
