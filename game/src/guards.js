// Guards: patrol, get suspicious, give chase.
// A guard walks its waypoints and waits at each one. When its detection
// meter fills partway it walks to the last place it saw (or heard)
// something and looks around; when the meter fills all the way it runs
// at the player. Lose the player for a while and it calms back down.
import { TILE, GUARD_PATROL, GUARD_INVESTIGATE, GUARD_CHASE, METER_SUSPICIOUS, METER_ALERTED } from './config.js';

export const GUARD_PATROL_STATE = 'patrol';
export const GUARD_SUSPICIOUS_STATE = 'suspicious';
export const GUARD_ALERTED_STATE = 'alerted';

export function createGuard(def) {
  const [sx, sy] = def.start;
  return {
    x: (sx + 0.5) * TILE,
    y: (sy + 0.5) * TILE,
    facing: 0,
    state: GUARD_PATROL_STATE,
    meter: 0,
    waypointIndex: 0,
    waypoints: def.waypoints.map(([c, r]) => ({
      x: (c + 0.5) * TILE,
      y: (r + 0.5) * TILE,
    })),
    pauseLeft: def.pause,
    pauseAtWaypoint: def.pause,
    investigateX: 0,
    investigateY: 0,
    lookAroundLeft: 0,
    lookAngle: 0,
    lostSightFor: 0,
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * TILE * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 1;
}

function patrolStep(guard, dt) {
  const target = guard.waypoints[guard.waypointIndex];
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    // A waiting guard slowly scans left and right.
    guard.facing += Math.sin(performance.now() / 900 + guard.x) * 0.0012;
    return;
  }
  const arrived = moveToward(guard, target.x, target.y, GUARD_PATROL, dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pauseAtWaypoint;
  }
}

function investigateStep(guard, dt) {
  if (guard.lookAroundLeft > 0) {
    guard.lookAroundLeft -= dt;
    guard.facing = guard.lookAngle + Math.sin(guard.lookAroundLeft * 2.4) * 0.9;
    return;
  }
  const arrived = moveToward(
    guard,
    guard.investigateX,
    guard.investigateY,
    GUARD_INVESTIGATE,
    dt,
  );
  if (arrived) {
    guard.lookAroundLeft = 2.2;
    guard.lookAngle = guard.facing;
  }
}

function chaseStep(guard, player, dt) {
  moveToward(guard, player.x, player.y, GUARD_CHASE, dt);
}

// Called when a pebble lands or a noise is heard: the guard goes to look.
export function distractGuard(guard, x, y) {
  if (guard.state === GUARD_ALERTED_STATE) return;
  guard.state = GUARD_SUSPICIOUS_STATE;
  guard.meter = Math.max(guard.meter, METER_SUSPICIOUS);
  guard.investigateX = x;
  guard.investigateY = y;
  guard.lookAroundLeft = 0;
}

export function updateGuard(guard, dt, player, playerVisible) {
  // The detection meter fills while the player is seen, drains otherwise.
  if (playerVisible > 0) {
    guard.meter += playerVisible * dt;
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.lostSightFor = 0;
  } else {
    guard.meter = Math.max(0, guard.meter - 0.55 * dt);
    guard.lostSightFor += dt;
  }

  if (guard.meter >= METER_ALERTED) {
    if (guard.state !== GUARD_ALERTED_STATE) {
      guard.state = GUARD_ALERTED_STATE;
    }
  } else if (guard.meter >= METER_SUSPICIOUS) {
    if (guard.state === GUARD_PATROL_STATE) {
      guard.state = GUARD_SUSPICIOUS_STATE;
      guard.investigateX = guard.lastSeenX;
      guard.investigateY = guard.lastSeenY;
      guard.lookAroundLeft = 0;
    }
  }

  if (guard.state === GUARD_ALERTED_STATE) {
    if (playerVisible > 0) {
      chaseStep(guard, player, dt);
    } else if (guard.lostSightFor > 3) {
      // Lost the trail: drop back to suspicious and check the last spot.
      guard.state = GUARD_SUSPICIOUS_STATE;
      guard.meter = METER_SUSPICIOUS;
      guard.investigateX = guard.lastSeenX;
      guard.investigateY = guard.lastSeenY;
      guard.lookAroundLeft = 0;
    } else {
      chaseStep(guard, { x: guard.lastSeenX, y: guard.lastSeenY }, dt);
    }
  } else if (guard.state === GUARD_SUSPICIOUS_STATE) {
    if (guard.meter < METER_SUSPICIOUS - 0.08) {
      guard.state = GUARD_PATROL_STATE;
      guard.pauseLeft = 0.4;
    } else {
      investigateStep(guard, dt);
    }
  } else {
    patrolStep(guard, dt);
  }
}
