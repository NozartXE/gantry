// Weather and wildlife: the wind (a base breeze plus announced gusts), gull flocks that cross
// the cable and shove the swing, the swell that rocks the ship and tightens the list, and —
// on the late ships — squall lines: a band of rain that sweeps the whole harbour, announced
// ahead, shoving the swing hard while the hook is inside it and rewarding a true stow landed
// in the weather. All schedules come from the run's weather stream, so a seed's weather
// replays exactly.
(function () {
  if (globalThis.GT_Hazards) return;

  function create(ship, difficulty, rng) {
    return {
      rng,
      baseWind: ship.wind * difficulty.windMul,
      gust: null,              // {dir, strength, t, dur, announced}
      gustTimer: rng.range(6, difficulty.gustEvery),
      gustEvery: difficulty.gustEvery,
      gullsOn: ship.gulls,
      flock: null,             // {x, y, vx, nudged}
      flockTimer: rng.range(9, 16),
      wavePhase: rng.range(0, Math.PI * 2),
      wavesOn: ship.waves,
      windNow: 0,
      squallOn: !!ship.squall,
      squall: null,            // {x, dir, w, speed} — the band's centre, half-width and pace
      squallTimer: ship.boss ? rng.range(10, 18) : rng.range(16, 26),
      squallWarned: false,
      squallForce: 0,          // signed extra wind the band is applying at the hook right now
    };
  }

  // How hard the squall is pressing at field position x: 1 at the band's heart, fading to 0
  // a band-width beyond its edges. 0 when no squall is over the harbour.
  function squallAt(hz, x) {
    if (!hz.squall) return 0;
    const d = Math.abs(x - hz.squall.x);
    const reach = hz.squall.w / 2 + 120;
    return d >= reach ? 0 : 1 - d / reach;
  }

  // Returns events the sim/banner care about: {type:'gust-incoming'|'gust-start'|'gull-nudge'|'flock'|'squall-incoming'|'squall-start'|'squall-end'}
  function update(hz, dt, craneHookX) {
    const events = [];
    hz.wavePhase += dt * (hz.wavesOn ? 0.9 : 0.25);

    // Squall lifecycle: announced 3 s ahead, then the band sweeps the field once and is gone.
    hz.squallForce = 0;
    if (hz.squallOn) {
      if (!hz.squall) {
        hz.squallTimer -= dt;
        if (hz.squallTimer <= 3 && !hz.squallWarned) {
          hz.squallWarned = true;
          hz._squallDir = hz.rng.chance(0.5) ? 1 : -1;
          events.push({ type: 'squall-incoming', dir: hz._squallDir });
        }
        if (hz.squallTimer <= 0) {
          const dir = hz._squallDir || 1;
          hz.squall = { x: dir > 0 ? -170 : 1450, dir, w: 300, speed: hz.rng.range(82, 108) };
          hz.squallWarned = false;
          events.push({ type: 'squall-start', dir });
        }
      }
      if (hz.squall) {
        hz.squall.x += hz.squall.dir * hz.squall.speed * dt;
        hz.squallForce = hz.squall.dir * 1.05 * squallAt(hz, craneHookX);
        if (hz.squall.x < -260 || hz.squall.x > 1540) {
          hz.squall = null;
          hz.squallTimer = hz.rng.range(30, 48);
          events.push({ type: 'squall-end' });
        }
      }
    }

    // Gust lifecycle: announced 2.2 s ahead (banner + arrow), then it blows for ~4 s.
    hz.gustTimer -= dt;
    if (!hz.gust && hz.gustTimer <= 2.2 && hz.gustTimer > 0 && !hz._announced) {
      hz._announced = true;
      hz._pendingDir = hz.rng.chance(0.5) ? 1 : -1;
      events.push({ type: 'gust-incoming', dir: hz._pendingDir });
    }
    if (!hz.gust && hz.gustTimer <= 0) {
      hz.gust = { dir: hz._pendingDir || 1, strength: hz.rng.range(0.8, 1.25), t: 0, dur: hz.rng.range(3.4, 4.6) };
      hz._announced = false;
      events.push({ type: 'gust-start', dir: hz.gust.dir });
    }
    if (hz.gust) {
      hz.gust.t += dt;
      if (hz.gust.t >= hz.gust.dur) { hz.gust = null; hz.gustTimer = hz.rng.range(hz.gustEvery * 0.7, hz.gustEvery * 1.3); }
    }
    const gustEnv = hz.gust ? Math.sin(Math.min(1, hz.gust.t / hz.gust.dur) * Math.PI) : 0;
    const gustForce = hz.gust ? hz.gust.dir * hz.gust.strength * gustEnv : 0;
    const breeze = Math.sin(hz.wavePhase * 0.6) * 0.22 * hz.baseWind;
    hz.windNow = breeze + (gustForce * (0.4 + hz.baseWind)) + hz.squallForce;

    // Gull flocks: cross the sky at cable height; passing the hook shoves the swing once.
    if (hz.gullsOn) {
      hz.flockTimer -= dt;
      if (!hz.flock && hz.flockTimer <= 0) {
        const dir = hz.rng.chance(0.5) ? 1 : -1;
        hz.flock = { x: dir > 0 ? -80 : 1360, y: hz.rng.range(210, 300), vx: dir * hz.rng.range(120, 170), nudged: false };
        events.push({ type: 'flock' });
      }
    }
    if (hz.flock) {
      hz.flock.x += hz.flock.vx * dt;
      if (!hz.flock.nudged && Math.abs(hz.flock.x - craneHookX) < 46) {
        hz.flock.nudged = true;
        events.push({ type: 'gull-nudge', dir: Math.sign(hz.flock.vx) });
      }
      if (hz.flock.x < -140 || hz.flock.x > 1420) { hz.flock = null; hz.flockTimer = hz.rng.range(11, 19); }
    }
    return events;
  }

  // Ship rock in radians for the renderer, and the list-threshold squeeze the swell applies.
  // A SEA ANCHOR (rigs, read by the caller) halves the rock and lifts the squeeze.
  function rock(hz, anchored) {
    const base = hz.wavesOn ? Math.sin(hz.wavePhase) * 0.021 : Math.sin(hz.wavePhase) * 0.006;
    return anchored ? base * 0.5 : base;
  }
  function listSqueeze(hz, anchored) {
    if (anchored) return 1;
    return hz.wavesOn ? 0.85 + Math.sin(hz.wavePhase * 2) * 0.07 : 1;
  }

  globalThis.GT_Hazards = { create, update, rock, listSqueeze, squallAt };
})();
