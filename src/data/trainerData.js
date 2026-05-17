import { POKEMON_DATA, createPokemonInstance } from './pokemonData';

export const TRAINERS = {
  BUG_CATCHER: {
    id: 1,
    name: 'Bug Catcher Tim',
    sprite: '🧒',
    reward: 50,
    party: [
      createPokemonInstance(POKEMON_DATA.CATERPIE, 4),
      createPokemonInstance(POKEMON_DATA.WEEDLE, 4),
    ],
  },
  GYM_LEADER: {
    id: 2,
    name: 'Gym Leader Brock',
    sprite: '🧑',
    reward: 200,
    party: [
      createPokemonInstance(POKEMON_DATA.GEODUDE, 10),
      createPokemonInstance(POKEMON_DATA.GEODUDE, 12),
    ],
  },
  YOUNGSTER: {
    id: 3,
    name: 'Youngster Joey',
    sprite: '🙋',
    reward: 80,
    party: [
      createPokemonInstance(POKEMON_DATA.RATTATA, 6),
    ],
  },
};

// Map trainer tile positions to trainer keys
// key format: "MAP_ID:x,y"
export const TRAINER_POSITIONS = {
  'TOWN:14,5':   'BUG_CATCHER',
  'TOWN:9,2':    'GYM_LEADER',
  'ROUTE1:15,8': 'YOUNGSTER',
};
