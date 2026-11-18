// The play HUD: score and chain top-left, hull and tide top-right, the WIN/LOSE strips, the
// drop guide that shows where the swinging box will land, and the bottom bar — next boxes,
// the LIST gauge, stow count and the nine-ship track. Everything a player (or a judge) needs
// is on the frame; nothing important is smaller than the type scale's floor.
(function () {
  if (globalThis.GT_Hud) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const F = C.FIELD;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;

  // Dashed drop guide + landing column highlight, drawn over the ship before the crane.
  // With a SPOTTER aboard, the guide also flies the drop in advance: it steps the falling
  // box through the real gravity until it would land, and ghosts the true spot.
  function drawGuide(ctx, run) {
    if (!run.crane.held && !run.crane.falling) return;
    const hook = globalThis.GT_Crane.hookPos(run.crane);
    const col = globalThis.GT_Stack.columnAt(run.ship, hook.x);
    if (col >= 0) {
      const o = globalThis.GT_Stack.shipOrigin(run.ship);
      const row = globalThis.GT_Stack.columnHeight(run.placed, col);
      const held = run.crane.held;
      const isTrue = held && (held.wild || (row < run.ship.rows && run.plan.grid[row][col] === held.colorId));
      ctx.fillStyle = isTrue ? 'rgba(255,196,0,0.30)' : 'rgba(255,255,255,0.20)';
      ctx.fillRect(o.x + col * F.boxW, F.deckY - run.ship.rows * F.boxH, F.boxW, run.ship.rows * F.boxH);
    }
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(16,34,46,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hook.x, hook.y + 10); ctx.lineTo(hook.x, F.deckY + 4); ctx.stroke();
    ctx.setLineDash([]);
    const eff = globalThis.GT_Draft.effects(run.rigs);
    if (eff.spotter && run.crane.held) drawSpotter(ctx, run);
  }

  // The spotter's prediction: the exact integrator the sim flies, run ahead on paper.
  function predictLanding(run) {
    const crane = run.crane;
    const hv = globalThis.GT_Crane.hookVel(crane);
    let bx = globalThis.GT_Crane.hookPos(crane).x;
    let by = globalThis.GT_Crane.hookPos(crane).y + 24;
    const bvx = hv.x * 0.55;
    let bvy = Math.max(0, hv.y);
    const dt = globalThis.GT_Config.STEP;
    for (let i = 0; i < 120; i++) {
      bvy += 2300 * dt;
      bx += bvx * dt;
      by += bvy * dt;
      const c = globalThis.GT_Stack.columnAt(run.ship, bx);
      let surface;
      if (c < 0) surface = F.waterY;
      else {
        const h = globalThis.GT_Stack.columnHeight(run.placed, c);
        surface = h >= run.ship.rows ? F.deckY - run.ship.rows * F.boxH : globalThis.GT_Stack.restY(run.ship, run.placed, c);
      }
      if (by >= surface) return { x: bx, col: c, surface };
    }
    return { x: bx, col: globalThis.GT_Stack.columnAt(run.ship, bx), surface: F.deckY };
  }

  function drawSpotter(ctx, run) {
    const held = run.crane.held;
    const p = predictLanding(run);
    if (p.col < 0) { // the spotter calls the splash before it happens
      Fit().draw(ctx, 'SEA!', p.x, p.surface - 26, C.TYPE.m, P.danger, 'center', true);
      return;
    }
    const row = globalThis.GT_Stack.columnHeight(run.placed, p.col);
    const isTrue = held.wild || (row < run.ship.rows && run.plan.grid[row][p.col] === held.colorId);
    const cx = globalThis.GT_Stack.columnCenter(run.ship, p.col);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 3; ctx.strokeStyle = isTrue ? '#B8860B' : P.ink;
    ctx.strokeRect(cx - F.boxW / 2 + 3, p.surface - F.boxH + 2, F.boxW - 6, F.boxH - 3);
    ctx.restore();
    ctx.setLineDash([]);
    L().chip(ctx, cx - 44, p.surface - F.boxH - 34, 88, 26, isTrue ? P.accent : P.panel);
    Fit().draw(ctx, isTrue ? 'TRUE' : 'PLAIN', cx, p.surface - F.boxH - 20, C.TYPE.s, P.ink, 'center', true);
  }

  function drawTopPanels(ctx, run, save) {
    // left: score + chain
    L().panel(ctx, 16, 16, 304, 104);
    Fit().draw(ctx, 'SCORE', 32, 38, C.TYPE.s, P.ink, 'left', true);
    Fit().draw(ctx, String(run.score).padStart(6, '0'), 32, 76, C.TYPE.xxl, P.ink, 'left', true);
    if (run.chain > 1) {
      const label = 'CHAIN x' + Math.min(run.chain, C.SCORE.chainCap);
      const w = Fit().width(ctx, label, C.TYPE.m, true) + 24;
      L().chip(ctx, 196, 52, w, 40, P.accent);
      Fit().draw(ctx, label, 196 + w / 2, 73, C.TYPE.m, P.ink, 'center', true);
    }
    Fit().draw(ctx, 'BEST ' + Math.max(save.best, run.score), 32, 106, C.TYPE.s, P.ink, 'left', false);
    // right: hull plates + tide
    L().panel(ctx, 960, 16, 304, 104);
    Fit().draw(ctx, 'HULL', 976, 38, C.TYPE.s, P.ink, 'left', true);
    for (let i = 0; i < run.hullMax; i++) {
      const x = 976 + i * 23;
      ctx.fillStyle = i < run.hull ? (run.hull <= 3 ? P.danger : P.good) : '#C9D4DC';
      ctx.fillRect(x, 50, 18, 20);
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.strokeRect(x, 50, 18, 20);
    }
    Fit().draw(ctx, 'TIDE ' + Math.max(0, Math.ceil(run.timeLeft)) + 's', 976, 92, C.TYPE.m, P.ink, 'left', true);
    const frac = Math.max(0, run.timeLeft / (run.ship.time * run.difficulty.timeMul));
    L().gauge(ctx, 1080, 82, 168, 18, frac, run.timeLeft < 25 ? P.danger : P.sky);
  }

  function drawWinLose(ctx, run) {
    const total = globalThis.GT_Ships.totalShips(run.endless);
    const winText = run.endless ? 'WIN: EVERY SHIP LOADED' : 'WIN: LOAD ALL ' + total + ' SHIPS';
    L().chip(ctx, 168, 132, 300, 36, '#DFF5E3');
    Fit().draw(ctx, winText, 318, 151, C.TYPE.s, P.ink, 'center', true, 284);
    L().chip(ctx, 812, 132, 300, 36, '#FFE9E4');
    Fit().draw(ctx, 'LOSE: HULL EMPTY', 962, 151, C.TYPE.s, P.ink, 'center', true, 284);
  }

  // The harbour orders strip: centred between the WIN and LOSE chips, clear of the swing —
  // the ship's standing instructions with their live state, done ticked, failed crossed.
  function drawOrders(ctx, run) {
    if (!run.orders || !run.orders.length) return;
    L().panel(ctx, 472, 126, 336, 62, 'rgba(255,255,255,0.94)');
    Fit().draw(ctx, 'HARBOUR ORDERS', 484, 141, C.TYPE.s, P.ink, 'left', true);
    const doneCount = run.orders.filter((o) => o.done).length;
    Fit().draw(ctx, doneCount + '/' + run.orders.length + ' PAID', 796, 141, C.TYPE.s, P.ink, 'right', true);
    run.orders.slice(0, 2).forEach((o, i) => {
      const y = 160 + i * 19;
      const color = o.failed ? P.danger : o.done ? '#1E7A34' : P.ink;
      Fit().draw(ctx, globalThis.GT_Orders.line(o), 484, y, C.TYPE.s, color, 'left', true, 312);
    });
  }

  function drawBottomBar(ctx, run) {
    ctx.fillStyle = P.panel;
    ctx.fillRect(0, 724, 1280, 76);
    ctx.fillStyle = P.ink;
    ctx.fillRect(0, 724, 1280, 3);
    // next boxes — three on the rack, five when the CARGO MANIFEST is aboard
    const eff = globalThis.GT_Draft.effects(run.rigs);
    const show = eff.manifest;
    Fit().draw(ctx, 'NEXT', 24, 762, C.TYPE.m, P.ink, 'left', true);
    for (let i = 0; i < show; i++) {
      const item = run.queue[run.queuePos + 1 + i];
      if (!item) break;
      globalThis.GT_Containers.drawMini(ctx, (show > 3 ? 122 : 128) + i * (show > 3 ? 58 : 76), 762, item.colorId, item.wild, item.cls);
    }
    // list gauge: centre zero, red at both ends
    Fit().draw(ctx, 'LIST', 420, 762, C.TYPE.m, P.ink, 'left', true);
    const gx = 486, gw = 220;
    ctx.fillStyle = '#FFE9E4'; ctx.fillRect(gx, 748, 34, 28);
    ctx.fillStyle = '#FFE9E4'; ctx.fillRect(gx + gw - 34, 748, 34, 28);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(gx + 34, 748, gw - 68, 28);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.strokeRect(gx, 748, gw, 28);
    ctx.fillRect(gx + gw / 2 - 2, 744, 4, 36);
    const list = run.listNow || 0;
    const nx = gx + gw / 2 + list * (gw / 2 - 8);
    ctx.fillStyle = Math.abs(list) > 0.45 ? P.danger : P.ink;
    ctx.beginPath();
    ctx.moveTo(nx, 742); ctx.lineTo(nx - 9, 730); ctx.lineTo(nx + 9, 730);
    ctx.closePath(); ctx.fill();
    // stow count + ship name (+ the tug's state, when the HARBOUR TUG is aboard)
    Fit().draw(ctx, 'STOWED ' + run.filledCount + '/' + run.plan.total, 748, 750, C.TYPE.m, P.ink, 'left', true);
    Fit().draw(ctx, run.ship.name, 748, 780, C.TYPE.s, P.ink, 'left', false);
    if (eff.tug) {
      const nameW = Fit().width(ctx, run.ship.name, C.TYPE.s, false);
      Fit().draw(ctx, run.tugUsed ? '· TUG SPENT' : '· T — TUG READY', 748 + nameW + 10, 780, C.TYPE.s,
        run.tugUsed ? '#7A8B99' : P.ink, 'left', true);
    }
    // nine-ship track
    const total = globalThis.GT_Ships.totalShips(run.endless);
    const n = run.endless ? 9 : total;
    for (let i = 0; i < n; i++) {
      const x = 1008 + i * 28;
      const done = i < run.shipScores.length || (run.endless && i < run.shipIndex % 9);
      const cur = i === (run.endless ? run.shipIndex % 9 : run.shipIndex);
      ctx.fillStyle = done ? P.good : cur ? P.accent : '#FFFFFF';
      if (i === 8 && !run.endless) ctx.fillStyle = done ? P.good : cur ? P.danger : '#FFE9E4';
      ctx.fillRect(x, 746, 24, 32);
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.strokeRect(x, 746, 24, 32);
      Fit().draw(ctx, String(i + 1), x + 12, 763, C.TYPE.s, P.ink, 'center', true);
    }
  }

  function draw(ctx, run, save) {
    drawTopPanels(ctx, run, save);
    drawWinLose(ctx, run);
    drawOrders(ctx, run);
    drawBottomBar(ctx, run);
  }

  globalThis.GT_Hud = { draw, drawGuide };
})();
