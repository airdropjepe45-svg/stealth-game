// The world: one level's live state. It owns the player, the guards,
// the detection meters, pickups and the clock, and reports what happened
// this step as events the main loop turns into sound and screen changes.
import { TILE, PEBBLES_PER_LEVEL, LIVES, METER_FILL_CLOSE, METER_FILL_FAR, SNEAK_FACTOR, SHADOW_FACTOR, BUSH_HIDE_DIST, PEBBLE_HEARING } from './config.js';
import { buildLevel } from './levels.js';
import { createPlayer, updatePlayer, throwPebble } from './player.js';
import { createGuard, updateGuard, distractGuard, GUARD_ALERTED_STATE, GUARD_SUSPICIOUS_STATE } from './guards.js';
import { visibilityOf, pointInShadow, pointInBush } from './vision.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_PEBBLE = 'pebble';
export const EVENT_ALERT = 'alert';
export const EVENT_SUSPICIOUS = 'suspicious';
export const EVENT_CAUGHT = 'caught';
export const EVENT_CLEAR = 'clear';
export const EVENT_FOOTSTEP = 'footstep';
export const EVENT_WIN = 'win';

export function createWorld(levelIndex, lives) {
  const level = buildLevel(levelIndex);
  const player = createPlayer(level);
  player.pebbles = PEBBLES_PER_LEVEL;
  return {
    levelIndex,
    level,
    player,
    guards: level.guards.map(createGuard),
    lives,
    timer: 0,
    keyTaken: false,
    sapphireTaken: false,
    pebbleMarks: [],
    alertLevel: 'calm',
    maxAlertThisLevel: 'calm',
    stepAlt: false,
    lastStepPhase: 0,
  };
}

function distTo(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fillRateFor(world, guard, vis) {
  let rate = METER_FILL_FAR + (METER_FILL_CLOSE - METER_FILL_FAR) * vis;
  const p = world.player;
  if (p.sneaking) rate *= SNEAK_FACTOR;
  if (pointInShadow(world.level, p.x, p.y)) rate *= SHADOW_FACTOR;
  return rate;
}

export function updateWorld(world, keys, dt, events) {
  const { level, player } = world;
  world.timer += dt;
  updatePlayer(player, level, keys, dt);

  // Footsteps: one soft scuff per half stride, only while walking aloud.
  if (player.moving && !player.sneaking) {
    const phase = Math.floor(player.stepPhase / Math.PI);
    if (phase !== world.lastStepPhase) {
      world.lastStepPhase = phase;
      world.stepAlt = !world.stepAlt;
      events.push({ type: EVENT_FOOTSTEP, alt: world.stepAlt });
    }
  }

  // Guards see, meter, and move.
  let worst = 'calm';
  for (const guard of world.guards) {
    let vis = visibilityOf(level, guard, player);
    if (vis > 0) {
      const d = distTo(guard, player);
      if (pointInBush(level, player.x, player.y) && d > BUSH_HIDE_DIST * TILE) {
        vis = 0;
      }
    }
    const prevState = guard.state;
    const fill = vis > 0 ? fillRateFor(world, guard, vis) : 0;
    updateGuard(guard, dt, player, fill);
    if (guard.state === GUARD_ALERTED_STATE) worst = 'alerted';
    else if (guard.state === GUARD_SUSPICIOUS_STATE && worst !== 'alerted') {
      worst = 'suspicious';
    }
    if (guard.state === GUARD_ALERTED_STATE && prevState !== GUARD_ALERTED_STATE) {
      events.push({ type: EVENT_ALERT });
    } else if (
      guard.state === GUARD_SUSPICIOUS_STATE &&
      prevState === 'patrol'
    ) {
      events.push({ type: EVENT_SUSPICIOUS });
    }
  }
  world.alertLevel = worst;
  if (worst === 'alerted') world.maxAlertThisLevel = 'alerted';
  else if (worst === 'suspicious' && world.maxAlertThisLevel !== 'alerted') {
    world.maxAlertThisLevel = 'suspicious';
  }

  // Pebble marks fade.
  for (const mark of world.pebbleMarks) mark.ttl -= dt;
  world.pebbleMarks = world.pebbleMarks.filter((m) => m.ttl > 0);

  // Pickups: the key, then the sapphire.
  const key = level.key;
  if (key && !world.keyTaken) {
    const kx = (key.col + 0.5) * TILE;
    const ky = (key.row + 0.5) * TILE;
    if (Math.hypot(player.x - kx, player.y - ky) < TILE * 0.55) {
      world.keyTaken = true;
      events.push({ type: EVENT_PICKUP, what: 'key' });
    }
  }
  const sapphire = level.sapphire;
  if (sapphire && !world.sapphireTaken) {
    const sx = (sapphire.col + 0.5) * TILE;
    const sy = (sapphire.row + 0.5) * TILE;
    if (Math.hypot(player.x - sx, player.y - sy) < TILE * 0.55) {
      world.sapphireTaken = true;
      events.push({ type: EVENT_PICKUP, what: 'sapphire' });
    }
  }

  // Caught: an alerted guard closes in.
  for (const guard of world.guards) {
    if (
      guard.state === GUARD_ALERTED_STATE &&
      distTo(guard, player) < TILE * 0.6
    ) {
      events.push({ type: EVENT_CAUGHT });
      return;
    }
  }

  // Exit: open only once the level's objective is met.
  const exit = level.exit;
  const open =
    (!level.needsKey || world.keyTaken) &&
    (!level.needsSapphire || world.sapphireTaken);
  if (exit) {
    const ex = (exit.col + 0.5) * TILE;
    const ey = (exit.row + 0.5) * TILE;
    if (open && Math.hypot(player.x - ex, player.y - ey) < TILE * 0.6) {
      events.push({ type: world.levelIndex >= 2 ? EVENT_WIN : EVENT_CLEAR });
    }
  }
}

// Throw a pebble at world coordinates. Guards near the landing point
// turn to investigate it. Returns true when a pebble was thrown.
export function worldThrowPebble(world, wx, wy, events) {
  const landing = throwPebble(world.player, world.level, wx, wy);
  if (!landing) return false;
  world.pebbleMarks.push({ x: landing.x, y: landing.y, ttl: 4 });
  for (const guard of world.guards) {
    if (distTo(guard, landing) < PEBBLE_HEARING * TILE) {
      distractGuard(guard, landing.x, landing.y);
    }
  }
  events.push({ type: EVENT_PEBBLE });
  return true;
}

export function exitIsOpen(world) {
  return (
    (!world.level.needsKey || world.keyTaken) &&
    (!world.level.needsSapphire || world.sapphireTaken)
  );
}

export function livesLeft(world) {
  return world.lives;
}
