export const TILE_SIZE = 48;

// Tile types
export const TILE_GRASS = 0;
export const TILE_TREE = 1;
export const TILE_WATER = 2;
export const TILE_NPC = 3;
export const TILE_TALL_GRASS = 4;
export const TILE_POKEBALL = 5;
export const TILE_TRAINER = 6;
export const TILE_CAVE = 7;  // Cave entrance (map transition)

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

// Map IDs
export const MAP_TOWN = 'TOWN';
export const MAP_ROUTE1 = 'ROUTE1';
export const MAP_CAVE = 'CAVE';

// ─── TOWN MAP (20 cols × 15 rows) ───────────────────────────────────────────
// Legend: 0=grass 1=tree 2=water 3=NPC 4=tall grass 5=pokeball 6=trainer 7=cave
export const MAPS = {
  [MAP_TOWN]: {
    cols: 20,
    rows: 15,
    startX: 3,
    startY: 3,
    areaLevel: 3,
    // Exits: right edge col 19 → ROUTE1, entered from left edge col 0
    exits: {
      right: { map: MAP_ROUTE1, entryX: 1, entryY: null /* match row */ },
    },
    tiles: [
      // row 0 - top border
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      // row 1 - open town
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // row 2 - NPC + gym trainer + trees
      [1,0,1,1,0,0,3,0,0,6,0,0,0,7,0,0,0,0,0,1],
      // row 3 - pokeballs (starters)
      [1,5,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // row 4 - pokeballs
      [1,5,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,1],
      // row 5 - pokeballs + gym leader
      [1,5,0,0,0,0,0,2,2,2,0,0,0,0,6,0,0,0,0,1],
      // row 6 - open (col 19 open = exit to Route 1)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 7 - tall grass begins (col 19 open = exit to Route 1)
      [1,4,4,4,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 8 - tall grass (col 19 open = exit to Route 1)
      [1,4,4,4,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 9 - open path
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // row 10
      [1,0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
      // row 11
      [1,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
      // row 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // row 13 - open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // row 14 - bottom border
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  [MAP_ROUTE1]: {
    cols: 20,
    rows: 15,
    startX: 1,
    startY: 7,
    areaLevel: 5,
    exits: {
      left: { map: MAP_TOWN, entryX: 18, entryY: null },
      right: { map: MAP_CAVE, entryX: 1, entryY: null },
    },
    tiles: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,4,4,4,0,0,1,1,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,1],
      [0,0,0,0,0,4,4,4,0,0,0,0,0,0,4,4,0,0,7,1],
      [0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0,4,4,4,0,0,6,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  [MAP_CAVE]: {
    cols: 16,
    rows: 12,
    startX: 1,
    startY: 6,
    areaLevel: 8,
    exits: {
      left: { map: MAP_ROUTE1, entryX: 18, entryY: null },
    },
    tiles: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,1,1,0,4,4,4,0,1,1,0,0,0,0,1],
      [1,0,0,0,0,4,4,4,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,4,4,0,0,0,0,0,1],
      [1,0,0,1,0,0,0,0,4,4,0,0,0,0,0,1],
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
};

// Backwards-compat alias
export const GAME_MAP = MAPS[MAP_TOWN].tiles;
export const MAP_COLS = MAPS[MAP_TOWN].cols;
export const MAP_ROWS = MAPS[MAP_TOWN].rows;
