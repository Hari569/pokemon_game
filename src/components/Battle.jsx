import React, { useState, useEffect, useRef } from 'react';
import { TYPE_EFFECTIVENESS, STATUS } from '../data/pokemonData';
import { usePlayer } from '../context/PlayerContext';
import './Battle.css';

const STAGE_TABLE = [0.25, 0.286, 0.333, 0.4, 0.5, 0.667, 1, 1.5, 2, 2.5, 3, 3.5, 4];
const stageMultiplier = (stage) => STAGE_TABLE[Math.max(-6, Math.min(6, stage)) + 6];

export function Battle({ playerPokemonInit, enemyPokemon, onBattleEnd, isTrainerBattle = false }) {
  const { party, gainExp, useItem, healPokemon, addPokemon, inventory, markCaught, updatePokemon } = usePlayer();

  const [activeIndex, setActiveIndex] = useState(playerPokemonInit ?? 0);
  const playerPokemon = party[activeIndex];

  const [battleState, setBattleState] = useState('START');
  const [menuState, setMenuState] = useState('MAIN');
  const [battleText, setBattleText] = useState(
    isTrainerBattle ? `A trainer wants to battle!` : `A wild ${enemyPokemon.name} appeared!`
  );
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [flashSuper, setFlashSuper] = useState(false);

  // HP — use refs for reading in callbacks, state for display
  const playerHpRef = useRef(playerPokemon?.currentHp ?? 0);
  const enemyHpRef = useRef(enemyPokemon.currentHp);
  const [playerHp, _setPlayerHp] = useState(playerHpRef.current);
  const [enemyHp, _setEnemyHp] = useState(enemyHpRef.current);

  const setPlayerHp = (val) => { playerHpRef.current = val; _setPlayerHp(val); };
  const setEnemyHp = (val) => { enemyHpRef.current = val; _setEnemyHp(val); };

  // Status — refs for callbacks, state for rendering badges
  const playerStatusRef = useRef(null);
  const enemyStatusRef = useRef(null);
  const playerSleepRef = useRef(0);
  const enemySleepRef = useRef(0);
  const [playerStatus, _setPlayerStatus] = useState(null);
  const [enemyStatus, _setEnemyStatus] = useState(null);

  const setPlayerStatus = (val) => { playerStatusRef.current = val; _setPlayerStatus(val); };
  const setEnemyStatus = (val) => { enemyStatusRef.current = val; _setEnemyStatus(val); };

  // Stat stages — refs for damage calc in callbacks, state for potential display
  const playerStagesRef = useRef({ attack: 0, defense: 0, speed: 0 });
  const enemyStagesRef = useRef({ attack: 0, defense: 0, speed: 0 });

  // Sync playerHp if active pokemon changes (party switch)
  useEffect(() => {
    if (playerPokemon) {
      const hp = playerPokemon.currentHp;
      playerHpRef.current = hp;
      _setPlayerHp(hp);
    }
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

  const triggerShake = (target) => {
    if (target === 'enemy') {
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 500);
    } else {
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 500);
    }
  };

  const calculateDamage = (attacker, defender, move) => {
    const aStages = attacker === playerPokemon ? playerStagesRef.current : enemyStagesRef.current;
    const dStages = defender === playerPokemon ? playerStagesRef.current : enemyStagesRef.current;

    const rawA = attacker.stats?.attack ?? attacker.baseStats.attack;
    const rawD = defender.stats?.defense ?? defender.baseStats.defense;

    let effectiveA = Math.floor(rawA * stageMultiplier(aStages.attack));
    let effectiveD = Math.floor(rawD * stageMultiplier(dStages.defense));

    // Burn halves attacker's attack
    const attackerStatus = attacker === playerPokemon ? playerStatusRef.current : enemyStatusRef.current;
    if (attackerStatus === STATUS.BURN) effectiveA = Math.floor(effectiveA * 0.5);

    let damage = Math.floor((2 * attacker.level / 5 + 2) * move.power * (effectiveA / effectiveD) / 50 + 2);

    let multiplier = 1;
    const effectiveness = TYPE_EFFECTIVENESS[move.type];
    if (effectiveness) {
      if (defender.types.some(t => effectiveness.strongAgainst.includes(t))) multiplier *= 2;
      if (defender.types.some(t => effectiveness.weakAgainst.includes(t))) multiplier *= 0.5;
    }
    if (attacker.types.includes(move.type)) multiplier *= 1.5;

    // Critical hit: 6.25% chance, 1.5x
    const isCrit = Math.random() < 0.0625;
    if (isCrit) multiplier *= 1.5;

    damage = Math.max(1, Math.floor(damage * multiplier));
    return { damage, multiplier: isCrit ? multiplier / 1.5 : multiplier, isCrit };
  };

  // Returns effect message or null. playerIsAttacker = player uses move on enemy
  const applyMoveEffect = (move, playerIsAttacker) => {
    if (!move.effect) return null;
    const { effect } = move;
    const targetName = playerIsAttacker ? enemyPokemon.name : playerPokemon?.name;

    if (effect.type === 'status') {
      const currentStatus = playerIsAttacker ? enemyStatusRef.current : playerStatusRef.current;
      if (currentStatus) return null;
      if (Math.random() >= effect.chance) return null;

      if (playerIsAttacker) {
        setEnemyStatus(effect.status);
        if (effect.status === STATUS.SLEEP) enemySleepRef.current = Math.floor(Math.random() * 3) + 1;
      } else {
        setPlayerStatus(effect.status);
        if (effect.status === STATUS.SLEEP) playerSleepRef.current = Math.floor(Math.random() * 3) + 1;
      }

      const msgs = {
        [STATUS.POISON]: 'was poisoned!',
        [STATUS.BURN]: 'was burned!',
        [STATUS.PARALYSIS]: 'is paralyzed!',
        [STATUS.SLEEP]: 'fell asleep!',
        [STATUS.FREEZE]: 'was frozen solid!',
      };
      return `${targetName} ${msgs[effect.status]}`;
    }

    if (effect.type === 'stat') {
      const stages = playerIsAttacker ? enemyStagesRef.current : playerStagesRef.current;
      const current = stages[effect.stat];
      const newVal = Math.max(-6, Math.min(6, current + effect.stages));
      if (newVal === current) return `${targetName}'s ${effect.stat} won't go any lower!`;

      if (playerIsAttacker) {
        enemyStagesRef.current = { ...stages, [effect.stat]: newVal };
      } else {
        playerStagesRef.current = { ...stages, [effect.stat]: newVal };
      }
      return `${targetName}'s ${effect.stat} ${effect.stages < 0 ? 'fell!' : 'rose!'}`;
    }

    return null;
  };

  // Check if a pokemon can act this turn. Calls onCanAct or onCannot.
  const checkCanAct = (isPlayer, onCanAct, onCannot) => {
    const status = isPlayer ? playerStatusRef.current : enemyStatusRef.current;
    const name = isPlayer ? playerPokemon?.name : enemyPokemon.name;

    if (status === STATUS.PARALYSIS && Math.random() < 0.25) {
      showText(`${name} is fully paralyzed!`, null, 1500).then(onCannot);
      return;
    }
    if (status === STATUS.SLEEP) {
      const turns = isPlayer ? playerSleepRef.current : enemySleepRef.current;
      if (turns <= 0) {
        if (isPlayer) setPlayerStatus(null); else setEnemyStatus(null);
        showText(`${name} woke up!`, null, 1500).then(onCanAct);
      } else {
        if (isPlayer) playerSleepRef.current--; else enemySleepRef.current--;
        showText(`${name} is fast asleep!`, null, 1500).then(onCannot);
      }
      return;
    }
    if (status === STATUS.FREEZE) {
      if (Math.random() < 0.2) {
        if (isPlayer) setPlayerStatus(null); else setEnemyStatus(null);
        showText(`${name} thawed out!`, null, 1500).then(onCanAct);
      } else {
        showText(`${name} is frozen solid!`, null, 1500).then(onCannot);
      }
      return;
    }
    onCanAct();
  };

  const applyEndOfRoundDamage = () => {
    const msgs = [];

    // Player status damage
    if (playerStatusRef.current === STATUS.POISON || playerStatusRef.current === STATUS.BURN) {
      const divisor = playerStatusRef.current === STATUS.POISON ? 8 : 16;
      const dmg = Math.max(1, Math.floor(playerPokemon.maxHp / divisor));
      const newHp = Math.max(0, playerHpRef.current - dmg);
      setPlayerHp(newHp);
      msgs.push(`${playerPokemon.name} is hurt by ${playerStatusRef.current === STATUS.POISON ? 'poison' : 'its burn'}!`);

      if (newHp === 0) {
        drainMessages(msgs, 'TEXT').then(() => {
          const nextAlive = party.findIndex((p, i) => i !== activeIndex && p.currentHp > 0);
          if (nextAlive !== -1) {
            showText(`${playerPokemon.name} fainted! Choose another!`, 'PLAYER_TURN').then(() => setMenuState('POKEMON'));
          } else {
            showText(`${playerPokemon.name} fainted! You lost!`, 'END', 2000).then(() => {
              setTimeout(() => onBattleEnd({ result: 'loss' }), 2000);
            });
          }
        });
        return;
      }
    }

    // Enemy status damage
    if (enemyStatusRef.current === STATUS.POISON || enemyStatusRef.current === STATUS.BURN) {
      const divisor = enemyStatusRef.current === STATUS.POISON ? 8 : 16;
      const dmg = Math.max(1, Math.floor(enemyPokemon.maxHp / divisor));
      const newHp = Math.max(0, enemyHpRef.current - dmg);
      setEnemyHp(newHp);
      msgs.push(`${enemyPokemon.name} is hurt by ${enemyStatusRef.current === STATUS.POISON ? 'poison' : 'its burn'}!`);

      if (newHp === 0) {
        const expGained = 20 * enemyPokemon.level;
        const expMsgs = gainExp(activeIndex, expGained);
        const allMsgs = [
          ...msgs,
          `${enemyPokemon.name} fainted!`,
          `${playerPokemon.name} gained ${expGained} EXP!`,
          ...expMsgs,
          'You won!',
        ];
        drainMessages(allMsgs, 'END').then(() => {
          setTimeout(() => onBattleEnd({ result: 'win' }), 1500);
        });
        return;
      }
    }

    if (msgs.length > 0) {
      drainMessages(msgs, 'PLAYER_TURN');
    } else {
      setBattleState('PLAYER_TURN');
    }
  };

  // Player attacks. onSurvive() called if enemy survives.
  const doPlayerAttack = (move, onSurvive) => {
    setBattleState('TEXT');

    checkCanAct(true, () => {
      // Accuracy check
      if (Math.random() * 100 > move.accuracy) {
        showText(`${playerPokemon.name}'s attack missed!`, null, 1500).then(onSurvive);
        return;
      }

      // Power-0 move: just the effect
      if (move.power === 0) {
        const effectMsg = applyMoveEffect(move, true);
        const text = `${playerPokemon.name} used ${move.name}!`;
        showText(text, null, 1500).then(() => {
          if (effectMsg) {
            showText(effectMsg, null, 1500).then(onSurvive);
          } else {
            onSurvive();
          }
        });
        return;
      }

      const { damage, multiplier, isCrit } = calculateDamage(playerPokemon, enemyPokemon, move);
      const newEnemyHp = Math.max(0, enemyHpRef.current - damage);
      setEnemyHp(newEnemyHp);
      triggerShake('enemy');
      if (multiplier >= 2) { setFlashSuper(true); setTimeout(() => setFlashSuper(false), 600); }

      let text = `${playerPokemon.name} used ${move.name}!`;
      if (isCrit) text += ' A critical hit!';
      else if (multiplier >= 2) text += " It's super effective!";
      else if (multiplier <= 0.5) text += " It's not very effective...";

      setBattleText(text);

      setTimeout(() => {
        if (newEnemyHp === 0) {
          const expGained = 20 * enemyPokemon.level;
          const msgs = gainExp(activeIndex, expGained);
          drainMessages([
            `${enemyPokemon.name} fainted!`,
            `${playerPokemon.name} gained ${expGained} EXP!`,
            ...msgs,
            'You won!',
          ], 'END').then(() => {
            setTimeout(() => onBattleEnd({ result: 'win' }), 1500);
          });
        } else {
          const effectMsg = applyMoveEffect(move, true);
          if (effectMsg) {
            showText(effectMsg, null, 1500).then(onSurvive);
          } else {
            onSurvive();
          }
        }
      }, 2000);
    }, onSurvive); // can't act → enemy HP unchanged, still call onSurvive
  };

  // Enemy attacks. onSurvive() called if player survives.
  const doEnemyAttack = (onSurvive) => {
    setBattleState('ENEMY_TURN');

    // Smart move selection: skip status moves if opponent already has one
    const availableMoves = enemyPokemon.moves.filter(m => {
      if (m.power === 0 && m.effect?.type === 'status' && playerStatusRef.current) return false;
      return true;
    });
    const move = (availableMoves.length > 0 ? availableMoves : enemyPokemon.moves)[
      Math.floor(Math.random() * (availableMoves.length || enemyPokemon.moves.length))
    ];

    checkCanAct(false, () => {
      // Accuracy check
      if (Math.random() * 100 > move.accuracy) {
        showText(`${enemyPokemon.name}'s attack missed!`, null, 1500).then(onSurvive);
        return;
      }

      // Power-0 move
      if (move.power === 0) {
        const effectMsg = applyMoveEffect(move, false);
        const text = `${enemyPokemon.name} used ${move.name}!`;
        showText(text, null, 1500).then(() => {
          if (effectMsg) {
            showText(effectMsg, null, 1500).then(onSurvive);
          } else {
            onSurvive();
          }
        });
        return;
      }

      const { damage, multiplier, isCrit } = calculateDamage(enemyPokemon, playerPokemon, move);
      const newPlayerHp = Math.max(0, playerHpRef.current - damage);
      setPlayerHp(newPlayerHp);
      triggerShake('player');

      let text = `${enemyPokemon.name} used ${move.name}!`;
      if (isCrit) text += ' A critical hit!';
      else if (multiplier >= 2) text += " It's super effective!";
      else if (multiplier <= 0.5) text += " It's not very effective...";

      setBattleText(text);
      setBattleState('TEXT');

      setTimeout(() => {
        if (newPlayerHp === 0) {
          const nextAlive = party.findIndex((p, i) => i !== activeIndex && p.currentHp > 0);
          if (nextAlive !== -1) {
            showText(`${playerPokemon.name} fainted! Choose another!`, 'PLAYER_TURN').then(() => setMenuState('POKEMON'));
          } else {
            showText(`${playerPokemon.name} fainted! You lost!`, 'END', 2000).then(() => {
              setTimeout(() => onBattleEnd({ result: 'loss' }), 2000);
            });
          }
        } else {
          const effectMsg = applyMoveEffect(move, false);
          if (effectMsg) {
            showText(effectMsg, null, 1500).then(onSurvive);
          } else {
            onSurvive();
          }
        }
      }, 2000);
    }, onSurvive); // can't act → player HP unchanged, still call onSurvive
  };

  const handleMoveSelect = (move) => {
    setMenuState('MAIN');
    if (!playerPokemon) return;

    const pSpeed = (playerPokemon.stats?.speed ?? playerPokemon.baseStats.speed) *
      (playerStatusRef.current === STATUS.PARALYSIS ? 0.5 : 1);
    const eSpeed = (enemyPokemon.stats?.speed ?? enemyPokemon.baseStats.speed) *
      (enemyStatusRef.current === STATUS.PARALYSIS ? 0.5 : 1);

    if (pSpeed >= eSpeed) {
      doPlayerAttack(move, () => {
        doEnemyAttack(() => applyEndOfRoundDamage());
      });
    } else {
      doEnemyAttack(() => {
        doPlayerAttack(move, () => applyEndOfRoundDamage());
      });
    }
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
      const catchRate = 1 - (enemyHpRef.current / enemyPokemon.maxHp);
      const caught = Math.random() < catchRate + 0.3;

      if (caught) {
        showText(`Gotcha! ${enemyPokemon.name} was caught!`, 'END', 2000).then(() => {
          const caughtMon = { ...enemyPokemon, currentHp: enemyHpRef.current };
          addPokemon(caughtMon);
          markCaught(enemyPokemon);
          setTimeout(() => onBattleEnd({ result: 'caught' }), 2000);
        });
      } else {
        showText('Oh no! The Pokemon broke free!', null, 2000).then(() => {
          setBattleState('ENEMY_TURN');
          doEnemyAttack(() => setBattleState('PLAYER_TURN'));
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
    const newHp = Math.min(playerHpRef.current + healAmount, playerPokemon.maxHp);
    setPlayerHp(newHp);
    healPokemon(activeIndex, healAmount);
    showText(`Used a Potion! ${playerPokemon.name} recovered HP!`, null, 2000).then(() => {
      doEnemyAttack(() => setBattleState('PLAYER_TURN'));
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
      doEnemyAttack(() => setBattleState('PLAYER_TURN'));
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

  const renderStatusBadge = (status) => {
    if (!status) return null;
    return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
  };

  if (!playerPokemon) return null;

  return (
    <div className={`battle-container${flashSuper ? ' flash-super' : ''}`}>
      <div className="battle-scene">
        {/* Enemy Side */}
        <div className="enemy-side">
          <div className="battle-stats enemy-stats">
            <div className="stat-name">
              {enemyPokemon.name} <span>Lv{enemyPokemon.level}</span>
              {renderStatusBadge(enemyStatus)}
            </div>
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
            <div className="stat-name">
              {playerPokemon.name} <span>Lv{playerPokemon.level}</span>
              {renderStatusBadge(playerStatus)}
            </div>
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
