// Weather and wildlife: the wind (a base breeze plus announced gusts), gull flocks that cross
// the cable and shove the swing, and the swell that rocks the ship and tightens the list.
// All schedules come from the run's weather stream, so a seed's weather replays exactly.
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
    };
  }

  // Returns events the sim/banner care about: {type:'gust-incoming'|'gust-start'|'gull-nudge'|'flock'}
  function update(hz, dt, craneHookX) {
    const events = [];
    hz.wavePhase += dt * (hz.wavesOn ? 0.9 : 0.25);

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
    hz.windNow = breeze + (gustForce * (0.4 + hz.baseWind));

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
  function rock(hz) { return hz.wavesOn ? Math.sin(hz.wavePhase) * 0.021 : Math.sin(hz.wavePhase) * 0.006; }
  function listSqueeze(hz) { return hz.wavesOn ? 0.85 + Math.sin(hz.wavePhase * 2) * 0.07 : 1; }

  globalThis.GT_Hazards = { create, update, rock, listSqueeze };
})();
