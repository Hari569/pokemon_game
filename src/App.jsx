import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMovement } from './hooks/useMovement';
import { Map } from './components/Map';
import { Player } from './components/Player';
import { DialogueBox } from './components/DialogueBox';
import { Battle } from './components/Battle';
import { Pokedex } from './components/Pokedex';
import { PCBox } from './components/PCBox';
import { usePlayer } from './context/PlayerContext';
import { TILE_SIZE, MAPS, MAP_TOWN, MAP_ROUTE1, MAP_CAVE } from './constants';
import { POKEMON_DATA, getEncounter, getCaveEncounter, createPokemonInstance } from './data/pokemonData';
import { TRAINERS, TRAINER_POSITIONS } from './data/trainerData';
import { BADGES } from './data/badgeData';
import './App.css';

const VIEWPORT_TILES = 10;
const VIEWPORT_PX = VIEWPORT_TILES * TILE_SIZE;

function App() {
  const { party, addPokemon, hasSave, newGame, money, addMoney, badges, earnBadge, markSeen, markCaught } = usePlayer();

  const [gameState, setGameState] = useState('START'); // START, MAP, BATTLE, POKEDEX, BADGES, PC
  const [currentMapId, setCurrentMapId] = useState(MAP_TOWN);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [currentTrainer, setCurrentTrainer] = useState(null);
  const [mapFlash, setMapFlash] = useState(false);
  const [defeatedTrainers, setDefeatedTrainers] = useState(new Set());
  const [pendingDialogue, setPendingDialogue] = useState(null);

  const mapData = MAPS[currentMapId];

  // Open Pokedex (P key) or Badges (B key) from overworld
  useEffect(() => {
    const handleKey = (e) => {
      if (gameState !== 'MAP') return;
      if (e.key === 'p' || e.key === 'P') setGameState('POKEDEX');
      if (e.key === 'b' || e.key === 'B') setGameState('BADGES');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  const handleEncounter = (type) => {
    if (party.length === 0) return;
    let enemy;
    if (type === 'wild') {
      enemy = currentMapId === MAP_CAVE ? getCaveEncounter() : getEncounter(mapData.areaLevel);
    }
    markSeen(enemy);
    setCurrentEnemy(enemy);
    setCurrentTrainer(null);
    setGameState('BATTLE');
  };

  const handleMapExit = (direction) => {
    const exit = mapData.exits?.[direction];
    if (!exit) return;
    const nextMap = MAPS[exit.map];
    if (!nextMap) return;
    setMapFlash(true);
    setTimeout(() => setMapFlash(false), 400);
    setCurrentMapId(exit.map);
  };

  const dialogueOnNextRef = useRef(null);

  const { pos, dir, isMoving, interactTarget, clearInteract } = useMovement(
    mapData.startX, mapData.startY, mapData, handleEncounter, handleMapExit,
    () => dialogueOnNextRef.current?.()
  );

  const cameraX = useMemo(() => {
    const ideal = pos.x * TILE_SIZE - VIEWPORT_PX / 2 + TILE_SIZE / 2;
    const maxX = mapData.cols * TILE_SIZE - VIEWPORT_PX;
    return Math.max(0, Math.min(ideal, maxX));
  }, [pos.x, mapData.cols]);

  const cameraY = useMemo(() => {
    const ideal = pos.y * TILE_SIZE - VIEWPORT_PX / 2 + TILE_SIZE / 2;
    const maxY = mapData.rows * TILE_SIZE - VIEWPORT_PX;
    return Math.max(0, Math.min(ideal, maxY));
  }, [pos.y, mapData.rows]);

  const handleBattleEnd = (result) => {
    if (currentTrainer && result.result === 'win') {
      setDefeatedTrainers(prev => new Set([...prev, `${currentTrainer.id}`]));
      // Money reward
      addMoney(currentTrainer.reward);
      // Badge reward
      if (currentTrainer.badgeKey && !badges.has(currentTrainer.badgeKey)) {
        earnBadge(currentTrainer.badgeKey);
        const badge = BADGES[currentTrainer.badgeKey];
        setPendingDialogue(`You earned the ${badge.name}!`);
      } else {
        setPendingDialogue(`You received $${currentTrainer.reward}!`);
      }
    } else if (result.result === 'win' && !currentTrainer) {
      // Wild battle win
      addMoney((currentEnemy?.level ?? 1) * 5);
    }
    setGameState('MAP');
    setCurrentEnemy(null);
    setCurrentTrainer(null);
  };

  // Resolve dialogue text from interact target
  let dialogueText = null;

  // Pending post-battle dialogue takes priority
  if (pendingDialogue) {
    dialogueText = pendingDialogue;
  } else if (interactTarget) {
    if (interactTarget.type === 'npc') {
      dialogueText = "Hi! Welcome to Kanto! Head east to Route 1 and catch some Pokemon! Press P for Pokedex, B for Badges.";
    } else if (interactTarget.type === 'pokeball') {
      if (party.length === 0) {
        const { y } = interactTarget;
        let starterName = 'Bulbasaur';
        if (y === 4) starterName = 'Charmander';
        if (y === 5) starterName = 'Squirtle';
        dialogueText = `${starterName} wants to join you! Press Space to take it!`;
      } else {
        dialogueText = "You already have a Pokemon!";
      }
    } else if (interactTarget.type === 'trainer') {
      const key = `${currentMapId}:${interactTarget.x},${interactTarget.y}`;
      const trainerKey = TRAINER_POSITIONS[key];
      const trainer = trainerKey ? TRAINERS[trainerKey] : null;

      if (trainer && defeatedTrainers.has(`${trainer.id}`)) {
        dialogueText = `${trainer.name}: You're strong! Come back anytime!`;
      } else if (trainer && party.length > 0) {
        clearInteract();
        // Mark all trainer pokemon as seen
        trainer.party.forEach(p => markSeen(p));
        setCurrentTrainer(trainer);
        setCurrentEnemy(trainer.party[0]);
        setGameState('BATTLE');
      } else if (!party.length) {
        dialogueText = "You need a Pokemon to battle!";
      } else {
        dialogueText = "A trainer blocks your path!";
      }
    } else if (interactTarget.type === 'cave') {
      dialogueText = currentMapId === MAP_CAVE
        ? "You exit the cave..."
        : "You enter the dark cave! Wild Zubat and Geodude lurk inside...";
    } else if (interactTarget.type === 'pc') {
      dialogueText = "PC Storage System. Deposit or withdraw Pokemon.";
    }
  }

  const dialogueOnNext = () => {
    if (pendingDialogue) {
      setPendingDialogue(null);
      return;
    }

    if (interactTarget?.type === 'pokeball' && party.length === 0) {
      const { y } = interactTarget;
      let starterKey = 'BULBASAUR';
      if (y === 4) starterKey = 'CHARMANDER';
      if (y === 5) starterKey = 'SQUIRTLE';
      const starter = createPokemonInstance(POKEMON_DATA[starterKey], 5);
      addPokemon(starter);
      markCaught(starter);
      clearInteract();
    } else if (interactTarget?.type === 'cave') {
      clearInteract();
      setMapFlash(true);
      setTimeout(() => setMapFlash(false), 400);
      if (currentMapId === MAP_CAVE) {
        setCurrentMapId(MAP_ROUTE1);
      } else {
        setCurrentMapId(MAP_CAVE);
      }
    } else if (interactTarget?.type === 'pc') {
      clearInteract();
      setGameState('PC');
    } else {
      clearInteract();
    }
  };
  dialogueOnNextRef.current = dialogueOnNext;

  const activePokemonIndex = party.findIndex(p => p.currentHp > 0);

  const mapName = currentMapId === MAP_TOWN ? 'Oak Town' : currentMapId === MAP_ROUTE1 ? 'Route 1' : 'Dark Cave';

  if (gameState === 'START') {
    return (
      <div className="game-wrapper">
        <div className="game-viewport">
          <div className="start-screen">
            <h1>Monster Adventure</h1>
            <div className="start-buttons">
              {hasSave && (
                <button onClick={() => setGameState('MAP')}>Continue</button>
              )}
              <button onClick={() => { newGame(); setGameState('MAP'); }}>
                {hasSave ? 'New Game' : 'Start Game'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="game-viewport" style={{ position: 'relative' }}>
        {gameState === 'MAP' && (
          <>
            <div
              className={`camera-world${mapFlash ? ' map-transition-flash' : ''}`}
              style={{ transform: `translate(${-cameraX}px, ${-cameraY}px)` }}
            >
              <Map mapData={mapData} />
              <Player pos={pos} dir={dir} isMoving={isMoving} />
            </div>
            <DialogueBox text={dialogueText} onNext={dialogueOnNext} />
          </>
        )}

        {gameState === 'BATTLE' && activePokemonIndex !== -1 && currentEnemy && (
          <Battle
            playerPokemonInit={activePokemonIndex}
            enemyPokemon={currentEnemy}
            onBattleEnd={handleBattleEnd}
            isTrainerBattle={!!currentTrainer}
          />
        )}

        {gameState === 'POKEDEX' && <Pokedex onClose={() => setGameState('MAP')} />}
        {gameState === 'PC' && <PCBox onClose={() => setGameState('MAP')} />}

        {gameState === 'BADGES' && (
          <div className="badges-overlay">
            <div className="badges-header">
              <h2>BADGES</h2>
              <button onClick={() => setGameState('MAP')}>CLOSE</button>
            </div>
            <div className="badges-grid">
              {Object.values(BADGES).map(badge => {
                const earned = badges.has(badge.id);
                return (
                  <div key={badge.id} className={`badge-item${earned ? ' earned' : ''}`}>
                    <span className="badge-sprite">{badge.sprite}</span>
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-desc">{badge.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="hud">
        <span className="hud-map">{mapName}</span>
        <span className="hud-party">
          {party.length > 0 ? party.map(p => p.sprite).join(' ') : 'No Pokemon'}
        </span>
        <span className="hud-money">${money}</span>
        <span className="hud-items">Party: {party.length}/6</span>
      </div>

      <div className="instructions">
        WASD/Arrows: move &nbsp;|&nbsp; Space/Enter: interact &nbsp;|&nbsp; P: Pokedex &nbsp;|&nbsp; B: Badges
      </div>
    </div>
  );
}

export default App;
