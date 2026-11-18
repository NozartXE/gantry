// The rig draft: between ships the harbour offers 1 of 3 rig cards from the pool of twenty.
// Owned one-off rigs leave the pool; consumables (SPARE PLATES, TIDE CHARTS) can return.
// Rerolling costs score, so the draft is a real decision, not a formality.
(function () {
  if (globalThis.GT_Draft) return;
  const C = globalThis.GT_Config;
  const REPEATABLE = { hull: true, charts: true };

  function poolFor(owned) {
    return C.RIGS.filter((r) => REPEATABLE[r.id] || !owned.includes(r.id));
  }

  function offers(rng, owned) {
    const pool = poolFor(owned);
    const picks = rng.shuffle(pool).slice(0, 3);
    while (picks.length < 3 && pool.length) picks.push(pool[picks.length % pool.length]);
    return picks.map((r) => r.id);
  }

  function rigById(id) { return C.RIGS.find((r) => r.id === id); }

  // The aggregate effect of the owned rigs, read by the crane, stack and sim each tick.
  function effects(owned) {
    const has = (id) => owned.includes(id);
    return {
      swingCalm: (has('magnet') ? 1.4 : 1) * (has('winch') ? 1.3 : 1),
      windShield: has('chains') ? 0.5 : 1,
      trolleySpeed: (has('trolley') ? 1.35 : 1) * (has('winch') ? 0.75 : 1),
      wideSpreader: has('spreader'),
      listTolerance: has('counter') ? 1.5 : 1,
      listDamp: has('ballast') ? 0.7 : 1,
      timeBonus: has('charts') ? 30 : 0,
      timeScoreMul: has('trolley') ? 2 : 1,
      grease: has('grease'),
      scarer: has('scarer'),
      paint: has('paint'),
      nets: has('nets'),
      manifest: has('manifest') ? 5 : 3,
      orderMul: has('priority') ? 2 : 1,
      insurePay: has('insure') ? 150 : 0,
      tug: has('tug'),
      spotter: has('spotter'),
      reefer: has('reefer'),
      anchor: has('anchor'),
    };
  }

  globalThis.GT_Draft = { offers, rigById, effects, REPEATABLE };
})();
