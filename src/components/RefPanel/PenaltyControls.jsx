import React from 'react';

function PenaltyControls({ penalties, teamKey, sendCommand }) {
  return (
    <div className="penalty-controls">
      <h3 className="control-label">Penalties</h3>
      <div className="control-row">
        <button
          className="control-btn decrement penalty-btn"
          onClick={() => sendCommand('decrement-penalty', { team: teamKey })}
          disabled={penalties <= 0}
        >
          -
        </button>
        <span className="control-value penalty-value">
          {penalties}
        </span>
        <button
          className="control-btn increment penalty-btn"
          onClick={() => sendCommand('increment-penalty', { team: teamKey })}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default PenaltyControls;

