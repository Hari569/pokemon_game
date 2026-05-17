import React from 'react';
import { POKEMON_DATA } from '../data/pokemonData';
import { usePlayer } from '../context/PlayerContext';
import './Pokedex.css';

export function Pokedex({ onClose }) {
  const { pokedex } = usePlayer();
  const allPokemon = Object.values(POKEMON_DATA).sort((a, b) => a.id - b.id);
  const caughtCount = Object.keys(pokedex.caught).length;

  return (
    <div className="pokedex-overlay">
      <div className="pokedex-header">
        <h2>POKEDEX</h2>
        <span className="pokedex-count">{caughtCount} / {allPokemon.length} caught</span>
        <button className="pokedex-close" onClick={onClose}>CLOSE</button>
      </div>
      <div className="pokedex-list">
        {allPokemon.map(p => {
          const seen = pokedex.seen[p.id];
          const caught = pokedex.caught[p.id];
          const status = caught ? 'caught' : seen ? 'seen' : 'unknown';
          return (
            <div key={p.id} className={`pokedex-entry ${status}`}>
              <span className="entry-id">#{String(p.id).padStart(3, '0')}</span>
              <span className="entry-sprite">{seen ? p.sprite : '?'}</span>
              <span className="entry-name">{seen ? p.name : '???'}</span>
              {caught && <span className="caught-mark">●</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
