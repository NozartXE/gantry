// The crane: a trolley that runs the beam and a container swinging from its cable. The swing is
// a true pendulum — trolley acceleration pumps it, wind pushes it, rig cards calm it — and a
// dropped box keeps the hook's velocity, so timing the release is the whole game.
(function () {
  if (globalThis.GT_Crane) return;
  const F = globalThis.GT_Config.FIELD;

  function create() {
    return {
      x: 640, v: 0,                 // trolley position and velocity on the beam
      angle: 0, angVel: 0,          // pendulum angle from straight-down, and its velocity
      held: null,                   // the queue box on the hook, or null
      falling: null,                // {x, y, vx, vy, colorId, serial} after release
      cooldown: 0,                  // brief pause before the next box is winched up
    };
  }

  function hookPos(crane) {
    return {
      x: crane.x + Math.sin(crane.angle) * F.cableLen,
      y: F.railY + Math.cos(crane.angle) * F.cableLen,
    };
  }

  function hookVel(crane) {
    return {
      x: crane.v + Math.cos(crane.angle) * crane.angVel * F.cableLen,
      y: -Math.sin(crane.angle) * crane.angVel * F.cableLen,
    };
  }

  // accel: -1..1 player input. wind: signed force from hazards. rigs: {swingCalm, windShield, trolleySpeed}
  function update(crane, dt, accel, wind, rigs) {
    const speedMul = (rigs && rigs.trolleySpeed) || 1;
    const calm = (rigs && rigs.swingCalm) || 1;
    const shield = (rigs && rigs.windShield) || 1;
    const ACC = 1500 * speedMul;
    const MAXV = 430 * speedMul;
    crane.v += accel * ACC * dt;
    crane.v -= crane.v * 2.2 * dt;                       // rail friction
    crane.v = Math.max(-MAXV, Math.min(MAXV, crane.v));
    crane.x += crane.v * dt;
    const minX = F.legL + 56, maxX = F.legR - 56;
    if (crane.x < minX) { crane.x = minX; crane.v = 0; }
    if (crane.x > maxX) { crane.x = maxX; crane.v = 0; }

    const G = 9.8 * 62;                                   // pendulum gravity, px-scaled
    const trolleyAcc = accel * ACC;
    let angAcc = -(G / F.cableLen) * Math.sin(crane.angle)
      - (trolleyAcc / F.cableLen) * Math.cos(crane.angle)
      + wind * shield * 0.7;
    crane.angVel += angAcc * dt;
    crane.angVel -= crane.angVel * (0.45 * calm) * dt;    // cable damping, rigs raise it
    crane.angle += crane.angVel * dt;

    if (crane.falling) {
      const b = crane.falling;
      b.vy += 2300 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    if (crane.cooldown > 0) crane.cooldown -= dt;
  }

  function drop(crane) {
    if (!crane.held || crane.falling) return false;
    const p = hookPos(crane);
    const v = hookVel(crane);
    // The spreader steadies the box as it lets go: it keeps only part of the hook's sideways
    // velocity, so a drop is a judgement about position more than a lottery about drift.
    // The falling box carries everything the landing needs to judge it: its colour, its class
    // (steel or glass), whether the paint made it wild, and whether this release was a hard
    // one for glass — judged now, from the swing the player is watching.
    crane.falling = {
      x: p.x, y: p.y + 24, vx: v.x * 0.55, vy: Math.max(0, v.y),
      colorId: crane.held.colorId, serial: crane.held.serial,
      cls: crane.held.cls || 'std', wild: !!crane.held.wild,
      hard: globalThis.GT_Specials.hardDrop(crane.angle, v.x),
    };
    crane.held = null;
    crane.cooldown = 0.55;
    return true;
  }

  globalThis.GT_Crane = { create, update, drop, hookPos, hookVel };
})();
