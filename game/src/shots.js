// Shot staging: deterministic gameplay scenes for the four screenshots.
// ?shot=cover|vault|alert|sneak (with &seed=N) paints one fixed scene
// instead of running the loop, paints it twice, and sets
// window.__shotReady. Every scene is live gameplay — a top-down level,
// guards with vision cones, cover, and the exit — never a menu screen.
import { TILE } from './config.js';
import { createWorld } from './world.js';
import { SCREEN_PLAY } from './render.js';

// The cover: Hall of Kings at its tensest. The Golden Key is taken and
// the green exit waits open at the top right. Wren crouches sneaking
// behind a crate while one guard sweeps his yellow cone straight at
// her and a second guard, already suspicious with a "?" over his head,
// closes in from above; a pebble that just landed rings on the floor.
function stageCoverShot() {
  const world = createWorld(1, 3);
  world.keyTaken = true;
  world.timer = 83;
  const p = world.player;
  p.x = 12.5 * TILE;
  p.y = 8.5 * TILE;
  p.sneaking = true;
  p.facing = Math.PI;
  p.pebbles = 2;
  const [gA, gB, gC] = world.guards;
  gA.x = 13.5 * TILE;
  gA.y = 6.5 * TILE;
  gA.facing = Math.PI * 0.75;
  gA.state = 'suspicious';
  gA.meter = 0.62;
  gB.x = 5.5 * TILE;
  gB.y = 9.5 * TILE;
  gB.facing = 0;
  gB.state = 'patrol';
  gC.x = 16.5 * TILE;
  gC.y = 8.5 * TILE;
  gC.facing = Math.PI;
  gC.state = 'patrol';
  world.alertLevel = 'suspicious';
  world.maxAlertThisLevel = 'suspicious';
  world.pebbleMarks.push({ x: 11.5 * TILE, y: 6.5 * TILE, ttl: 3.2 });
  return { world, screen: SCREEN_PLAY, best: 0 };
}

// The Vault: Wren sneaks down on the Star Sapphire on its plinth while
// a guard's cone sweeps the gallery and three more patrol below; the
// exit is still locked grey until the gem is taken.
function stageVaultShot() {
  const world = createWorld(2, 3);
  world.timer = 127;
  const p = world.player;
  p.x = 9.5 * TILE;
  p.y = 4.5 * TILE;
  p.sneaking = true;
  p.facing = Math.PI / 2;
  p.pebbles = 3;
  const [gA, gB, gC, gD] = world.guards;
  gA.x = 14.5 * TILE;
  gA.y = 5.5 * TILE;
  gA.facing = Math.PI;
  gA.state = 'patrol';
  gB.x = 6.5 * TILE;
  gB.y = 9.5 * TILE;
  gB.facing = 0;
  gB.state = 'patrol';
  gC.x = 13.5 * TILE;
  gC.y = 9.5 * TILE;
  gC.facing = -Math.PI / 2;
  gC.state = 'patrol';
  gD.x = 5.5 * TILE;
  gD.y = 5.5 * TILE;
  gD.facing = Math.PI / 2;
  gD.state = 'patrol';
  world.alertLevel = 'calm';
  world.maxAlertThisLevel = 'calm';
  return { world, screen: SCREEN_PLAY, best: 0 };
}

// The near-miss: the Garden Wing, an alerted guard with a red "!" and
// a full meter runs his red cone straight at Wren as she flees; the
// HUD reads ALERTED and one pebble is left.
function stageAlertShot() {
  const world = createWorld(0, 3);
  world.timer = 47;
  const p = world.player;
  p.x = 10.5 * TILE;
  p.y = 5.5 * TILE;
  p.sneaking = false;
  p.facing = Math.PI;
  p.moving = true;
  p.stepPhase = 1.2;
  p.pebbles = 1;
  const [gA, gB] = world.guards;
  gA.x = 12.5 * TILE;
  gA.y = 5.5 * TILE;
  gA.facing = Math.PI;
  gA.state = 'alerted';
  gA.meter = 1.0;
  gB.x = 5.5 * TILE;
  gB.y = 9.5 * TILE;
  gB.facing = 0;
  gB.state = 'patrol';
  world.alertLevel = 'alerted';
  world.maxAlertThisLevel = 'alerted';
  return { world, screen: SCREEN_PLAY, best: 0 };
}

// The quiet one: the Garden Wing, Wren sneaking inside a bush beside a
// deep shadow pool while a guard's yellow cone sweeps just past her and
// another patrols the far gallery; the HUD reads UNSEEN.
function stageSneakShot() {
  const world = createWorld(0, 3);
  world.timer = 31;
  const p = world.player;
  p.x = 3.5 * TILE;
  p.y = 7.5 * TILE;
  p.sneaking = true;
  p.facing = 0;
  p.pebbles = 3;
  const [gA, gB] = world.guards;
  gA.x = 13.5 * TILE;
  gA.y = 5.5 * TILE;
  gA.facing = Math.PI;
  gA.state = 'patrol';
  gB.x = 5.5 * TILE;
  gB.y = 9.5 * TILE;
  gB.facing = -Math.PI / 2;
  gB.state = 'patrol';
  world.alertLevel = 'calm';
  world.maxAlertThisLevel = 'calm';
  return { world, screen: SCREEN_PLAY, best: 0 };
}

export function stageShot(name) {
  if (name === 'cover') return stageCoverShot();
  if (name === 'vault') return stageVaultShot();
  if (name === 'alert') return stageAlertShot();
  if (name === 'sneak') return stageSneakShot();
  return null;
}
