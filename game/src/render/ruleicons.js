// Rule icons: one stroke language (4 px ink lines, squared forms) for the six glyphs the title
// screen's rules digest uses — drop, match, chain, list, hull, storm. Drawn, never emoji.
(function () {
  if (globalThis.GT_RuleIcons) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;

  function box(ctx, cx, cy, s, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s * 0.62);
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s * 0.62);
  }

  function draw(ctx, kind, cx, cy, s) {
    ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 4;
    if (kind === 'drop') {
      box(ctx, cx, cy - s * 0.22, s * 0.8, P.accent);
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.05); ctx.lineTo(cx, cy + s * 0.34);
      ctx.moveTo(cx - s * 0.14, cy + s * 0.2); ctx.lineTo(cx, cy + s * 0.36); ctx.lineTo(cx + s * 0.14, cy + s * 0.2);
      ctx.stroke();
    } else if (kind === 'match') {
      box(ctx, cx, cy, s * 0.85, C.CARGO_COLORS[2].fill);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy); ctx.lineTo(cx - s * 0.06, cy + s * 0.14); ctx.lineTo(cx + s * 0.22, cy - s * 0.16);
      ctx.stroke();
    } else if (kind === 'chain') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 4;
      ctx.strokeRect(cx - s * 0.42, cy - s * 0.2, s * 0.44, s * 0.4);
      ctx.strokeRect(cx - s * 0.02, cy - s * 0.2, s * 0.44, s * 0.4);
      ctx.fillStyle = P.accent;
      ctx.fillRect(cx - s * 0.1, cy - s * 0.08, s * 0.2, s * 0.16);
    } else if (kind === 'list') {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.22);
      ctx.fillStyle = '#2C4A63';
      ctx.fillRect(-s * 0.45, -s * 0.05, s * 0.9, s * 0.3);
      box(ctx, -s * 0.18, -s * 0.22, s * 0.4, C.CARGO_COLORS[0].fill);
      box(ctx, s * 0.16, -s * 0.22, s * 0.4, C.CARGO_COLORS[1].fill);
      ctx.restore();
      ctx.strokeStyle = P.sea; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy + s * 0.34); ctx.lineTo(cx + s * 0.5, cy + s * 0.34); ctx.stroke();
    } else if (kind === 'hull') {
      ctx.fillStyle = P.danger;
      ctx.fillRect(cx - s * 0.34, cy - s * 0.3, s * 0.68, s * 0.6);
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
      ctx.strokeRect(cx - s * 0.34, cy - s * 0.3, s * 0.68, s * 0.6);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.16, cy); ctx.lineTo(cx + s * 0.16, cy);
      ctx.stroke();
    } else if (kind === 'storm') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - s * 0.4, cy - s * 0.34, s * 0.8, s * 0.3);
      ctx.fillRect(cx - s * 0.24, cy - s * 0.48, s * 0.48, s * 0.16);
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
      ctx.strokeRect(cx - s * 0.4, cy - s * 0.34, s * 0.8, s * 0.3);
      ctx.fillStyle = P.accent;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.08, cy - s * 0.02); ctx.lineTo(cx - s * 0.14, cy + s * 0.3); ctx.lineTo(cx + s * 0.02, cy + s * 0.3);
      ctx.lineTo(cx - s * 0.08, cy + s * 0.5); ctx.lineTo(cx + s * 0.2, cy + s * 0.14); ctx.lineTo(cx + s * 0.05, cy + s * 0.14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  globalThis.GT_RuleIcons = { draw };
})();
