// Effects: splashes, sparks and confetti as short-lived particles, and the floating score
// text. Floaters always sit on a backing pill with an ink rim and are pushed apart by a
// separation pass, so two rewards in the same second never overlap into mush — the lesson
// the pachinko attempt learned the hard way.
(function () {
  if (globalThis.GT_Fx) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const rng = globalThis.GT_Rng.makeStream('gantry-fx');

  const particles = [];
  const floaters = [];

  function spawn(ev) {
    if (ev.type === 'splash') {
      for (let i = 0; i < 26; i++) {
        particles.push({ x: ev.x + rng.range(-30, 30), y: ev.y, vx: rng.range(-90, 90), vy: rng.range(-330, -90), t: 0, life: rng.range(0.4, 0.75), color: i % 3 ? P.foam : '#7FD4DE', size: rng.range(3, 6), grav: 900 });
      }
    } else if (ev.type === 'sparks') {
      for (let i = 0; i < (ev.n || 10); i++) {
        particles.push({ x: ev.x, y: ev.y, vx: rng.range(-140, 140), vy: rng.range(-190, -30), t: 0, life: rng.range(0.3, 0.55), color: i % 2 ? P.accent : '#FFFFFF', size: rng.range(2, 4), grav: 620 });
      }
    } else if (ev.type === 'confetti') {
      for (let i = 0; i < (ev.n || 30); i++) {
        particles.push({ x: ev.x + rng.range(-260, 260), y: ev.y + rng.range(-40, 40), vx: rng.range(-40, 40), vy: rng.range(20, 90), t: 0, life: rng.range(0.8, 1.3), color: C.CARGO_COLORS[i % 5].fill, size: rng.range(4, 7), grav: 60, rect: true });
      }
    } else if (ev.type === 'floater') {
      floaters.push({ x: ev.x, y: ev.y, text: ev.text, kind: ev.kind, t: 0, life: 1.6 });
    }
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt; f.y -= 26 * dt;
      if (f.t >= f.life) floaters.splice(i, 1);
    }
  }

  // Separation: floaters sorted by height; any two closer than a pill height are hopped apart.
  function separated() {
    const list = floaters.slice().sort((a, b) => a.y - b.y);
    for (let i = 1; i < list.length; i++) {
      if (Math.abs(list[i].x - list[i - 1].x) < 190 && list[i].y - list[i - 1].y < 40) {
        list[i].y = list[i - 1].y + 40;
      }
    }
    return list;
  }

  function draw(ctx) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      if (p.rect) ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.62);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.29); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const f of separated()) {
      const alpha = f.t < 0.12 ? f.t / 0.12 : f.t > f.life - 0.35 ? Math.max(0, (f.life - f.t) / 0.35) : 1;
      ctx.globalAlpha = alpha;
      const w = globalThis.GT_Fit.width(ctx, f.text, C.TYPE.l, true) + 32;
      const h = 40;
      const x = Math.max(8, Math.min(1280 - w - 8, f.x - w / 2));
      const fill = f.kind === 'good' ? P.accent : f.kind === 'bad' ? P.danger : P.panel;
      const ink = f.kind === 'bad' ? '#FFFFFF' : P.ink;
      ctx.fillStyle = P.ink;
      ctx.fillRect(x + 4, f.y - h / 2 + 4, w, h);
      ctx.fillStyle = fill;
      ctx.fillRect(x, f.y - h / 2, w, h);
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink;
      ctx.strokeRect(x, f.y - h / 2, w, h);
      globalThis.GT_Fit.draw(ctx, f.text, x + w / 2, f.y + 1, C.TYPE.l, ink, 'center', true);
    }
    ctx.globalAlpha = 1;
  }

  globalThis.GT_Fx = { spawn, update, draw, floaters, particles };
})();
