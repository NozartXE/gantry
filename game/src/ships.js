// The fleet roster: which ship is alongside, which shift of the day it belongs to, and the
// honest forecast text the draft screen shows for the next ship (size, weather, new hazards).
(function () {
  if (globalThis.GT_Ships) return;
  const C = globalThis.GT_Config;

  function shiftOf(index) {
    if (index < 3) return 'SHIFT 1 · DAWN';
    if (index < 6) return 'SHIFT 2 · MIDDAY';
    return 'SHIFT 3 · DUSK';
  }

  function shipAt(index, endless) {
    if (!endless || index < C.SHIPS.length) return C.SHIPS[Math.min(index, C.SHIPS.length - 1)];
    // Endless NIGHT SHIFT: the freighter returns, wider and windier each lap.
    const base = C.SHIPS[C.SHIPS.length - 1];
    const lap = Math.floor(index / C.SHIPS.length);
    return Object.assign({}, base, {
      name: 'TYPHOON FREIGHTER +' + lap,
      wind: base.wind + lap * 0.2,
      time: Math.max(150, base.time - lap * 15),
    });
  }

  function totalShips(endless) { return endless ? Infinity : C.SHIPS.length; }

  // What is new about the next ship, in one banner-sized line — computed from the definitions,
  // never hand-written, so the forecast cannot lie.
  function forecastLine(prev, next) {
    if (!next) return 'THE HARBOUR IS CLEAR';
    const bits = [];
    if (prev && next.cols > prev.cols) bits.push('WIDER: ' + next.cols + ' COLUMNS');
    if (prev && next.rows > prev.rows) bits.push('TALLER: ' + next.rows + ' HIGH');
    if (next.gulls && !(prev && prev.gulls)) bits.push('NEW: GULL FLOCKS');
    if (next.waves && !(prev && prev.waves)) bits.push('NEW: THE SWELL');
    if (next.heavy && !(prev && prev.heavy)) bits.push('NEW: HEAVY BOXES');
    if (next.fragile && !(prev && prev.fragile)) bits.push('NEW: FRAGILE GLASS');
    if (next.squall && !(prev && prev.squall)) bits.push('NEW: SQUALL LINE');
    if (next.boss) bits.push('THE STORM SHIP');
    if (next.wind > (prev ? prev.wind : 0) + 0.24) bits.push('WIND RISING');
    return bits.length ? bits.join(' · ') : next.note.toUpperCase();
  }

  globalThis.GT_Ships = { shiftOf, shipAt, totalShips, forecastLine };
})();
