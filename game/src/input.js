// Input: keyboard state, one-shot key presses, and canvas mouse position/clicks, all in canvas
// coordinates. The sim reads held keys for the trolley and pressed keys for drops and menus.
(function () {
  if (globalThis.GT_Input) return;

  const held = {};
  const pressed = {};
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  function bind(canvas) {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      if (!held[e.key]) pressed[e.key] = true;
      held[e.key] = true;
    });
    window.addEventListener('keyup', (e) => { held[e.key] = false; });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { mouse.down = true; mouse.clicked = true; });
    window.addEventListener('mouseup', () => { mouse.down = false; });
  }

  globalThis.GT_Input = {
    bind,
    held: (k) => !!held[k],
    wasPressed(k) { const v = !!pressed[k]; pressed[k] = false; return v; },
    mouse,
    endFrame() { mouse.clicked = false; for (const k in pressed) pressed[k] = false; },
  };
})();
