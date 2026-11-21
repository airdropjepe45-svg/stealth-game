// Renderer: paints the museum from above, the guards' vision cones,
// the HUD strip, and every screen (title, pause, level clear, caught,
// win). Everything is drawn on one 1280 x 800 canvas.
import { TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, COLORS } from './config.js';
import { conePolygon } from './vision.js';
import { GUARD_ALERTED_STATE, GUARD_SUSPICIOUS_STATE } from './guards.js';
import { exitIsOpen } from './world.js';
import { buildNightMask, drawLampPools, drawLampGlow, drawShadowPools } from './lighting.js';
import { floorShade, drawFloorMarks, drawRugs, drawPaintings, drawPlants, drawStatues } from './decor.js';

// The night mask is built once per level and reused every frame.
let maskLevel = -1;
let maskCanvas = null;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(renderer, world) {
  const { ctx } = renderer;
  const { level } = world;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const x = c * TILE;
      const y = HUD_H + r * TILE;
      ctx.fillStyle = floorShade(c, r);
      ctx.fillRect(x, y, TILE, TILE);
      drawFloorMarks(ctx, c, r);
      ctx.strokeStyle = COLORS.floorLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawWalls(renderer, world) {
  const { ctx } = renderer;
  const { level } = world;
  for (const key of level.walls) {
    const [c, r] = key.split(',').map(Number);
    const x = c * TILE;
    const y = HUD_H + r * TILE;
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x, y, TILE, 5);
    // A gilt skirting line where the wall meets the floor.
    ctx.fillStyle = COLORS.wallTrim;
    ctx.fillRect(x, y + TILE - 3, TILE, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }
  drawPaintings(ctx, level);
}

function drawCrates(renderer, world) {
  const { ctx } = renderer;
  for (const key of world.level.crates) {
    const [c, r] = key.split(',').map(Number);
    const x = c * TILE + 6;
    const y = HUD_H + r * TILE + 6;
    const s = TILE - 12;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = COLORS.crateEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.stroke();
  }
}

function drawBushes(renderer, world) {
  const { ctx } = renderer;
  for (const key of world.level.bushes) {
    const [c, r] = key.split(',').map(Number);
    const cx = c * TILE + TILE / 2;
    const cy = HUD_H + r * TILE + TILE / 2;
    ctx.fillStyle = COLORS.bush;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bushLeaf;
    for (const [ox, oy, rad] of [[-10, -8, 11], [10, -6, 12], [0, 10, 11], [12, 10, 8]]) {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(renderer, world) {
  const { ctx } = renderer;
  const { exit } = world.level;
  if (!exit) return;
  const cx = exit.col * TILE + TILE / 2;
  const cy = HUD_H + exit.row * TILE + TILE / 2;
  const open = exitIsOpen(world);
  ctx.save();
  ctx.shadowColor = open ? COLORS.exit : '#666';
  ctx.shadowBlur = open ? 22 : 6;
  ctx.fillStyle = open ? COLORS.exit : '#5a6274';
  roundRect(ctx, cx - 24, cy - 26, 48, 52, 6);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0e2418';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? '→' : '🔒', cx, cy + 1);
  if (!open) {
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '11px sans-serif';
    ctx.fillText('LOCKED', cx, cy + 36);
  }
}

function drawExitGlow(renderer, world) {
  const { ctx } = renderer;
  const { exit } = world.level;
  if (!exit || !exitIsOpen(world)) return;
  const cx = exit.col * TILE + TILE / 2;
  const cy = HUD_H + exit.row * TILE + TILE / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 110);
  g.addColorStop(0, 'rgba(57, 217, 138, 0.20)');
  g.addColorStop(1, 'rgba(57, 217, 138, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPickup(renderer, world, point, kind) {
  const { ctx } = renderer;
  if (!point) return;
  const cx = point.col * TILE + TILE / 2;
  const cy = HUD_H + point.row * TILE + TILE / 2;
  // The Star Sapphire rests on a stone plinth; the key hangs bare.
  if (kind === 'sapphire') {
    ctx.fillStyle = COLORS.statueBase;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.statue;
    ctx.fillRect(cx - 10, cy + 2, 20, 10);
  }
  ctx.save();
  ctx.shadowColor = kind === 'key' ? COLORS.key : '#7ec8ff';
  ctx.shadowBlur = 16;
  ctx.fillStyle = kind === 'key' ? COLORS.key : '#7ec8ff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx + 11, cy);
  ctx.lineTo(cx, cy + 14);
  ctx.lineTo(cx - 11, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCones(renderer, world) {
  const { ctx } = renderer;
  for (const guard of world.guards) {
    const poly = conePolygon(world.level, { x: guard.x, y: guard.y + 0, facing: guard.facing }, 5.2 * TILE);
    // conePolygon works in playfield coordinates; shift by the HUD strip.
    const shifted = poly.map((p) => ({ x: p.x, y: p.y + HUD_H }));
    const color =
      guard.state === GUARD_ALERTED_STATE
        ? COLORS.coneAlerted
        : guard.state === GUARD_SUSPICIOUS_STATE
          ? COLORS.coneSuspicious
          : COLORS.coneCalm;
    const edge =
      guard.state === GUARD_ALERTED_STATE
        ? COLORS.coneEdgeAlerted
        : guard.state === GUARD_SUSPICIOUS_STATE
          ? COLORS.coneEdgeSuspicious
          : COLORS.coneEdgeCalm;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(shifted[0].x, shifted[0].y);
    for (let i = 1; i < shifted.length; i += 1) ctx.lineTo(shifted[i].x, shifted[i].y);
    ctx.closePath();
    ctx.fill();
    // A bright rim so the cone's edge reads at a glance, even in the dark.
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPebbleMarks(renderer, world) {
  const { ctx } = renderer;
  for (const mark of world.pebbleMarks) {
    const alpha = Math.min(1, mark.ttl);
    ctx.strokeStyle = `rgba(255, 220, 120, ${0.8 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mark.x, HUD_H + mark.y, 10 + (4 - mark.ttl) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 220, 120, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mark.x, HUD_H + mark.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuard(renderer, guard) {
  const { ctx } = renderer;
  const x = guard.x;
  const y = HUD_H + guard.y;
  // A pale ring under the guard, so he reads against any floor, lit or dark.
  ctx.strokeStyle = COLORS.guardRing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, Math.PI * 2);
  ctx.stroke();
  // Body: a night watchman in a dark navy coat over a red tunic.
  ctx.fillStyle = COLORS.guardCoat;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  // Brass buttons down the tunic.
  ctx.fillStyle = COLORS.guardButton;
  ctx.beginPath();
  ctx.arc(x, y - 4, 1.8, 0, Math.PI * 2);
  ctx.arc(x, y + 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // A pale face looking the way he faces, under a dark cap with a brim.
  const fx = Math.cos(guard.facing);
  const fy = Math.sin(guard.facing);
  ctx.fillStyle = COLORS.guardFace;
  ctx.beginPath();
  ctx.arc(x + fx * 7, y + fy * 7, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + fx * 10, y + fy * 10);
  ctx.lineTo(x + fx * 19, y + fy * 19);
  ctx.stroke();
  // Detection meter arc over his head.
  if (guard.meter > 0.04) {
    ctx.strokeStyle = guard.meter >= 1 ? '#ff5040' : '#ffc23d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, guard.meter));
    ctx.stroke();
  }
  // "?" while suspicious, "!" while alerted.
  if (guard.state === GUARD_SUSPICIOUS_STATE) {
    ctx.fillStyle = '#ffc23d';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x, y - 26);
  } else if (guard.state === GUARD_ALERTED_STATE) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y - 26);
  }
}

function drawPlayer(renderer, world) {
  const { ctx } = renderer;
  const { player } = world;
  const x = player.x;
  const y = HUD_H + player.y;
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  const r = player.sneaking ? 11 : 13;
  // A pale ring under Wren, so the thief reads against any floor.
  ctx.strokeStyle = COLORS.playerRing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y + bob, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(x, y + bob, r + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(x, y + bob, r, 0, Math.PI * 2);
  ctx.fill();
  // Hood point in the direction of travel.
  ctx.fillStyle = '#0b3d39';
  ctx.beginPath();
  ctx.arc(
    x + Math.cos(player.facing) * (r - 2),
    y + bob + Math.sin(player.facing) * (r - 2),
    4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(53, 196, 181, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + bob, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function drawHud(renderer, world) {
  const { ctx } = renderer;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`◆ ${world.level.name}`, 16, HUD_H / 2);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  const obj = world.level.objective;
  ctx.fillText(obj, 300, HUD_H / 2);
  // Right side: key/sapphire, pebbles, lives, timer, alert word.
  let x = VIEW_W - 16;
  ctx.textAlign = 'right';
  const alertWord =
    world.alertLevel === 'alerted'
      ? 'ALERTED'
      : world.alertLevel === 'suspicious'
        ? 'SUSPICIOUS'
        : 'UNSEEN';
  ctx.fillStyle =
    world.alertLevel === 'alerted'
      ? '#ff6a5c'
      : world.alertLevel === 'suspicious'
        ? '#ffc23d'
        : '#39d98a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(alertWord, x, HUD_H / 2);
  x -= 110;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '15px sans-serif';
  ctx.fillText(formatTime(world.timer), x, HUD_H / 2);
  x -= 70;
  ctx.fillStyle = '#ff7d7d';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)), x, HUD_H / 2);
  x -= 70;
  ctx.fillStyle = '#e8c96a';
  ctx.fillText('●'.repeat(Math.max(0, world.player.pebbles)), x, HUD_H / 2);
  x -= 66;
  if (world.level.needsKey) {
    ctx.fillStyle = world.keyTaken ? COLORS.key : '#5a6274';
    ctx.fillText(world.keyTaken ? 'KEY ✓' : 'KEY …', x, HUD_H / 2);
    x -= 74;
  }
  if (world.level.needsSapphire) {
    ctx.fillStyle = world.sapphireTaken ? '#7ec8ff' : '#5a6274';
    ctx.fillText(world.sapphireTaken ? 'GEM ✓' : 'GEM …', x, HUD_H / 2);
  }
  // Bottom hint strip.
  ctx.fillStyle = '#0b0e17';
  ctx.fillRect(0, VIEW_H - 48, VIEW_W, 48);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    'WASD / arrows — move    Shift — sneak    Click — throw a pebble    P — pause    M — mute',
    16,
    VIEW_H - 24,
  );
}

function drawPlay(renderer, world) {
  // Floor first: marble, rugs, deep shadow pools, then lamplight.
  drawFloor(renderer, world);
  drawRugs(renderer.ctx, world.level);
  drawShadowPools(renderer.ctx, world.level);
  drawLampPools(renderer.ctx, world.level);
  drawPlants(renderer.ctx, world.level);
  drawStatues(renderer.ctx, world.level);
  drawWalls(renderer, world);
  drawExit(renderer, world);
  if (world.level.key && !world.keyTaken) {
    drawPickup(renderer, world, world.level.key, 'key');
  }
  if (world.level.sapphire && !world.sapphireTaken) {
    drawPickup(renderer, world, world.level.sapphire, 'sapphire');
  }
  drawBushes(renderer, world);
  drawCrates(renderer, world);
  // Night falls over the room: the cached mask darkens everything
  // except the lamplight pools. Cones, actors and the HUD are painted
  // after it, so they stay bright and readable in the dark.
  if (maskLevel !== world.level.index || !maskCanvas) {
    maskCanvas = buildNightMask(world.level);
    maskLevel = world.level.index;
  }
  renderer.ctx.drawImage(maskCanvas, 0, 0);
  drawLampGlow(renderer.ctx, world.level);
  drawCones(renderer, world);
  drawExitGlow(renderer, world);
  drawPebbleMarks(renderer, world);
  for (const guard of world.guards) drawGuard(renderer, guard);
  drawPlayer(renderer, world);
  drawHud(renderer, world);
}

function dimScreen(renderer) {
  const { ctx } = renderer;
  ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(renderer, w, h) {
  const { ctx } = renderer;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#141a2b';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = '#3d4a6b';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  return { x, y, w, h };
}

function centerText(renderer, text, y, font, color) {
  const { ctx } = renderer;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, y);
}

function drawTitle(renderer, bestMs) {
  const { ctx } = renderer;
  ctx.fillStyle = '#0b0e17';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A faint museum hall behind the title: columns and a glow.
  ctx.fillStyle = '#141a2b';
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(90 + i * 200, 90, 46, 620);
  }
  ctx.fillStyle = 'rgba(255, 211, 77, 0.10)';
  ctx.beginPath();
  ctx.arc(VIEW_W / 2, 300, 220, 0, Math.PI * 2);
  ctx.fill();
  centerText(renderer, 'THE GILDED VAULT', 180, 'bold 64px Georgia, serif', COLORS.gold);
  centerText(renderer, 'A night-museum stealth game', 226, '22px Georgia, serif', COLORS.hudText);
  centerText(renderer, 'Wren the thief is inside. Three wings — and more guards in every one.', 262, '17px sans-serif', COLORS.hudDim);
  centerText(renderer, 'Reach the green door unseen — and take the Star Sapphire.', 288, '17px sans-serif', COLORS.hudDim);
  const p = panel(renderer, 560, 180);
  centerText(renderer, 'HOW TO SNEAK', p.y + 30, 'bold 16px sans-serif', COLORS.gold);
  const lines = [
    'WASD / arrows — move        Shift — sneak (slower, harder to spot)',
    'Click — throw a pebble to pull a guard away',
    'Stay out of the yellow cones. Crouch in bushes. Mind the shadows.',
    'Yellow ? — a guard is suspicious. Red ! — run, you have been seen.',
  ];
  lines.forEach((line, i) => {
    centerText(renderer, line, p.y + 64 + i * 28, '15px sans-serif', COLORS.hudText);
  });
  centerText(renderer, 'Press Enter or click to begin', 600, 'bold 20px sans-serif', '#39d98a');
  if (bestMs > 0) {
    centerText(renderer, `Best escape: ${formatTime(bestMs / 1000)}`, 636, '15px sans-serif', COLORS.hudDim);
  }
}

function drawPaused(renderer) {
  dimScreen(renderer);
  centerText(renderer, 'PAUSED', VIEW_H / 2 - 30, 'bold 44px Georgia, serif', COLORS.hudText);
  centerText(renderer, 'Press P or Enter to keep sneaking', VIEW_H / 2 + 24, '17px sans-serif', COLORS.hudDim);
}

function drawClear(renderer, world, rating) {
  drawPlay(renderer, world);
  dimScreen(renderer);
  const p = panel(renderer, 520, 300);
  centerText(renderer, 'LEVEL CLEAR', p.y + 52, 'bold 40px Georgia, serif', '#39d98a');
  centerText(renderer, world.level.name, p.y + 100, '20px sans-serif', COLORS.hudText);
  centerText(renderer, `Time  ${formatTime(world.timer)}`, p.y + 146, '18px sans-serif', COLORS.hudText);
  centerText(renderer, `Rating  ${rating}`, p.y + 182, 'bold 20px sans-serif', COLORS.gold);
  centerText(renderer, 'Press Enter for the next wing', p.y + 240, '16px sans-serif', COLORS.hudDim);
}

function drawOver(renderer, world) {
  drawPlay(renderer, world);
  dimScreen(renderer);
  const p = panel(renderer, 520, 260);
  centerText(renderer, 'CAUGHT!', p.y + 52, 'bold 40px Georgia, serif', '#ff6a5c');
  centerText(renderer, 'The night watch found Wren in the lamplight.', p.y + 100, '17px sans-serif', COLORS.hudText);
  centerText(renderer, `Lives left: ${world.lives}`, p.y + 140, '17px sans-serif', COLORS.hudText);
  centerText(renderer, 'Press Enter to try the wing again', p.y + 196, '16px sans-serif', COLORS.hudDim);
}

function drawWin(renderer, totalMs, bestMs, isBest) {
  const { ctx } = renderer;
  ctx.fillStyle = '#0b0e17';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(126, 200, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(VIEW_W / 2, 300, 240, 0, Math.PI * 2);
  ctx.fill();
  centerText(renderer, 'THE SAPPHIRE IS YOURS', 230, 'bold 52px Georgia, serif', '#7ec8ff');
  centerText(renderer, 'Wren slips into the night, the Star Sapphire in her pocket.', 288, '19px sans-serif', COLORS.hudText);
  centerText(renderer, `Total time  ${formatTime(totalMs / 1000)}`, 350, '20px sans-serif', COLORS.gold);
  if (isBest) centerText(renderer, 'A new best escape!', 388, '17px sans-serif', '#39d98a');
  else if (bestMs > 0) centerText(renderer, `Best escape: ${formatTime(bestMs / 1000)}`, 388, '16px sans-serif', COLORS.hudDim);
  centerText(renderer, 'Press Enter to play again', 470, '17px sans-serif', COLORS.hudDim);
}

export function draw(renderer, world, screen, extra) {
  const { ctx } = renderer;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (screen === SCREEN_TITLE) drawTitle(renderer, extra?.bestMs ?? 0);
  else if (screen === SCREEN_PAUSED) {
    drawPlay(renderer, world);
    drawPaused(renderer);
  } else if (screen === SCREEN_CLEAR) drawClear(renderer, world, extra?.rating ?? 'GHOST');
  else if (screen === SCREEN_OVER) drawOver(renderer, world);
  else if (screen === SCREEN_WIN) {
    drawWin(renderer, extra?.totalMs ?? 0, extra?.bestMs ?? 0, extra?.isBest ?? false);
  } else drawPlay(renderer, world);
}

export function ratingFor(world) {
  if (world.maxAlertThisLevel === 'alerted') return 'LOUD';
  if (world.maxAlertThisLevel === 'suspicious') return 'SHADOW';
  return 'GHOST';
}
