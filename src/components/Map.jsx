import React from 'react';
import { TILE_SIZE, TILE_GRASS, TILE_TREE, TILE_WATER, TILE_NPC, TILE_TALL_GRASS, TILE_POKEBALL, TILE_TRAINER, TILE_CAVE, TILE_PC } from '../constants';
import './Map.css';

export function Map({ mapData }) {
  const { tiles, cols, rows } = mapData;

  return (
    <div
      className="map-container"
      style={{ width: cols * TILE_SIZE, height: rows * TILE_SIZE }}
    >
      {tiles.map((row, y) =>
        row.map((tile, x) => {
          let className = 'tile ';
          let content = '';

          if (tile === TILE_GRASS)      className += 'tile-grass';
          if (tile === TILE_TALL_GRASS) className += 'tile-tall-grass';
          if (tile === TILE_TREE)       { className += 'tile-tree'; content = '\u{1F333}'; }
          if (tile === TILE_WATER)      className += 'tile-water';
          if (tile === TILE_NPC)        { className += 'tile-npc'; content = '\u{1F467}'; }
          if (tile === TILE_POKEBALL)   { className += 'tile-pokeball'; content = '\u{1F534}'; }
          if (tile === TILE_TRAINER)    { className += 'tile-trainer'; content = '\u{1F9D1}'; }
          if (tile === TILE_CAVE)       { className += 'tile-cave'; content = '\u{1F30B}'; }
          if (tile === TILE_PC)         { className += 'tile-pc';   content = '\u{1F4BB}'; }

          return (
            <div
              key={`${x}-${y}`}
              className={className}
              style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
            >
              <span className="tile-content">{content}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
