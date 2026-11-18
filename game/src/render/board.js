// The port itself: sky band, distant quay with yard stacks, the sea with seeded sparkle, and
// sea with seeded sparkle, and the ship — hull, name, and the cargo-plan slots glowing with
// the colour each cell wants. Decoration comes from a visual-only stream, precomputed once,
// so it is identical on every run and never touches the game's randomness.
(function () {
  if (globalThis.GT_Board) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const F = C.FIELD;

  // --- precomputed decoration (deterministic) ------------------------------------------------
  const decor = (() => {
    const rng = globalThis.GT_Rng.makeStream('gantry-decor');
    const sparkles = [];
    for (let i = 0; i < 260; i++) sparkles.push({ x: rng.range(0, 1280), y: rng.range(636, 792), p: rng.range(0, 6.28), s: rng.range(2, 5) });
    const clouds = [];
    for (let i = 0; i < 7; i++) clouds.push({ x: rng.range(30, 1180), y: rng.range(120, 300), w: rng.range(90, 190) });
    const yard = [];
    let yx = 856;
    while (yx < 1240) { const w = rng.int(2, 3); yard.push({ x: yx, cols: w, rows: rng.int(1, 3), seed: rng.int(0, 4) }); yx += w * 46 + 18; }
    const whitecaps = [];
    for (let i = 0; i < 26; i++) whitecaps.push({ x: rng.range(0, 1280), p: rng.range(0, 6.28) });
    return { sparkles, clouds, yard, whitecaps };
  })();

  function drawSky(ctx, run, storm) {
    ctx.fillStyle = storm ? '#2E6DA8' : P.sky;
    ctx.fillRect(0, 0, 1280, 448);
    ctx.fillStyle = P.skyLow;
    ctx.fillRect(0, 448, 1280, 26);
    // flat cloud shapes, one language: squared puffs
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (const cl of decor.clouds) {
      const drift = ((run.elapsed * 3 + cl.x) % 1420) - 70;
      ctx.fillRect(drift, cl.y, cl.w, 22);
      ctx.fillRect(drift + 18, cl.y - 14, cl.w * 0.55, 14);
    }
    if (storm) { // rain streaks, seeded and steady
      ctx.strokeStyle = 'rgba(234,251,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const rx = ((i * 173 + Math.floor(run.elapsed * 260)) % 1320) - 20;
        const ry = ((i * 97 + Math.floor(run.elapsed * 420)) % 470);
        ctx.moveTo(rx, ry); ctx.lineTo(rx - 6, ry + 22);
      }
      ctx.stroke();
    }
    if (run.hazards && run.hazards.squall) { // a squall overhead greys the whole sky down
      ctx.fillStyle = 'rgba(46,80,110,0.22)';
      ctx.fillRect(0, 0, 1280, 474);
    }
  }

  function drawQuay(ctx) {
    ctx.fillStyle = P.quayDark;
    ctx.fillRect(0, 474, 1280, 30);                        // distant quay band
    ctx.fillStyle = P.quay;
    ctx.fillRect(0, 474, 1280, 8);
    // yard stacks on the far quay: little coloured piles, the port at work
    for (const y of decor.yard) {
      for (let cx = 0; cx < y.cols; cx++) for (let ry = 0; ry < y.rows; ry++) {
        const col = C.CARGO_COLORS[(y.seed + cx + ry) % C.CARGO_COLORS.length];
        ctx.fillStyle = col.fill;
        ctx.fillRect(y.x + cx * 46, 474 - (ry + 1) * 20, 42, 18);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.strokeRect(y.x + cx * 46, 474 - (ry + 1) * 20, 42, 18);
      }
    }
  }

  function drawSea(ctx, run, storm) {
    ctx.fillStyle = P.sea;
    ctx.fillRect(0, 504, 1280, 296);
    ctx.fillStyle = P.seaDark;
    ctx.fillRect(0, 504, 1280, 10);
    ctx.fillStyle = P.foam;
    for (const s of decor.sparkles) {
      const a = 0.25 + 0.55 * Math.abs(Math.sin(run.elapsed * 1.4 + s.p));
      ctx.globalAlpha = a;
      ctx.fillRect(s.x, s.y, s.s * 2.2, 2);
    }
    ctx.globalAlpha = 1;
    // whitecap arcs rolling under the hull line
    ctx.strokeStyle = 'rgba(234,251,255,0.65)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (const wcap of decor.whitecaps) {
      const wy = 640 + Math.sin(run.elapsed * 1.8 + wcap.p) * 4;
      ctx.moveTo(wcap.x, wy);
      ctx.quadraticCurveTo(wcap.x + 14, wy - 8, wcap.x + 28, wy);
    }
    ctx.stroke();
    if (storm) { ctx.fillStyle = 'rgba(10,90,99,0.25)'; ctx.fillRect(0, 504, 1280, 296); }
  }

  // The ship and its plan. Drawn inside a rock transform around the waterline centre.
  // opts.hideName skips the hull name (the results screen parks its buttons over it).
  function drawShip(ctx, run, opts) {
    const ship = run.ship;
    const o = globalThis.GT_Stack.shipOrigin(ship);
    const anchored = !!(run.rigs && run.rigs.includes('anchor'));
    const rock = run.hazards ? globalThis.GT_Hazards.rock(run.hazards, anchored) : 0;
    ctx.save();
    ctx.translate(640, F.waterY);
    ctx.rotate(rock);
    ctx.translate(-640, -F.waterY);

    // hull: a long trapezoid, slate blue with a safety-yellow sheer stripe and the ship's name
    ctx.fillStyle = '#2C4A63';
    ctx.beginPath();
    ctx.moveTo(o.x - 56, F.deckY);
    ctx.lineTo(o.x + o.w + 56, F.deckY);
    ctx.lineTo(o.x + o.w + 16, F.deckY + 104);
    ctx.lineTo(o.x - 16, F.deckY + 104);
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.fillStyle = P.accent;
    ctx.fillRect(o.x - 52, F.deckY + 10, o.w + 104, 10);
    ctx.fillStyle = P.seaDark;
    ctx.fillRect(o.x - 16, F.deckY + 88, o.w + 32, 16);
    if (!(opts && opts.hideName)) {
      globalThis.GT_Fit.draw(ctx, ship.name, 640, F.deckY + 52, C.TYPE.xl, '#FFFFFF', 'center', true, o.w - 40);
    }
    // bridge block at the stern
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(o.x - 52, F.deckY - 56, 64, 56);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.strokeRect(o.x - 52, F.deckY - 56, 64, 56);
    ctx.fillStyle = P.sky;
    ctx.fillRect(o.x - 44, F.deckY - 48, 20, 16); ctx.fillRect(o.x - 18, F.deckY - 48, 20, 16);

    // plan slots: dashed rim, translucent want-colour, glyph letter — the puzzle, readable
    for (let r = 0; r < ship.rows; r++) {
      for (let c = 0; c < ship.cols; c++) {
        if (run.filled && run.filled[r][c]) continue;
        const want = globalThis.GT_Cargo.colorById(run.plan.grid[r][c]);
        const x = o.x + c * F.boxW + 2, y = F.deckY - (r + 1) * F.boxH + 1;
        ctx.fillStyle = want.fill + '59';
        ctx.fillRect(x, y, F.boxW - 4, F.boxH - 2);
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 2; ctx.strokeStyle = P.ink;
        ctx.strokeRect(x, y, F.boxW - 4, F.boxH - 2);
        ctx.setLineDash([]);
        ctx.font = '900 20px ' + C.DISPLAY_FONT;
        ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(want.glyph, x + (F.boxW - 4) / 2, y + (F.boxH - 2) / 2 + 1);
      }
    }
    if (run.placed) globalThis.GT_Containers.drawPlaced(ctx, run);
    ctx.restore();

    // foam at the waterline (unrotated, sells the float)
    ctx.fillStyle = P.foam;
    for (let i = 0; i < 12; i++) {
      const fx = o.x - 40 + i * ((o.w + 80) / 11) + Math.sin(run.elapsed * 2 + i) * 5;
      ctx.fillRect(fx, F.waterY + 16, 26, 4);
    }
    drawSquall(ctx, run);
  }

  // The squall line itself: a slate band of driving rain sweeping the field, drawn over the
  // ship but under the crane — you can see it coming and you can see the hook inside it.
  function drawSquall(ctx, run) {
    const hz = run.hazards;
    if (!hz || !hz.squall) return;
    const sq = hz.squall;
    const x0 = sq.x - sq.w / 2, x1 = sq.x + sq.w / 2;
    ctx.fillStyle = 'rgba(52,84,110,0.20)';
    ctx.fillRect(x0, 0, sq.w, 724);
    ctx.fillStyle = 'rgba(52,84,110,0.30)';
    ctx.fillRect(sq.dir > 0 ? x0 : x1 - 5, 0, 5, 724); // the hard leading edge
    ctx.strokeStyle = 'rgba(234,251,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const rx = x0 + ((i * 67 + Math.floor(run.elapsed * 300)) % Math.max(40, sq.w));
      const ry = ((i * 131 + Math.floor(run.elapsed * 460)) % 700);
      ctx.moveTo(rx, ry); ctx.lineTo(rx - 7, ry + 26);
    }
    ctx.stroke();
  }

  function drawScene(ctx, run) {
    const storm = !!(run.ship && run.ship.boss);
    drawSky(ctx, run, storm);
    drawQuay(ctx);
    drawSea(ctx, run, storm);
  }

  function draw(ctx, run) {
    drawScene(ctx, run);
    drawShip(ctx, run);
  }

  globalThis.GT_Board = { draw, drawShip, drawScene };
})();
