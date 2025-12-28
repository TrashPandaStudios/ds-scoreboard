import React, { useState } from 'react';

function SetHistoryEditor({ history, homeTeamName, awayTeamName, sendCommand }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editHomeScore, setEditHomeScore] = useState(0);
  const [editAwayScore, setEditAwayScore] = useState(0);
  const [editWinner, setEditWinner] = useState('tie');

  const startEditing = (index) => {
    const set = history[index];
    setEditingIndex(index);
    setEditHomeScore(set.homeScore);
    setEditAwayScore(set.awayScore);
    setEditWinner(set.winner);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const saveEdit = () => {
    sendCommand('edit-set-history', {
      setIndex: editingIndex,
      homeScore: parseInt(editHomeScore) || 0,
      awayScore: parseInt(editAwayScore) || 0,
      winner: editWinner
    });
    setEditingIndex(null);
  };

  if (!history || history.length === 0) {
    return (
      <div className="set-history-editor">
        <div className="no-history">No completed sets yet</div>
      </div>
    );
  }

  return (
    <div className="set-history-editor">
      <div className="history-list">
        {history.map((set, index) => (
          <div key={index} className="history-item">
            {editingIndex === index ? (
              <div className="history-edit-form">
                <div className="edit-header">
                  <span className="edit-set-label">Set {set.setNumber}</span>
                </div>
                <div className="edit-scores">
                  <div className="edit-team">
                    <label>{homeTeamName}</label>
                    <input
                      type="number"
                      min="0"
                      value={editHomeScore}
                      onChange={(e) => setEditHomeScore(e.target.value)}
                      className="score-input"
                    />
                  </div>
                  <span className="edit-vs">vs</span>
                  <div className="edit-team">
                    <label>{awayTeamName}</label>
                    <input
                      type="number"
                      min="0"
                      value={editAwayScore}
                      onChange={(e) => setEditAwayScore(e.target.value)}
                      className="score-input"
                    />
                  </div>
                </div>
                <div className="edit-winner">
                  <label>Winner:</label>
                  <div className="winner-buttons">
                    <button
                      className={`winner-btn ${editWinner === 'home' ? 'active home' : ''}`}
                      onClick={() => setEditWinner('home')}
                    >
                      {homeTeamName}
                    </button>
                    <button
                      className={`winner-btn ${editWinner === 'tie' ? 'active tie' : ''}`}
                      onClick={() => setEditWinner('tie')}
                    >
                      Tie
                    </button>
                    <button
                      className={`winner-btn ${editWinner === 'away' ? 'active away' : ''}`}
                      onClick={() => setEditWinner('away')}
                    >
                      {awayTeamName}
                    </button>
                  </div>
                </div>
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={cancelEditing}>Cancel</button>
                  <button className="save-btn" onClick={saveEdit}>Save</button>
                </div>
              </div>
            ) : (
              <div className="history-display" onClick={() => startEditing(index)}>
                <span className="history-set-num">Set {set.setNumber}</span>
                <span className={`history-score ${set.winner === 'home' ? 'winner' : ''}`}>
                  {set.homeScore}
                </span>
                <span className="history-dash">-</span>
                <span className={`history-score ${set.winner === 'away' ? 'winner' : ''}`}>
                  {set.awayScore}
                </span>
                {set.winner === 'tie' && <span className="history-tie-badge">TIE</span>}
                <span className="edit-hint">Click to edit</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SetHistoryEditor;

