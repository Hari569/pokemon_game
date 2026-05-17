import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import './PCBox.css';

export function PCBox({ onClose }) {
  const { party, pcBox, depositPokemon, withdrawPokemon } = usePlayer();
  const [tab, setTab] = useState('PARTY');

  return (
    <div className="pcbox-overlay">
      <div className="pcbox-header">
        <span className="pcbox-title">PC STORAGE</span>
        <div className="pcbox-tabs">
          <button
            className={tab === 'PARTY' ? 'tab-active' : ''}
            onClick={() => setTab('PARTY')}
          >
            PARTY ({party.length}/6)
          </button>
          <button
            className={tab === 'BOX' ? 'tab-active' : ''}
            onClick={() => setTab('BOX')}
          >
            BOX ({pcBox.length})
          </button>
        </div>
        <button className="pcbox-close" onClick={onClose}>EXIT</button>
      </div>

      <div className="pcbox-body">
        {tab === 'PARTY' && (
          <div className="pcbox-list">
            {party.length === 0 && <p className="pcbox-empty">Party is empty.</p>}
            {party.map((mon, i) => (
              <div key={i} className="pc-entry">
                <span className="pc-sprite">{mon.sprite}</span>
                <span className="pc-info">{mon.name} <em>Lv{mon.level}</em></span>
                <span className="pc-hp">HP {mon.currentHp}/{mon.maxHp}</span>
                <button
                  className="pc-btn"
                  onClick={() => depositPokemon(i)}
                  disabled={party.length <= 1}
                >
                  DEPOSIT
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'BOX' && (
          <div className="pcbox-list">
            {pcBox.length === 0 && <p className="pcbox-empty">Box is empty.</p>}
            {pcBox.map((mon, i) => (
              <div key={i} className="pc-entry">
                <span className="pc-sprite">{mon.sprite}</span>
                <span className="pc-info">{mon.name} <em>Lv{mon.level}</em></span>
                <span className="pc-hp">HP {mon.currentHp}/{mon.maxHp}</span>
                <button
                  className="pc-btn"
                  onClick={() => withdrawPokemon(i)}
                  disabled={party.length >= 6}
                >
                  WITHDRAW
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pcbox-hint">
        {tab === 'PARTY'
          ? party.length <= 1 ? 'Need at least 1 Pokemon in party.' : 'Select a Pokemon to deposit into the box.'
          : party.length >= 6 ? 'Party is full (6/6).' : 'Select a Pokemon to add to your party.'}
      </div>
    </div>
  );
}
