import { useState, useEffect, useCallback, useRef } from 'react';

const defaultGameState = {
  teams: {
    home: { name: 'Team 1', color: '#FF4444', score: 0, penalties: 0, setsWon: 0 },
    away: { name: 'Team 2', color: '#4488FF', score: 0, penalties: 0, setsWon: 0 }
  },
  timer: {
    totalSeconds: 180,
    remainingSeconds: 180,
    isRunning: false
  },
  sets: {
    current: 1,
    total: 3,
    isWaitingPeriod: false,
    waitingTotalSeconds: 300,
    waitingRemainingSeconds: 300,
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
      settings: {
        soundEnabled: true
      },
      sponsors: [],
      sponsorLabel: 'Event Sponsors'
    };

// Sound playback using audio files
class SoundGenerator {
  constructor() {
    this.audioContext = null;
    // Preload audio files - try .mp3 first, fallback to .wav
    try {
      this.buzzerAudio = new Audio('./buzzer.mp3');
      this.buzzerAudio.preload = 'auto';
      this.buzzerAudio.volume = 0.7;
      // Handle loading errors gracefully
      this.buzzerAudio.addEventListener('error', (e) => {
        // Try .wav as fallback
        try {
          this.buzzerAudio = new Audio('./buzzer.wav');
          this.buzzerAudio.preload = 'auto';
          this.buzzerAudio.volume = 0.7;
          this.buzzerAudio.addEventListener('error', (e2) => {
            console.log('Buzzer audio file not found. Please add buzzer.mp3 or buzzer.wav to the public directory.');
          });
        } catch (e2) {
          console.log('Failed to load buzzer audio file:', e2);
          this.buzzerAudio = null;
        }
      });
    } catch (e) {
      console.log('Failed to create audio object:', e);
      this.buzzerAudio = null;
    }
  }

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  playBuzzer() {
    try {
      // Reset audio to beginning and play
      if (this.buzzerAudio) {
        this.buzzerAudio.currentTime = 0;
        this.buzzerAudio.play().catch(e => {
          console.log('Audio playback failed:', e);
        });
      }
    } catch (e) {
      console.log('Audio not available:', e);
    }
  }

  playGoal() {
    try {
      const ctx = this.getContext();
      
      // Play a triumphant chord
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const startTime = ctx.currentTime + i * 0.05;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.8);
      });
    } catch (e) {
      console.log('Audio not available');
    }
  }

  play(soundName) {
    if (soundName === 'buzzer') {
      this.playBuzzer();
    } else if (soundName === 'goal') {
      this.playGoal();
    }
  }
}

function useGameState() {
  const [gameState, setGameState] = useState(defaultGameState);
  const soundGeneratorRef = useRef(null);

  // Initialize sound generator
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();
  }, []);

  // Play sound function
  const playSound = useCallback((soundName) => {
    if (gameState.settings.soundEnabled && soundGeneratorRef.current) {
      soundGeneratorRef.current.play(soundName);
    }
  }, [gameState.settings.soundEnabled]);

  // Listen for state updates from main process
  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onStateUpdate((newState) => {
        setGameState(newState);
      });

      const unsubscribeSound = window.electronAPI.onPlaySound((soundName) => {
        playSound(soundName);
      });

      // Request initial state
      window.electronAPI.requestState();

      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubscribeSound) unsubscribeSound();
      };
    }
  }, [playSound]);

  // Send command to main process
  const sendCommand = useCallback((command, payload = {}) => {
    if (window.electronAPI) {
      window.electronAPI.sendCommand(command, payload);
    } else {
      // Fallback for development without Electron
      console.log('Command:', command, payload);
      handleLocalCommand(command, payload, setGameState, playSound);
    }
  }, [playSound]);

  return { gameState, sendCommand, playSound };
}

// Local command handler for development/testing without Electron
function handleLocalCommand(command, payload, setGameState, playSound) {
  setGameState(prev => {
    const newState = { ...prev };
    
    switch (command) {
      case 'increment-score':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            score: prev.teams[payload.team].score + 1
          }
        };
        break;
        
      case 'decrement-score':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            score: Math.max(0, prev.teams[payload.team].score - 1)
          }
        };
        break;
        
      case 'increment-penalty':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            penalties: prev.teams[payload.team].penalties + 1
          }
        };
        break;
        
      case 'decrement-penalty':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            penalties: Math.max(0, prev.teams[payload.team].penalties - 1)
          }
        };
        break;
        
      case 'set-team-name':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            name: payload.name
          }
        };
        break;
        
      case 'set-team-color':
        newState.teams = {
          ...prev.teams,
          [payload.team]: {
            ...prev.teams[payload.team],
            color: payload.color
          }
        };
        break;
        
      case 'start-timer':
        newState.timer = { ...prev.timer, isRunning: true };
        newState.match = { ...prev.match, isEnded: false };
        break;
        
      case 'pause-timer':
        newState.timer = { ...prev.timer, isRunning: false };
        break;
        
      case 'reset-timer':
        newState.timer = {
          ...prev.timer,
          remainingSeconds: prev.timer.totalSeconds,
          isRunning: false
        };
        newState.match = { ...prev.match, isEnded: false };
        break;
        
      case 'set-time':
        newState.timer = {
          totalSeconds: payload.seconds,
          remainingSeconds: payload.seconds,
          isRunning: false
        };
        newState.match = { ...prev.match, isEnded: false };
        break;
        
      case 'toggle-sound':
        newState.settings = {
          ...prev.settings,
          soundEnabled: !prev.settings.soundEnabled
        };
        break;
        
      case 'reset-match':
        return {
          ...defaultGameState,
          teams: {
            home: { ...defaultGameState.teams.home, name: prev.teams.home.name, color: prev.teams.home.color },
            away: { ...defaultGameState.teams.away, name: prev.teams.away.name, color: prev.teams.away.color }
          },
          sets: {
            ...defaultGameState.sets,
            total: prev.sets?.total || 3,
            waitingTotalSeconds: prev.sets?.waitingTotalSeconds || 300,
            waitingRemainingSeconds: prev.sets?.waitingTotalSeconds || 300
          },
          settings: prev.settings
        };
      
      case 'start-waiting-period':
        return {
          ...prev,
          timer: { ...prev.timer, isRunning: true },
          sets: {
            ...prev.sets,
            isWaitingPeriod: true,
            waitingRemainingSeconds: prev.sets.waitingTotalSeconds
          },
          match: { ...prev.match, isEnded: false }
        };
      
      case 'start-next-set':
        return {
          ...prev,
          teams: {
            home: { ...prev.teams.home, score: 0, penalties: 0 },
            away: { ...prev.teams.away, score: 0, penalties: 0 }
          },
          timer: {
            ...prev.timer,
            remainingSeconds: prev.timer.totalSeconds,
            isRunning: false
          },
          sets: {
            ...prev.sets,
            current: prev.sets.current + 1,
            isWaitingPeriod: false
          },
          match: { ...prev.match, isEnded: false }
        };
      
      case 'set-total-sets':
        return {
          ...prev,
          sets: { ...prev.sets, total: payload.total }
        };
      
      case 'set-waiting-time':
        return {
          ...prev,
          sets: {
            ...prev.sets,
            waitingTotalSeconds: payload.seconds,
            waitingRemainingSeconds: payload.seconds
          }
        };
        
      default:
        return prev;
    }
    
    return newState;
  });
}

export default useGameState;
