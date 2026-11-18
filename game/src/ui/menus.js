// The side doors from the title: OPTIONS (three sliders — music, effects, screen shake),
// the ALMANAC (the fleet roster, the twenty rigs, the cargo classes and the order book) and
// the SHIFT TRIALS board (six one-ship drills with their medal ladders), drawn as overlays.
(function () {
  if (globalThis.GT_Menus) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;

  function drawOptions(ctx, view) {
    ctx.fillStyle = 'rgba(16,34,46,0.55)';
    ctx.fillRect(0, 0, 1280, 800);
    L().panel(ctx, 340, 170, 600, 460, P.panel);
    Fit().draw(ctx, 'OPTIONS', 640, 222, C.TYPE.xxl, P.ink, 'center', true);
    view.buttons = {};
    const rows = [['music', 'MUSIC'], ['sfx', 'EFFECTS'], ['shake', 'SHAKE']];
    rows.forEach((row, i) => {
      const y = 300 + i * 88;
      Fit().draw(ctx, row[1], 420, y, C.TYPE.l, P.ink, 'left', true);
      const val = view.save.settings[row[0]];
      L().gauge(ctx, 420, y + 24, 440, 24, val, P.accent);
      view.buttons['opt-' + row[0] + '-down'] = L().button(ctx, 884, y - 6, 44, 44, '−', { size: C.TYPE.l });
      view.buttons['opt-' + row[0] + '-up'] = L().button(ctx, 884, y + 46, 44, 44, '+', { size: C.TYPE.l });
      Fit().draw(ctx, Math.round(val * 100) + '%', 640, y + 72, C.TYPE.s, P.ink, 'center', true);
    });
    Fit().draw(ctx, 'ESC — BACK', 640, 592, C.TYPE.m, P.ink, 'center', true);
  }

  function drawAlmanac(ctx, view) {
    ctx.fillStyle = 'rgba(16,34,46,0.55)';
    ctx.fillRect(0, 0, 1280, 800);
    L().panel(ctx, 60, 50, 1160, 700, P.panel);
    Fit().draw(ctx, 'ALMANAC', 640, 96, C.TYPE.xxl, P.ink, 'center', true);
    // left column: the fleet, then what the boxes themselves can be
    Fit().draw(ctx, 'THE FLEET', 100, 140, C.TYPE.l, P.ink, 'left', true);
    C.SHIPS.forEach((s, i) => {
      const y = 168 + i * 25;
      Fit().draw(ctx, (i + 1) + '. ' + s.name, 100, y, C.TYPE.m, s.boss ? P.danger : P.ink, 'left', true, 190);
      Fit().draw(ctx, s.cols + 'x' + s.rows + ' — ' + s.note, 296, y, C.TYPE.s, P.ink, 'left', false, 300);
    });
    Fit().draw(ctx, 'CARGO CLASSES', 100, 424, C.TYPE.l, P.ink, 'left', true);
    const classes = [
      ['PLAIN', 'the standard box — one list weight'],
      ['HEAVY', 'steel — double list weight, +50 stowed true'],
      ['GLASS', 'fragile — cracks on a hard drop, never true'],
    ];
    classes.forEach((row, i) => {
      const y = 452 + i * 25;
      Fit().draw(ctx, row[0], 100, y, C.TYPE.m, P.ink, 'left', true, 90);
      Fit().draw(ctx, row[1], 196, y, C.TYPE.s, P.ink, 'left', false, 400);
    });
    Fit().draw(ctx, 'HARBOUR ORDERS', 100, 552, C.TYPE.l, P.ink, 'left', true);
    Fit().draw(ctx, 'Bonus jobs ride every ship: stow a colour true, keep the', 100, 580, C.TYPE.s, P.ink, 'left', false, 500);
    Fit().draw(ctx, 'glass whole, keep her list down, sail fast, fill every cell.', 100, 604, C.TYPE.s, P.ink, 'left', false, 500);
    Fit().draw(ctx, 'Paid at sailing — PRIORITY TAGS double the pay.', 100, 628, C.TYPE.s, P.ink, 'left', false, 500);
    C.CARGO_COLORS.forEach((c, i) => {
      globalThis.GT_Containers.drawMini(ctx, 132 + i * 76, 686, c.id, false);
    });
    // right column: all twenty rigs, one line each
    Fit().draw(ctx, 'THE RIGS — 20', 640, 140, C.TYPE.l, P.ink, 'left', true);
    C.RIGS.forEach((r, i) => {
      const y = 168 + i * 25;
      Fit().draw(ctx, r.name, 640, y, C.TYPE.s, P.ink, 'left', true, 168);
      Fit().draw(ctx, r.text, 814, y, C.TYPE.s, P.ink, 'left', false, 372);
    });
    Fit().draw(ctx, 'ESC — BACK', 640, 728, C.TYPE.m, P.ink, 'center', true);
  }

  // The trials board: six drills, each with its ship, its pressure and its medal ladder;
  // medals already won show as chips in the harbour's colours.
  function drawTrials(ctx, view) {
    ctx.fillStyle = 'rgba(16,34,46,0.55)';
    ctx.fillRect(0, 0, 1280, 800);
    L().panel(ctx, 190, 70, 900, 660, P.panel);
    Fit().draw(ctx, 'SHIFT TRIALS', 640, 122, C.TYPE.xxl, P.ink, 'center', true);
    Fit().draw(ctx, 'ONE SHIP · ONE PRESSURE · MEDALS FOR THE SHIP’S POINTS', 640, 158, C.TYPE.s, P.ink, 'center', true);
    view.buttons = {};
    C.TRIALS.forEach((t, i) => {
      const y = 196 + i * 72;
      const medal = (view.save.trials || {})[t.id];
      const hover = view.hover === 'trial' + i;
      L().chip(ctx, 230, y - 26, 820, 58, hover ? '#FFF7DB' : '#EFF6FA');
      Fit().draw(ctx, String(i + 1), 262, y + 4, C.TYPE.xl, P.ink, 'center', true);
      Fit().draw(ctx, t.name, 292, y - 6, C.TYPE.l, P.ink, 'left', true, 300);
      Fit().draw(ctx, t.goal, 292, y + 20, C.TYPE.s, P.ink, 'left', false, 430);
      Fit().draw(ctx, 'B ' + t.medals[0] + ' · S ' + t.medals[1] + ' · G ' + t.medals[2], 1050, y - 6, C.TYPE.s, P.ink, 'right', true);
      if (medal) {
        const fill = medal === 'GOLD' ? P.accent : medal === 'SILVER' ? '#C9D4DC' : '#D9A066';
        L().chip(ctx, 950, y + 8, 100, 24, fill);
        Fit().draw(ctx, medal, 1000, y + 21, C.TYPE.s, P.ink, 'center', true);
      }
      view.buttons['trial' + i] = { x: 230, y: y - 26, w: 820, h: 58 };
    });
    Fit().draw(ctx, 'PRESS 1–6 OR CLICK A DRILL · ESC — BACK', 640, 692, C.TYPE.m, P.ink, 'center', true);
  }

  globalThis.GT_Menus = { drawOptions, drawAlmanac, drawTrials };
})();
