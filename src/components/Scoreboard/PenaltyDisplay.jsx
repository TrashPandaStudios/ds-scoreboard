import React from 'react';

function PenaltyDisplay({ homePenalties, awayPenalties, homeColor, awayColor }) {
  return (
    <div className="penalty-display">
      <div className="penalty-section penalty-home">
        <span className="penalty-label">PENALTIES</span>
        <div className="penalty-value" style={{ color: homeColor }}>
          {homePenalties}
        </div>
      </div>
      
      <div className="penalty-divider"></div>
      
      <div className="penalty-section penalty-away">
        <span className="penalty-label">PENALTIES</span>
        <div className="penalty-value" style={{ color: awayColor }}>
          {awayPenalties}
        </div>
      </div>
    </div>
  );
}

export default PenaltyDisplay;

