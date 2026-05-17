import React, { useState, useEffect, useRef } from 'react';
import { TYPE_EFFECTIVENESS } from '../data/pokemonData';
import { usePlayer } from '../context/PlayerContext';
import './Battle.css';

export function Battle({ playerPokemonInit, enemyPokemon, onBattleEnd, isTrainerBattle = false }) {
  const { party, gainExp, useItem, healPokemon, addPokemon, inventory } = usePlayer();

  // Track which party member is active
  const [activeIndex, setActiveIndex] = useState(playerPokemonInit ?? 0);
  const playerPokemon = party[activeIndex];

  const [battleState, setBattleState] = useState('START'); // START, PLAYER_TURN, ENEMY_TURN, TEXT, END
  const [menuState, setMenuState] = useState('MAIN'); // MAIN, MOVES, BAG, POKEMON
  const [battleText, setBattleText] = useState(
    isTrainerBattle ? `A trainer wants to battle!` : `A wild ${enemyPokemon.name} appeared!`
  );

  const [playerHp, setPlayerHp] = useState(playerPokemon?.currentHp ?? 0);
  const [enemyHp, setEnemyHp] = useState(enemyPokemon.currentHp);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [flashSuper, setFlashSuper] = useState(false);

  const pendingMessages = useRef([]);

  // Sync playerHp if active pokemon changes (party switch)
  useEffect(() => {
    if (playerPokemon) setPlayerHp(playerPokemon.currentHp);
  }, [activeIndex]);

  useEffect(() => {
    const timer = setTimeout(() => setBattleState('PLAYER_TURN'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const showText = (text, nextState, delay = 2000) => {
    setBattleText(text);
    setBattleState('TEXT');
    return new Promise(resolve => {
      setTimeout(() => {
        if (nextState) setBattleState(nextState);
        resolve();
      }, delay);
    });
  };

  const drainMessages = async (messages, finalState) => {
    for (const msg of messages) {
      await showText(msg, null, 2000);
    }
    setBattleState(finalState);
  };

  const calculateDamage = (attacker, defender, move) => {
    const power = move.power;
    const a = attacker.stats?.attack ?? attacker.baseStats.attack;
    const d = defender.stats?.defense ?? defender.baseStats.defense;
    let damage = Math.floor((2 * attacker.level / 5 + 2) * power * (a / d) / 50 + 2);

    let multiplier = 1;
    const effectiveness = TYPE_EFFECTIVENESS[move.type];
    if (effectiveness) {
      if (defender.types.some(t => effectiveness.strongAgainst.includes(t))) multiplier *= 2;
      if (defender.types.some(t => effectiveness.weakAgainst.includes(t))) multiplier *= 0.5;
    }
    if (attacker.types.includes(move.type)) multiplier *= 1.5;

    damage = Math.max(1, Math.floor(damage * multiplier));
    return { damage, multiplier };
  };

  const triggerShake = (target) => {
    if (target === 'enemy') {
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 500);
    } else {
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 500);
    }
  };

  const doEnemyAttack = (currentPlayerHp, afterCallback = null) => {
    const move = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
    const { damage, multiplier } = calculateDamage(enemyPokemon, playerPokemon, move);

    // Show "enemy is about to attack" state before damage
    setBattleState('ENEMY_TURN');

    setTimeout(() => {
      const newPlayerHp = Math.max(0, currentPlayerHp - damage);
      setPlayerHp(newPlayerHp);
      triggerShake('player');

      let text = `${enemyPokemon.name} used ${move.name}!`;
      if (multiplier >= 2) text += " It's super effective!";
      else if (multiplier <= 0.5) text += " It's not very effective...";

      setBattleText(text);
      setBattleState('TEXT');

      setTimeout(() => {
        if (newPlayerHp === 0) {
          const nextAlive = party.findIndex((p, i) => i !== activeIndex && p.currentHp > 0);
          if (nextAlive !== -1) {
            showText(`${playerPokemon.name} fainted! Choose another Pokemon!`, 'PLAYER_TURN').then(() => {
              setMenuState('POKEMON');
            });
          } else {
            showText(`${playerPokemon.name} fainted! You lost!`, 'END', 2000).then(() => {
              setTimeout(() => onBattleEnd({ result: 'loss' }), 2000);
            });
          }
        } else if (afterCallback) {
          afterCallback();
        } else {
          setBattleState('PLAYER_TURN');
        }
      }, 2000);
    }, 1000);
  };

  const handleMoveSelect = (move) => {
    setMenuState('MAIN');
    if (!playerPokemon) return;

    const playerSpeed = playerPokemon.stats?.speed ?? playerPokemon.baseStats.speed;
    const enemySpeed = enemyPokemon.stats?.speed ?? enemyPokemon.baseStats.speed;

    if (playerSpeed >= enemySpeed) {
      // Player attacks first, enemy counter-attacks after
      doPlayerAttack(move, () => doEnemyAttack(playerHp));
    } else {
      // Enemy attacks first, player attacks after if still alive
      doEnemyAttack(playerHp, () => doPlayerAttack(move, null));
    }
  };

  const doPlayerAttack = (move, afterCallback) => {
    const { damage, multiplier } = calculateDamage(playerPokemon, enemyPokemon, move);
    const newEnemyHp = Math.max(0, enemyHp - damage);
    setEnemyHp(newEnemyHp);
    triggerShake('enemy');
    if (multiplier >= 2) setFlashSuper(true), setTimeout(() => setFlashSuper(false), 600);

    let text = `${playerPokemon.name} used ${move.name}!`;
    if (multiplier >= 2) text += " It's super effective!";
    else if (multiplier <= 0.5) text += " It's not very effective...";

    setBattleText(text);
    setBattleState('TEXT');

    setTimeout(() => {
      if (newEnemyHp === 0) {
        const expGained = 20 * enemyPokemon.level;
        const msgs = gainExp(activeIndex, expGained);
        const allMsgs = [
          `${enemyPokemon.name} fainted!`,
          `${playerPokemon.name} gained ${expGained} EXP!`,
          ...msgs,
          'You won!',
        ];
        drainMessages(allMsgs, 'END').then(() => {
          setTimeout(() => onBattleEnd({ result: 'win' }), 1500);
        });
      } else if (afterCallback) {
        setBattleState('ENEMY_TURN');
        afterCallback();
      } else {
        setBattleState('PLAYER_TURN');
      }
    }, 2000);
  };

  const attemptCatch = () => {
    if (isTrainerBattle) {
      showText("You can't catch a trainer's Pokemon!", 'PLAYER_TURN');
      return;
    }
    if (!useItem('pokeballs')) {
      showText("You're out of Pokeballs!", 'PLAYER_TURN');
      return;
    }
    setBattleState('TEXT');
    setBattleText('You threw a Pokeball!');

    setTimeout(() => {
      const catchRate = 1 - (enemyHp / enemyPokemon.maxHp);
      const caught = Math.random() < catchRate + 0.3;

      if (caught) {
        showText(`Gotcha! ${enemyPokemon.name} was caught!`, 'END', 2000).then(() => {
          addPokemon({ ...enemyPokemon, currentHp: enemyHp });
          setTimeout(() => onBattleEnd({ result: 'caught' }), 2000);
        });
      } else {
        showText('Oh no! The Pokemon broke free!', null, 2000).then(() => {
          setBattleState('ENEMY_TURN');
          doEnemyAttack(playerHp);
        });
      }
    }, 2000);
  };

  const usePotion = () => {
    if (!useItem('potions')) {
      showText("You have no Potions!", 'PLAYER_TURN');
      return;
    }
    setMenuState('MAIN');
    const healAmount = 20;
    const newHp = Math.min(playerHp + healAmount, playerPokemon.maxHp);
    setPlayerHp(newHp);
    healPokemon(activeIndex, healAmount);
    showText(`Used a Potion! ${playerPokemon.name} recovered HP!`, null, 2000).then(() => {
      setBattleState('ENEMY_TURN');
      doEnemyAttack(newHp);
    });
  };

  const switchPokemon = (index) => {
    if (index === activeIndex) {
      showText("That Pokemon is already out!", 'PLAYER_TURN');
      return;
    }
    if (party[index].currentHp <= 0) {
      showText("That Pokemon has fainted!", 'PLAYER_TURN');
      return;
    }
    setMenuState('MAIN');
    const oldName = playerPokemon.name;
    setActiveIndex(index);
    const newMon = party[index];
    showText(`Come back ${oldName}! Go ${newMon.name}!`, null, 2000).then(() => {
      setBattleState('ENEMY_TURN');
      doEnemyAttack(newMon.currentHp);
    });
  };

  const renderHealthBar = (current, max) => {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    let color = '#4ade80';
    if (percent < 50) color = '#facc15';
    if (percent < 20) color = '#f87171';
    return (
      <div className="health-bar-container">
        <div className="health-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    );
  };

  if (!playerPokemon) return null;

  return (
    <div className={`battle-container${flashSuper ? ' flash-super' : ''}`}>
      <div className="battle-scene">
        {/* Enemy Side */}
        <div className="enemy-side">
          <div className="battle-stats enemy-stats">
            <div className="stat-name">{enemyPokemon.name} <span>Lv{enemyPokemon.level}</span></div>
            {renderHealthBar(enemyHp, enemyPokemon.maxHp)}
          </div>
          <div className={`pokemon-sprite enemy-sprite${shakeEnemy ? ' shake' : ''}`}>
            {enemyPokemon.sprite}
          </div>
        </div>

        {/* Player Side */}
        <div className="player-side">
          <div className={`pokemon-sprite player-sprite${shakePlayer ? ' shake' : ''}`}>
            {playerPokemon.sprite}
          </div>
          <div className="battle-stats player-stats">
            <div className="stat-name">{playerPokemon.name} <span>Lv{playerPokemon.level}</span></div>
            {renderHealthBar(playerHp, playerPokemon.maxHp)}
            <div className="hp-text">{playerHp} / {playerPokemon.maxHp}</div>
            <div className="exp-bar-container">
              <div
                className="exp-bar-fill"
                style={{ width: `${Math.min(100, ((playerPokemon.exp ?? 0) / playerPokemon.expToNextLevel) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="battle-ui">
        <div className="battle-text-box">
          {battleState === 'TEXT' || battleState === 'START' || battleState === 'END' ? (
            <p>{battleText}</p>
          ) : battleState === 'PLAYER_TURN' ? (
            <p>What will {playerPokemon.name} do?</p>
          ) : (
            <p>{battleText}</p>
          )}
        </div>

        {battleState === 'PLAYER_TURN' && (
          <div className="battle-menu">
            {menuState === 'MAIN' && (
              <>
                <button onClick={() => setMenuState('MOVES')}>FIGHT</button>
                <button onClick={() => setMenuState('BAG')}>BAG</button>
                <button onClick={() => setMenuState('POKEMON')}>POKEMON</button>
                <button onClick={() => onBattleEnd({ result: 'run' })}>RUN</button>
              </>
            )}

            {menuState === 'MOVES' && (
              <>
                {playerPokemon.moves.map((move, i) => (
                  <button key={i} onClick={() => handleMoveSelect(move)}>
                    {move.name}
                    <span className="move-type">{move.type}</span>
                  </button>
                ))}
                <button onClick={() => setMenuState('MAIN')}>BACK</button>
              </>
            )}

            {menuState === 'BAG' && (
              <>
                <button onClick={attemptCatch} disabled={isTrainerBattle}>
                  POKEBALL ({inventory.pokeballs})
                </button>
                <button onClick={usePotion}>
                  POTION ({inventory.potions})
                </button>
                <button onClick={() => setMenuState('MAIN')}>BACK</button>
              </>
            )}

            {menuState === 'POKEMON' && (
              <>
                {party.map((mon, i) => (
                  <button
                    key={i}
                    onClick={() => switchPokemon(i)}
                    disabled={mon.currentHp <= 0}
                    className={i === activeIndex ? 'active-pokemon' : ''}
                  >
                    {mon.sprite} {mon.name} Lv{mon.level} {mon.currentHp <= 0 ? '(fainted)' : `HP:${mon.currentHp}`}
                  </button>
                ))}
                <button onClick={() => setMenuState('MAIN')}>BACK</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
