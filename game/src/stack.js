// The stack: where dropped boxes come to rest on the ship, and the ship's LIST — the lean that
// builds when one side is loaded heavier than the other. Lean too far and the top box of the
// heavy side slides into the sea. This module is pure arithmetic; the sim owns the events.
(function () {
  if (globalThis.GT_Stack) return;
  const F = globalThis.GT_Config.FIELD;

  // Ship geometry: the plan is centred on the field; columns are box-width lanes on the deck.
  function shipOrigin(ship) {
    const w = ship.cols * F.boxW;
    return { x: 640 - w / 2, deckY: F.deckY, w };
  }

  function columnAt(ship, x) {
    const o = shipOrigin(ship);
    const col = Math.floor((x - o.x) / F.boxW);
    return col >= 0 && col < ship.cols ? col : -1;
  }

  function columnCenter(ship, col) {
    const o = shipOrigin(ship);
    return o.x + col * F.boxW + F.boxW / 2;
  }

  function columnHeight(placed, col) {
    let n = 0;
    for (const p of placed) if (p.col === col) n += 1;
    return n;
  }

  // List in [-1, 1]: negative leans left (port), positive right (starboard). Weight is the
  // stack height of each column, levered by its distance from the centreline.
  function listValue(placed, ship) {
    if (!placed.length) return 0;
    const mid = (ship.cols - 1) / 2;
    let moment = 0, weight = 0;
    for (let c = 0; c < ship.cols; c++) {
      const h = columnHeight(placed, c);
      moment += h * (c - mid);
      weight += h;
    }
    if (!weight) return 0;
    return moment / (weight * Math.max(1, mid));
  }

  // The box that would slide off first: the top box of the outermost loaded column on the
  // heavy side. Returns null when the stack is safe.
  function slideCandidate(placed, ship, list, threshold) {
    if (Math.abs(list) <= threshold || !placed.length) return null;
    const side = list > 0 ? 1 : -1;
    let best = null;
    for (const p of placed) {
      const dir = Math.sign(p.col - (ship.cols - 1) / 2) || side;
      if (dir !== side) continue;
      if (!best || p.col * side > best.col * side || (p.col === best.col && p.row > best.row)) best = p;
    }
    return best;
  }

  // Resting y of a box landing in a column (its top edge), given how many are already there.
  function restY(ship, placed, col) {
    const h = columnHeight(placed, col);
    return F.deckY - (h + 1) * F.boxH;
  }

  globalThis.GT_Stack = { shipOrigin, columnAt, columnCenter, columnHeight, listValue, slideCandidate, restY };
})();
