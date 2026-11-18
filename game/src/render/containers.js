// Containers: every box in the game is drawn here — flat cargo colour, corrugation ribs, an
// ink rim, and a big stencilled glyph letter plus serial, so a box reads at thumbnail scale
// and its colour is never the only signal. The BONUS PAINT wild box wears all five stripes.
(function () {
  if (globalThis.GT_Containers) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const F = C.FIELD;

  function drawBox(ctx, cx, cy, w, h, colorId, serial, wild) {
    const x = cx - w / 2, y = cy - h / 2;
    const col = globalThis.GT_Cargo.colorById(colorId) || C.CARGO_COLORS[0];
    ctx.fillStyle = col.fill;
    ctx.fillRect(x, y, w, h);
    // corrugation ribs: vertical shades every 11 px, and a darker foot band
    ctx.fillStyle = col.dark;
    for (let rx = x + 9; rx < x + w - 4; rx += 11) ctx.fillRect(rx, y + 3, 3, h - 6);
    ctx.fillRect(x, y + h - 7, w, 4);
    if (wild) {
      const stripeW = w / C.CARGO_COLORS.length;
      C.CARGO_COLORS.forEach((c, i) => { ctx.fillStyle = c.fill; ctx.fillRect(x + i * stripeW, y, stripeW, 8); });
    }
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(x, y, w, h);
    // the stencil: glyph letter big and white, serial small at the foot
    ctx.font = '900 ' + Math.round(h * 0.62) + 'px ' + C.DISPLAY_FONT;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(wild ? '★' : col.glyph, cx, cy + 1);
    if (serial != null && w >= 60) {
      ctx.font = '600 12px ' + C.TEXT_FONT;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'right';
      ctx.fillText(String(serial), x + w - 5, y + h - 9);
    }
  }

  // All boxes resting on the ship, inside the ship's rock transform set up by the board.
  function drawPlaced(ctx, run) {
    for (const p of run.placed) {
      const cx = globalThis.GT_Stack.columnCenter(run.ship, p.col);
      const cy = F.deckY - p.row * F.boxH - F.boxH / 2;
      drawBox(ctx, cx, cy, F.boxW - 4, F.boxH - 3, p.colorId, p.serial, p.wild);
    }
  }

  // Mini boxes for the queue rack and draft/results strips.
  function drawMini(ctx, cx, cy, colorId, wild) {
    drawBox(ctx, cx, cy, 62, 28, colorId, null, wild);
  }

  globalThis.GT_Containers = { drawBox, drawPlaced, drawMini };
})();
