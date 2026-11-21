// Vision: line of sight and vision cones.
// A guard sees the player only when the player is inside the cone
// (range + angle) AND the straight line between them crosses no wall
// or crate. Sight is tested by stepping along the line in small steps
// and checking the tile under each step.
import { TILE, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';

function tileAt(level, x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return { col, row };
}

export function blocksSight(level, x, y) {
  const { col, row } = tileAt(level, x, y);
  return (
    level.walls.has(`${col},${row}`) || level.crates.has(`${col},${row}`)
  );
}

// True when the segment from (x0, y0) to (x1, y1) crosses no wall/crate.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (blocksSight(level, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How far a cone ray travels before it hits a wall/crate, at most range.
export function castConeRay(level, x, y, angle, range) {
  const step = 6;
  let d = step;
  while (d < range) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    if (blocksSight(level, px, py)) return d - step;
    d += step;
  }
  return range;
}

// The guard's cone as a polygon: the guard's position plus the endpoints
// of rays fanned across the cone. Walls cut the rays short, so the cone
// hugs the room's shape.
export function conePolygon(level, guard, range) {
  const points = [{ x: guard.x, y: guard.y }];
  const rays = 26;
  for (let i = 0; i <= rays; i += 1) {
    const a =
      guard.facing - VISION_HALF_ANGLE +
      (2 * VISION_HALF_ANGLE * i) / rays;
    const d = castConeRay(level, guard.x, guard.y, a, range);
    points.push({
      x: guard.x + Math.cos(a) * d,
      y: guard.y + Math.sin(a) * d,
    });
  }
  return points;
}

// 0 when the player cannot be seen at all, 1 when seen up close.
// Between them the value grows as the player gets closer to the guard.
export function visibilityOf(level, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE * TILE) return 0;
  const angleToPlayer = Math.atan2(dy, dx);
  const off = Math.abs(angleDifference(angleToPlayer, guard.facing));
  if (off > VISION_HALF_ANGLE) return 0;
  if (!hasLineOfSight(level, guard.x, guard.y, player.x, player.y)) return 0;
  // Closer reads clearer: 1 at touching distance, ~0.45 at the cone's edge.
  const closeness = 1 - dist / (VISION_RANGE * TILE);
  return 0.45 + 0.55 * closeness;
}

export function pointInShadow(level, x, y) {
  const { col, row } = tileAt(level, x, y);
  return level.shadows.some(
    (s) => col >= s.x && col < s.x + s.w && row >= s.y && row < s.y + s.h,
  );
}

export function pointInBush(level, x, y) {
  const { col, row } = tileAt(level, x, y);
  return level.bushes.has(`${col},${row}`);
}
