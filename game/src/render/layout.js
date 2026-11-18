// Layout primitives shared by every screen: signage panels with hard ink offset shadows (one
// shape language — squared corners, 3 px ink rims), buttons, pills and gauges. All spacing
// comes from the config scale; nothing here invents a number the tokens do not know.
(function () {
  if (globalThis.GT_Layout) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;

  function panel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(x + 6, y + 6, w, h);                    // hard offset shadow, never a blur
    ctx.fillStyle = fill || P.panel;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(x, y, w, h);
  }

  function chip(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(x, y, w, h);
  }

  // A button drawn in the signage style; returns true when the point is inside it.
  function button(ctx, x, y, w, h, label, opts) {
    const o = opts || {};
    const fill = o.fill || P.accent;
    ctx.fillStyle = P.ink;
    ctx.fillRect(x + 5, y + 5, w, h);
    ctx.fillStyle = o.hover ? shade(fill) : fill;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(x, y, w, h);
    globalThis.GT_Fit.draw(ctx, label, x + w / 2, y + h / 2 + 1, o.size || C.TYPE.l,
      o.color || P.ink, 'center', true, w - 16);
    return { x, y, w, h };
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + 24), g = Math.min(255, ((n >> 8) & 255) + 24), b = Math.min(255, (n & 255) + 24);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function inside(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }

  // A horizontal gauge with an ink rim and a filled portion; label sits above in caps.
  function gauge(ctx, x, y, w, h, frac, fill) {
    ctx.fillStyle = P.panel;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(x, y, w, h);
    const fw = Math.max(0, Math.min(1, frac)) * (w - 6);
    if (fw > 0) { ctx.fillStyle = fill; ctx.fillRect(x + 3, y + 3, fw, h - 6); }
  }

  globalThis.GT_Layout = { panel, chip, button, inside, gauge };
})();
