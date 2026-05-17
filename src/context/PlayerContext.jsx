import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { POKEMON_DATA, createPokemonInstance } from '../data/pokemonData';

const PlayerContext = createContext();

const SAVE_KEY = 'pokemon_save';

const DEFAULT_INVENTORY = { pokeballs: 5, potions: 3 };

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

export function PlayerProvider({ children }) {
  const savedData = loadSave();

  const [party, setParty] = useState(savedData?.party ?? []);
  const [inventory, setInventory] = useState(savedData?.inventory ?? DEFAULT_INVENTORY);
  const [playerPos, setPlayerPos] = useState(savedData?.playerPos ?? { x: 3, y: 3 });
  const [hasSave, setHasSave] = useState(!!savedData);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ party, inventory, playerPos }));
  }, [party, inventory, playerPos]);

  const addPokemon = (pokemon) => {
    if (party.length < 6) {
      setParty(prev => [...prev, pokemon]);
      return true;
    }
    return false;
  };

  const updatePokemon = useCallback((index, updater) => {
    setParty(prev => {
      const next = [...prev];
      next[index] = typeof updater === 'function' ? updater(next[index]) : { ...next[index], ...updater };
      return next;
    });
  }, []);

  const gainExp = useCallback((index, amount) => {
    let levelUpMessages = [];

    setParty(prev => {
      const next = [...prev];
      let mon = { ...next[index] };
      mon.exp = (mon.exp ?? 0) + amount;

      // Level up loop (could gain multiple levels)
      while (mon.exp >= mon.expToNextLevel) {
        mon.exp -= mon.expToNextLevel;
        mon.level += 1;
        mon.expToNextLevel = 50 * mon.level;

        // Scale stats on level up
        mon.stats = {
          hp: Math.floor(mon.baseStats.hp * (1 + mon.level * 0.05)),
          attack: Math.floor(mon.baseStats.attack * (1 + mon.level * 0.03)),
          defense: Math.floor(mon.baseStats.defense * (1 + mon.level * 0.03)),
          speed: Math.floor(mon.baseStats.speed * (1 + mon.level * 0.02)),
        };
        // Heal some HP on level up
        const hpGain = mon.stats.hp - mon.maxHp;
        mon.maxHp = mon.stats.hp;
        mon.currentHp = Math.min(mon.currentHp + hpGain, mon.maxHp);

        levelUpMessages.push(`${mon.name} grew to level ${mon.level}!`);

        // Check evolution
        if (mon.evolutionLevel && mon.level >= mon.evolutionLevel && mon.evolvesTo) {
          const evolvedTemplate = POKEMON_DATA[mon.evolvesTo];
          if (evolvedTemplate) {
            const prevName = mon.name;
            const evolved = createPokemonInstance(evolvedTemplate, mon.level);
            evolved.exp = mon.exp;
            evolved.expToNextLevel = mon.expToNextLevel;
            mon = evolved;
            levelUpMessages.push(`${prevName} evolved into ${mon.name}!`);
          }
        }
      }

      next[index] = mon;
      return next;
    });

    return levelUpMessages;
  }, []);

  const useItem = (itemType) => {
    if (inventory[itemType] > 0) {
      setInventory(prev => ({ ...prev, [itemType]: prev[itemType] - 1 }));
      return true;
    }
    return false;
  };

  const healPokemon = useCallback((index, amount) => {
    setParty(prev => {
      const next = [...prev];
      const mon = { ...next[index] };
      mon.currentHp = Math.min(mon.currentHp + amount, mon.maxHp);
      next[index] = mon;
      return next;
    });
  }, []);

  const newGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setParty([]);
    setInventory(DEFAULT_INVENTORY);
    setPlayerPos({ x: 3, y: 3 });
    setHasSave(false);
  };

  return (
    <PlayerContext.Provider value={{
      party, setParty,
      inventory,
      playerPos, setPlayerPos,
      hasSave,
      addPokemon,
      updatePokemon,
      gainExp,
      healPokemon,
      useItem,
      newGame,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
