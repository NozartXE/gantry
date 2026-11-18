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

  function drawBottomBar(ctx, run) {
    ctx.fillStyle = P.panel;
    ctx.fillRect(0, 724, 1280, 76);
    ctx.fillStyle = P.ink;
    ctx.fillRect(0, 724, 1280, 3);
    // next boxes
    Fit().draw(ctx, 'NEXT', 24, 762, C.TYPE.m, P.ink, 'left', true);
    for (let i = 0; i < 3; i++) {
      const item = run.queue[run.queuePos + 1 + i];
      if (!item) break;
      globalThis.GT_Containers.drawMini(ctx, 128 + i * 76, 762, item.colorId, item.wild);
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
    // stow count + ship name
    Fit().draw(ctx, 'STOWED ' + run.filledCount + '/' + run.plan.total, 748, 750, C.TYPE.m, P.ink, 'left', true);
    Fit().draw(ctx, run.ship.name, 748, 780, C.TYPE.s, P.ink, 'left', false);
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
    drawBottomBar(ctx, run);
  }

  globalThis.GT_Hud = { draw, drawGuide };
})();
