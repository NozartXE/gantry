// Harbour orders: the harbourmaster's standing instructions for one ship, issued as she comes
// alongside and settled when she sails. Each ship carries one order (two from the second ship
// on), drawn from the kinds her cargo and weather make possible — stow so many of a colour
// true, keep the glass whole, keep her list down, beat the tide, earn her keep. An order is a
// second goal riding on every drop: it changes which box you want, where you put it and how
// much swing you dare. Completed orders pay a bonus at sailing; PRIORITY TAGS double it.
// Orders are generated from their own seeded stream, so a seed's order book never changes.
(function () {
  if (globalThis.GT_Orders) return;
  const C = globalThis.GT_Config;

  // Every kind knows how to build itself for a ship (or decline, returning null), and how to
  // describe its live state in one short line for the HUD strip.
  const KINDS = {
    truecount: {
      make(run, rng) {
        const counts = {};
        run.plan.grid.forEach((row) => row.forEach((id) => { counts[id] = (counts[id] || 0) + 1; }));
        const colour = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        const target = Math.max(3, Math.ceil(counts[colour] * 0.6));
        return { kind: 'truecount', colour, target, progress: 0, bonus: 300 };
      },
      line(o) { return 'STOW ' + o.target + ' ' + colourName(o.colour) + ' TRUE · ' + Math.min(o.progress, o.target) + '/' + o.target; },
    },
    chain: {
      make(run, rng) {
        const target = run.shipIndex >= 4 ? 5 : 4;
        return { kind: 'chain', target, progress: 0, bonus: 250 };
      },
      line(o) { return 'REACH CHAIN x' + o.target + ' · BEST ' + Math.min(o.progress, o.target) + '/' + o.target; },
    },
    dry: {
      make() { return { kind: 'dry', target: 0, progress: 0, bonus: 300 }; },
      line() { return 'NO SPLASH · NO SLIDE'; },
    },
    fast: {
      make(run) {
        const target = run.ship.cols >= 7 ? 45 : 30;
        return { kind: 'fast', target, progress: 0, bonus: 300 };
      },
      line(o) { return 'SAIL WITH ' + o.target + 's TO SPARE'; },
    },
    heavy: {
      make(run) {
        if (!run.ship.heavy) return null;
        return { kind: 'heavy', target: 3, progress: 0, bonus: 350 };
      },
      line(o) { return 'STOW ' + o.target + ' HEAVY TRUE · ' + Math.min(o.progress, o.target) + '/' + o.target; },
    },
    glass: {
      make(run) {
        if (!run.ship.fragile) return null;
        return { kind: 'glass', target: 0, progress: 0, bonus: 350 };
      },
      line() { return 'NO CRACKED GLASS'; },
    },
    centre: {
      make(run) {
        if (!run.ship.heavy) return null;
        return { kind: 'centre', target: 0, progress: 0, bonus: 300 };
      },
      line() { return 'HEAVY BOXES MIDSHIPS'; },
    },
    full: {
      make() { return { kind: 'full', target: 0, progress: 0, bonus: 400 }; },
      line() { return 'FILL EVERY CELL'; },
    },
    rich: {
      make(run) {
        const target = Math.round(run.plan.total * 55 / 50) * 50;
        return { kind: 'rich', target, progress: 0, bonus: 250 };
      },
      line(o) { return 'EARN ' + o.target + ' THIS SHIP · ' + Math.min(o.progress, o.target) + '/' + o.target; },
    },
    calm: {
      make() { return { kind: 'calm', target: 0, progress: 0, bonus: 300 }; },
      line() { return 'NEVER LIST PAST 0.6'; },
    },
  };

  function colourName(id) {
    const col = C.CARGO_COLORS.find((c) => c.id === id);
    return col ? col.name.split(' ').pop().toUpperCase() : String(id).toUpperCase();
  }

  // The order book for one ship: one order on the first ship, two afterwards, kinds never
  // repeated within a ship and weighted toward what this ship actually carries.
  function forShip(run, rng) {
    const want = run.shipIndex === 0 && !run.trial ? 1 : 2;
    const weights = [
      ['truecount', 3], ['chain', 2], ['rich', 2], ['dry', 2], ['fast', 2],
      ['full', 1], ['calm', 1], ['heavy', 3], ['glass', 3], ['centre', 2],
    ];
    const bag = [];
    for (const [kind, w] of weights) for (let i = 0; i < w; i++) bag.push(kind);
    const orders = [];
    const tried = new Set();
    let guard = 0;
    while (orders.length < want && guard < 40) {
      guard += 1;
      const kind = rng.pick(bag);
      if (tried.has(kind)) continue;
      tried.add(kind);
      const order = KINDS[kind].make(run, rng);
      if (order) { order.done = false; order.failed = false; orders.push(order); }
    }
    if (!orders.length) orders.push(Object.assign(KINDS.chain.make(run, rng), { done: false, failed: false }));
    return orders;
  }

  // Progress one kind of order. test, when given, gates the bump (e.g. only this colour).
  function bump(run, kind, amount, test) {
    for (const o of run.orders || []) {
      if (o.kind !== kind || o.done || o.failed) continue;
      if (test && !test(o)) continue;
      o.progress += amount || 1;
      if (o.target > 0 && o.progress >= o.target) o.done = true;
    }
  }

  // Fail one kind of order outright (a splash on a dry order, a crack on a glass order).
  function fail(run, kind) {
    for (const o of run.orders || []) {
      if (o.kind === kind && !o.done) o.failed = true;
    }
  }

  // Record a peak value (the best chain reached) rather than an increment.
  function peak(run, kind, value) {
    for (const o of run.orders || []) {
      if (o.kind !== kind || o.done || o.failed) continue;
      if (value > o.progress) o.progress = value;
      if (o.target > 0 && o.progress >= o.target) o.done = true;
    }
  }

  function anyLive(run, kind) {
    return (run.orders || []).some((o) => o.kind === kind && !o.done && !o.failed);
  }

  // Settle the book as the ship sails: time-and-fullness orders are judged here, counting
  // orders were judged as they filled. Returns {bonus, done} with the rig multiplier applied.
  function settle(run, cleared, bonusMul) {
    let bonus = 0, done = 0;
    for (const o of run.orders || []) {
      if (o.kind === 'fast' && !o.failed) o.done = cleared && run.timeLeft >= o.target;
      if (o.kind === 'full' && !o.failed) o.done = cleared && run.filledCount >= run.plan.total;
      if (o.kind === 'centre' && !o.failed) o.done = cleared && run.shipHeavyStowed > 0 && run.shipHeavyOff === 0;
      if (o.failed) o.done = false;
      if (o.done) { bonus += o.bonus; done += 1; }
    }
    return { bonus: Math.round(bonus * (bonusMul || 1)), done };
  }

  function line(o) {
    const base = KINDS[o.kind].line(o);
    if (o.failed) return base + ' ✗';
    if (o.done) return base + ' ✓';
    return base;
  }

  globalThis.GT_Orders = { forShip, bump, fail, peak, anyLive, settle, line, KINDS };
})();
