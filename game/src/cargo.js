// Cargo: builds each ship's cargo plan (the coloured grid the player must fill) and the queue
// of containers the crane will lift, shuffled from the plan plus a few spare boxes. Plans are
// dealt in the ship's archetype — dealt at random, row stripes, column bands, a two-colour
// checker with sprinkles, or strata weighted by depth — so each ship's puzzle reads
// differently on the deck before a single box is lifted.
(function () {
  if (globalThis.GT_Cargo) return;
  const C = globalThis.GT_Config;

  // A plan is rows x cols of colour ids. Colours are dealt so every colour in the ship's set
  // appears and no column is a single repeated colour more than twice in a row.
  function makePlan(ship, rng) {
    const total = ship.cols * ship.rows;
    const colorCount = ship.cols >= 7 ? 5 : ship.cols >= 5 ? 4 : 3;
    const ids = C.CARGO_COLORS.slice(0, colorCount).map((c) => c.id);
    const style = ship.planStyle || 'dealt';
    let grid;
    if (style === 'stripes') grid = planStripes(ship, ids, rng);
    else if (style === 'columns') grid = planColumns(ship, ids, rng);
    else if (style === 'checker') grid = planChecker(ship, ids, rng);
    else if (style === 'strata') grid = planStrata(ship, ids, rng);
    else grid = planDealt(ship, ids, rng);
    return { grid, total, colorCount };
  }

  function planDealt(ship, ids, rng) {
    const total = ship.cols * ship.rows;
    const cells = [];
    for (let i = 0; i < total; i++) cells.push(ids[i % ids.length]);
    const dealt = rng.shuffle(cells);
    const grid = [];
    for (let r = 0; r < ship.rows; r++) grid.push(dealt.slice(r * ship.cols, (r + 1) * ship.cols));
    return grid;
  }

  // Stripes: each row is one colour band; neighbouring rows never share a colour, and a few
  // cells defect to a neighbour's colour so the band is a tendency, not a stencil.
  function planStripes(ship, ids, rng) {
    const order = rng.shuffle(ids);
    const grid = [];
    for (let r = 0; r < ship.rows; r++) {
      const band = order[r % order.length];
      const row = [];
      for (let c = 0; c < ship.cols; c++) {
        row.push(rng.chance(0.14) ? rng.pick(ids) : band);
      }
      grid.push(row);
    }
    return grid;
  }

  // Columns: each column is one colour band — the mirror image of stripes, so the list puzzle
  // (which side is heavy with which colour) reads down the deck instead of across it.
  function planColumns(ship, ids, rng) {
    const order = rng.shuffle(ids);
    const grid = [];
    for (let r = 0; r < ship.rows; r++) {
      const row = [];
      for (let c = 0; c < ship.cols; c++) {
        row.push(rng.chance(0.14) ? rng.pick(ids) : order[c % order.length]);
      }
      grid.push(row);
    }
    return grid;
  }

  // Checker: two colours alternate across the whole deck; the rest of the set sprinkles in at
  // a quarter of the cells, breaking the pattern just enough to demand a second look.
  function planChecker(ship, ids, rng) {
    const pair = rng.shuffle(ids);
    const a = pair[0], b = pair[1];
    const rest = ids.filter((id) => id !== a && id !== b);
    const grid = [];
    for (let r = 0; r < ship.rows; r++) {
      const row = [];
      for (let c = 0; c < ship.cols; c++) {
        let id = (r + c) % 2 === 0 ? a : b;
        if (rest.length && rng.chance(0.25)) id = rng.pick(rest);
        row.push(id);
      }
      grid.push(row);
    }
    return grid;
  }

  // Strata: the deep rows favour the first colours of the set, the high rows the last — like
  // cargo loaded by weight, heavy intents at the bottom of the plan.
  function planStrata(ship, ids, rng) {
    const grid = [];
    for (let r = 0; r < ship.rows; r++) {
      const depth = ship.rows <= 1 ? 0 : r / (ship.rows - 1); // grid row 0 is the deck row
      const row = [];
      for (let c = 0; c < ship.cols; c++) {
        const t = Math.max(0, Math.min(0.999, depth + rng.range(-0.3, 0.3)));
        row.push(ids[Math.floor(t * ids.length)]);
      }
      grid.push(row);
    }
    return grid;
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
