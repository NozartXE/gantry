// Cargo: builds each ship's cargo plan (the coloured grid the player must fill) and the queue
// of containers the crane will lift, shuffled from the plan plus a few spare boxes.
(function () {
  if (globalThis.GT_Cargo) return;
  const C = globalThis.GT_Config;

  // A plan is rows x cols of colour ids. Colours are dealt so every colour in the ship's set
  // appears and no column is a single repeated colour more than twice in a row.
  function makePlan(ship, rng) {
    const total = ship.cols * ship.rows;
    const colorCount = ship.cols >= 7 ? 5 : ship.cols >= 5 ? 4 : 3;
    const ids = C.CARGO_COLORS.slice(0, colorCount).map((c) => c.id);
    const cells = [];
    for (let i = 0; i < total; i++) cells.push(ids[i % ids.length]);
    const dealt = rng.shuffle(cells);
    const grid = [];
    for (let r = 0; r < ship.rows; r++) grid.push(dealt.slice(r * ship.cols, (r + 1) * ship.cols));
    return { grid, total, colorCount };
  }

  // The queue: exactly the plan's colours in shuffled order, then spare boxes of random plan
  // colours, so a careful crane can always finish and a sloppy one runs out of true matches.
  function makeQueue(plan, rng, spares) {
    const flat = [];
    plan.grid.forEach((row) => row.forEach((id) => flat.push(id)));
    const queue = rng.shuffle(flat).map((id, i) => ({ colorId: id, serial: 100 + i }));
    for (let i = 0; i < spares; i++) {
      queue.push({ colorId: flat[rng.int(0, flat.length - 1)], serial: 200 + i });
    }
    return queue;
  }

  // Colours still missing from the plan, most-wanted first (drives the forecast and BONUS PAINT).
  function missingColors(plan, placed) {
    const need = {};
    plan.grid.forEach((row) => row.forEach((id) => { need[id] = (need[id] || 0) + 1; }));
    placed.forEach((p) => {
      const want = plan.grid[p.row] && plan.grid[p.row][p.col];
      if (want === p.colorId && need[p.colorId] > 0) need[p.colorId] -= 1;
    });
    return Object.keys(need).filter((id) => need[id] > 0)
      .sort((a, b) => need[b] - need[a]);
  }

  function colorById(id) { return C.CARGO_COLORS.find((c) => c.id === id); }

  globalThis.GT_Cargo = { makePlan, makeQueue, missingColors, colorById };
})();
