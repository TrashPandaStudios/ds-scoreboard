import React, { useState, useEffect } from 'react';

function SponsorDisplay({ sponsors, label, isBreak }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    if (!sponsors || sponsors.length <= 1 || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sponsors.length);
    }, 6000); // 6 seconds per sponsor

    return () => clearInterval(interval);
  }, [sponsors, isPaused]);

  // Reset index if sponsors array changes
  useEffect(() => {
    if (sponsors && sponsors.length > 0 && currentIndex >= sponsors.length) {
      setCurrentIndex(0);
    }
  }, [sponsors, currentIndex]);

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  // Ensure currentIndex is valid
  const validIndex = currentIndex % sponsors.length;
  const currentSponsor = sponsors[validIndex];

  return (
    <div
      className={`sponsor-display ${isBreak ? 'is-break' : ''}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {label && (
        <div className="sponsor-label">{label}</div>
      )}
      <div className="sponsor-carousel">
        {sponsors.map((sponsor, index) => (
          <div
            key={sponsor.id}
            className={`sponsor-item ${index === validIndex ? 'active' : ''}`}
          >
            {sponsor.logoUrl && (
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className={`sponsor-logo ${sponsor.whiteBackground ? 'white-bg' : ''}`}
              />
            )}
            {sponsor.name && (
              <span className="sponsor-name">{sponsor.name}</span>
            )}
          </div>
        ))}
      </div>

      {sponsors.length > 1 && (
        <div className="sponsor-indicators">
          {sponsors.map((sponsor, index) => (
            <button
              key={sponsor.id}
              className={`sponsor-indicator ${index === validIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to sponsor ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SponsorDisplay;

