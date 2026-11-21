// The Gilded Vault — three night-museum levels, drawn as ASCII maps.
// Every row is exactly 20 characters wide, 11 rows tall.
// Legend: '#' wall, '.' floor, 'C' crate (blocks sight and movement),
// 'B' bush (hides the player), 'P' player start, 'E' exit,
// 'K' golden key, 'S' the Star Sapphire. Guards are placed by the
// 'guards' lists below; each guard walks its waypoints and waits at each.
const MAPS = [
  {
    name: 'The Garden Wing',
    subtitle: 'Slip past the night watch and reach the green door.',
    objective: 'Reach the exit unseen',
    needsKey: false,
    needsSapphire: false,
    map: [
      '####################',
      '#P....C......#....E#',
      '#.....C......#.....#',
      '#..B...###...#..B..#',
      '#......#.....#.....#',
      '#..C...#..G.....C..#',
      '#......#.....C.....#',
      '#..B...###....B....#',
      '#.....C.....C......#',
      '#..G......C....C...#',
      '####################',
    ],
    guards: [
      { start: [10, 5], waypoints: [[10, 5], [15, 5]], pause: 1.4 },
      { start: [3, 9], waypoints: [[3, 9], [8, 9]], pause: 1.2 },
    ],
    shadows: [
      { x: 1, y: 7, w: 2, h: 1 },
      { x: 9, y: 2, w: 2, h: 1 },
    ],
    // Hanging lamps (tile centres; radius in tiles) — their pools of
    // warm light are the bright ground; the dark between them is cover.
    lamps: [
      { c: 5, r: 2, radius: 2.2 },
      { c: 14, r: 2, radius: 2.2 },
      { c: 5, r: 8, radius: 2.2 },
      { c: 14, r: 8, radius: 2.2 },
    ],
    // Flat red-carpet runners on floor tiles (decoration only).
    rugs: [
      { x: 4, y: 1, w: 1, h: 9 },
      { x: 10, y: 4, w: 5, h: 1 },
    ],
    // Potted plants and statues at floor-tile corners (decoration only).
    plants: [
      { c: 1, r: 2 },
      { c: 18, r: 2 },
      { c: 1, r: 8 },
      { c: 18, r: 8 },
    ],
    statues: [
      { c: 10, r: 3 },
      { c: 16, r: 6 },
    ],
  },
  {
    name: 'Hall of Kings',
    subtitle: 'The Golden Key hangs in the gallery. Take it, then leave.',
    objective: 'Take the Golden Key, then reach the exit',
    needsKey: true,
    needsSapphire: false,
    map: [
      '####################',
      '#P...C....###.....E#',
      '#....C....#.....#..#',
      '#..B......#..K..#..#',
      '#....###..#.....#..#',
      '#..C..#...#..G..#..#',
      '#.....#...#.....#..#',
      '#..B..#...###..B...#',
      '#.....#......C..G..#',
      '#..G.....C.....C...#',
      '####################',
    ],
    guards: [
      { start: [13, 5], waypoints: [[13, 5], [13, 7]], pause: 1.0 },
      { start: [3, 9], waypoints: [[3, 9], [8, 9]], pause: 1.2 },
      { start: [16, 8], waypoints: [[16, 8], [18, 8]], pause: 1.6 },
    ],
    shadows: [
      { x: 1, y: 6, w: 2, h: 1 },
      { x: 10, y: 2, w: 2, h: 1 },
      { x: 10, y: 8, w: 2, h: 1 },
    ],
    lamps: [
      { c: 4, r: 2, radius: 2.2 },
      { c: 15, r: 2, radius: 2.2 },
      { c: 4, r: 8, radius: 2.2 },
      { c: 15, r: 8, radius: 2.2 },
    ],
    rugs: [
      { x: 2, y: 1, w: 1, h: 9 },
      { x: 10, y: 6, w: 5, h: 1 },
    ],
    plants: [
      { c: 1, r: 5 },
      { c: 18, r: 3 },
      { c: 18, r: 6 },
      { c: 1, r: 8 },
    ],
    statues: [
      { c: 10, r: 2 },
      { c: 16, r: 5 },
    ],
  },
  {
    name: 'The Vault',
    subtitle: 'The Star Sapphire waits in the heart of the museum.',
    objective: 'Steal the Star Sapphire, then reach the exit',
    needsKey: false,
    needsSapphire: true,
    map: [
      '####################',
      '#P..C....#....C...E#',
      '#....C...#....C....#',
      '#..B....###...B....#',
      '#.......#.#...#....#',
      '#..C....#S....G....#',
      '#.......#.#...#....#',
      '#..B.G..###...B....#',
      '#....C....C...C....#',
      '#..G....C...G....C.#',
      '####################',
    ],
    guards: [
      { start: [14, 5], waypoints: [[14, 5], [18, 5]], pause: 0.8 },
      { start: [3, 9], waypoints: [[3, 9], [7, 9]], pause: 1.0 },
      { start: [12, 9], waypoints: [[12, 9], [16, 9]], pause: 1.2 },
      { start: [5, 7], waypoints: [[5, 7], [5, 3]], pause: 1.4 },
    ],
    shadows: [
      { x: 1, y: 5, w: 2, h: 1 },
      { x: 16, y: 5, w: 2, h: 1 },
      { x: 9, y: 8, w: 3, h: 1 },
    ],
    lamps: [
      { c: 4, r: 2, radius: 2.2 },
      { c: 15, r: 2, radius: 2.2 },
      { c: 4, r: 8, radius: 2.2 },
      { c: 15, r: 8, radius: 2.2 },
    ],
    rugs: [
      { x: 2, y: 1, w: 1, h: 9 },
      { x: 2, y: 4, w: 5, h: 1 },
    ],
    plants: [
      { c: 1, r: 2 },
      { c: 18, r: 2 },
      { c: 1, r: 8 },
      { c: 18, r: 8 },
    ],
    statues: [
      { c: 10, r: 1 },
      { c: 16, r: 4 },
    ],
  },
];

// Parse one ASCII map into a grid the game can query.
// Returns { walls, crates, bushes, player, exit, key, sapphire } where
// walls/crates/bushes are Sets of "col,row" keys and the rest are
// {col, row} points (or null when the level has none).
export function parseLevelMap(rows) {
  const walls = new Set();
  const crates = new Set();
  const bushes = new Set();
  let player = null;
  let exit = null;
  let key = null;
  let sapphire = null;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) {
      const ch = row[c];
      const k = `${c},${r}`;
      if (ch === '#') walls.add(k);
      else if (ch === 'C') crates.add(k);
      else if (ch === 'B') bushes.add(k);
      else if (ch === 'P') player = { col: c, row: r };
      else if (ch === 'E') exit = { col: c, row: r };
      else if (ch === 'K') key = { col: c, row: r };
      else if (ch === 'S') sapphire = { col: c, row: r };
    }
  });
  return { walls, crates, bushes, player, exit, key, sapphire };
}

export function buildLevel(index) {
  const def = MAPS[index];
  const parsed = parseLevelMap(def.map);
  // Paintings hang on wall tiles that face the room (walkable tile
  // below), a deterministic subset so the gallery reads the same every
  // run. Kinds cycle landscape / portrait / seascape.
  const kinds = ['landscape', 'portrait', 'seascape'];
  const paintings = [];
  for (let r = 0; r < def.map.length; r += 1) {
    for (let c = 0; c < def.map[r].length; c += 1) {
      if (paintings.length >= 8) break;
      if (!parsed.walls.has(`${c},${r}`)) continue;
      const below = `${c},${r + 1}`;
      if (parsed.walls.has(below) || parsed.crates.has(below)) continue;
      if ((c + r) % 3 !== 0) continue;
      paintings.push({ c, r, kind: kinds[(c * 7 + r) % 3] });
    }
  }
  return {
    index,
    name: def.name,
    subtitle: def.subtitle,
    objective: def.objective,
    needsKey: def.needsKey,
    needsSapphire: def.needsSapphire,
    rows: def.map,
    guards: def.guards,
    shadows: def.shadows,
    lamps: def.lamps,
    rugs: def.rugs,
    plants: def.plants,
    statues: def.statues,
    paintings,
    ...parsed,
  };
}

export const LEVEL_COUNT = MAPS.length;

// Flood-fill from the player start over every walkable tile (floor, bush,
// key, sapphire, exit). Used by the self-test to prove every objective
// tile can actually be reached.
export function reachableTiles(level) {
  const blocked = (c, r) =>
    level.walls.has(`${c},${r}`) || level.crates.has(`${c},${r}`);
  const seen = new Set();
  const queue = [[level.player.col, level.player.row]];
  while (queue.length > 0) {
    const [c, r] = queue.pop();
    const k = `${c},${r}`;
    if (seen.has(k) || blocked(c, r)) continue;
    seen.add(k);
    queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
  }
  return seen;
}
