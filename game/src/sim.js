// The run: one seeded play-through of the harbour — nine ships (or the endless Night Shift),
// the score/chain/hull economy, the draft between ships, and every event the renderer and the
// sound board consume. DOM-free: input arrives as a plain control object, so headless bots
// play the exact same game the browser does.
(function () {
  if (globalThis.GT_Sim) return;
  const C = globalThis.GT_Config;
  const F = C.FIELD;

  function createRun(seed, difficultyId, endless, trialDef) {
    const difficulty = C.DIFFICULTIES.find((d) => d.id === difficultyId) || C.DIFFICULTIES[1];
    const run = {
      screen: 'play',
      seed: String(seed),
      rng: globalThis.GT_Rng.makeStream('gantry-run-' + seed),
      weather: globalThis.GT_Rng.makeStream('gantry-weather-' + seed),
      difficulty, endless: !!endless,
      trial: trialDef || null, medal: null,
      shipIndex: 0, ship: null, plan: null, filled: null, filledCount: 0, trueCount: 0,
      queue: [], queuePos: 0, placed: [],
      crane: globalThis.GT_Crane.create(),
      hazards: null,
      score: 0, chain: 0, bestChain: 0,
      hull: trialDef ? trialDef.hull : difficulty.hull,
      hullMax: trialDef ? trialDef.hull : difficulty.hull,
      timeLeft: 0, elapsed: 0, shipTime: 0,
      rigs: [], offers: [], offersSeen: 0, rigsPicked: 0,
      shipScores: [], shipLog: [], events: [], banner: null, bannerT: 0,
      stats: { drops: 0, trueStows: 0, splashes: 0, slides: 0, ordersDone: 0, heavyStows: 0, glassStows: 0, squallStows: 0 },
      shipSplashes: 0, shipSlides: 0, netsUsed: false,
      orders: [], shipOrdersDone: 0, shipStartScore: 0,
      shipHeavyStowed: 0, shipHeavyOff: 0, cleanStreak: 0,
      tugUsed: false, trim: 0,
      featsEarned: [], result: null, listWarnT: 0, over: false,
    };
    if (trialDef) startShip(run, trialDef.ship, globalThis.GT_Trials.shipFor(trialDef));
    else startShip(run, 0);
    return run;
  }

  function fx(run, ev) { run.events.push(ev); }
  function announce(run, title, sub, ttl) {
    run.banner = { title, sub: sub || '', ttl: ttl || 2.6 };
    run.bannerT = ttl || 2.6;
  }

  function startShip(run, index, shipOverride) {
    run.shipIndex = index;
    run.ship = shipOverride || globalThis.GT_Ships.shipAt(index, run.endless);
    // The plan comes from its own per-ship stream, so the draft screen's forecast preview can
    // reproduce this exact grid before the ship arrives — the forecast never lies.
    run.plan = globalThis.GT_Cargo.makePlan(run.ship,
      globalThis.GT_Rng.makeStream('gantry-plan-' + run.seed + '-' + index));
    run.filled = run.plan.grid.map((row) => row.map(() => null));
    run.filledCount = 0; run.trueCount = 0;
    run.placed = [];
    run.queue = globalThis.GT_Cargo.makeQueue(run.plan, run.rng, 4);
    const eff = globalThis.GT_Draft.effects(run.rigs);
    if (eff.paint) {
      const spare = run.queue[run.queue.length - 1];
      spare.wild = true; // BONUS PAINT: one box counts true wherever it lands
    }
    // Cargo classes ride on the queue the ship's traits demand, dealt from the run stream.
    globalThis.GT_Specials.assign(run.ship, run.queue, run.rng);
    run.queuePos = 0;
    run.crane = globalThis.GT_Crane.create();
    run.crane.held = run.queue[0] || null;
    run.hazards = globalThis.GT_Hazards.create(run.ship, run.difficulty, run.weather);
    run.timeLeft = run.ship.time * run.difficulty.timeMul + eff.timeBonus;
    run.shipTime = 0;
    run.shipSplashes = 0; run.shipSlides = 0; run.netsUsed = false;
    // The harbourmaster's orders for this ship, from their own stream so they never shift.
    run.orders = globalThis.GT_Orders.forShip(run,
      globalThis.GT_Rng.makeStream('gantry-orders-' + run.seed + '-' + index));
    run.shipOrdersDone = 0; run.shipStartScore = run.score;
    run.shipHeavyStowed = 0; run.shipHeavyOff = 0;
    run.tugUsed = false; run.trim = 0;
    run.screen = 'play';
    announce(run,
      run.trial ? 'TRIAL · ' + run.trial.name : 'SHIP ' + (index + 1) + ' · ' + run.ship.name,
      globalThis.GT_Ships.shiftOf(index) + ' — ' + run.ship.note.toUpperCase(), 3.0);
    fx(run, { type: 'sound', name: 'draft' });
  }

  function gradeFor(score) {
    for (const g of C.GRADES) if (score >= g.min) return g.grade;
    return 'D';
  }

  function endRun(run, result) {
    run.over = true;
    run.screen = 'results';
    const grade = gradeFor(run.score);
    if (run.trial) run.medal = result === 'TRIAL CLEAR' ? globalThis.GT_Trials.medalFor(run.trial, run.score) : null;
    run.result = {
      result, grade, score: run.score,
      shipsCleared: run.shipScores.length,
      rigsPicked: run.rigsPicked, offersSeen: run.offersSeen,
      bestChain: run.bestChain, stats: Object.assign({}, run.stats),
      difficulty: run.difficulty.name, seed: run.seed, endless: run.endless,
      trial: run.trial ? run.trial.id : null,
      trialName: run.trial ? run.trial.name : null,
      medal: run.medal,
    };
    if (result === 'CLEARED' && !run.featsEarned.includes('harbour') && !run.endless) run.featsEarned.push('harbour');
  }

  function earnFeat(run, id) {
    if (!run.featsEarned.includes(id)) {
      run.featsEarned.push(id);
      const feat = C.FEATS.find((f) => f.id === id);
      announce(run, 'FEAT: ' + feat.name, feat.text.toUpperCase(), 2.4);
    }
  }

  function damageHull(run, amount, x, y) {
    run.hull -= amount;
    fx(run, { type: 'floater', x, y, text: 'HULL -' + amount, kind: 'bad' });
    fx(run, { type: 'sound', name: 'alarm' });
    // HULL INSURANCE turns damage into a smaller consolation: the loss still hurts, less.
    const eff = globalThis.GT_Draft.effects(run.rigs);
    if (eff.insurePay && amount > 0) {
      const pay = eff.insurePay * amount;
      run.score += pay;
      fx(run, { type: 'floater', x, y: y - 44, text: '+' + pay + ' INSURED', kind: 'good' });
      fx(run, { type: 'sound', name: 'insure' });
    }
    if (run.hull <= 0) { run.hull = 0; endRun(run, 'HULL LOST'); }
  }

  function splash(run, x, why) {
    run.stats.splashes += 1; run.shipSplashes += 1;
    globalThis.GT_Orders.fail(run, 'dry');
    fx(run, { type: 'splash', x, y: F.waterY });
    fx(run, { type: 'sound', name: 'splash' });
    const eff = globalThis.GT_Draft.effects(run.rigs);
    if (why === 'drop' && eff.nets && !run.netsUsed) {
      run.netsUsed = true;
      fx(run, { type: 'floater', x, y: F.waterY - 64, text: 'NETS CAUGHT IT', kind: 'good' });
      return;
    }
    damageHull(run, 1, x, F.waterY - 64);
  }

  function resolveLanding(run) {
    const box = run.crane.falling;
    run.crane.falling = null;
    run.stats.drops += 1;
    const ship = run.ship;
    const eff = globalThis.GT_Draft.effects(run.rigs);
    const col = globalThis.GT_Stack.columnAt(ship, box.x);
    if (col < 0) { splash(run, box.x, 'drop'); advanceQueue(run); return; }
    const row = globalThis.GT_Stack.columnHeight(run.placed, col);
    if (row >= ship.rows) { // the stack is full: the box topples off the pile into the sea
      fx(run, { type: 'floater', x: box.x, y: F.deckY - ship.rows * F.boxH - 32, text: 'TOPPLED!', kind: 'bad' });
      splash(run, globalThis.GT_Stack.columnCenter(ship, col) + (col < ship.cols / 2 ? -70 : 70), 'drop');
      advanceQueue(run); return;
    }
    const want = run.plan.grid[row][col];
    // Glass judges the release, not the landing: a hard swing at let-go cracks it, and a
    // cracked box fills its cell but never counts true. REEFER PLUGS keep glass whole.
    const cracked = box.cls === 'fragile' && box.hard && !eff.reefer;
    const isTrue = !cracked && (box.wild || want === box.colorId);
    run.placed.push({
      col, row, colorId: box.colorId, serial: box.serial, wild: !!box.wild,
      cls: box.cls || 'std', cracked, weight: globalThis.GT_Specials.weightOf(box),
    });
    run.filled[row][col] = box.colorId;
    run.filledCount += 1;
    const cx = globalThis.GT_Stack.columnCenter(ship, col);
    const cy = F.deckY - row * F.boxH - 48;
    if (box.cls === 'heavy') {
      const mid = (ship.cols - 1) / 2;
      if (Math.abs(col - mid) > Math.max(1, (ship.cols - 1) / 4)) run.shipHeavyOff += 1;
      else run.shipHeavyStowed += 1;
    }
    if (cracked) {
      fx(run, { type: 'floater', x: cx, y: cy, text: 'CRACKED!', kind: 'bad' });
      fx(run, { type: 'shards', x: cx, y: cy + 20, n: 12 });
      fx(run, { type: 'sound', name: 'crack' });
      globalThis.GT_Orders.fail(run, 'glass');
      if (!eff.grease) run.chain = 0;
    } else if (isTrue) {
      run.trueCount += 1;
      run.stats.trueStows += 1;
      const mult = Math.min(run.chain + 1, C.SCORE.chainCap);
      run.chain += 1;
      run.bestChain = Math.max(run.bestChain, mult);
      let pts = C.SCORE.trueStow * mult;
      if (box.cls === 'heavy') pts += C.SCORE.heavyTrueBonus;
      run.score += pts;
      fx(run, { type: 'floater', x: cx, y: cy, text: '+' + pts + (mult > 1 ? ' CHAIN x' + mult : ''), kind: 'good' });
      fx(run, { type: 'sparks', x: cx, y: cy + 24, n: 10 });
      fx(run, { type: 'sound', name: 'chain', arg: mult });
      if (!run.featsEarned.includes('first')) earnFeat(run, 'first');
      if (mult >= C.SCORE.chainCap) earnFeat(run, 'chain8');
      globalThis.GT_Orders.bump(run, 'truecount', 1, (o) => o.colour === box.colorId);
      globalThis.GT_Orders.bump(run, 'rich', pts);
      if (box.cls === 'heavy') {
        run.stats.heavyStows += 1;
        globalThis.GT_Orders.bump(run, 'heavy');
        if (run.stats.heavyStows >= 12) earnFeat(run, 'heavy');
      }
      if (box.cls === 'fragile') {
        run.stats.glassStows += 1;
        if (run.stats.glassStows >= 8) earnFeat(run, 'glass');
      }
      if (run.hazards && globalThis.GT_Hazards.squallAt(run.hazards, cx) > 0.4) {
        run.stats.squallStows += 1;
        earnFeat(run, 'squall');
        fx(run, { type: 'floater', x: cx, y: cy - 44, text: 'IN THE SQUALL!', kind: 'good' });
      }
    } else {
      run.score += C.SCORE.plainStow;
      globalThis.GT_Orders.bump(run, 'rich', C.SCORE.plainStow);
      fx(run, { type: 'floater', x: cx, y: cy, text: '+' + C.SCORE.plainStow, kind: 'plain' });
      fx(run, { type: 'sound', name: 'clank', arg: col });
      if (!eff.grease) run.chain = 0;
    }
    globalThis.GT_Orders.peak(run, 'chain', run.chain);
    checkSlide(run);
    if (!run.over && run.filledCount >= run.plan.total) clearShip(run);
    advanceQueue(run);
  }

  function advanceQueue(run) {
    run.queuePos += 1;
    run.crane.held = run.queue[run.queuePos] || null;
    if (!run.crane.held && !run.crane.falling && run.filledCount < run.plan.total) {
      run.timeLeft = Math.min(run.timeLeft, 5); // no boxes left: the ship sails within seconds
      announce(run, 'NO BOXES LEFT', 'THE SHIP SAILS SHORT', 2.2);
    }
  }

  // The list the ship actually feels: BALLAST PUMPS damp the raw list, and a HARBOUR TUG
  // call banks a trim offset against it. Slides, warnings, orders and the gauge all read this.
  function effectiveList(run, eff) {
    const raw = globalThis.GT_Stack.listValue(run.placed, run.ship);
    const v = raw * eff.listDamp + (run.trim || 0);
    return Math.max(-1, Math.min(1, v));
  }

  function checkSlide(run) {
    const eff = globalThis.GT_Draft.effects(run.rigs);
    const anchored = eff.anchor;
    const threshold = 0.62 * eff.listTolerance * globalThis.GT_Hazards.listSqueeze(run.hazards, anchored);
    const list = effectiveList(run, eff);
    const victim = globalThis.GT_Stack.slideCandidate(run.placed, run.ship, list, threshold);
    if (!victim) return;
    run.placed = run.placed.filter((p) => p !== victim);
    if (run.filled[victim.row][victim.col] === victim.colorId) {
      run.filled[victim.row][victim.col] = null;
      run.filledCount -= 1;
      if ((run.plan.grid[victim.row][victim.col] === victim.colorId || victim.wild) && !victim.cracked) run.trueCount -= 1;
    }
    run.stats.slides += 1; run.shipSlides += 1;
    const cx = globalThis.GT_Stack.columnCenter(run.ship, victim.col);
    fx(run, { type: 'floater', x: cx, y: F.deckY - victim.row * F.boxH - 48, text: 'IT SLID OFF!', kind: 'bad' });
    fx(run, { type: 'sound', name: 'slide' });
    splash(run, cx + (list > 0 ? 90 : -90), 'slide');
  }

  // Settle the order book as a ship sails and write her line into the run's log — shared by
  // the full clear and the sailed-short path so the results table never misses a ship.
  function settleAndLog(run, cleared) {
    const eff = globalThis.GT_Draft.effects(run.rigs);
    const settled = globalThis.GT_Orders.settle(run, cleared, eff.orderMul);
    if (settled.bonus > 0) run.score += settled.bonus;
    run.stats.ordersDone += settled.done;
    run.shipOrdersDone = settled.done;
    if (run.stats.ordersDone >= 6) earnFeat(run, 'orders');
    run.shipLog.push({
      name: run.ship.name, true: run.trueCount, total: run.plan.total,
      time: Math.round(run.shipTime), orders: settled.done + '/' + run.orders.length,
      delta: 0, // filled by the caller once every bonus is in
    });
    return settled;
  }

  function clearShip(run) {
    const eff = globalThis.GT_Draft.effects(run.rigs);
    const settled = settleAndLog(run, true);
    const timeBonus = Math.round(run.timeLeft) * C.SCORE.shipClearPerSecond * eff.timeScoreMul;
    let bonus = timeBonus + settled.bonus;
    const perfect = run.trueCount >= run.plan.total;
    if (perfect) { bonus += C.SCORE.perfectShip; earnFeat(run, 'perfect'); }
    if (run.shipSplashes === 0 && run.shipSlides === 0) {
      earnFeat(run, 'dry');
      run.cleanStreak += 1;
      if (run.cleanStreak >= 3) earnFeat(run, 'streak');
    } else run.cleanStreak = 0;
    if (run.timeLeft >= 60) earnFeat(run, 'fast');
    if (run.ship.boss) earnFeat(run, 'storm');
    run.score += timeBonus + (perfect ? C.SCORE.perfectShip : 0);
    run.shipLog[run.shipLog.length - 1].delta = run.score - run.shipStartScore;
    run.shipScores.push(run.score);
    fx(run, { type: 'confetti', x: 640, y: 300, n: 42 });
    if (settled.done > 0) fx(run, { type: 'sound', name: 'order' });
    announce(run, run.ship.name + ' LOADED',
      '+' + bonus + (perfect ? ' · PERFECT SHIP' : ' TIME BONUS') + (settled.done ? ' · ' + settled.done + ' ORDER' + (settled.done > 1 ? 'S' : '') + ' PAID' : ''), 3.0);
    if (run.trial) { endRun(run, 'TRIAL CLEAR'); return; }
    const isLast = !run.endless && run.shipIndex >= C.SHIPS.length - 1;
    if (isLast) { endRun(run, 'CLEARED'); return; }
    run.screen = 'draft';
    run.offers = globalThis.GT_Draft.offers(run.rng, run.rigs);
    run.offersSeen += run.offers.length;
  }

  function pickRig(run, rigId) {
    if (run.screen !== 'draft' || !run.offers.includes(rigId)) return false;
    if (rigId === 'hull') run.hull = Math.min(run.hullMax + 3, run.hull + 3);
    if (!globalThis.GT_Draft.REPEATABLE[rigId]) run.rigs.push(rigId);
    else if (!run.rigs.includes(rigId)) run.rigs.push(rigId);
    run.rigsPicked += 1;
    fx(run, { type: 'sound', name: 'draft' });
    startShip(run, run.shipIndex + 1);
    return true;
  }

  function reroll(run) {
    if (run.screen !== 'draft' || run.score < C.SCORE.rerollCost) return false;
    run.score -= C.SCORE.rerollCost;
    run.offers = globalThis.GT_Draft.offers(run.rng, run.rigs);
    run.offersSeen += run.offers.length;
    return true;
  }

  // ctrl: {accel: -1..1, drop: bool}
  function update(run, dt, ctrl) {
    if (run.bannerT > 0) run.bannerT -= dt;
    if (run.over) return;
    run.elapsed += dt;

    if (run.screen === 'play') {
      run.shipTime += dt;
      run.timeLeft -= dt;
      if (run.timeLeft <= 0) {
        const frac = run.filledCount / run.plan.total;
        if (run.trial) {
          // A trial is one ship: loaded or not, the drill ends here.
          if (frac >= 0.7) {
            settleAndLog(run, false);
            run.shipLog[run.shipLog.length - 1].delta = run.score - run.shipStartScore;
            run.shipScores.push(run.score);
          }
          endRun(run, 'TRIAL FAILED');
        } else if (frac >= 0.7) { // sailed short but substantially loaded: counts, without honours
          settleAndLog(run, false);
          run.shipLog[run.shipLog.length - 1].delta = run.score - run.shipStartScore;
          run.shipScores.push(run.score);
          run.cleanStreak = 0;
          announce(run, run.ship.name + ' SAILED SHORT', Math.round(frac * 100) + '% LOADED — IT COUNTS', 2.6);
          const isLast = !run.endless && run.shipIndex >= C.SHIPS.length - 1;
          if (isLast) { endRun(run, 'CLEARED'); return; }
          run.screen = 'draft';
          run.offers = globalThis.GT_Draft.offers(run.rng, run.rigs);
          run.offersSeen += run.offers.length;
        } else {
          endRun(run, 'SAILED SHORT');
        }
        return;
      }

      const eff = globalThis.GT_Draft.effects(run.rigs);
      const hook = globalThis.GT_Crane.hookPos(run.crane);
      const hzEvents = globalThis.GT_Hazards.update(run.hazards, dt, hook.x);
      for (const ev of hzEvents) {
        if (ev.type === 'gust-incoming') {
          announce(run, ev.dir > 0 ? 'GUST FROM THE WEST' : 'GUST FROM THE EAST', 'HOLD YOUR DROP', 2.2);
          fx(run, { type: 'sound', name: 'gust' });
        } else if (ev.type === 'squall-incoming') {
          announce(run, 'SQUALL LINE INBOUND', ev.dir > 0 ? 'RAIN SWEEPING IN FROM THE WEST' : 'RAIN SWEEPING IN FROM THE EAST', 2.6);
          fx(run, { type: 'sound', name: 'gust' });
        } else if (ev.type === 'squall-start') {
          fx(run, { type: 'sound', name: 'gust' });
        } else if (ev.type === 'gull-nudge' && !eff.scarer) {
          run.crane.angVel += ev.dir * 0.55;
          fx(run, { type: 'floater', x: hook.x, y: hook.y - 40, text: 'GULLS!', kind: 'bad' });
        }
      }

      globalThis.GT_Crane.update(run.crane, dt, ctrl.accel, run.hazards.windNow, eff);
      if (ctrl.drop) globalThis.GT_Crane.drop(run.crane);
      // The HARBOUR TUG: one call per ship — she hauls the ship level against her current
      // list and the trim holds for whatever is stowed afterwards.
      if (ctrl.tug && eff.tug && !run.tugUsed) {
        run.tugUsed = true;
        run.trim = -(globalThis.GT_Stack.listValue(run.placed, run.ship) * eff.listDamp);
        fx(run, { type: 'floater', x: 640, y: F.waterY - 130, text: 'TUG HAULED HER LEVEL', kind: 'good' });
        fx(run, { type: 'sound', name: 'tug' });
      }

      if (run.crane.falling) {
        const b = run.crane.falling;
        const col = globalThis.GT_Stack.columnAt(run.ship, b.x);
        let surface;
        if (col < 0) surface = F.waterY;
        else {
          const h = globalThis.GT_Stack.columnHeight(run.placed, col);
          surface = h >= run.ship.rows ? F.deckY - run.ship.rows * F.boxH : globalThis.GT_Stack.restY(run.ship, run.placed, col);
        }
        if (b.y >= surface) { b.y = surface; resolveLanding(run); }
      }

      const list = effectiveList(run, eff);
      if (Math.abs(list) > 0.62) globalThis.GT_Orders.fail(run, 'calm');
      run.listWarnT -= dt;
      if (Math.abs(list) > 0.45 && run.listWarnT <= 0) {
        run.listWarnT = 5;
        announce(run, 'LISTING ' + (list > 0 ? 'STARBOARD' : 'PORT') + '!', 'EVEN THE LOAD BEFORE SHE SLIDES', 2.0);
        fx(run, { type: 'sound', name: 'alarm' });
      }
      run.listNow = list;
    }
  }

  globalThis.GT_Sim = { createRun, update, pickRig, reroll, gradeFor, startShip };
})();
