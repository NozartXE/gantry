// The results screen: the run's whole story on one plaque — grade, score, the ladder it
// climbed, stat tiles (ships, orders paid, best chain, true stows), the last three runs in
// one honest line, a per-ship table (true stows, time, orders, points for every ship), the
// rig it built, all twelve feats, and — for a trial — the medal it earned — with the loaded
// ship as hero art.
(function () {
  if (globalThis.GT_Results) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function draw(ctx, run, view) {
    view.buttons = {};
    const res = run.result;
    const save = view.save;
    const isTrial = !!res.trial;
    const cleared = res.result === 'CLEARED' || res.result === 'TRIAL CLEAR';
    const headline = isTrial
      ? (res.result === 'TRIAL CLEAR' ? 'TRIAL CLEAR' : 'TRIAL FAILED')
      : res.result === 'CLEARED' ? (res.endless ? 'THE NIGHT SHIFT GOES ON' : 'HARBOUR CLEARED') : res.result;
    const isBest = !isTrial && res.score >= save.best && res.score > 0;

    L().panel(ctx, 48, 40, 716, 720, P.panel);
    Fit().draw(ctx, headline, 88, 84, C.TYPE.xxl, cleared ? P.ink : P.danger, 'left', true, 560);
    if (isBest) {
      L().chip(ctx, 560, 58, 168, 44, P.accent);
      Fit().draw(ctx, 'NEW BEST', 644, 81, C.TYPE.m, P.ink, 'center', true);
    }
    if (isTrial && res.medal) {
      const fill = res.medal === 'GOLD' ? P.accent : res.medal === 'SILVER' ? '#C9D4DC' : '#D9A066';
      L().chip(ctx, 560, 58, 168, 44, fill);
      Fit().draw(ctx, res.medal + ' MEDAL', 644, 81, C.TYPE.m, P.ink, 'center', true);
    }
    // grade block + score
    L().chip(ctx, 88, 124, 120, 120, P.accent);
    Fit().draw(ctx, res.grade, 148, 186, 92, P.ink, 'center', true);
    Fit().draw(ctx, 'SCORE', 232, 146, C.TYPE.s, P.ink, 'left', true);
    Fit().draw(ctx, String(res.score), 232, 184, C.TYPE.huge, P.ink, 'left', true);
    const meta = (isTrial ? res.trialName + ' · ' : '') + res.difficulty + ' · SEED ' + res.seed + ' · TIME ' + fmtTime(run.elapsed);
    Fit().draw(ctx, meta, 232, 224, C.TYPE.s, P.ink, 'left', false, 490);

    // stat tiles
    const tiles = [
      ['SHIPS', res.shipsCleared + (res.endless ? '' : '/' + C.SHIPS.length)],
      ['ORDERS PAID', String(res.stats.ordersDone || 0)],
      ['BEST CHAIN', 'x' + res.bestChain],
      ['TRUE STOWS', String(res.stats.trueStows)],
    ];
    tiles.forEach((t, i) => {
      const x = 88 + i * 164;
      L().chip(ctx, x, 264, 148, 76, '#EFF6FA');
      Fit().draw(ctx, t[0], x + 74, 286, C.TYPE.s, P.ink, 'center', true);
      Fit().draw(ctx, t[1], x + 74, 318, C.TYPE.xl, P.ink, 'center', true);
    });

    // grade ladder with ticks
    const ladder = C.GRADES.map((g) => {
      const got = res.score >= g.min;
      return g.grade + ' ' + g.min + (got ? ' ✓' : ' ✗');
    }).join('    ');
    Fit().draw(ctx, ladder, 88, 368, C.TYPE.m, P.ink, 'left', true, 640);

    // last three runs, one line, losses named plainly
    const hist = save.history.length ? save.history : [{ score: res.score, grade: res.grade, result: res.result, ship: res.shipsCleared, difficulty: res.difficulty }];
    const histText = 'LAST 3: ' + hist.slice(0, 3).map((h) => h.score + ' ' + h.grade + ' ' + h.result).join('  ·  ');
    Fit().draw(ctx, histText, 88, 396, C.TYPE.s, P.ink, 'left', false, 640);

    // the per-ship table: every ship's true stows, time, orders and points
    Fit().draw(ctx, 'PER SHIP', 88, 428, C.TYPE.s, P.ink, 'left', true);
    Fit().draw(ctx, 'TRUE', 292, 428, C.TYPE.s, '#7A8B99', 'left', true);
    Fit().draw(ctx, 'TIME', 372, 428, C.TYPE.s, '#7A8B99', 'left', true);
    Fit().draw(ctx, 'ORDERS', 452, 428, C.TYPE.s, '#7A8B99', 'left', true);
    Fit().draw(ctx, 'POINTS', 724, 428, C.TYPE.s, '#7A8B99', 'right', true);
    (run.shipLog || []).slice(0, 9).forEach((row, i) => {
      const y = 452 + i * 19;
      Fit().draw(ctx, row.name, 88, y, C.TYPE.s, P.ink, 'left', true, 196);
      Fit().draw(ctx, row.true + '/' + row.total, 292, y, C.TYPE.s, P.ink, 'left', false);
      Fit().draw(ctx, fmtTime(row.time), 372, y, C.TYPE.s, P.ink, 'left', false);
      Fit().draw(ctx, row.orders, 452, y, C.TYPE.s, P.ink, 'left', false);
      Fit().draw(ctx, '+' + row.delta, 724, y, C.TYPE.s, P.ink, 'right', true);
    });

    // the build, wrapped to the plaque — never spilling onto the hero ship
    const rigNames = run.rigs.map((id) => globalThis.GT_Draft.rigById(id).name);
    Fit().draw(ctx, 'YOUR RIG — ' + res.rigsPicked + ' PICKED FROM ' + res.offersSeen + ' OFFERS', 88, 624, C.TYPE.s, P.ink, 'left', true);
    const rigText = rigNames.length ? rigNames.join(' · ') : 'NONE — THE HARBOUR RAN BARE';
    globalThis.GT_DraftScreen.wrap(ctx, rigText, C.TYPE.s, 640).slice(0, 2).forEach((line, li) => {
      Fit().draw(ctx, line, 88, 646 + li * 20, C.TYPE.s, P.ink, 'left', false, 640);
    });

    // feats: all twelve, two rows of chips, earned in gold
    C.FEATS.forEach((f, i) => {
      const earned = !!save.feats[f.id] || run.featsEarned.includes(f.id);
      const x = 88 + (i % 6) * 108;
      const y = 692 + Math.floor(i / 6) * 34;
      L().chip(ctx, x, y, 100, 28, earned ? P.accent : '#E4EBEF');
      Fit().draw(ctx, f.name.split(' ')[0], x + 50, y + 15, C.TYPE.s, earned ? P.ink : '#7A8B99', 'center', true, 92);
    });

    view.buttons.again = L().button(ctx, 816, 600, 416, 72, isTrial ? 'R — RETRY THE DRILL' : 'R — LOAD AGAIN', { size: C.TYPE.xl, hover: view.hover === 'again' });
    view.buttons.title = L().button(ctx, 816, 688, 416, 48, 'ESC — TITLE', { size: C.TYPE.m, fill: P.panel, hover: view.hover === 'title' });
  }

  globalThis.GT_Results = { draw };
})();
