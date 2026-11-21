// Shot staging: deterministic scenes for the three screenshots.
// ?shot=start|play|end (with &seed=N) paints one fixed scene instead of
// running the loop, paints it twice, and sets window.__shotReady.
import { TILE } from './config.js';
import { createWorld } from './world.js';
import { SCREEN_TITLE, SCREEN_CLEAR, SCREEN_PLAY } from './render.js';

// A staged mid-game moment in the Hall of Kings: the key is already
// taken, Wren is crouched behind the crate at (12, 8) while the guard
// at (16, 8) sweeps his cone past her, another guard is suspicious
// near the pebble that just landed, and the green exit waits upstairs.
function stagePlayShot() {
  const world = createWorld(1, 3);
  world.keyTaken = true;
  world.timer = 83;
  const p = world.player;
  p.x = (12.5) * TILE;
  p.y = (8.5) * TILE;
  p.sneaking = true;
  p.facing = Math.PI;
  p.pebbles = 2;
  const [gA, gB, gC] = world.guards;
  gA.x = (13.5) * TILE;
  gA.y = (6.5) * TILE;
  gA.facing = Math.PI * 0.75;
  gA.state = 'suspicious';
  gA.meter = 0.62;
  gB.x = (5.5) * TILE;
  gB.y = (9.5) * TILE;
  gB.facing = 0;
  gB.state = 'patrol';
  gC.x = (16.5) * TILE;
  gC.y = (8.5) * TILE;
  gC.facing = Math.PI;
  gC.state = 'patrol';
  world.alertLevel = 'suspicious';
  world.maxAlertThisLevel = 'suspicious';
  world.pebbleMarks.push({ x: (11.5) * TILE, y: (6.5) * TILE, ttl: 3.2 });
  return { world, screen: SCREEN_PLAY, best: 0 };
}

function stageEndShot() {
  const world = createWorld(0, 3);
  world.timer = 74.2;
  world.maxAlertThisLevel = 'calm';
  return { world, screen: SCREEN_CLEAR, best: 0 };
}

export function stageShot(name) {
  if (name === 'start') {
    const world = createWorld(0, 3);
    return { world, screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') return stagePlayShot();
  if (name === 'end') return stageEndShot();
  return null;
}
