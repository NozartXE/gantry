// Seeded randomness: one mulberry32 stream per job (run, weather, visuals) so a seed replays a
// run exactly and the decoration never perturbs the game. No Math.random anywhere in the sim.
(function () {
  if (globalThis.GT_Rng) return;

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeStream(seed) {
    let a = hashSeed(seed) || 1;
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next,
      range: (lo, hi) => lo + next() * (hi - lo),
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      shuffle: (arr) => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          const t = out[i]; out[i] = out[j]; out[j] = t;
        }
        return out;
      },
    };
  }

  globalThis.GT_Rng = { hashSeed, makeStream };
})();
