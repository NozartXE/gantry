// The side doors from the title: OPTIONS (three sliders — music, effects, screen shake) and
// the ALMANAC (the fleet roster, the twelve rigs, the five cargo colours), drawn as overlays.
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
    L().panel(ctx, 90, 60, 1100, 680, P.panel);
    Fit().draw(ctx, 'ALMANAC', 640, 108, C.TYPE.xxl, P.ink, 'center', true);
    Fit().draw(ctx, 'THE FLEET', 130, 156, C.TYPE.l, P.ink, 'left', true);
    C.SHIPS.forEach((s, i) => {
      const y = 190 + i * 30;
      Fit().draw(ctx, (i + 1) + '. ' + s.name, 130, y, C.TYPE.m, s.boss ? P.danger : P.ink, 'left', true, 300);
      Fit().draw(ctx, s.cols + ' x ' + s.rows + ' — ' + s.note, 448, y, C.TYPE.s, P.ink, 'left', false, 400);
    });
    Fit().draw(ctx, 'THE RIGS', 130, 492, C.TYPE.l, P.ink, 'left', true);
    C.RIGS.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 130 + col * 520, y = 528 + row * 30;
      Fit().draw(ctx, r.name, x, y, C.TYPE.s, P.ink, 'left', true, 200);
      Fit().draw(ctx, r.text, x + 190, y, C.TYPE.s, P.ink, 'left', false, 330);
    });
    C.CARGO_COLORS.forEach((c, i) => {
      globalThis.GT_Containers.drawMini(ctx, 950 + (i % 3) * 76, 168 + Math.floor(i / 3) * 44, c.id, false);
    });
    Fit().draw(ctx, 'ESC — BACK', 640, 712, C.TYPE.m, P.ink, 'center', true);
  }

  globalThis.GT_Menus = { drawOptions, drawAlmanac };
})();
