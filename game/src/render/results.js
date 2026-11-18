// The results screen: the run's whole story on one plaque — grade, score, the ladder it
// climbed, stat tiles, the last three runs with their losses in red, the rig it built, the
// feats it holds, the next goal, and a per-ship graph — with the loaded ship as hero art.
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
    const headline = res.result === 'CLEARED' ? (res.endless ? 'THE NIGHT SHIFT GOES ON' : 'HARBOUR CLEARED') : res.result;
    const isBest = res.score >= save.best && res.score > 0;

    L().panel(ctx, 48, 40, 716, 720, P.panel);
    Fit().draw(ctx, headline, 88, 84, C.TYPE.xxl, res.result === 'CLEARED' ? P.ink : P.danger, 'left', true, 560);
    if (isBest) {
      L().chip(ctx, 560, 58, 168, 44, P.accent);
      Fit().draw(ctx, 'NEW BEST', 644, 81, C.TYPE.m, P.ink, 'center', true);
    }
    // grade block + score
    L().chip(ctx, 88, 124, 120, 120, P.accent);
    Fit().draw(ctx, res.grade, 148, 186, 92, P.ink, 'center', true);
    Fit().draw(ctx, 'SCORE', 232, 146, C.TYPE.s, P.ink, 'left', true);
    Fit().draw(ctx, String(res.score), 232, 184, C.TYPE.huge, P.ink, 'left', true);
    Fit().draw(ctx, res.difficulty + ' · SEED ' + res.seed + ' · TIME ' + fmtTime(run.elapsed), 232, 224, C.TYPE.s, P.ink, 'left', false);

    // stat tiles
    const tiles = [
      ['SHIPS', res.shipsCleared + (res.endless ? '' : '/' + C.SHIPS.length)],
      ['BEST CHAIN', 'x' + res.bestChain],
      ['TRUE STOWS', String(res.stats.trueStows)],
      ['SPLASHES', String(res.stats.splashes + res.stats.slides)],
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
    Fit().draw(ctx, ladder, 88, 372, C.TYPE.m, P.ink, 'left', true, 640);

    // last three runs, losses in red
    Fit().draw(ctx, 'LAST 3 RUNS', 88, 408, C.TYPE.s, P.ink, 'left', true);
    const hist = save.history.length ? save.history : [{ score: res.score, grade: res.grade, result: res.result, ship: res.shipsCleared, difficulty: res.difficulty }];
    hist.slice(0, 3).forEach((hst, i) => {
      const y = 436 + i * 36;
      const ok = hst.result === 'CLEARED';
      L().chip(ctx, 88, y - 14, 128, 28, ok ? '#DFF5E3' : '#FFE9E4');
      Fit().draw(ctx, hst.result, 152, y + 1, C.TYPE.s, ok ? P.ink : P.danger, 'center', true, 120);
      Fit().draw(ctx, hst.score + ' pts · grade ' + hst.grade + ' · ship ' + hst.ship + ' · ' + hst.difficulty, 232, y + 1, C.TYPE.s, P.ink, 'left', false);
    });

    // the build, wrapped to the plaque — never spilling onto the hero ship
    const rigNames = run.rigs.map((id) => globalThis.GT_Draft.rigById(id).name);
    Fit().draw(ctx, 'YOUR RIG — ' + res.rigsPicked + ' PICKED FROM ' + res.offersSeen + ' OFFERS', 88, 548, C.TYPE.s, P.ink, 'left', true);
    const rigText = rigNames.length ? rigNames.join(' · ') : 'NONE — THE HARBOUR RAN BARE';
    globalThis.GT_DraftScreen.wrap(ctx, rigText, C.TYPE.s, 640).slice(0, 2).forEach((line, li) => {
      Fit().draw(ctx, line, 88, 574 + li * 24, C.TYPE.s, P.ink, 'left', false, 640);
    });

    // feats row
    C.FEATS.forEach((f, i) => {
      const earned = !!save.feats[f.id] || run.featsEarned.includes(f.id);
      const x = 88 + i * 108;
      L().chip(ctx, x, 628, 100, 36, earned ? P.accent : '#E4EBEF');
      Fit().draw(ctx, f.name.split(' ')[0], x + 50, 647, C.TYPE.s, earned ? P.ink : '#7A8B99', 'center', true, 92);
    });
    const nextFeat = C.FEATS.find((f) => !save.feats[f.id] && !run.featsEarned.includes(f.id));
    let goalText = nextFeat ? 'NEXT GOAL: ' + nextFeat.name + ' — ' + nextFeat.text : 'NEXT GOAL: BEAT ' + save.best + ' ON TYPHOON';
    if (goalText.length > 52) goalText = goalText.slice(0, goalText.lastIndexOf(' ', 52)) + '…';
    Fit().draw(ctx, goalText, 88, 692, C.TYPE.s, P.ink, 'left', true, 420);

    // per-ship graph along the plaque's bottom-right, clear of the next-goal line
    const scores = run.shipScores;
    if (scores.length > 1) {
      Fit().draw(ctx, 'PER SHIP', 520, 692, C.TYPE.s, P.ink, 'left', true);
      const deltas = scores.map((s, i) => s - (i ? scores[i - 1] : 0));
      const max = Math.max.apply(null, deltas.concat([1]));
      deltas.forEach((d, i) => {
        const bh = Math.max(4, (d / max) * 36);
        const x = 520 + i * 26;
        ctx.fillStyle = P.sky;
        ctx.fillRect(x, 744 - bh, 20, bh);
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.strokeRect(x, 744 - bh, 20, bh);
      });
    }

    view.buttons.again = L().button(ctx, 816, 600, 416, 72, 'R — LOAD AGAIN', { size: C.TYPE.xl, hover: view.hover === 'again' });
    view.buttons.title = L().button(ctx, 816, 688, 416, 48, 'ESC — TITLE', { size: C.TYPE.m, fill: P.panel, hover: view.hover === 'title' });
  }

  globalThis.GT_Results = { draw };
})();
