// The Gilded Vault — shared constants for the whole game.
// One tile is 64 px. The playfield is 20 x 11 tiles under a 48 px HUD strip.
export const TILE = 64;
export const COLS = 20;
export const ROWS = 11;
export const HUD_H = 48;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE + 48; // 800

export const STEP = 1 / 60;

export const BEST_KEY = 'gilded-vault-best-ms';

// Movement speeds, in tiles per second.
export const PLAYER_WALK = 3.4;
export const PLAYER_SNEAK = 1.9;
export const GUARD_PATROL = 1.5;
export const GUARD_INVESTIGATE = 2.1;
export const GUARD_CHASE = 2.6;

// Vision: how far a guard sees, and how wide the cone is.
export const VISION_RANGE = 5.2; // tiles
export const VISION_HALF_ANGLE = 0.61; // radians (~35 degrees)

// Detection meter: 0 = unseen, 0.45 = suspicious, 1 = alerted.
export const METER_SUSPICIOUS = 0.45;
export const METER_ALERTED = 1.0;
export const METER_DECAY = 0.55; // per second while unseen
export const METER_FILL_CLOSE = 1.05; // per second, player within 2 tiles
export const METER_FILL_FAR = 0.5; // per second, player at the edge of the cone
export const SNEAK_FACTOR = 0.55; // sneaking fills the meter slower
export const SHADOW_FACTOR = 0.6; // standing in a shadow fills it slower
export const BUSH_HIDE_DIST = 1.25; // tiles: closer than this a guard sees into a bush

export const PEBBLES_PER_LEVEL = 3;
export const PEBBLE_RANGE = 7; // tiles from the player
export const PEBBLE_HEARING = 6; // tiles a guard hears a pebble from
export const LIVES = 3;

// Palette: a night museum — deep blue floors, warm lamplight, red alert.
export const COLORS = {
  floorA: '#1c2438',
  floorB: '#202a41',
  floorLine: '#2a3550',
  wall: '#3a2f4d',
  wallTop: '#5d4a7d',
  crate: '#7a5a34',
  crateEdge: '#a07d4a',
  bush: '#1f4d2e',
  bushLeaf: '#2f6b3f',
  shadow: 'rgba(6, 8, 18, 0.55)',
  exit: '#39d98a',
  exitGlow: 'rgba(57, 217, 138, 0.35)',
  key: '#ffd34d',
  player: '#35c4b5',
  playerCloak: '#1f8a80',
  guard: '#e0564b',
  guardDark: '#8f2f27',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 166, 40, 0.30)',
  coneAlerted: 'rgba(255, 70, 60, 0.34)',
  hudBg: '#10141f',
  hudText: '#e8e2d0',
  hudDim: '#9aa3b8',
  gold: '#ffd34d',
};
