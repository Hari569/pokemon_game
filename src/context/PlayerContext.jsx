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
  const [money, setMoney] = useState(savedData?.money ?? 0);
  const [pokedex, setPokedex] = useState(savedData?.pokedex ?? { seen: {}, caught: {} });
  const [badges, setBadges] = useState(new Set(savedData?.badges ?? []));
  const [pcBox, setPcBox] = useState(savedData?.pcBox ?? []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      party, inventory, playerPos, money, pokedex,
      badges: Array.from(badges), pcBox,
    }));
  }, [party, inventory, playerPos, money, pokedex, badges, pcBox]);

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

      while (mon.exp >= mon.expToNextLevel) {
        mon.exp -= mon.expToNextLevel;
        mon.level += 1;
        mon.expToNextLevel = 50 * mon.level;

        mon.stats = {
          hp: Math.floor(mon.baseStats.hp * (1 + mon.level * 0.05)),
          attack: Math.floor(mon.baseStats.attack * (1 + mon.level * 0.03)),
          defense: Math.floor(mon.baseStats.defense * (1 + mon.level * 0.03)),
          speed: Math.floor(mon.baseStats.speed * (1 + mon.level * 0.02)),
        };
        const hpGain = mon.stats.hp - mon.maxHp;
        mon.maxHp = mon.stats.hp;
        mon.currentHp = Math.min(mon.currentHp + hpGain, mon.maxHp);

        levelUpMessages.push(`${mon.name} grew to level ${mon.level}!`);

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

  const addMoney = useCallback((amount) => {
    setMoney(prev => prev + amount);
  }, []);

  const spendMoney = useCallback((amount) => {
    if (money < amount) return false;
    setMoney(prev => prev - amount);
    return true;
  }, [money]);

  const markSeen = useCallback((pokemon) => {
    setPokedex(prev => ({
      ...prev,
      seen: {
        ...prev.seen,
        [pokemon.id]: { id: pokemon.id, name: pokemon.name, sprite: pokemon.sprite },
      },
    }));
  }, []);

  const markCaught = useCallback((pokemon) => {
    setPokedex(prev => ({
      ...prev,
      seen: {
        ...prev.seen,
        [pokemon.id]: { id: pokemon.id, name: pokemon.name, sprite: pokemon.sprite },
      },
      caught: { ...prev.caught, [pokemon.id]: true },
    }));
  }, []);

  const earnBadge = useCallback((badgeId) => {
    setBadges(prev => new Set([...prev, badgeId]));
  }, []);

  const depositPokemon = useCallback((partyIndex) => {
    setParty(prev => {
      if (prev.length <= 1) return prev;
      const mon = prev[partyIndex];
      setPcBox(box => [...box, mon]);
      return prev.filter((_, i) => i !== partyIndex);
    });
  }, []);

  const withdrawPokemon = useCallback((boxIndex) => {
    setParty(prev => {
      if (prev.length >= 6) return prev;
      const mon = pcBox[boxIndex];
      setPcBox(box => box.filter((_, i) => i !== boxIndex));
      return [...prev, mon];
    });
  }, [pcBox]);

  const newGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setParty([]);
    setInventory(DEFAULT_INVENTORY);
    setPlayerPos({ x: 3, y: 3 });
    setMoney(0);
    setPokedex({ seen: {}, caught: {} });
    setBadges(new Set());
    setPcBox([]);
    setHasSave(false);
  };

  return (
    <PlayerContext.Provider value={{
      party, setParty,
      inventory,
      playerPos, setPlayerPos,
      hasSave,
      money,
      pokedex,
      badges,
      pcBox,
      addPokemon,
      updatePokemon,
      gainExp,
      healPokemon,
      useItem,
      addMoney,
      spendMoney,
      markSeen,
      markCaught,
      earnBadge,
      depositPokemon,
      withdrawPokemon,
      newGame,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
