// The rig draft: one decision fills the whole frame — three big cards with key hints, honest
// effect text and synergy notes, the next ship's real plan previewed beside its forecast, and
// the rig you already own along the bottom. No HUD, nothing else competing for the eye.
(function () {
  if (globalThis.GT_DraftScreen) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;

  function wrap(ctx, text, size, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const trial = line ? line + ' ' + w : w;
      if (Fit().width(ctx, trial, size, false) > maxWidth && line) { lines.push(line); line = w; }
      else line = trial;
    }
    if (line) lines.push(line);
    return lines;
  }

  const MONOGRAM = { magnet: 'MG', spreader: 'WS', counter: 'CW', winch: 'SW', trolley: 'FT', hull: '+3', grease: 'CG', charts: 'TC', scarer: 'GS', chains: 'HC', paint: 'BP', nets: 'SN', ballast: 'BA', manifest: 'CM', priority: 'PT', insure: 'HI', tug: 'HT', spotter: 'SP', reefer: 'RP', anchor: 'SA' };

  function draw(ctx, run, view) {
    view.buttons = {};
    const next = globalThis.GT_Ships.shipAt(run.shipIndex + 1, run.endless);
    const prev = run.ship;
    // heading
    L().panel(ctx, 190, 28, 900, 84, P.accent);
    Fit().draw(ctx, prev.name + ' LOADED — PICK 1 RIG', 640, 71, C.TYPE.xxl, P.ink, 'center', true, 860);
    Fit().draw(ctx, 'SCORE ' + run.score + ' · HULL ' + run.hull + '/' + run.hullMax + ' · CHAIN x' + Math.max(1, Math.min(run.chain, 8)), 640, 140, C.TYPE.m, P.ink, 'center', true);

    // three cards
    run.offers.forEach((rigId, i) => {
      const rig = globalThis.GT_Draft.rigById(rigId);
      const x = 64 + i * 400, y = 176, w = 352, h = 400;
      const hover = view.hover === 'card' + i;
      L().panel(ctx, x, y, w, h, hover ? '#FFF7DB' : P.panel);
      L().chip(ctx, x + 20, y + 20, 56, 56, P.accent);
      Fit().draw(ctx, String(i + 1), x + 48, y + 49, C.TYPE.xxl, P.ink, 'center', true);
      L().chip(ctx, x + w - 96, y + 20, 76, 56, P.sky);
      Fit().draw(ctx, MONOGRAM[rigId] || 'RG', x + w - 58, y + 49, C.TYPE.xl, P.ink, 'center', true);
      Fit().draw(ctx, rig.name, x + w / 2, y + 116, C.TYPE.xl, P.ink, 'center', true, w - 32);
      ctx.fillStyle = P.ink; ctx.fillRect(x + 24, y + 140, w - 48, 3);
      wrap(ctx, rig.text, C.TYPE.m, w - 48).forEach((line, li) => {
        Fit().draw(ctx, line, x + w / 2, y + 178 + li * 30, C.TYPE.m, P.ink, 'center', false, w - 40);
      });
      wrap(ctx, rig.synergy, C.TYPE.s, w - 48).forEach((line, li) => {
        Fit().draw(ctx, line, x + w / 2, y + 268 + li * 24, C.TYPE.s, '#42566A', 'center', false, w - 40);
      });
      Fit().draw(ctx, 'PRESS ' + (i + 1), x + w / 2, y + h - 36, C.TYPE.m, P.ink, 'center', true);
      view.buttons['card' + i] = { x, y, w, h };
    });

    // forecast strip: the next ship's real plan, miniaturised, beside its honest forecast
    L().panel(ctx, 64, 600, 1152, 112, P.panel);
    Fit().draw(ctx, 'NEXT: ' + (next ? next.name : '—'), 88, 632, C.TYPE.l, P.ink, 'left', true);
    Fit().draw(ctx, next ? globalThis.GT_Ships.forecastLine(prev, next) : '', 88, 668, C.TYPE.m, P.ink, 'left', false, 560);
    if (next) {
      const plan = globalThis.GT_Cargo.makePlan(next, globalThis.GT_Rng.makeStream('gantry-plan-' + run.seed + '-' + (run.shipIndex + 1)));
      const mw = 26, mh = 15;
      const gx = 1216 - next.cols * (mw + 3), gy = 656 - (next.rows * (mh + 3)) / 2;
      for (let r = 0; r < next.rows; r++) for (let c = 0; c < next.cols; c++) {
        const col = globalThis.GT_Cargo.colorById(plan.grid[next.rows - 1 - r][c]);
        ctx.fillStyle = col.fill;
        ctx.fillRect(gx + c * (mw + 3), gy + r * (mh + 3), mw, mh);
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink;
        ctx.strokeRect(gx + c * (mw + 3), gy + r * (mh + 3), mw, mh);
      }
    }
    // owned rigs + reroll, on their own strip so nothing beneath competes with them
    L().panel(ctx, 64, 724, 1152, 64, P.panel);
    const ownedText = run.rigs.length ? 'YOUR RIG: ' + run.rigs.map((id) => globalThis.GT_Draft.rigById(id).name).join(' · ') : 'YOUR RIG: NONE YET';
    Fit().draw(ctx, ownedText, 88, 757, C.TYPE.m, P.ink, 'left', true, 800);
    view.buttons.reroll = L().button(ctx, 916, 732, 276, 48, 'X — REROLL · ' + C.SCORE.rerollCost + ' PTS', {
      size: C.TYPE.s, fill: run.score >= C.SCORE.rerollCost ? P.panel : '#C9D4DC', hover: view.hover === 'reroll',
    });
  }

  globalThis.GT_DraftScreen = { draw, wrap };
})();
