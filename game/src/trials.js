// Shift trials: six one-ship drills offered from the title screen, for the player who wants
// the storm without the whole harbour. A trial is a single ship under a named pressure —
// heavy steel, fragile glass, a squall sky, a short tide, the Freighter herself — scored on
// its own medal ladder (BRONZE / SILVER / GOLD by the ship's points). Trials run through the
// same sim as the harbour: same crane, same orders, same hull. Medals are kept in the save.
(function () {
  if (globalThis.GT_Trials) return;
  const C = globalThis.GT_Config;

  function byId(id) { return C.TRIALS.find((t) => t.id === id) || null; }

  // The ship a trial sails: the roster ship, with any forced cargo traits laid over her.
  function shipFor(trial) {
    const base = C.SHIPS[trial.ship];
    const ship = Object.assign({}, base);
    if (trial.force) {
      if (trial.force.heavy) ship.heavy = true;
      if (trial.force.fragile) ship.fragile = true;
      if (trial.force.squall) ship.squall = true;
    }
    if (trial.timeMul) ship.time = Math.round(base.time * trial.timeMul);
    return ship;
  }

  // Medal for a finished trial's score: 'GOLD' / 'SILVER' / 'BRONZE' / null (sailed, no medal).
  function medalFor(trial, score) {
    if (score >= trial.medals[2]) return 'GOLD';
    if (score >= trial.medals[1]) return 'SILVER';
    if (score >= trial.medals[0]) return 'BRONZE';
    return null;
  }

  const MEDAL_RANK = { BRONZE: 1, SILVER: 2, GOLD: 3 };

  function betterMedal(kept, earned) {
    if (!earned) return kept || null;
    if (!kept) return earned;
    return MEDAL_RANK[earned] > MEDAL_RANK[kept] ? earned : kept;
  }

  // Begin a trial run: a normal run whose only ship is the trial's, with the trial's own
  // hull. The sim reads run.trial at sailing time and ends the run there.
  function begin(trialId, seed) {
    const trial = byId(trialId);
    if (!trial) return null;
    return globalThis.GT_Sim.createRun(seed, trial.difficulty, false, trial);
  }

  globalThis.GT_Trials = { byId, shipFor, medalFor, betterMedal, begin, MEDAL_RANK };
})();
