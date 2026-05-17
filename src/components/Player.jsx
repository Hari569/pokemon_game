import React from 'react';
import { TILE_SIZE, DIRECTIONS } from '../constants';
import './Player.css';

export function Player({ pos, dir, isMoving }) {
  // Simple rotation or flipping based on direction for our emoji character
  let transform = `translate(${pos.x * TILE_SIZE}px, ${pos.y * TILE_SIZE}px)`;
  
  let innerTransform = '';
  if (dir === DIRECTIONS.LEFT) innerTransform = 'scaleX(-1)';
  if (dir === DIRECTIONS.RIGHT) innerTransform = 'scaleX(1)';
  // For up and down, we might just scale slightly or not at all if using an emoji.

  return (
    <div
      className={`player ${isMoving ? 'walking' : ''}`}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        transform: transform,
      }}
    >
      <div 
        className="player-sprite"
        style={{ transform: innerTransform }}
      >
        {'\u{1F9D2}'} {/* Child emoji */}
      </div>
    </div>
  );
}
