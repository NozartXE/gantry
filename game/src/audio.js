// Sound: a small WebAudio synth — a slow harbour groove (bass pulse plus pentatonic crane-bell
// plucks from a seeded stream) and one-shot effects for clanks, splashes, chains and gusts.
// Everything is generated; no audio files, no network. Muted until the first player gesture.
(function () {
  if (globalThis.GT_Audio) return;

  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let started = false;
  let step = 0;
  let nextNoteAt = 0;
  const musicRng = globalThis.GT_Rng.makeStream('gantry-music');

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function applyVolumes(settings) {
    if (!ctx) return;
    musicGain.gain.value = 0.16 * settings.music;
    sfxGain.gain.value = 0.9 * settings.sfx;
  }

  function tone(freq, at, dur, type, vol, dest, slideTo) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(at); o.stop(at + dur + 0.05);
  }

  // The groove: an eighth-note grid at 92 BPM; bass on the beat, a bell pluck when the seeded
  // stream says so. Scheduled a step ahead from the main loop's update tick.
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
  function updateMusic(settings) {
    if (!started || !ensure()) return;
    applyVolumes(settings);
    const spb = 60 / 92 / 2;
    while (nextNoteAt < ctx.currentTime + 0.12) {
      const at = Math.max(nextNoteAt, ctx.currentTime);
      const bar = Math.floor(step / 8) % 4;
      if (step % 2 === 0) tone([110, 98, 87.3, 98][bar], at, 0.22, 'triangle', 0.5, musicGain);
      if (musicRng.chance(0.55)) {
        const deg = SCALE[musicRng.int(0, SCALE.length - 1)];
        tone(440 * Math.pow(2, deg / 12), at, 0.3, 'sine', 0.22, musicGain);
      }
      step += 1;
      nextNoteAt += spb;
    }
  }

  globalThis.GT_Audio = {
    unlock(settings) {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (!started) { started = true; nextNoteAt = ctx.currentTime + 0.05; }
      applyVolumes(settings);
    },
    update: updateMusic,
    setMuted(muted, settings) {
      if (!ctx) return;
      if (muted) { musicGain.gain.value = 0; sfxGain.gain.value = 0; }
      else applyVolumes(settings);
    },
    clank(pitch) { if (started && ensure()) { const t = ctx.currentTime; tone(180 + pitch * 30, t, 0.12, 'square', 0.16); tone(320 + pitch * 40, t, 0.08, 'square', 0.1); } },
    chain(n) { if (started && ensure()) { const t = ctx.currentTime; tone(520 + n * 60, t, 0.16, 'sine', 0.25); tone(780 + n * 60, t + 0.05, 0.2, 'sine', 0.18); } },
    splash() { if (started && ensure()) { const t = ctx.currentTime; tone(300, t, 0.3, 'sawtooth', 0.08, sfxGain, 70); } },
    slide() { if (started && ensure()) { const t = ctx.currentTime; tone(240, t, 0.35, 'sawtooth', 0.1, sfxGain, 60); } },
    gust() { if (started && ensure()) { const t = ctx.currentTime; tone(140, t, 0.6, 'sawtooth', 0.05, sfxGain, 320); } },
    draft() { if (started && ensure()) { const t = ctx.currentTime; [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.18, 'sine', 0.2)); } },
    alarm() { if (started && ensure()) { const t = ctx.currentTime; tone(880, t, 0.12, 'square', 0.12); tone(880, t + 0.18, 0.12, 'square', 0.12); } },
    order() { if (started && ensure()) { const t = ctx.currentTime; [392, 523, 659].forEach((f, i) => tone(f, t + i * 0.06, 0.16, 'triangle', 0.2)); } },
    crack() { if (started && ensure()) { const t = ctx.currentTime; tone(1400, t, 0.05, 'square', 0.14); tone(900, t + 0.04, 0.07, 'square', 0.1); tone(500, t + 0.09, 0.1, 'square', 0.07); } },
    tug() { if (started && ensure()) { const t = ctx.currentTime; tone(196, t, 0.32, 'sine', 0.3); tone(196, t + 0.42, 0.4, 'sine', 0.3); } },
    insure() { if (started && ensure()) { const t = ctx.currentTime; tone(1046, t, 0.1, 'sine', 0.16); tone(1318, t + 0.07, 0.14, 'sine', 0.14); } },
  };
})();
