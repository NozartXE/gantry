// Text fitting: measure once per (font, string) and shrink a string to a box by stepping down
// the fixed type scale — never by arbitrary pixel sizes, so the type system stays intact.
(function () {
  if (globalThis.GT_Fit) return;
  const C = globalThis.GT_Config;
  const cache = new Map();

  function fontFor(size, display) {
    return (display ? '900 ' : '600 ') + size + 'px ' + (display ? C.DISPLAY_FONT : C.TEXT_FONT);
  }

  function width(ctx, text, size, display) {
    const key = size + '|' + (display ? 'd' : 't') + '|' + text;
    if (cache.has(key)) return cache.get(key);
    ctx.font = fontFor(size, display);
    const w = ctx.measureText(text).width;
    cache.set(key, w);
    return w;
  }

  // Largest scale step that fits maxWidth; returns the size to draw at.
  function fitSize(ctx, text, size, maxWidth, display) {
    const steps = [76, 61, 49, 39, 31, 25, 20, 16, 13];
    let s = size;
    while (s > 13 && width(ctx, text, s, display) > maxWidth) {
      const next = steps[steps.indexOf(s) + 1];
      if (!next) break;
      s = next;
    }
    return s;
  }

  function draw(ctx, text, x, y, size, color, align, display, maxWidth) {
    const s = maxWidth ? fitSize(ctx, text, size, maxWidth, display) : size;
    ctx.font = fontFor(s, display);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    return s;
  }

  globalThis.GT_Fit = { fontFor, width, fitSize, draw };
})();
