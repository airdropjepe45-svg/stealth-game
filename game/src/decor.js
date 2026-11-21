// Museum dressing: marble floor variation, red-carpet runners, framed
// paintings on the walls, potted plants and statues. All of it is flat
// decoration on floor or wall tiles — it never blocks movement or sight,
// so the levels play exactly as before, they only look like a museum.
import { TILE, HUD_H, COLORS } from './config.js';

// A stable per-tile hash, so the floor reads the same every run.
function tileHash(c, r) {
  return (c * 73 + r * 149 + 41) % 100;
}

// One of three marble tones for a floor tile: mostly the checkerboard,
// every eighth tile a lighter slab.
export function floorShade(c, r) {
  const h = tileHash(c, r);
  if (h < 12) return COLORS.floorC;
  return (c + r) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
}

// Speckles and veins on a floor tile: a few dark dots, sometimes a
// pale hairline crack, placed by the same hash.
export function drawFloorMarks(ctx, c, r) {
  const h = tileHash(c, r);
  const x = c * TILE;
  const y = HUD_H + r * TILE;
  ctx.fillStyle = COLORS.floorSpeck;
  const dots = [[14, 18], [44, 40], [30, 52]];
  for (const [dx, dy] of dots) {
    if ((h + dx + dy) % 7 < 3) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (h >= 12 && h < 18) {
    ctx.strokeStyle = COLORS.floorVein;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 50);
    ctx.lineTo(x + 34, y + 22);
    ctx.lineTo(x + 56, y + 30);
    ctx.stroke();
  }
}

// Red-carpet runners with a gold border and a centre stripe.
export function drawRugs(ctx, level) {
  for (const rug of level.rugs ?? []) {
    const x = rug.x * TILE;
    const y = HUD_H + rug.y * TILE;
    const w = rug.w * TILE;
    const h = rug.h * TILE;
    ctx.fillStyle = COLORS.rug;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.rugInner;
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    ctx.strokeStyle = COLORS.rugBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 11.5, y + 11.5, w - 23, h - 23);
  }
}

function drawLandscape(ctx, x, y, w, h) {
  ctx.fillStyle = '#e8c98a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7ba7c9';
  ctx.fillRect(x, y, w, h * 0.55);
  ctx.fillStyle = '#f4e3b0';
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4d7a4a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.4, y + h * 0.45);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawPortrait(ctx, x, y, w, h) {
  ctx.fillStyle = '#3a2f3d';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f2d7c9';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.38, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#232c4e';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h);
  ctx.quadraticCurveTo(x + w / 2, y + h * 0.55, x + w * 0.8, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawSeascape(ctx, x, y, w, h) {
  ctx.fillStyle = '#2c4a6b';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e8e2d0';
  ctx.beginPath();
  ctx.arc(x + w * 0.25, y + h * 0.28, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232, 226, 208, 0.8)';
  ctx.lineWidth = 2;
  for (const wy of [0.62, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * wy);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * (wy - 0.08), x + w * 0.55, y + h * wy);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * (wy + 0.08), x + w - 4, y + h * wy);
    ctx.stroke();
  }
}

// Framed paintings on wall tiles: a gold frame and a tiny scene inside,
// drawn in the lower half of the tile so they face the room.
export function drawPaintings(ctx, level) {
  for (const p of level.paintings ?? []) {
    const x = p.c * TILE + 10;
    const y = HUD_H + p.r * TILE + 16;
    const w = TILE - 20;
    const h = 34;
    ctx.fillStyle = COLORS.paintingFrame;
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (p.kind === 'portrait') drawPortrait(ctx, x, y, w, h);
    else if (p.kind === 'seascape') drawSeascape(ctx, x, y, w, h);
    else drawLandscape(ctx, x, y, w, h);
    ctx.restore();
  }
}

// A potted plant tucked into a floor tile's corner: terracotta pot with
// three leafy crowns above it.
export function drawPlants(ctx, level) {
  for (const p of level.plants ?? []) {
    const cx = p.c * TILE + 16;
    const cy = HUD_H + p.r * TILE + 18;
    ctx.fillStyle = COLORS.plantLeaf;
    for (const [ox, oy, rad] of [[-8, -12, 9], [8, -12, 9], [0, -20, 10]]) {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.plantLeaf2;
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 14, 5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.plantPot;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 4);
    ctx.lineTo(cx + 9, cy - 4);
    ctx.lineTo(cx + 6, cy + 12);
    ctx.lineTo(cx - 6, cy + 12);
    ctx.closePath();
    ctx.fill();
  }
}

// A stone statue on a square plinth, tucked into a floor tile's corner.
export function drawStatues(ctx, level) {
  for (const s of level.statues ?? []) {
    const cx = s.c * TILE + 46;
    const cy = HUD_H + s.r * TILE + 46;
    ctx.fillStyle = COLORS.statueBase;
    ctx.fillRect(cx - 11, cy + 4, 22, 10);
    ctx.fillStyle = COLORS.statue;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + 6);
    ctx.quadraticCurveTo(cx, cy - 6, cx + 9, cy + 6);
    ctx.closePath();
    ctx.fill();
  }
}
