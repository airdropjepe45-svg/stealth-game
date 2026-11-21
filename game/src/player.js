// The player: Wren, a thief in a hooded cloak.
// Walks with WASD or the arrow keys, sneaks while Shift is held
// (slower, quieter, harder to spot), and throws pebbles with a mouse
// click to pull a guard away. Walls and crates block movement; bushes
// and shadows hide.
import { TILE, PLAYER_WALK, PLAYER_SNEAK, PEBBLE_RANGE } from './config.js';

export function createPlayer(level) {
  return {
    x: (level.player.col + 0.5) * TILE,
    y: (level.player.row + 0.5) * TILE,
    facing: 0,
    moving: false,
    sneaking: false,
    pebbles: 3,
    pebbleCooldown: 0,
    stepPhase: 0,
  };
}

function tileBlocked(level, x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (col < 0 || row < 0 || col >= 20 || row >= 11) return true;
  return (
    level.walls.has(`${col},${row}`) || level.crates.has(`${col},${row}`)
  );
}

// Move axis by axis so the player slides along walls instead of sticking.
function tryMove(level, player, dx, dy) {
  const r = TILE * 0.3;
  const nx = player.x + dx;
  if (
    !tileBlocked(level, nx - r, player.y - r) &&
    !tileBlocked(level, nx + r, player.y - r) &&
    !tileBlocked(level, nx - r, player.y + r) &&
    !tileBlocked(level, nx + r, player.y + r)
  ) {
    player.x = nx;
  }
  const ny = player.y + dy;
  if (
    !tileBlocked(level, player.x - r, ny - r) &&
    !tileBlocked(level, player.x + r, ny - r) &&
    !tileBlocked(level, player.x - r, ny + r) &&
    !tileBlocked(level, player.x + r, ny + r)
  ) {
    player.y = ny;
  }
}

export function updatePlayer(player, level, keys, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.sneaking = !!keys.sneak;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const speed = (player.sneaking ? PLAYER_SNEAK : PLAYER_WALK) * TILE;
    const vx = (dx / len) * speed * dt;
    const vy = (dy / len) * speed * dt;
    tryMove(level, player, vx, vy);
    player.facing = Math.atan2(vy, vx);
    player.stepPhase += dt * (player.sneaking ? 5 : 8);
  }
  if (player.pebbleCooldown > 0) player.pebbleCooldown -= dt;
}

// A click becomes a pebble when it lands on a walkable tile within range.
// Returns the landing point in pixels, or null when the throw is illegal.
export function throwPebble(player, level, worldX, worldY) {
  if (player.pebbles <= 0 || player.pebbleCooldown > 0) return null;
  const dist = Math.hypot(worldX - player.x, worldY - player.y);
  if (dist > PEBBLE_RANGE * TILE) return null;
  const col = Math.floor(worldX / TILE);
  const row = Math.floor(worldY / TILE);
  if (col < 0 || row < 0 || col >= 20 || row >= 11) return null;
  if (
    level.walls.has(`${col},${row}`) ||
    level.crates.has(`${col},${row}`)
  ) {
    return null;
  }
  player.pebbles -= 1;
  player.pebbleCooldown = 0.5;
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}
