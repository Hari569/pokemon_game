import React, { useState, useMemo, useRef } from 'react';
import { useMovement } from './hooks/useMovement';
import { Map } from './components/Map';
import { Player } from './components/Player';
import { DialogueBox } from './components/DialogueBox';
import { Battle } from './components/Battle';
import { usePlayer } from './context/PlayerContext';
import { TILE_SIZE, MAPS, MAP_TOWN, MAP_ROUTE1, MAP_CAVE } from './constants';
import { POKEMON_DATA, getEncounter, getCaveEncounter, createPokemonInstance } from './data/pokemonData';
import { TRAINERS, TRAINER_POSITIONS } from './data/trainerData';
import './App.css';

const VIEWPORT_TILES = 10;
const VIEWPORT_PX = VIEWPORT_TILES * TILE_SIZE; // 480px

function App() {
  const { party, addPokemon, hasSave, newGame } = usePlayer();

  const [gameState, setGameState] = useState('START'); // START, MAP, BATTLE
  const [currentMapId, setCurrentMapId] = useState(MAP_TOWN);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [currentTrainer, setCurrentTrainer] = useState(null);
  const [mapFlash, setMapFlash] = useState(false);
  const [defeatedTrainers, setDefeatedTrainers] = useState(new Set());

  const mapData = MAPS[currentMapId];

  const handleEncounter = (type) => {
    if (party.length === 0) return;
    let enemy;
    if (type === 'wild') {
      enemy = currentMapId === MAP_CAVE ? getCaveEncounter() : getEncounter(mapData.areaLevel);
    }
    setCurrentEnemy(enemy);
    setCurrentTrainer(null);
    setGameState('BATTLE');
  };

  const handleMapExit = (direction, currentRow) => {
    const exit = mapData.exits?.[direction];
    if (!exit) return;

    const nextMap = MAPS[exit.map];
    if (!nextMap) return;

    setMapFlash(true);
    setTimeout(() => setMapFlash(false), 400);
    setCurrentMapId(exit.map);
    // entryY: keep same row if null, otherwise use specified row
  };

  const startX = mapData.startX;
  const startY = mapData.startY;

  // Ref holds the latest dialogueOnNext so we can pass it to useMovement without circular deps
  const dialogueOnNextRef = useRef(null);

  const { pos, dir, isMoving, interactTarget, clearInteract } = useMovement(
    startX, startY, mapData, handleEncounter, handleMapExit,
    () => dialogueOnNextRef.current?.()
  );

  // Camera: clamp so map doesn't scroll past its edges
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
    if (currentTrainer && (result.result === 'win')) {
      setDefeatedTrainers(prev => new Set([...prev, `${currentTrainer.id}`]));
    }
    setGameState('MAP');
    setCurrentEnemy(null);
    setCurrentTrainer(null);
  };

  // Resolve dialogue text from interact target
  let dialogueText = null;
  if (interactTarget) {
    if (interactTarget.type === 'npc') {
      dialogueText = "Hi! Welcome to Kanto! Head east to Route 1 and catch some Pokemon!";
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
    }
  }

  // Contextual onNext for dialogue — also kept in a ref so useMovement can call it via keyboard
  const dialogueOnNext = () => {
    if (interactTarget?.type === 'pokeball' && party.length === 0) {
      const { y } = interactTarget;
      let starterKey = 'BULBASAUR';
      if (y === 4) starterKey = 'CHARMANDER';
      if (y === 5) starterKey = 'SQUIRTLE';
      const starter = createPokemonInstance(POKEMON_DATA[starterKey], 5);
      addPokemon(starter);
      clearInteract();
    } else if (interactTarget?.type === 'cave') {
      clearInteract();
      setMapFlash(true);
      setTimeout(() => setMapFlash(false), 400);
      // Cave tile in Town or Route1 → enter cave; cave tile in Cave → exit back
      if (currentMapId === MAP_CAVE) {
        setCurrentMapId(MAP_ROUTE1);
      } else {
        setCurrentMapId(MAP_CAVE);
      }
    } else {
      clearInteract();
    }
  };
  dialogueOnNextRef.current = dialogueOnNext;

  // Active (first non-fainted) pokemon index for battle
  const activePokemonIndex = party.findIndex(p => p.currentHp > 0);

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
      <div className="game-viewport">
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
      </div>

      <div className="hud">
        <span className="hud-map">
          {currentMapId === MAP_TOWN ? 'Oak Town' : currentMapId === MAP_ROUTE1 ? 'Route 1' : 'Dark Cave'}
        </span>
        <span className="hud-party">
          {party.length > 0 ? party.map(p => p.sprite).join(' ') : 'No Pokemon'}
        </span>
        <span className="hud-items">
          Party: {party.length}/6
        </span>
      </div>

      <div className="instructions">
        WASD / Arrow Keys to move &nbsp;|&nbsp; Space / Enter to interact
      </div>
    </div>
  );
}

export default App;
