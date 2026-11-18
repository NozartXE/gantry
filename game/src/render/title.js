// The title screen: the demo harbour alive behind, the wordmark filling the top, a quantified
// scope strip, a six-row rules digest with icons, and the way in — PLAY, three difficulties,
// the endless Night Shift, and the three side doors (how to play, options, almanac).
(function () {
  if (globalThis.GT_Title) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;
  const Icons = () => globalThis.GT_RuleIcons;

  const RULES = [
    ['drop', 'DROP boxes from the swinging hook'],
    ['match', 'Land on the plan colour: +100 x CHAIN'],
    ['list', 'Keep her level — HEAVY steel lists double'],
    ['orders', 'Harbour orders pay bonus: glass whole, decks dry'],
    ['hull', 'Splashes and slides cost HULL'],
    ['storm', 'Squall lines sweep in — ship 9 is the TYPHOON FREIGHTER'],
  ];

  function draw(ctx, view) {
    const save = view.save;
    view.buttons = {};
    // wordmark: one focal point, the whole top band
    L().panel(ctx, 120, 32, 1040, 128, P.accent);
    Fit().draw(ctx, 'GANTRY', 640, 84, C.TYPE.wordmark, P.ink, 'center', true);
    Fit().draw(ctx, 'SWING IT. DROP IT. STOW IT TRUE.', 640, 140, C.TYPE.m, P.ink, 'center', true);
    // quantified scope strip
    L().panel(ctx, 120, 176, 1040, 48, P.panel);
    Fit().draw(ctx, '5 CARGO COLOURS · 3 CARGO CLASSES · 9 SHIPS · 20 RIG CARDS · 12 FEATS · 6 TRIALS', 640, 201, C.TYPE.m, P.ink, 'center', true, 1000);

    // rules digest, left
    L().panel(ctx, 48, 288, 576, 336, P.panel);
    RULES.forEach((row, i) => {
      const y = 288 + 30 + i * 48;
      Icons().draw(ctx, row[0], 92, y, 34);
      Fit().draw(ctx, row[1], 128, y + 1, C.TYPE.m, P.ink, 'left', false, 470);
    });
    Fit().draw(ctx, 'WIN: LOAD ALL 9 SHIPS — LOSE: THE HULL GIVES OUT', 336, 606, C.TYPE.s, P.ink, 'center', true, 540);

    // the way in, right
    L().panel(ctx, 656, 288, 576, 336, P.panel);
    view.buttons.play = L().button(ctx, 688, 308, 512, 64, '▶  LOAD THE HARBOUR', { size: C.TYPE.xl, hover: view.hover === 'play' });
    Fit().draw(ctx, 'BEST ' + save.best + (save.bestGrade ? ' · GRADE ' + save.bestGrade : '') + ' · FEATS ' +
      Object.keys(save.feats).length + '/12', 944, 396, C.TYPE.m, P.ink, 'center', true);
    C.DIFFICULTIES.forEach((d, i) => {
      const x = 688 + i * 176;
      const sel = view.difficulty === d.id;
      view.buttons['diff' + i] = L().button(ctx, x, 416, 160, 52, d.name, {
        fill: sel ? P.accent : P.panel, size: C.TYPE.m, hover: view.hover === 'diff' + i,
      });
    });
    const endlessLabel = save.endlessUnlocked
      ? (view.endless ? 'NIGHT SHIFT: ON — ENDLESS' : 'NIGHT SHIFT: OFF')
      : 'NIGHT SHIFT: CLEAR THE HARBOUR TO UNLOCK';
    view.buttons.endless = L().button(ctx, 688, 480, 512, 44, endlessLabel, {
      fill: view.endless ? P.sky : P.panel, size: C.TYPE.s, hover: view.hover === 'endless',
    });
    const medals = Object.keys(save.trials || {}).length;
    view.buttons.trials = L().button(ctx, 688, 532, 512, 40,
      'SHIFT TRIALS — 6 DRILLS' + (medals ? ' · ' + medals + ' MEDALS WON' : ''), {
        size: C.TYPE.s, fill: P.panel, hover: view.hover === 'trials',
      });
    view.buttons.howto = L().button(ctx, 688, 580, 160, 36, 'HOW TO PLAY', { size: C.TYPE.s, hover: view.hover === 'howto' });
    view.buttons.options = L().button(ctx, 864, 580, 160, 36, 'OPTIONS', { size: C.TYPE.s, hover: view.hover === 'options' });
    view.buttons.almanac = L().button(ctx, 1040, 580, 160, 36, 'ALMANAC', { size: C.TYPE.s, hover: view.hover === 'almanac' });

    // controls footer
    ctx.fillStyle = P.ink;
    ctx.fillRect(0, 752, 1280, 48);
    Fit().draw(ctx, '◀ ▶ MOVE THE CRANE · SPACE DROP · T CALL THE TUG · 1 2 3 PICK A RIG · X REROLL · P PAUSE · M MUTE', 640, 777, C.TYPE.m, '#FFFFFF', 'center', true);
  }

  globalThis.GT_Title = { draw };
})();
