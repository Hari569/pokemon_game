import React from 'react';
import './DialogueBox.css';

export function DialogueBox({ text, onNext }) {
  if (!text) return null;

  return (
    <div className="dialogue-box-container" onClick={onNext}>
      <div className="dialogue-box">
        <div className="dialogue-text">
          {text}
        </div>
        <div className="dialogue-indicator">▼</div>
      </div>
    </div>
  );
}
