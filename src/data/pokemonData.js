export const TYPES = {
  NORMAL: 'Normal',
  FIRE: 'Fire',
  WATER: 'Water',
  GRASS: 'Grass',
  ELECTRIC: 'Electric',
  FLYING: 'Flying',
  BUG: 'Bug',
  POISON: 'Poison',
  ROCK: 'Rock',
  GROUND: 'Ground'
};

export const STATUS = {
  POISON: 'PSN',
  BURN: 'BRN',
  PARALYSIS: 'PAR',
  SLEEP: 'SLP',
  FREEZE: 'FRZ',
};

export const TYPE_EFFECTIVENESS = {
  [TYPES.FIRE]: { strongAgainst: [TYPES.GRASS, TYPES.BUG], weakAgainst: [TYPES.WATER, TYPES.ROCK, TYPES.GROUND] },
  [TYPES.WATER]: { strongAgainst: [TYPES.FIRE, TYPES.ROCK, TYPES.GROUND], weakAgainst: [TYPES.GRASS, TYPES.ELECTRIC] },
  [TYPES.GRASS]: { strongAgainst: [TYPES.WATER, TYPES.ROCK, TYPES.GROUND], weakAgainst: [TYPES.FIRE, TYPES.BUG, TYPES.POISON, TYPES.FLYING] },
  [TYPES.ELECTRIC]: { strongAgainst: [TYPES.WATER, TYPES.FLYING], weakAgainst: [TYPES.GROUND] },
  [TYPES.NORMAL]: { strongAgainst: [], weakAgainst: [] },
  [TYPES.FLYING]: { strongAgainst: [TYPES.GRASS, TYPES.BUG], weakAgainst: [TYPES.ELECTRIC, TYPES.ROCK] },
  [TYPES.BUG]: { strongAgainst: [TYPES.GRASS], weakAgainst: [TYPES.FIRE, TYPES.FLYING, TYPES.ROCK] },
  [TYPES.POISON]: { strongAgainst: [TYPES.GRASS], weakAgainst: [TYPES.GROUND] },
  [TYPES.ROCK]: { strongAgainst: [TYPES.FIRE, TYPES.FLYING, TYPES.BUG], weakAgainst: [TYPES.WATER, TYPES.GRASS, TYPES.GROUND] },
  [TYPES.GROUND]: { strongAgainst: [TYPES.FIRE, TYPES.ELECTRIC, TYPES.POISON, TYPES.ROCK], weakAgainst: [TYPES.WATER, TYPES.GRASS] }
};

export const MOVES = {
  TACKLE:       { name: 'Tackle',       type: TYPES.NORMAL,   power: 40, accuracy: 100 },
  SCRATCH:      { name: 'Scratch',      type: TYPES.NORMAL,   power: 40, accuracy: 100 },
  GROWL:        { name: 'Growl',        type: TYPES.NORMAL,   power: 0,  accuracy: 100, effect: { type: 'stat', stat: 'attack',  stages: -1 } },
  TAIL_WHIP:    { name: 'Tail Whip',    type: TYPES.NORMAL,   power: 0,  accuracy: 100, effect: { type: 'stat', stat: 'defense', stages: -1 } },
  EMBER:        { name: 'Ember',        type: TYPES.FIRE,     power: 40, accuracy: 100, effect: { type: 'status', status: STATUS.BURN,      chance: 0.10 } },
  FLAMETHROWER: { name: 'Flamethrower', type: TYPES.FIRE,     power: 90, accuracy: 100, effect: { type: 'status', status: STATUS.BURN,      chance: 0.10 } },
  WATER_GUN:    { name: 'Water Gun',    type: TYPES.WATER,    power: 40, accuracy: 100 },
  SURF:         { name: 'Surf',         type: TYPES.WATER,    power: 90, accuracy: 100 },
  VINE_WHIP:    { name: 'Vine Whip',    type: TYPES.GRASS,    power: 45, accuracy: 100 },
  RAZOR_LEAF:   { name: 'Razor Leaf',   type: TYPES.GRASS,    power: 55, accuracy: 95  },
  THUNDER_SHOCK:{ name: 'Thunder Shock',type: TYPES.ELECTRIC, power: 40, accuracy: 100, effect: { type: 'status', status: STATUS.PARALYSIS,  chance: 0.10 } },
  GUST:         { name: 'Gust',         type: TYPES.FLYING,   power: 40, accuracy: 100 },
  QUICK_ATTACK: { name: 'Quick Attack', type: TYPES.NORMAL,   power: 40, accuracy: 100 },
  BITE:         { name: 'Bite',         type: TYPES.NORMAL,   power: 60, accuracy: 100 },
  ROCK_THROW:   { name: 'Rock Throw',   type: TYPES.ROCK,     power: 50, accuracy: 90  },
  POISON_STING: { name: 'Poison Sting', type: TYPES.POISON,   power: 15, accuracy: 100, effect: { type: 'status', status: STATUS.POISON,    chance: 0.30 } },
  STRING_SHOT:  { name: 'String Shot',  type: TYPES.BUG,      power: 0,  accuracy: 95,  effect: { type: 'stat',   stat: 'speed',   stages: -1 } },
  HEADBUTT:     { name: 'Headbutt',     type: TYPES.NORMAL,   power: 70, accuracy: 100 },
};

export const POKEMON_DATA = {
  BULBASAUR: {
    id: 1, name: 'Bulbasaur', sprite: '🐸', types: [TYPES.GRASS, TYPES.POISON],
    baseStats: { hp: 45, attack: 49, defense: 49, speed: 45 },
    moves: [MOVES.TACKLE, MOVES.VINE_WHIP, MOVES.GROWL],
    evolutionLevel: 16, evolvesTo: 'IVYSAUR',
  },
  IVYSAUR: {
    id: 2, name: 'Ivysaur', sprite: '🌿', types: [TYPES.GRASS, TYPES.POISON],
    baseStats: { hp: 60, attack: 62, defense: 63, speed: 60 },
    moves: [MOVES.VINE_WHIP, MOVES.RAZOR_LEAF, MOVES.GROWL],
    evolutionLevel: 32, evolvesTo: null,
  },
  CHARMANDER: {
    id: 4, name: 'Charmander', sprite: '🦎', types: [TYPES.FIRE],
    baseStats: { hp: 39, attack: 52, defense: 43, speed: 65 },
    moves: [MOVES.SCRATCH, MOVES.EMBER, MOVES.GROWL],
    evolutionLevel: 16, evolvesTo: 'CHARMELEON',
  },
  CHARMELEON: {
    id: 5, name: 'Charmeleon', sprite: '🔥', types: [TYPES.FIRE],
    baseStats: { hp: 58, attack: 64, defense: 58, speed: 80 },
    moves: [MOVES.SCRATCH, MOVES.EMBER, MOVES.FLAMETHROWER],
    evolutionLevel: 36, evolvesTo: null,
  },
  SQUIRTLE: {
    id: 7, name: 'Squirtle', sprite: '🐢', types: [TYPES.WATER],
    baseStats: { hp: 44, attack: 48, defense: 65, speed: 43 },
    moves: [MOVES.TACKLE, MOVES.WATER_GUN, MOVES.TAIL_WHIP],
    evolutionLevel: 16, evolvesTo: 'WARTORTLE',
  },
  WARTORTLE: {
    id: 8, name: 'Wartortle', sprite: '🌊', types: [TYPES.WATER],
    baseStats: { hp: 59, attack: 63, defense: 80, speed: 58 },
    moves: [MOVES.WATER_GUN, MOVES.SURF, MOVES.TAIL_WHIP],
    evolutionLevel: 36, evolvesTo: null,
  },
  PIDGEY: {
    id: 16, name: 'Pidgey', sprite: '🐦', types: [TYPES.NORMAL, TYPES.FLYING],
    baseStats: { hp: 40, attack: 45, defense: 40, speed: 56 },
    moves: [MOVES.TACKLE, MOVES.GUST],
    evolutionLevel: null, evolvesTo: null,
  },
  RATTATA: {
    id: 19, name: 'Rattata', sprite: '🐀', types: [TYPES.NORMAL],
    baseStats: { hp: 30, attack: 56, defense: 35, speed: 72 },
    moves: [MOVES.TACKLE, MOVES.QUICK_ATTACK, MOVES.BITE],
    evolutionLevel: null, evolvesTo: null,
  },
  PIKACHU: {
    id: 25, name: 'Pikachu', sprite: '⚡', types: [TYPES.ELECTRIC],
    baseStats: { hp: 35, attack: 55, defense: 40, speed: 90 },
    moves: [MOVES.THUNDER_SHOCK, MOVES.QUICK_ATTACK],
    evolutionLevel: null, evolvesTo: null,
  },
  CATERPIE: {
    id: 10, name: 'Caterpie', sprite: '🐛', types: [TYPES.BUG],
    baseStats: { hp: 45, attack: 30, defense: 35, speed: 45 },
    moves: [MOVES.TACKLE, MOVES.STRING_SHOT],
    evolutionLevel: 7, evolvesTo: 'METAPOD',
  },
  METAPOD: {
    id: 11, name: 'Metapod', sprite: '🫘', types: [TYPES.BUG],
    baseStats: { hp: 50, attack: 20, defense: 55, speed: 30 },
    moves: [MOVES.HEADBUTT],
    evolutionLevel: null, evolvesTo: null,
  },
  WEEDLE: {
    id: 13, name: 'Weedle', sprite: '🐝', types: [TYPES.BUG, TYPES.POISON],
    baseStats: { hp: 40, attack: 35, defense: 30, speed: 50 },
    moves: [MOVES.POISON_STING, MOVES.STRING_SHOT],
    evolutionLevel: null, evolvesTo: null,
  },
  ZUBAT: {
    id: 41, name: 'Zubat', sprite: '🦇', types: [TYPES.POISON, TYPES.FLYING],
    baseStats: { hp: 40, attack: 45, defense: 35, speed: 55 },
    moves: [MOVES.BITE, MOVES.GUST],
    evolutionLevel: null, evolvesTo: null,
  },
  GEODUDE: {
    id: 74, name: 'Geodude', sprite: '🪨', types: [TYPES.ROCK, TYPES.GROUND],
    baseStats: { hp: 40, attack: 80, defense: 100, speed: 20 },
    moves: [MOVES.TACKLE, MOVES.ROCK_THROW],
    evolutionLevel: null, evolvesTo: null,
  },
};

export const getEncounter = (areaLevel = 3) => {
  const wildPokemon = [
    POKEMON_DATA.PIDGEY,
    POKEMON_DATA.RATTATA,
    POKEMON_DATA.CATERPIE,
    POKEMON_DATA.WEEDLE,
    POKEMON_DATA.PIKACHU
  ];
  const template = wildPokemon[Math.floor(Math.random() * wildPokemon.length)];
  const level = Math.max(2, Math.floor(areaLevel + (Math.random() * 3 - 1)));
  return createPokemonInstance(template, level);
};

export const getCaveEncounter = () => {
  const cavePokemon = [POKEMON_DATA.ZUBAT, POKEMON_DATA.GEODUDE];
  const template = cavePokemon[Math.floor(Math.random() * cavePokemon.length)];
  const level = Math.floor(Math.random() * 4) + 5;
  return createPokemonInstance(template, level);
};

export const createPokemonInstance = (template, level) => {
  const scaledHp = Math.floor(template.baseStats.hp * (1 + level * 0.05));
  const scaledAttack = Math.floor(template.baseStats.attack * (1 + level * 0.03));
  const scaledDefense = Math.floor(template.baseStats.defense * (1 + level * 0.03));
  const scaledSpeed = Math.floor(template.baseStats.speed * (1 + level * 0.02));

  return {
    ...template,
    level,
    currentHp: scaledHp,
    maxHp: scaledHp,
    stats: {
      hp: scaledHp,
      attack: scaledAttack,
      defense: scaledDefense,
      speed: scaledSpeed,
    },
    exp: 0,
    expToNextLevel: 50 * level,
    status: null,
    sleepTurns: 0,
  };
};
