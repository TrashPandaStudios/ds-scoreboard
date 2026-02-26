import React from 'react';

function ScoreControls({ score, teamKey, color, sendCommand }) {
  return (
    <div className="score-controls">
      <h3 className="control-label">Score</h3>
      <div className="control-row">
        <button
          className="control-btn decrement"
          onClick={() => sendCommand('decrement-score', { team: teamKey })}
          disabled={score <= 0}
        >
          -
        </button>
        <span className="control-value score-value" style={{ color }}>
          {score}
        </span>
        <button
          className="control-btn increment"
          onClick={() => sendCommand('increment-score', { team: teamKey })}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}40`
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default ScoreControls;

