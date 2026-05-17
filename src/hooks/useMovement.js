import { useState, useEffect, useCallback } from 'react';
import { DIRECTIONS, TILE_TREE, TILE_WATER, TILE_NPC, TILE_POKEBALL, TILE_TALL_GRASS, TILE_TRAINER, TILE_CAVE, TILE_PC } from '../constants';

const BLOCKED_TILES = new Set([TILE_TREE, TILE_WATER, TILE_NPC, TILE_POKEBALL, TILE_TRAINER, TILE_CAVE, TILE_PC]);

function isWalkable(x, y, mapData) {
  if (x < 0 || x >= mapData.cols || y < 0 || y >= mapData.rows) return false;
  const tile = mapData.tiles[y][x];
  return !BLOCKED_TILES.has(tile);
}

function getInteractable(x, y, mapData) {
  if (x < 0 || x >= mapData.cols || y < 0 || y >= mapData.rows) return null;
  const tile = mapData.tiles[y][x];
  if (tile === TILE_NPC) return { type: 'npc', x, y };
  if (tile === TILE_POKEBALL) return { type: 'pokeball', x, y };
  if (tile === TILE_TRAINER) return { type: 'trainer', x, y };
  if (tile === TILE_CAVE) return { type: 'cave', x, y };
  if (tile === TILE_PC)   return { type: 'pc', x, y };
  return null;
}

export function useMovement(initialX, initialY, mapData, onEncounter, onMapExit, onDialogueNext) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dir, setDir] = useState(DIRECTIONS.DOWN);
  const [isMoving, setIsMoving] = useState(false);
  const [interactTarget, setInteractTarget] = useState(null);

  // Reset position when map changes
  useEffect(() => {
    setPos({ x: initialX, y: initialY });
  }, [mapData]);

  const move = useCallback((newDir) => {
    if (isMoving || interactTarget) return;

    setDir(newDir);
    let nextX = pos.x;
    let nextY = pos.y;

    if (newDir === DIRECTIONS.UP) nextY -= 1;
    if (newDir === DIRECTIONS.DOWN) nextY += 1;
    if (newDir === DIRECTIONS.LEFT) nextX -= 1;
    if (newDir === DIRECTIONS.RIGHT) nextX += 1;

    // Check for map exit (out of bounds)
    if (nextX < 0 || nextX >= mapData.cols || nextY < 0 || nextY >= mapData.rows) {
      const dirStr = newDir; // 'up','down','left','right'
      if (onMapExit && mapData.exits?.[dirStr]) {
        onMapExit(dirStr, pos.y);
      }
      return;
    }

    if (isWalkable(nextX, nextY, mapData)) {
      setIsMoving(true);
      setPos({ x: nextX, y: nextY });

      const tile = mapData.tiles[nextY][nextX];
      if (tile === TILE_TALL_GRASS && Math.random() < 0.15 && onEncounter) {
        onEncounter('wild');
      }

      setTimeout(() => setIsMoving(false), 250);
    }
  }, [pos, isMoving, interactTarget, mapData, onEncounter, onMapExit]);

  const interact = useCallback(() => {
    let targetX = pos.x;
    let targetY = pos.y;
    if (dir === DIRECTIONS.UP) targetY -= 1;
    if (dir === DIRECTIONS.DOWN) targetY += 1;
    if (dir === DIRECTIONS.LEFT) targetX -= 1;
    if (dir === DIRECTIONS.RIGHT) targetX += 1;

    const target = getInteractable(targetX, targetY, mapData);
    if (target) setInteractTarget(target);
  }, [pos, dir, mapData]);

  const clearInteract = useCallback(() => setInteractTarget(null), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (interactTarget) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          if (onDialogueNext) onDialogueNext();
          else clearInteract();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowUp': case 'w': move(DIRECTIONS.UP); break;
        case 'ArrowDown': case 's': move(DIRECTIONS.DOWN); break;
        case 'ArrowLeft': case 'a': move(DIRECTIONS.LEFT); break;
        case 'ArrowRight': case 'd': move(DIRECTIONS.RIGHT); break;
        case 'Enter': case ' ': interact(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, interact, interactTarget, clearInteract, onDialogueNext]);

  return { pos, dir, isMoving, interactTarget, clearInteract };
}
