import React, { useState, useEffect } from 'react';

function SponsorControls({ sponsors, sponsorLabel, sendCommand }) {
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLogoPath, setEditLogoPath] = useState('');
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(sponsorLabel || 'Event Sponsors');

  const handleAddSponsor = async () => {
    if (!window.electronAPI) {
      alert('File picker not available. Please use Electron environment.');
      return;
    }

    try {
      const logoPath = await window.electronAPI.selectLogoFile();
      if (logoPath) {
        sendCommand('add-sponsor', { name: 'New Sponsor', logoPath });
      }
    } catch (error) {
      console.error('Error selecting logo file:', error);
    }
  };

  const handleEditSponsor = (sponsor) => {
    setEditingSponsor(sponsor.id);
    setEditName(sponsor.name);
    setEditLogoPath(sponsor.logoPath);
  };

  const handleSaveEdit = () => {
    if (editingSponsor && editName.trim()) {
      sendCommand('update-sponsor', {
        id: editingSponsor,
        name: editName.trim(),
        logoPath: editLogoPath
      });
      setEditingSponsor(null);
      setEditName('');
      setEditLogoPath('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSponsor(null);
    setEditName('');
    setEditLogoPath('');
  };

  const handleChangeLogo = async (sponsorId) => {
    if (!window.electronAPI) {
      alert('File picker not available. Please use Electron environment.');
      return;
    }

    try {
      const logoPath = await window.electronAPI.selectLogoFile();
      if (logoPath) {
        sendCommand('update-sponsor', { id: sponsorId, logoPath });
      }
    } catch (error) {
      console.error('Error selecting logo file:', error);
    }
  };

  const handleRemoveSponsor = (id, logoPath) => {
    if (window.confirm('Remove this sponsor?')) {
      sendCommand('remove-sponsor', { id, logoPath });
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...sponsors];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const sponsorIds = newOrder.map(s => s.id);
    sendCommand('reorder-sponsors', { sponsorIds });
  };

  const handleMoveDown = (index) => {
    if (index === sponsors.length - 1) return;
    const newOrder = [...sponsors];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const sponsorIds = newOrder.map(s => s.id);
    sendCommand('reorder-sponsors', { sponsorIds });
  };

  useEffect(() => {
    setLabelValue(sponsorLabel || 'Event Sponsors');
  }, [sponsorLabel]);

  const handleLabelChange = (e) => {
    setLabelValue(e.target.value);
  };

  const handleLabelBlur = () => {
    if (labelValue.trim() && labelValue !== sponsorLabel) {
      sendCommand('set-sponsor-label', { label: labelValue.trim() });
    } else {
      setLabelValue(sponsorLabel || 'Event Sponsors');
    }
    setEditingLabel(false);
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setLabelValue(sponsorLabel || 'Event Sponsors');
      setEditingLabel(false);
    }
  };

  return (
    <div className="sponsor-controls">
      <div className="sponsor-controls-header">
        <h3 className="subsection-title">Sponsors</h3>
        <button className="add-sponsor-btn" onClick={handleAddSponsor}>
          + Add Sponsor
        </button>
      </div>

      <div className="sponsor-label-setting">
        <label className="setting-label">Sponsor Section Label</label>
        {editingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            className="sponsor-label-input"
            placeholder="Event Sponsors"
            maxLength={30}
            autoFocus
          />
        ) : (
          <div 
            className="sponsor-label-display"
            onClick={() => setEditingLabel(true)}
            title="Click to edit"
          >
            {labelValue || 'Event Sponsors'}
            <span className="edit-hint">✏️</span>
          </div>
        )}
      </div>

      {sponsors && sponsors.length > 0 ? (
        <div className="sponsor-list">
          {sponsors.map((sponsor, index) => (
            <div key={sponsor.id} className="sponsor-item-control">
              {editingSponsor === sponsor.id ? (
                <div className="sponsor-edit-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="sponsor-name-input"
                    placeholder="Sponsor name"
                    maxLength={30}
                  />
                  <div className="sponsor-edit-actions">
                    <button className="save-btn" onClick={handleSaveEdit}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sponsor-preview">
                    {sponsor.logoUrl && (
                      <img 
                        src={sponsor.logoUrl} 
                        alt={sponsor.name}
                        className={`sponsor-preview-logo ${sponsor.whiteBackground ? 'white-bg' : ''}`}
                      />
                    )}
                    <span className="sponsor-preview-name">{sponsor.name}</span>
                  </div>
                  <div className="sponsor-actions">
                    <label className="white-bg-toggle" title="White background">
                      <input
                        type="checkbox"
                        checked={sponsor.whiteBackground || false}
                        onChange={(e) => {
                          sendCommand('update-sponsor', {
                            id: sponsor.id,
                            whiteBackground: e.target.checked
                          });
                        }}
                      />
                      <span className="toggle-label">⚪</span>
                    </label>
                    <div className="sponsor-order-controls">
                      <button
                        className="move-btn"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="move-btn"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sponsors.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      className="change-logo-btn"
                      onClick={() => handleChangeLogo(sponsor.id)}
                      title="Change logo"
                    >
                      📷
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditSponsor(sponsor)}
                      title="Edit name"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleRemoveSponsor(sponsor.id, sponsor.logoPath)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="sponsor-empty-state">
          <p>No sponsors added yet. Click "Add Sponsor" to get started.</p>
        </div>
      )}
    </div>
  );
}

export default SponsorControls;

