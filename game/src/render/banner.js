// The event banner: one announcement at a time, centred under the beam — ship arrivals, gust
// warnings, list warnings, feats. Big display type for the headline, one line of sub-text.
(function () {
  if (globalThis.GT_Banner) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;

  function draw(ctx, run) {
    if (!run.banner || run.bannerT <= 0) return;
    const b = run.banner;
    const w = 640, h = b.sub ? 92 : 64;
    const x = 640 - w / 2, y = 188;
    const danger = /GUST|LISTING|HULL|SAILS/.test(b.title);
    ctx.globalAlpha = Math.min(1, run.bannerT / 0.3);
    globalThis.GT_Layout.panel(ctx, x, y, w, h, danger ? '#FFE9E4' : P.panel);
    globalThis.GT_Fit.draw(ctx, b.title, 640, y + (b.sub ? 30 : h / 2), C.TYPE.xl,
      danger ? P.danger : P.ink, 'center', true, w - 32);
    if (b.sub) globalThis.GT_Fit.draw(ctx, b.sub, 640, y + 66, C.TYPE.s, P.ink, 'center', false, w - 32);
    ctx.globalAlpha = 1;
  }

  globalThis.GT_Banner = { draw };
})();
