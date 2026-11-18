// The gantry crane itself: two truss legs, the great yellow beam, the trolley, and the cable
// with its swinging box — the focal point of every play frame, drawn biggest and brightest.
(function () {
  if (globalThis.GT_CraneView) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const F = C.FIELD;

  function truss(ctx, x, top, bottom) {
    ctx.strokeStyle = '#14384F'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let y = top + 8; y < bottom - 20; y += 36) {
      ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y + 30);
      ctx.moveTo(x + 9, y); ctx.lineTo(x - 9, y + 30);
    }
    ctx.stroke();
    ctx.fillStyle = '#14384F';
    ctx.fillRect(x - 20, bottom - 6, 40, 12);
  }

  function draw(ctx, run) {
    const crane = run.crane;
    // legs stand on the quay band, beam across the top
    truss(ctx, F.legL, F.railY, 512);
    truss(ctx, F.legR, F.railY, 512);
    ctx.fillStyle = P.accent;
    ctx.fillRect(F.legL - 44, F.railY - 26, (F.legR - F.legL) + 88, 26);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(F.legL - 44, F.railY - 26, (F.legR - F.legL) + 88, 26);
    ctx.fillStyle = P.accentDark;
    for (let x = F.legL - 32; x < F.legR + 60; x += 48) ctx.fillRect(x, F.railY - 26, 5, 26);

    // trolley
    ctx.fillStyle = '#14384F';
    ctx.fillRect(crane.x - 30, F.railY - 40, 60, 22);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(crane.x - 30, F.railY - 40, 60, 22);
    ctx.fillStyle = P.panel;
    ctx.beginPath(); ctx.arc(crane.x - 18, F.railY - 14, 6, 0, 6.29); ctx.arc(crane.x + 18, F.railY - 14, 6, 0, 6.29); ctx.fill();

    // cable + hook + held box (the swinging focal point)
    const hook = globalThis.GT_Crane.hookPos(crane);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(crane.x, F.railY - 18); ctx.lineTo(hook.x, hook.y); ctx.stroke();
    ctx.fillStyle = '#14384F';
    ctx.fillRect(hook.x - 13, hook.y - 8, 26, 14);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
    ctx.strokeRect(hook.x - 13, hook.y - 8, 26, 14);
    if (crane.held) {
      globalThis.GT_Containers.drawBox(ctx, hook.x, hook.y + 6 + F.boxH / 2, F.boxW, F.boxH,
        crane.held.colorId, crane.held.serial, crane.held.wild, crane.held.cls, false);
    }
    // the falling box, with two speed streaks
    if (crane.falling) {
      const b = crane.falling;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(b.x - 24, b.y - 60); ctx.lineTo(b.x - 24, b.y - 18);
      ctx.moveTo(b.x + 24, b.y - 72); ctx.lineTo(b.x + 24, b.y - 24);
      ctx.stroke();
      globalThis.GT_Containers.drawBox(ctx, b.x, b.y + F.boxH / 2, F.boxW, F.boxH, b.colorId, b.serial, b.wild, b.cls, false);
    }
  }

  globalThis.GT_CraneView = { draw };
})();
