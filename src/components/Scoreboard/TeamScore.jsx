import React from 'react';

function TeamScore({ team, side }) {
  return (
    <div className={`team-score team-${side}`}>
      <div 
        className="team-color-bar"
        style={{ backgroundColor: team.color }}
      ></div>
      <div className="team-info">
        <h2 className="team-name" style={{ color: team.color }}>
          {team.name}
        </h2>
        <div className="score-display">
          <span 
            className="score-value"
            style={{ 
              textShadow: `0 0 30px ${team.color}, 0 0 60px ${team.color}40`
            }}
          >
            {team.score}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TeamScore;

