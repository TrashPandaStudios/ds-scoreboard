import React, { useState } from 'react';

function TimerControls({ timer, sets, isEnded, sendCommand }) {
  const [customMinutes, setCustomMinutes] = useState(3);
  const [customSeconds, setCustomSeconds] = useState(0);

  const isWaitingPeriod = sets?.isWaitingPeriod;
  const displaySeconds = isWaitingPeriod ? sets.waitingRemainingSeconds : timer.remainingSeconds;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTime = () => {
    const totalSeconds = (parseInt(customMinutes) || 0) * 60 + (parseInt(customSeconds) || 0);
    if (totalSeconds > 0) {
      sendCommand('set-time', { seconds: totalSeconds });
    }
  };

  const handleQuickSet = (minutes) => {
    sendCommand('set-time', { seconds: minutes * 60 });
  };

  return (
    <div className="timer-controls">
      <div className={`timer-display-large ${isWaitingPeriod ? 'waiting-mode' : ''}`}>
        <span className={`time-value ${timer.isRunning ? 'running' : ''} ${isEnded ? 'ended' : ''} ${isWaitingPeriod ? 'waiting' : ''}`}>
          {formatTime(displaySeconds)}
        </span>
        {isWaitingPeriod && <span className="timer-mode-label">BREAK</span>}
      </div>

      <div className="timer-buttons">
        <button 
          className={`timer-btn ${timer.isRunning ? 'pause' : 'start'}`}
          onClick={() => sendCommand(timer.isRunning ? 'pause-timer' : 'start-timer')}
          disabled={isEnded && !isWaitingPeriod}
        >
          {timer.isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button 
          className="timer-btn reset"
          onClick={() => sendCommand('reset-timer')}
          disabled={isWaitingPeriod}
        >
          ↺ Reset Timer
        </button>
      </div>

      <div className="quick-time-buttons">
        <span className="quick-label">Quick Set:</span>
        <button className="quick-btn" onClick={() => handleQuickSet(1)}>1:00</button>
        <button className="quick-btn" onClick={() => handleQuickSet(2)}>2:00</button>
        <button className="quick-btn" onClick={() => handleQuickSet(3)}>3:00</button>
        <button className="quick-btn" onClick={() => handleQuickSet(5)}>5:00</button>
      </div>

      <div className="custom-time">
        <span className="custom-label">Custom Time:</span>
        <div className="custom-inputs">
          <input 
            type="number" 
            min="0" 
            max="99"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="time-input"
          />
          <span className="time-separator">:</span>
          <input 
            type="number" 
            min="0" 
            max="59"
            value={customSeconds}
            onChange={(e) => setCustomSeconds(e.target.value)}
            className="time-input"
          />
          <button className="set-btn" onClick={handleSetTime}>Set</button>
        </div>
      </div>
    </div>
  );
}

export default TimerControls;

