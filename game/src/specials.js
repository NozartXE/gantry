// Cargo classes: beyond its colour, a box can be HEAVY or FRAGILE, and the class changes how
// the crane must treat it. HEAVY boxes are steel-banded: they count double on the ship's list
// and pay a bonus stowed true, so they belong near the centreline. FRAGILE boxes are glass:
// if the crane lets go while the swing is still hard, the box cracks on landing — it fills its
// cell but never counts true and pays nothing. Calm hands keep glass whole. Classes are dealt
// from the run's own stream when a ship's traits call for them, so a seed's cargo never moves.
(function () {
  if (globalThis.GT_Specials) return;

  const HEAVY_SHARE = 0.24;    // of the queue, on ships that carry steel
  const FRAGILE_SHARE = 0.20;  // of the queue, on ships that carry glass
  const HARD_ANGLE = 0.17;     // radians of swing at release that endanger glass
  const HARD_DRIFT = 235;      // px/s of sideways hook speed at release that endanger glass

  // Deal classes onto a freshly built queue. The wild BONUS PAINT box is chosen afterwards by
  // the sim and always stays standard — paint over steel or glass would hide the stencil.
  function assign(ship, queue, rng) {
    if (!ship.heavy && !ship.fragile) return queue;
    const eligible = queue.filter((b) => !b.wild);
    for (const box of eligible) {
      const roll = rng.next();
      if (ship.heavy && roll < HEAVY_SHARE) box.cls = 'heavy';
      else if (ship.fragile && roll < HEAVY_SHARE + FRAGILE_SHARE) box.cls = 'fragile';
    }
    // Guarantee the trait is real on the ship that introduces it: at least two of each class
    // the ship carries, taken from plain boxes at the queue's tail so the opening lifts vary.
    ensure(ship, queue, rng, 'heavy');
    ensure(ship, queue, rng, 'fragile');
    return queue;
  }

  function ensure(ship, queue, rng, cls) {
    if (cls === 'heavy' && !ship.heavy) return;
    if (cls === 'fragile' && !ship.fragile) return;
    let have = queue.filter((b) => b.cls === cls).length;
    for (let i = queue.length - 1; i >= 0 && have < 2; i--) {
      if (!queue[i].cls && !queue[i].wild) { queue[i].cls = cls; have += 1; }
    }
  }

  function classOf(box) { return (box && box.cls) || 'std'; }
  function isHeavy(box) { return classOf(box) === 'heavy'; }
  function isFragile(box) { return classOf(box) === 'fragile'; }

  // The list weight a box exerts once it rests on the ship: steel counts double.
  function weightOf(box) { return isHeavy(box) ? 2 : 1; }

  // Was this release a hard one? Judged at the moment of letting go, from the pendulum's own
  // state — the same numbers the player watches on the swing.
  function hardDrop(angle, hookVx) {
    return Math.abs(angle) > HARD_ANGLE || Math.abs(hookVx) > HARD_DRIFT;
  }

  // Short stencil word the HUD and almanac use for a class.
  function label(cls) {
    if (cls === 'heavy') return 'HEAVY';
    if (cls === 'fragile') return 'GLASS';
    return 'PLAIN';
  }

  globalThis.GT_Specials = {
    assign, classOf, isHeavy, isFragile, weightOf, hardDrop, label,
    HEAVY_SHARE, FRAGILE_SHARE, HARD_ANGLE, HARD_DRIFT,
  };
})();
