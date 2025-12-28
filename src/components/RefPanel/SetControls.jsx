import React, { useState } from 'react';

function SetControls({ sets, penaltyPhase, matchIsEnded, isMatchComplete, homeTeam, awayTeam, sendCommand }) {
  const [waitingMinutes, setWaitingMinutes] = useState(5);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetWaitingTime = () => {
    const totalSeconds = (parseInt(waitingMinutes) || 5) * 60;
    sendCommand('set-waiting-time', { seconds: totalSeconds });
  };

  const isPenaltyPhaseActive = penaltyPhase?.isActive;
  const canStartWaiting = matchIsEnded && !sets.isWaitingPeriod && !isMatchComplete && !isPenaltyPhaseActive;
  const canStartNextSet = (sets.isWaitingPeriod || matchIsEnded) && sets.current < sets.total && !isMatchComplete && !isPenaltyPhaseActive;

  return (
    <div className="set-controls">
      <div className="set-info">
        <div className="set-display">
          <span className="set-current-large">Set {sets.current}</span>
          <span className="set-of">of</span>
          <div className="set-total-control">
            <button 
              className="set-adjust-btn"
              onClick={() => sendCommand('set-total-sets', { total: Math.max(1, sets.total - 1) })}
              disabled={sets.total <= 1}
            >
              −
            </button>
            <span className="set-total-value">{sets.total}</span>
            <button 
              className="set-adjust-btn"
              onClick={() => sendCommand('set-total-sets', { total: Math.min(9, sets.total + 1) })}
              disabled={sets.total >= 9}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="sets-won">
          <span className="sets-won-label">Sets Won:</span>
          <span className="sets-won-score">
            <span className="home-sets">{sets.homeWon || 0}</span>
            <span className="sets-dash">-</span>
            <span className="away-sets">{sets.awayWon || 0}</span>
          </span>
        </div>
      </div>

      {isPenaltyPhaseActive && (
        <div className="penalty-phase-panel">
          <div className="penalty-phase-title">⚠️ Penalty Phase Active</div>
          <div className="penalty-phase-details">
            <div className="penalty-info-row">
              <span className="penalty-info-label">Striker:</span>
              <span className="penalty-info-value" style={{ color: penaltyPhase.striker === 'home' ? homeTeam?.color : awayTeam?.color }}>
                {penaltyPhase.striker === 'home' ? homeTeam?.name : awayTeam?.name}
              </span>
            </div>
            <div className="penalty-info-row">
              <span className="penalty-info-label">Defender:</span>
              <span className="penalty-info-value" style={{ color: penaltyPhase.defender === 'home' ? homeTeam?.color : awayTeam?.color }}>
                {penaltyPhase.defender === 'home' ? homeTeam?.name : awayTeam?.name}
              </span>
            </div>
            <div className="penalty-info-row">
              <span className="penalty-info-label">Time:</span>
              <span className="penalty-info-value penalty-time">{formatTime(penaltyPhase.remainingSeconds)}</span>
            </div>
            <div className="penalty-info-row">
              <span className="penalty-info-label">Penalties:</span>
              <span className="penalty-info-value">{penaltyPhase.penaltyDifference} × 10s</span>
            </div>
          </div>
          <div className="penalty-actions">
            <button 
              className="set-btn start-penalty"
              onClick={() => sendCommand('start-penalty-phase')}
            >
              ▶ Start Penalty
            </button>
            <button 
              className="set-btn end-penalty"
              onClick={() => sendCommand('end-penalty-phase')}
            >
              End Penalty
            </button>
            <button 
              className="set-btn skip-penalty"
              onClick={() => sendCommand('skip-penalty-phase')}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {sets.isWaitingPeriod && (
        <div className="waiting-display">
          <div className="waiting-label">Break Time Remaining</div>
          <div className="waiting-time">{formatTime(sets.waitingRemainingSeconds)}</div>
        </div>
      )}

      <div className="set-actions">
        {!sets.isWaitingPeriod && !matchIsEnded && !isPenaltyPhaseActive && (
          <button 
            className="set-btn end-set"
            onClick={() => sendCommand('end-set')}
          >
            End Set
          </button>
        )}
        
        {canStartWaiting && (
          <button 
            className="set-btn start-waiting"
            onClick={() => sendCommand('start-waiting-period')}
          >
            Start Break ({formatTime(sets.waitingTotalSeconds)})
          </button>
        )}
        
        {canStartNextSet && (
          <button 
            className="set-btn start-next"
            onClick={() => sendCommand('start-next-set')}
          >
            Start Set {sets.current + 1}
          </button>
        )}
        
        {isMatchComplete && !isPenaltyPhaseActive && (
          <div className="match-complete-msg">
            Match Complete!
          </div>
        )}
      </div>

      <div className="waiting-config">
        <span className="config-label">Break Duration:</span>
        <div className="waiting-input-group">
          <input 
            type="number"
            min="1"
            max="30"
            value={waitingMinutes}
            onChange={(e) => setWaitingMinutes(e.target.value)}
            className="waiting-input"
          />
          <span className="waiting-unit">min</span>
          <button className="set-waiting-btn" onClick={handleSetWaitingTime}>
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetControls;

