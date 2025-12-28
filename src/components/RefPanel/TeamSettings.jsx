import React, { useState, useEffect } from 'react';

function TeamSettings({ team, teamKey, sendCommand }) {
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.color);

  useEffect(() => {
    setName(team.name);
    setColor(team.color);
  }, [team.name, team.color]);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name.trim() && name !== team.name) {
      sendCommand('set-team-name', { team: teamKey, name: name.trim() });
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    sendCommand('set-team-color', { team: teamKey, color: newColor });
  };

  const presetColors = [
    '#FF4444', '#FF8844', '#FFCC00', '#44FF44', 
    '#44FFFF', '#4488FF', '#8844FF', '#FF44FF'
  ];

  return (
    <div className="team-settings">
      <div className="setting-row">
        <label className="setting-label">Team Name</label>
        <input 
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="name-input"
          maxLength={20}
        />
      </div>
      <div className="setting-row">
        <label className="setting-label">Color</label>
        <div className="color-picker">
          <input 
            type="color"
            value={color}
            onChange={handleColorChange}
            className="color-input"
          />
          <div className="preset-colors">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className={`preset-color ${color === presetColor ? 'active' : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  setColor(presetColor);
                  sendCommand('set-team-color', { team: teamKey, color: presetColor });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamSettings;

