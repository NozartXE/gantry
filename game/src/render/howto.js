// How to play: the whole game on one overlay — the controls, the scoring, the list, and what
// each draft family does. Opened from the title; Esc or a click returns.
(function () {
  if (globalThis.GT_HowTo) return;
  const C = globalThis.GT_Config;
  const P = C.PALETTE;
  const L = () => globalThis.GT_Layout;
  const Fit = () => globalThis.GT_Fit;
  const Icons = () => globalThis.GT_RuleIcons;

  const ROWS = [
    ['drop', 'MOVE with ◀ ▶ (or A/D). The box swings like a pendulum — the trolley pumps it, the wind pushes it.'],
    ['match', 'DROP with SPACE. A box stows where it lands; landing on the plan colour pays +100 x CHAIN.'],
    ['chain', 'CHAIN: true stows in a row multiply, up to x8. A plain stow pays 25 and breaks the chain.'],
    ['list', 'LIST: load one side too heavy and the ship leans. HEAVY steel boxes lean her twice as hard.'],
    ['orders', 'CARGO: GLASS cracks if you let go mid-swing. ORDERS ride each ship — fill them for bonus pay.'],
    ['hull', 'HULL: splashes and slides cost 1. At zero the run ends. Clear a ship to draft 1 of 3 RIGS.'],
    ['storm', 'SQUALL LINES sweep the late ships, shoving the swing. Ship 9 is the TYPHOON FREIGHTER — clear her to win.'],
  ];

  function draw(ctx, view) {
    ctx.fillStyle = 'rgba(16,34,46,0.55)';
    ctx.fillRect(0, 0, 1280, 800);
    L().panel(ctx, 190, 70, 900, 660, P.panel);
    Fit().draw(ctx, 'HOW TO PLAY', 640, 118, C.TYPE.xxl, P.ink, 'center', true);
    ROWS.forEach((row, i) => {
      const y = 178 + i * 62;
      Icons().draw(ctx, row[0], 262, y, 38);
      const lines = globalThis.GT_DraftScreen.wrap(ctx, row[1], C.TYPE.m, 700);
      lines.forEach((line, li) => Fit().draw(ctx, line, 306, y - 10 + li * 28, C.TYPE.m, P.ink, 'left', false, 720));
    });
    Fit().draw(ctx, 'DRAFT KEYS 1 · 2 · 3 — REROLL WITH X (150 PTS) — TUG WITH T — PAUSE P — MUTE M', 640, 640, C.TYPE.s, P.ink, 'center', true, 840);
    Fit().draw(ctx, 'ESC — BACK', 640, 684, C.TYPE.m, P.ink, 'center', true);
  }

  globalThis.GT_HowTo = { draw };
})();
