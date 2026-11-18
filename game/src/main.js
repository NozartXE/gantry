// Boot and screen state machine: owns the canvas loop, routes input between the title, the
// run (play and draft), the results and the side doors, plays the sim's sound events, and —
// in ?shot= staging mode — freezes one deterministic frame per screen for the screenshots.
(function () {
  if (globalThis.GT_Main && globalThis.GT_Main.booted) return;

  const C = globalThis.GT_Config;
  const STEP = C.STEP;
  const params = new URLSearchParams(location.search);
  const shotMode = params.get('shot');
  const seedParam = params.get('seed') || '7';

  const view = {
    screen: 'title',
    run: null,
    demo: null,
    save: null,
    difficulty: 'busy',
    endless: false,
    hover: null,
    buttons: {},
    paused: false,
    muted: false,
    shakeT: 0,
    recorded: false,
    staged: false,
  };

  let canvas, ctx, acc = 0, lastTs = 0;

  function newRun() {
    const seed = 'harbour-' + (view.save.runs + 1) + '-' + view.difficulty + (view.endless ? '-night' : '');
    view.run = globalThis.GT_Sim.createRun(seed, view.difficulty, view.endless);
    view.recorded = false;
    view.paused = false;
    view.screen = 'play';
  }

  function newTrial(trialId) {
    const seed = 'trial-' + trialId + '-' + (view.save.runs + 1);
    view.run = globalThis.GT_Trials.begin(trialId, seed);
    if (!view.run) { view.screen = 'title'; return; }
    view.recorded = false;
    view.paused = false;
    view.screen = 'play';
  }

  function recordIfDone() {
    const run = view.run;
    if (!run || !run.over || view.recorded) return;
    view.recorded = true;
    if (run.trial) {
      // Trials keep their medal and their feats, but they are not harbour runs: the best
      // score and the history belong to the nine-ship harbour alone.
      globalThis.GT_Save.recordTrial(run.trial.id, run.medal);
    } else {
      globalThis.GT_Save.recordRun({
        score: run.result.score, grade: run.result.grade, result: run.result.result,
        ship: run.result.shipsCleared, difficulty: run.result.difficulty,
      });
    }
    run.featsEarned.forEach((id) => globalThis.GT_Save.unlockFeat(id));
    view.save = globalThis.GT_Save.get();
  }

  function consumeEvents(run) {
    for (const ev of run.events) {
      if (ev.type === 'sound') {
        if (!view.muted && globalThis.GT_Audio[ev.name]) globalThis.GT_Audio[ev.name](ev.arg);
      } else {
        globalThis.GT_Fx.spawn(ev);
        if (ev.type === 'splash') view.shakeT = Math.max(view.shakeT, 0.22);
      }
    }
    run.events.length = 0;
  }

  function playControl() {
    const I = globalThis.GT_Input;
    let accel = 0;
    if (I.held('ArrowLeft') || I.held('a') || I.held('A')) accel -= 1;
    if (I.held('ArrowRight') || I.held('d') || I.held('D')) accel += 1;
    return { accel, drop: I.wasPressed(' '), tug: I.wasPressed('t') || I.wasPressed('T') };
  }

  function updatePlay(dt) {
    const run = view.run;
    if (globalThis.GT_Input.wasPressed('p') || globalThis.GT_Input.wasPressed('P')) view.paused = !view.paused;
    if (view.paused) return;
    globalThis.GT_Sim.update(run, dt, playControl());
    consumeEvents(run);
    if (run.over) { recordIfDone(); view.screen = 'results'; }
  }

  function updateDraftInput() {
    const run = view.run;
    const I = globalThis.GT_Input;
    for (let i = 0; i < 3; i++) {
      if (I.wasPressed(String(i + 1)) && run.offers[i]) { globalThis.GT_Sim.pickRig(run, run.offers[i]); return; }
      if (view.clickedButton === 'card' + i && run.offers[i]) { globalThis.GT_Sim.pickRig(run, run.offers[i]); view.clickedButton = null; return; }
    }
    if (I.wasPressed('x') || I.wasPressed('X') || view.clickedButton === 'reroll') {
      globalThis.GT_Sim.reroll(run);
      view.clickedButton = null;
    }
  }

  function updateTitle(dt) {
    if (!view.demo || view.demo.screen !== 'play' || view.demo.timeLeft < 25) {
      view.demo = globalThis.GT_TitleDemo.build();
    }
    globalThis.GT_Sim.update(view.demo, dt, globalThis.GT_Bot.control(view.demo));
    view.demo.events.length = 0;
  }

  function handleTitleKeys() {
    const I = globalThis.GT_Input;
    if (I.wasPressed('Enter') || I.wasPressed(' ')) { newRun(); return; }
    const b = view.clickedButton;
    if (!b) return;
    view.clickedButton = null;
    if (b === 'play') newRun();
    else if (b === 'howto') view.screen = 'howto';
    else if (b === 'options') view.screen = 'options';
    else if (b === 'almanac') view.screen = 'almanac';
    else if (b === 'trials') view.screen = 'trials';
    else if (b === 'endless') { if (view.save.endlessUnlocked) view.endless = !view.endless; }
    else if (b.indexOf('diff') === 0) view.difficulty = C.DIFFICULTIES[Number(b.slice(4))].id;
  }

  function handleTrialsInput() {
    const I = globalThis.GT_Input;
    if (I.wasPressed('Escape')) { view.screen = 'title'; return; }
    for (let i = 0; i < C.TRIALS.length; i++) {
      if (I.wasPressed(String(i + 1)) || view.clickedButton === 'trial' + i) {
        view.clickedButton = null;
        newTrial(C.TRIALS[i].id);
        return;
      }
    }
    view.clickedButton = null;
  }

  function handleOptionsClick() {
    const b = view.clickedButton;
    if (!b) return;
    view.clickedButton = null;
    const m = /^opt-(music|sfx|shake)-(up|down)$/.exec(b);
    if (m) {
      const cur = view.save.settings[m[1]];
      globalThis.GT_Save.setSetting(m[1], Math.max(0, Math.min(1, cur + (m[2] === 'up' ? 0.1 : -0.1))));
      view.save = globalThis.GT_Save.get();
    }
  }

  function step(dt) {
    const I = globalThis.GT_Input;
    if (I.wasPressed('m') || I.wasPressed('M')) {
      view.muted = !view.muted;
      globalThis.GT_Audio.setMuted(view.muted, view.save.settings);
    }
    switch (view.screen) {
      case 'title': updateTitle(dt); handleTitleKeys(); break;
      case 'trials': updateTitle(dt); handleTrialsInput(); break;
      case 'howto': case 'almanac':
        if (I.wasPressed('Escape') || I.mouse.clicked) view.screen = 'title';
        break;
      case 'options':
        handleOptionsClick();
        if (I.wasPressed('Escape')) view.screen = 'title';
        break;
      case 'play':
        if (view.run.screen === 'draft') updateDraftInput();
        else updatePlay(dt);
        break;
      case 'results':
        if (I.wasPressed('r') || I.wasPressed('R') || view.clickedButton === 'again') {
          view.clickedButton = null;
          if (view.run && view.run.trial) newTrial(view.run.trial.id);
          else newRun();
        }
        else if (I.wasPressed('Escape') || view.clickedButton === 'title') { view.clickedButton = null; view.screen = 'title'; }
        break;
    }
    globalThis.GT_Fx.update(dt);
    if (view.shakeT > 0) view.shakeT -= dt;
    if (!view.muted) globalThis.GT_Audio.update(view.save.settings);
    I.endFrame();
  }

  function pickHover() {
    const m = globalThis.GT_Input.mouse;
    view.hover = null;
    for (const name in view.buttons) {
      if (globalThis.GT_Layout.inside(m.x, m.y, view.buttons[name])) { view.hover = name; break; }
    }
    if (m.clicked && view.hover) view.clickedButton = view.hover;
  }

  function render() {
    ctx.save();
    if (view.shakeT > 0 && !view.staged) {
      const s = view.save.settings.shake;
      ctx.translate(Math.sin(performance.now() * 0.09) * 5 * s * view.shakeT * 4, Math.cos(performance.now() * 0.11) * 4 * s * view.shakeT * 4);
    }
    if (view.screen === 'title' || view.screen === 'howto' || view.screen === 'options' || view.screen === 'almanac' || view.screen === 'trials') {
      const demo = view.demo || globalThis.GT_TitleDemo.build();
      globalThis.GT_Board.draw(ctx, demo);
      globalThis.GT_CraneView.draw(ctx, demo);
      globalThis.GT_Fx.draw(ctx);
      if (view.screen === 'title') globalThis.GT_Title.draw(ctx, view);
      else if (view.screen === 'trials') { globalThis.GT_Title.draw(ctx, view); globalThis.GT_Menus.drawTrials(ctx, view); }
      else if (view.screen === 'howto') { globalThis.GT_Title.draw(ctx, view); globalThis.GT_HowTo.draw(ctx, view); }
      else if (view.screen === 'options') { globalThis.GT_Title.draw(ctx, view); globalThis.GT_Menus.drawOptions(ctx, view); }
      else { globalThis.GT_Title.draw(ctx, view); globalThis.GT_Menus.drawAlmanac(ctx, view); }
    } else if (view.screen === 'play' && view.run) {
      const run = view.run;
      globalThis.GT_Board.draw(ctx, run);
      if (run.screen === 'draft') {
        // the draft owns the frame: no HUD, no banner — one decision, nothing competing
        globalThis.GT_DraftScreen.draw(ctx, run, view);
      } else {
        globalThis.GT_Hud.drawGuide(ctx, run);
        globalThis.GT_CraneView.draw(ctx, run);
        globalThis.GT_Fx.draw(ctx);
        globalThis.GT_Hud.draw(ctx, run, view.save);
        globalThis.GT_Banner.draw(ctx, run);
      }
      if (view.paused) {
        ctx.fillStyle = 'rgba(16,34,46,0.55)';
        ctx.fillRect(0, 0, 1280, 800);
        globalThis.GT_Layout.panel(ctx, 440, 330, 400, 140, C.PALETTE.panel);
        globalThis.GT_Fit.draw(ctx, 'PAUSED', 640, 385, C.TYPE.xxl, C.PALETTE.ink, 'center', true);
        globalThis.GT_Fit.draw(ctx, 'P — RESUME', 640, 435, C.TYPE.m, C.PALETTE.ink, 'center', true);
      }
    } else if (view.screen === 'results' && view.run) {
      const run = view.run;
      globalThis.GT_Board.drawScene(ctx, run);
      ctx.save();
      ctx.translate(360, 250);
      ctx.scale(0.66, 0.66);
      globalThis.GT_Board.drawShip(ctx, run, { hideName: true });
      ctx.restore();
      globalThis.GT_Results.draw(ctx, run, view);
    }
    ctx.restore();
    pickHover();
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    let elapsed = (ts - lastTs) / 1000;
    lastTs = ts;
    if (view.staged) { render(); return; }
    acc += Math.min(elapsed, 0.25);
    while (acc >= STEP) { step(STEP); acc -= STEP; }
    render();
  }

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    globalThis.GT_Input.bind(canvas);
    window.addEventListener('keydown', () => globalThis.GT_Audio.unlock(view.save.settings), { once: true });
    canvas.addEventListener('mousedown', () => globalThis.GT_Audio.unlock(view.save.settings), { once: true });

    if (shotMode) {
      view.staged = true;
      if (shotMode === 'title') {
        globalThis.GT_Testhook.stagedSave();
        view.save = globalThis.GT_Save.get();
        view.demo = globalThis.GT_TitleDemo.build();
        // settle the demo: let the bot work a few seconds so the harbour looks lived-in
        for (let i = 0; i < 60 * 7; i++) {
          globalThis.GT_Sim.update(view.demo, STEP, globalThis.GT_Bot.control(view.demo));
          view.demo.events.length = 0;
        }
        view.screen = 'title';
      } else if (shotMode === 'play') {
        view.save = globalThis.GT_Save.get();
        view.run = globalThis.GT_Testhook.stagePlay(seedParam);
        consumeEvents(view.run);
        globalThis.GT_Fx.update(0.4);
        view.screen = 'play';
      } else if (shotMode === 'draft') {
        view.save = globalThis.GT_Save.get();
        view.run = globalThis.GT_Testhook.stageDraft(seedParam);
        view.screen = 'play';
      } else if (shotMode === 'results') {
        view.run = globalThis.GT_Testhook.stageResults(seedParam);
        view.save = globalThis.GT_Save.get();
        view.screen = 'results';
      }
    } else {
      view.save = globalThis.GT_Save.get();
      view.demo = globalThis.GT_TitleDemo.build();
    }
    globalThis.GT_Main = { booted: true, view };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
