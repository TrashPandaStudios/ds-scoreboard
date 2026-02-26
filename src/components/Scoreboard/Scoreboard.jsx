import React from 'react';
import useGameState from '../../hooks/useGameState';
import TeamScore from './TeamScore';
import Timer from './Timer';
import PenaltyDisplay from './PenaltyDisplay';
import SponsorDisplay from './SponsorDisplay';
import logoSrc from '/logo.svg';
import './scoreboard.css';

function Scoreboard() {
  const { gameState } = useGameState();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow bg-glow-left"></div>
        <div className="bg-glow bg-glow-right"></div>
      </div>

      <header className="scoreboard-header">
        {gameState.sponsors && gameState.sponsors.length > 0 ? (
          <SponsorDisplay sponsors={gameState.sponsors} label={gameState.sponsorLabel} isBreak={gameState.sets?.isWaitingPeriod} />
        ) : (
          <h1 className="title">DRONE SOCCER</h1>
        )}
        <div className="match-status">
          {gameState.match.isMatchComplete ? (
            <span className="status-ended">MATCH COMPLETE</span>
          ) : gameState.penaltyPhase?.isActive ? (
            <span className="status-penalty">PENALTY PHASE</span>
          ) : gameState.sets?.isWaitingPeriod ? (
            <span className="status-waiting">BREAK TIME</span>
          ) : gameState.match.isEnded ? (
            <span className="status-ended">SET ENDED</span>
          ) : gameState.timer.isRunning ? (
            <span className="status-live">LIVE</span>
          ) : (
            <span className="status-paused">PAUSED</span>
          )}
        </div>
      </header>

      <main className="scoreboard-main">
        <TeamScore
          team={gameState.teams.home}
          side="home"
          penaltyRole={gameState.penaltyPhase?.isActive ? (gameState.penaltyPhase.striker === 'home' ? 'STRIKER' : 'DEFENDER') : null}
        />

        <div className="center-display">
          <div className="set-indicator-center">
            <span className="set-text">SET</span>
            <span className="set-number">{gameState.sets?.current || 1}</span>
            <span className="set-of-total">/ {gameState.sets?.total || 3}</span>
          </div>

          {gameState.penaltyPhase?.isActive ? (
            <>
              <div className="penalty-phase-display">
                <div className="penalty-phase-header">PENALTY PHASE</div>
              </div>
              <Timer
                time={formatTime(gameState.penaltyPhase.remainingSeconds)}
                isRunning={gameState.timer.isRunning}
                isEnded={false}
                remainingSeconds={gameState.penaltyPhase.remainingSeconds}
                label="PENALTY"
              />
            </>
          ) : gameState.match.isEnded && !gameState.sets?.isWaitingPeriod ? (
            <div className="set-winner-display">
              {gameState.teams.home.score > gameState.teams.away.score ? (
                <>
                  <div className="winner-label">SET {gameState.sets?.current || 1} WINNER</div>
                  <div
                    className="winner-team"
                    style={{
                      color: gameState.teams.home.color,
                      textShadow: `0 0 30px ${gameState.teams.home.color}`
                    }}
                  >
                    {gameState.teams.home.name}
                  </div>
                </>
              ) : gameState.teams.away.score > gameState.teams.home.score ? (
                <>
                  <div className="winner-label">SET {gameState.sets?.current || 1} WINNER</div>
                  <div
                    className="winner-team"
                    style={{
                      color: gameState.teams.away.color,
                      textShadow: `0 0 30px ${gameState.teams.away.color}`
                    }}
                  >
                    {gameState.teams.away.name}
                  </div>
                </>
              ) : (
                <>
                  <div className="winner-label">SET {gameState.sets?.current || 1}</div>
                  <div className="winner-team tie">DRAW</div>
                </>
              )}
            </div>
          ) : gameState.sets?.isWaitingPeriod ? (
            <Timer
              time={formatTime(gameState.sets.waitingRemainingSeconds)}
              isRunning={gameState.timer.isRunning}
              isEnded={false}
              remainingSeconds={gameState.sets.waitingRemainingSeconds}
              label="BREAK"
            />
          ) : (
            <Timer
              time={formatTime(gameState.timer.remainingSeconds)}
              isRunning={gameState.timer.isRunning}
              isEnded={gameState.match.isEnded}
              remainingSeconds={gameState.timer.remainingSeconds}
            />
          )}

          <div className="sets-score">
            <span className="sets-home" style={{ color: gameState.teams.home.color }}>
              {gameState.teams.home.setsWon || 0}
            </span>
            <span className="sets-divider">SETS</span>
            <span className="sets-away" style={{ color: gameState.teams.away.color }}>
              {gameState.teams.away.setsWon || 0}
            </span>
          </div>
        </div>

        <TeamScore
          team={gameState.teams.away}
          side="away"
          penaltyRole={gameState.penaltyPhase?.isActive ? (gameState.penaltyPhase.striker === 'away' ? 'STRIKER' : 'DEFENDER') : null}
        />
      </main>

      <div className="branding">
        <img src={logoSrc} alt="Trash Panda Studios" className="branding-logo" />
        <span className="branding-name">Trash Panda Studios</span>
      </div>

      <footer className="scoreboard-footer">
        <PenaltyDisplay
          homePenalties={gameState.teams.home.penalties}
          awayPenalties={gameState.teams.away.penalties}
          homeColor={gameState.teams.home.color}
          awayColor={gameState.teams.away.color}
        />

        {gameState.sets?.history?.length > 0 && (
          <div className="set-history">
            <div className="set-history-label">Previous Sets</div>
            <div className="set-history-list">
              {gameState.sets.history.map((set, index) => (
                <div key={index} className="set-history-item">
                  <span className="set-history-number">Set {set.setNumber}</span>
                  <span
                    className={`set-history-score ${set.winner === 'home' ? 'winner' : ''}`}
                    style={{ color: set.winner === 'home' ? gameState.teams.home.color : undefined }}
                  >
                    {set.homeScore}
                  </span>
                  <span className="set-history-dash">-</span>
                  <span
                    className={`set-history-score ${set.winner === 'away' ? 'winner' : ''}`}
                    style={{ color: set.winner === 'away' ? gameState.teams.away.color : undefined }}
                  >
                    {set.awayScore}
                  </span>
                  {set.winner === 'tie' && <span className="set-history-tie">TIE</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default Scoreboard;

