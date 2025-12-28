import React from 'react';

function Timer({ time, isRunning, isEnded, remainingSeconds, label = "TIME" }) {
  const isWarning = remainingSeconds <= 10 && remainingSeconds > 0 && !isEnded;
  const isBreak = label === "BREAK";
  const isPenalty = label === "PENALTY";
  
  return (
    <div className={`timer ${isRunning ? 'running' : ''} ${isEnded ? 'ended' : ''} ${isWarning ? 'warning' : ''} ${isBreak ? 'break-timer' : ''} ${isPenalty ? 'penalty-timer' : ''}`}>
      <div className="timer-label">{label}</div>
      <div className="timer-display">
        <span className="timer-value">{time}</span>
      </div>
      {isRunning && !isWarning && <div className="timer-pulse"></div>}
      {isWarning && <div className="timer-pulse warning-pulse"></div>}
    </div>
  );
}

export default Timer;

