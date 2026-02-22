import React, { useEffect } from 'react';
import useGameState from '../../hooks/useGameState';
import ScoreControls from './ScoreControls';
import TimerControls from './TimerControls';
import TeamSettings from './TeamSettings';
import PenaltyControls from './PenaltyControls';
import SetControls from './SetControls';
import SetHistoryEditor from './SetHistoryEditor';
import SponsorControls from './SponsorControls';
import './refpanel.css';

function RefPanel() {
  const { gameState, sendCommand } = useGameState();

  // Keyboard shortcuts for score control
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        // Team 1 (Home) - W/S keys
        case 'w':
          sendCommand('increment-score', { team: 'home' });
          break;
        case 's':
          sendCommand('decrement-score', { team: 'home' });
          break;
        // Team 2 (Away) - Arrow keys
        case 'arrowup':
          e.preventDefault();
          sendCommand('increment-score', { team: 'away' });
          break;
        case 'arrowdown':
          e.preventDefault();
          sendCommand('decrement-score', { team: 'away' });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendCommand]);

  const handleReset = () => {
    if (window.confirm('Reset match? This will clear all scores and reset the timer.')) {
      sendCommand('reset-match');
    }
  };

  return (
    <div className="ref-panel">
      <header className="ref-header">
        <h1 className="ref-title">Referee Control Panel</h1>
        <div className="header-actions">
          <button
            className={`sound-toggle ${gameState.settings.soundEnabled ? 'active' : ''}`}
            onClick={() => sendCommand('toggle-sound')}
            title={gameState.settings.soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {gameState.settings.soundEnabled ? '🔊' : '🔇'}
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Reset Match
          </button>
        </div>
      </header>

      <main className="ref-main">
        <section className="control-section sets-section">
          <h2 className="section-title">Sets & Rounds</h2>
          <SetControls
            sets={{
              ...gameState.sets,
              homeWon: gameState.teams.home.setsWon,
              awayWon: gameState.teams.away.setsWon
            }}
            penaltyPhase={gameState.penaltyPhase}
            matchIsEnded={gameState.match.isEnded}
            isMatchComplete={gameState.match.isMatchComplete}
            homeTeam={gameState.teams.home}
            awayTeam={gameState.teams.away}
            sendCommand={sendCommand}
            isRunning={gameState.timer.isRunning}
          />

          {gameState.sets?.history?.length > 0 && (
            <div className="set-history-section">
              <h3 className="subsection-title">Edit Previous Sets</h3>
              <SetHistoryEditor
                history={gameState.sets.history}
                homeTeamName={gameState.teams.home.name}
                awayTeamName={gameState.teams.away.name}
                sendCommand={sendCommand}
              />
            </div>
          )}
        </section>

        <section className="control-section timer-section">
          <h2 className="section-title">
            {gameState.sets?.isWaitingPeriod ? 'Break Timer' : 'Match Timer'}
          </h2>
          <TimerControls
            timer={gameState.timer}
            sets={gameState.sets}
            isEnded={gameState.match.isEnded}
            sendCommand={sendCommand}
          />
        </section>

        <div className="teams-container">
          <section className="control-section team-section">
            <h2 className="section-title" style={{ color: gameState.teams.home.color }}>
              {gameState.teams.home.name}
            </h2>
            <TeamSettings
              team={gameState.teams.home}
              teamKey="home"
              sendCommand={sendCommand}
            />
            <ScoreControls
              score={gameState.teams.home.score}
              teamKey="home"
              color={gameState.teams.home.color}
              sendCommand={sendCommand}
            />
            <PenaltyControls
              penalties={gameState.teams.home.penalties}
              teamKey="home"
              sendCommand={sendCommand}
            />
          </section>

          <section className="control-section team-section">
            <h2 className="section-title" style={{ color: gameState.teams.away.color }}>
              {gameState.teams.away.name}
            </h2>
            <TeamSettings
              team={gameState.teams.away}
              teamKey="away"
              sendCommand={sendCommand}
            />
            <ScoreControls
              score={gameState.teams.away.score}
              teamKey="away"
              color={gameState.teams.away.color}
              sendCommand={sendCommand}
            />
            <PenaltyControls
              penalties={gameState.teams.away.penalties}
              teamKey="away"
              sendCommand={sendCommand}
            />
          </section>
        </div>

        <section className="control-section sponsor-section">
          <h2 className="section-title">Sponsors</h2>
          <SponsorControls
            sponsors={gameState.sponsors}
            sponsorLabel={gameState.sponsorLabel}
            sendCommand={sendCommand}
          />
        </section>

        <section className="control-section settings-section">
          <h2 className="section-title">Global Settings</h2>
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Match Results Folder:</span>
              <span className="setting-value">{gameState.settings.matchResultFolder || 'Default (Documents/DroneSoccerScoreboard/MatchResults)'}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={async () => {
                const folderPath = await window.electronAPI.selectFolder();
                if (folderPath) {
                  sendCommand('set-match-result-folder', { path: folderPath });
                }
              }}
            >
              Choose Folder
            </button>
          </div>
        </section>
      </main>

      <footer className="ref-footer">
        <div className="status-bar">
          <span className="status-item">
            Time: {Math.floor(gameState.timer.remainingSeconds / 60)}:{(gameState.timer.remainingSeconds % 60).toString().padStart(2, '0')}
          </span>
          <span className="status-item">
            {gameState.teams.home.name} {gameState.teams.home.score} - {gameState.teams.away.score} {gameState.teams.away.name}
          </span>
          <span className={`status-item status-${gameState.timer.isRunning ? 'running' : 'paused'}`}>
            {gameState.match.isEnded ? 'ENDED' : gameState.timer.isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>
        <div className="keyboard-hints">
          <span className="hint">Score: <kbd>W</kbd>/<kbd>S</kbd> Team 1 · <kbd>↑</kbd>/<kbd>↓</kbd> Team 2</span>
        </div>
      </footer>
    </div>
  );
}

export default RefPanel;

