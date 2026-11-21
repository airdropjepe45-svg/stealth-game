// Lighting: the night museum is dark except where the lamps burn.
// A cached mask per level darkens the whole playfield and punches soft
// holes at each lamp, so lamplight pools read as lit ground and the
// dark between them reads as cover — the player can see at a glance
// what is safe. The mask is built once per level and reused each frame.
import { TILE, ROWS, HUD_H, VIEW_W, VIEW_H, COLORS } from './config.js';

const NIGHT_ALPHA = 0.42;

// A full-canvas mask: darkness over the playfield, erased softly around
// every lamp. Painted over the world, under the cones and the actors,
// so the actors stay readable while the floor falls into night.
export function buildNightMask(level) {
  const mask = document.createElement('canvas');
  mask.width = VIEW_W;
  mask.height = VIEW_H;
  const m = mask.getContext('2d');
  m.fillStyle = COLORS.night;
  m.fillRect(0, HUD_H, VIEW_W, ROWS * TILE);
  m.globalCompositeOperation = 'destination-out';
  for (const lamp of level.lamps ?? []) {
    const cx = (lamp.c + 0.5) * TILE;
    const cy = HUD_H + (lamp.r + 0.5) * TILE;
    const rad = (lamp.radius ?? 2.2) * TILE;
    const g = m.createRadialGradient(cx, cy, rad * 0.15, cx, cy, rad);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.65)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g;
    m.beginPath();
    m.arc(cx, cy, rad, 0, Math.PI * 2);
    m.fill();
  }
  m.globalCompositeOperation = 'source-over';
  return mask;
}

// Warm tint on the floor where a lamp burns, drawn before the mask, plus
// the hanging lamp itself seen from above: a brass ring with a bright
// heart. The tint and the hole in the mask together make the pool glow.
export function drawLampPools(ctx, level) {
  for (const lamp of level.lamps ?? []) {
    const cx = (lamp.c + 0.5) * TILE;
    const cy = HUD_H + (lamp.r + 0.5) * TILE;
    const rad = (lamp.radius ?? 2.2) * TILE;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
    g.addColorStop(0, 'rgba(255, 196, 100, 0.26)');
    g.addColorStop(0.7, 'rgba(255, 180, 80, 0.10)');
    g.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.lampBrass;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.lampBulb;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A faint additive glow over each lamp pool, drawn after the mask, so
// the lit ground stays warm even where the mask is darkest.
export function drawLampGlow(ctx, level) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of level.lamps ?? []) {
    const cx = (lamp.c + 0.5) * TILE;
    const cy = HUD_H + (lamp.r + 0.5) * TILE;
    const rad = (lamp.radius ?? 2.2) * TILE * 0.7;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
    g.addColorStop(0, 'rgba(255, 190, 90, 0.10)');
    g.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Deep shadow pools: soft-edged dark rectangles where the detection
// meter fills slower. Drawn on the floor, before the night mask, so
// they read as the darkest, safest ground in the room.
export function drawShadowPools(ctx, level) {
  for (const s of level.shadows) {
    const x = s.x * TILE;
    const y = HUD_H + s.y * TILE;
    const w = s.w * TILE;
    const h = s.h * TILE;
    ctx.fillStyle = COLORS.shadowEdge;
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    ctx.fillStyle = 'rgba(3, 5, 12, 0.50)';
    ctx.fillRect(x, y, w, h);
  }
}
