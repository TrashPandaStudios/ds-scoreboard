class GameState {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.timerInterval = null;
    
    this.state = {
      teams: {
        home: { name: 'Team 1', color: '#FF4444', score: 0, penalties: 0, setsWon: 0 },
        away: { name: 'Team 2', color: '#4488FF', score: 0, penalties: 0, setsWon: 0 }
      },
      timer: {
        totalSeconds: 180,      // Default 3 minutes for FAI Drone Soccer
        remainingSeconds: 180,
        isRunning: false
      },
      sets: {
        current: 1,
        total: 3,               // Default 3 sets per match
        isWaitingPeriod: false,
        waitingTotalSeconds: 300,  // Default 5 minute break
        waitingRemainingSeconds: 300,
        history: []             // Array of { setNumber, homeScore, awayScore, winner: 'home'|'away'|'tie' }
      },
      penaltyPhase: {
        isActive: false,
        striker: null,          // 'home' or 'away'
        defender: null,         // 'home' or 'away'
        totalSeconds: 0,
        remainingSeconds: 0,
        penaltyDifference: 0
      },
      match: {
        period: 1,
        isEnded: false,
        isMatchComplete: false  // All sets completed
      },
      settings: {
        soundEnabled: true
      },
      sponsors: [],  // Array of { id, name, logoPath, order }
      sponsorLabel: 'Event Sponsors'  // Customizable label for sponsor section
    };
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Score management
  incrementScore(team) {
    if (this.state.teams[team]) {
      this.state.teams[team].score += 1;
    }
  }

  decrementScore(team) {
    if (this.state.teams[team] && this.state.teams[team].score > 0) {
      this.state.teams[team].score -= 1;
    }
  }

  // Penalty management
  incrementPenalty(team) {
    if (this.state.teams[team]) {
      this.state.teams[team].penalties += 1;
    }
  }

  decrementPenalty(team) {
    if (this.state.teams[team] && this.state.teams[team].penalties > 0) {
      this.state.teams[team].penalties -= 1;
    }
  }

  // Team settings
  setTeamName(team, name) {
    if (this.state.teams[team]) {
      this.state.teams[team].name = name;
    }
  }

  setTeamColor(team, color) {
    if (this.state.teams[team]) {
      this.state.teams[team].color = color;
    }
  }

  // Timer management
  startTimer() {
    if (this.state.sets.isWaitingPeriod) {
      this.startWaitingTimer();
      return;
    }
    
    if (this.state.timer.remainingSeconds > 0 && !this.state.timer.isRunning) {
      this.state.timer.isRunning = true;
      this.state.match.isEnded = false;
      
      this.timerInterval = setInterval(() => {
        if (this.state.timer.remainingSeconds > 0) {
          this.state.timer.remainingSeconds -= 1;
          
          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange();
          }
          
          // Timer reached zero
          if (this.state.timer.remainingSeconds === 0) {
            this.endSet();
          }
        }
      }, 1000);
    }
  }

  startWaitingTimer() {
    if (this.state.sets.waitingRemainingSeconds > 0 && !this.state.timer.isRunning) {
      this.state.timer.isRunning = true;
      
      this.timerInterval = setInterval(() => {
        if (this.state.sets.waitingRemainingSeconds > 0) {
          this.state.sets.waitingRemainingSeconds -= 1;
          
          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange();
          }
          
          // Waiting period ended
          if (this.state.sets.waitingRemainingSeconds === 0) {
            this.endWaitingPeriod();
          }
        }
      }, 1000);
    }
  }

  pauseTimer() {
    this.state.timer.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.state.timer.remainingSeconds = this.state.timer.totalSeconds;
    this.state.match.isEnded = false;
  }

  setTime(seconds) {
    this.pauseTimer();
    this.state.timer.totalSeconds = seconds;
    this.state.timer.remainingSeconds = seconds;
    this.state.match.isEnded = false;
  }

  setWaitingTime(seconds) {
    this.state.sets.waitingTotalSeconds = seconds;
    this.state.sets.waitingRemainingSeconds = seconds;
  }

  setTotalSets(total) {
    this.state.sets.total = Math.max(1, Math.min(9, total));
  }

  endSet() {
    this.pauseTimer();
    
    const homePenalties = this.state.teams.home.penalties;
    const awayPenalties = this.state.teams.away.penalties;
    
    // Check if penalty phase is needed
    if (homePenalties > 0 || awayPenalties > 0) {
      const penaltyDiff = Math.abs(homePenalties - awayPenalties);
      
      if (penaltyDiff > 0) {
        // Enter penalty phase
        const striker = homePenalties < awayPenalties ? 'home' : 'away';
        const defender = homePenalties < awayPenalties ? 'away' : 'home';
        const penaltyTime = penaltyDiff * 10; // 10 seconds per penalty difference
        
        this.state.penaltyPhase = {
          isActive: true,
          striker: striker,
          defender: defender,
          totalSeconds: penaltyTime,
          remainingSeconds: penaltyTime,
          penaltyDifference: penaltyDiff
        };
        
        this.state.match.isEnded = false; // Not ended yet, penalty phase first
        
        if (this.callbacks.onStateChange) {
          this.callbacks.onStateChange();
        }
        return; // Don't finalize set yet
      }
    }
    
    // No penalty phase needed or penalties are equal - finalize set
    this.finalizeSet();
  }

  startPenaltyPhase() {
    if (this.state.penaltyPhase.isActive && this.state.penaltyPhase.remainingSeconds > 0) {
      this.state.timer.isRunning = true;
      
      this.timerInterval = setInterval(() => {
        if (this.state.penaltyPhase.remainingSeconds > 0) {
          this.state.penaltyPhase.remainingSeconds -= 1;
          
          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange();
          }
          
          if (this.state.penaltyPhase.remainingSeconds === 0) {
            this.endPenaltyPhase();
          }
        }
      }, 1000);
    }
  }

  endPenaltyPhase() {
    this.pauseTimer();
    this.state.penaltyPhase.isActive = false;
    this.finalizeSet();
    
    if (this.callbacks.onTimerEnd) {
      this.callbacks.onTimerEnd();
    }
  }

  skipPenaltyPhase() {
    this.pauseTimer();
    this.state.penaltyPhase.isActive = false;
    this.state.penaltyPhase.remainingSeconds = 0;
    this.finalizeSet();
  }

  finalizeSet() {
    this.state.match.isEnded = true;
    this.state.penaltyPhase.isActive = false;
    
    // Determine set winner based on score
    let winner = 'tie';
    if (this.state.teams.home.score > this.state.teams.away.score) {
      this.state.teams.home.setsWon += 1;
      winner = 'home';
    } else if (this.state.teams.away.score > this.state.teams.home.score) {
      this.state.teams.away.setsWon += 1;
      winner = 'away';
    }
    
    // Record set history
    this.state.sets.history.push({
      setNumber: this.state.sets.current,
      homeScore: this.state.teams.home.score,
      awayScore: this.state.teams.away.score,
      winner: winner
    });
    
    // Check if match is complete
    const setsToWin = Math.ceil(this.state.sets.total / 2);
    if (this.state.teams.home.setsWon >= setsToWin || 
        this.state.teams.away.setsWon >= setsToWin ||
        this.state.sets.current >= this.state.sets.total) {
      this.state.match.isMatchComplete = true;
    }
    
    if (this.callbacks.onTimerEnd) {
      this.callbacks.onTimerEnd();
    }
  }

  editSetHistory(setIndex, homeScore, awayScore, winner) {
    if (setIndex >= 0 && setIndex < this.state.sets.history.length) {
      const oldSet = this.state.sets.history[setIndex];
      const oldWinner = oldSet.winner;
      
      // Remove old winner's set win
      if (oldWinner === 'home') {
        this.state.teams.home.setsWon = Math.max(0, this.state.teams.home.setsWon - 1);
      } else if (oldWinner === 'away') {
        this.state.teams.away.setsWon = Math.max(0, this.state.teams.away.setsWon - 1);
      }
      
      // Add new winner's set win
      if (winner === 'home') {
        this.state.teams.home.setsWon += 1;
      } else if (winner === 'away') {
        this.state.teams.away.setsWon += 1;
      }
      
      // Update history
      this.state.sets.history[setIndex] = {
        setNumber: oldSet.setNumber,
        homeScore: homeScore,
        awayScore: awayScore,
        winner: winner
      };
      
      // Recalculate match complete status
      const setsToWin = Math.ceil(this.state.sets.total / 2);
      this.state.match.isMatchComplete = 
        this.state.teams.home.setsWon >= setsToWin || 
        this.state.teams.away.setsWon >= setsToWin ||
        this.state.sets.history.length >= this.state.sets.total;
    }
  }

  startWaitingPeriod() {
    this.pauseTimer();
    this.state.sets.isWaitingPeriod = true;
    this.state.sets.waitingRemainingSeconds = this.state.sets.waitingTotalSeconds;
    this.state.match.isEnded = false;
    // Auto-start the waiting timer
    this.startWaitingTimer();
  }

  endWaitingPeriod() {
    this.pauseTimer();
    this.state.sets.isWaitingPeriod = false;
    
    if (this.callbacks.onTimerEnd) {
      this.callbacks.onTimerEnd();
    }
  }

  startNextSet() {
    this.pauseTimer();
    this.state.sets.isWaitingPeriod = false;
    this.state.sets.current += 1;
    
    // Reset scores for new set
    this.state.teams.home.score = 0;
    this.state.teams.away.score = 0;
    this.state.teams.home.penalties = 0;
    this.state.teams.away.penalties = 0;
    
    // Reset timer
    this.state.timer.remainingSeconds = this.state.timer.totalSeconds;
    this.state.match.isEnded = false;
  }

  endMatch() {
    this.pauseTimer();
    this.state.match.isEnded = true;
    
    if (this.callbacks.onTimerEnd) {
      this.callbacks.onTimerEnd();
    }
  }

  // Settings
  toggleSound() {
    this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
  }

  // Sponsor management
  addSponsor(name, logoPath) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const order = this.state.sponsors.length;
    this.state.sponsors.push({ id, name, logoPath, order, whiteBackground: false });
  }

  removeSponsor(id) {
    this.state.sponsors = this.state.sponsors.filter(sponsor => sponsor.id !== id);
    // Reorder remaining sponsors
    this.state.sponsors.forEach((sponsor, index) => {
      sponsor.order = index;
    });
  }

  updateSponsor(id, name, logoPath, whiteBackground) {
    const sponsor = this.state.sponsors.find(s => s.id === id);
    if (sponsor) {
      if (name !== undefined) sponsor.name = name;
      if (logoPath !== undefined) sponsor.logoPath = logoPath;
      if (whiteBackground !== undefined) sponsor.whiteBackground = whiteBackground;
    }
  }

  reorderSponsors(sponsorIds) {
    // Reorder sponsors array based on provided order of IDs
    const sponsorMap = new Map(this.state.sponsors.map(s => [s.id, s]));
    this.state.sponsors = sponsorIds
      .map(id => sponsorMap.get(id))
      .filter(Boolean)
      .map((sponsor, index) => {
        sponsor.order = index;
        return sponsor;
      });
  }

  setSponsorLabel(label) {
    this.state.sponsorLabel = label || 'Event Sponsors';
  }

  // Full reset
  resetMatch() {
    this.pauseTimer();
    
    const homeTeam = this.state.teams.home;
    const awayTeam = this.state.teams.away;
    const totalSets = this.state.sets.total;
    const waitingTime = this.state.sets.waitingTotalSeconds;
    
    this.state = {
      teams: {
        home: { name: homeTeam.name, color: homeTeam.color, score: 0, penalties: 0, setsWon: 0 },
        away: { name: awayTeam.name, color: awayTeam.color, score: 0, penalties: 0, setsWon: 0 }
      },
      timer: {
        totalSeconds: this.state.timer.totalSeconds,
        remainingSeconds: this.state.timer.totalSeconds,
        isRunning: false
      },
      sets: {
        current: 1,
        total: totalSets,
        isWaitingPeriod: false,
        waitingTotalSeconds: waitingTime,
        waitingRemainingSeconds: waitingTime,
        history: []
      },
      penaltyPhase: {
        isActive: false,
        striker: null,
        defender: null,
        totalSeconds: 0,
        remainingSeconds: 0,
        penaltyDifference: 0
      },
      match: {
        period: 1,
        isEnded: false,
        isMatchComplete: false
      },
      settings: this.state.settings,
      sponsors: this.state.sponsors,  // Preserve sponsors on reset
      sponsorLabel: this.state.sponsorLabel  // Preserve sponsor label on reset
    };
  }

  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

module.exports = GameState;

