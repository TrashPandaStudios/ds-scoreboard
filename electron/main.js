const { app, BrowserWindow, ipcMain, screen, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const GameState = require('./gameState');

let scoreboardWindow = null;
let refPanelWindow = null;
let gameState = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createScoreboardWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  const windowConfig = {
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
    title: 'Drone Soccer Scoreboard',
    backgroundColor: '#0a0a0f',
    show: false,
  };

  // Place on external display if available
  if (externalDisplay) {
    windowConfig.x = externalDisplay.bounds.x + 50;
    windowConfig.y = externalDisplay.bounds.y + 50;
  }

  scoreboardWindow = new BrowserWindow(windowConfig);

  // Load the app
  if (isDev) {
    scoreboardWindow.loadURL('http://localhost:5173/?window=scoreboard');
  } else {
    scoreboardWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'scoreboard' }
    });
  }

  scoreboardWindow.once('ready-to-show', () => {
    scoreboardWindow.show();
  });

  scoreboardWindow.on('closed', () => {
    scoreboardWindow = null;
  });

  return scoreboardWindow;
}

function createRefPanelWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();

  refPanelWindow = new BrowserWindow({
    width: 700,
    height: 800,
    minWidth: 600,
    minHeight: 700,
    x: primaryDisplay.bounds.x + 50,
    y: primaryDisplay.bounds.y + 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
    title: 'Referee Control Panel',
    backgroundColor: '#0d0d12',
    show: false,
  });

  // Load the app
  if (isDev) {
    refPanelWindow.loadURL('http://localhost:5173/?window=refpanel');
  } else {
    refPanelWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'refpanel' }
    });
  }

  refPanelWindow.once('ready-to-show', () => {
    refPanelWindow.show();
  });

  refPanelWindow.on('closed', () => {
    refPanelWindow = null;
  });

  return refPanelWindow;
}

function broadcastState() {
  const state = gameState.getState();

  // Convert logo paths to custom protocol URLs for renderer process
  if (state.sponsors) {
    state.sponsors = state.sponsors.map(sponsor => {
      if (sponsor.logoPath && !sponsor.logoPath.startsWith('sponsor://') && !sponsor.logoPath.startsWith('http')) {
        // Use custom protocol to serve sponsor images
        sponsor.logoUrl = `sponsor://${sponsor.logoPath.replace(/\\/g, '/')}`;
      } else if (sponsor.logoPath) {
        sponsor.logoUrl = sponsor.logoPath;
      }
      return sponsor;
    });
  }

  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.webContents.send('state-update', state);
  }

  if (refPanelWindow && !refPanelWindow.isDestroyed()) {
    refPanelWindow.webContents.send('state-update', state);
  }
}

function broadcastSound(soundName) {
  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.webContents.send('play-sound', soundName);
  }

  if (refPanelWindow && !refPanelWindow.isDestroyed()) {
    refPanelWindow.webContents.send('play-sound', soundName);
  }
}

function saveMatchResult(state, isFinal) {
  try {
    let documentPath = app.getPath('documents');
    if (state.settings.matchResultFolder) {
      documentPath = state.settings.matchResultFolder;
    }
    const homeName = state.teams.home.name.replace(/[^a-z0-9]/gi, '_');
    const awayName = state.teams.away.name.replace(/[^a-z0-9]/gi, '_');

    let baseDir = '';
    // If a custom folder is set, we use it directly as the base (we can still create the match specific subfolder inside it)
    if (state.settings.matchResultFolder) {
      baseDir = path.join(documentPath, `${homeName}_vs_${awayName}`);
    } else {
      baseDir = path.join(documentPath, 'DroneSoccerScoreboard', 'MatchResults', `${homeName}_vs_${awayName}`);
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const now = new Date();
    const timeOptions = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const parts = new Intl.DateTimeFormat('en-US', timeOptions).formatToParts(now);
    const findObj = (type) => parts.find(p => p.type === type).value;
    const estString = `${findObj('year')}-${findObj('month')}-${findObj('day')}_${findObj('hour')}-${findObj('minute')}-${findObj('second')}`;

    let filename = `MatchResult_${estString}.json`;
    if (!isFinal) {
      filename = `MatchResult_Round${state.sets.current}_${estString}.json`;
    }

    let matchWinner = null;
    if (state.match.isMatchComplete) {
      if (state.teams.home.setsWon > state.teams.away.setsWon) {
        matchWinner = state.teams.home.name;
      } else if (state.teams.away.setsWon > state.teams.home.setsWon) {
        matchWinner = state.teams.away.name;
      } else {
        matchWinner = 'Tie';
      }
    }

    const getTeamName = (winnerString) => {
      if (winnerString === 'home') return state.teams.home.name;
      if (winnerString === 'away') return state.teams.away.name;
      return 'Tie';
    };

    const resultData = {
      timestamp: now.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }),
      isFinalSnapshot: isFinal,
      matchComplete: state.match.isMatchComplete,
      matchWinner: matchWinner,
      roundsPlayed: state.sets.history.length,
      homeTeam: {
        name: state.teams.home.name,
        score: state.teams.home.score,
        penalties: state.teams.home.penalties,
        setsWon: state.teams.home.setsWon
      },
      awayTeam: {
        name: state.teams.away.name,
        score: state.teams.away.score,
        penalties: state.teams.away.penalties,
        setsWon: state.teams.away.setsWon
      },
      roundHistory: state.sets.history.map(h => ({
        round: h.setNumber,
        winner: getTeamName(h.winner),
        homeScore: h.homeScore,
        awayScore: h.awayScore,
        penaltyPoints: h.penaltyPoints,
        endTime: new Date(h.endTime).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' })
      }))
    };

    fs.writeFileSync(path.join(baseDir, filename), JSON.stringify(resultData, null, 2));
  } catch (err) {
    console.error('Failed to save match result:', err);
  }
}

function setupIPC() {
  // Handle command from renderer
  ipcMain.on('command', (event, { command, payload }) => {
    handleCommand(command, payload);
  });

  // Handle state request
  ipcMain.on('request-state', (event) => {
    event.reply('state-update', gameState.getState());
  });

  // Handle logo file selection
  ipcMain.handle('select-logo-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourcePath = result.filePaths[0];
    const userDataPath = app.getPath('userData');
    const sponsorsDir = path.join(userDataPath, 'sponsors');

    // Ensure sponsors directory exists
    if (!fs.existsSync(sponsorsDir)) {
      fs.mkdirSync(sponsorsDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(sourcePath);
    const filename = Date.now().toString(36) + Math.random().toString(36).substr(2) + ext;
    const destPath = path.join(sponsorsDir, filename);

    // Copy file to sponsors directory
    try {
      fs.copyFileSync(sourcePath, destPath);
      // Return relative path that can be used to load the image
      return `sponsors/${filename}`;
    } catch (error) {
      console.error('Error copying logo file:', error);
      return null;
    }
  });

  // Handle folder selection
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}

function handleCommand(command, payload) {
  switch (command) {
    case 'increment-score':
      gameState.incrementScore(payload.team);
      break;

    case 'decrement-score':
      gameState.decrementScore(payload.team);
      break;

    case 'increment-penalty':
      gameState.incrementPenalty(payload.team);
      break;

    case 'decrement-penalty':
      gameState.decrementPenalty(payload.team);
      break;

    case 'set-team-name':
      gameState.setTeamName(payload.team, payload.name);
      break;

    case 'set-team-color':
      gameState.setTeamColor(payload.team, payload.color);
      break;

    case 'start-timer':
      gameState.startTimer();
      break;

    case 'pause-timer':
      gameState.pauseTimer();
      break;

    case 'reset-timer':
      gameState.resetTimer();
      break;

    case 'set-time':
      gameState.setTime(payload.seconds);
      break;

    case 'toggle-sound':
      gameState.toggleSound();
      break;

    case 'reset-match':
      gameState.resetMatch();
      break;

    case 'end-set':
      gameState.endSet();
      broadcastSound('buzzer');
      break;

    case 'start-waiting-period':
      gameState.startWaitingPeriod();
      break;

    case 'start-next-set':
      gameState.startNextSet();
      break;

    case 'set-waiting-time':
      gameState.setWaitingTime(payload.seconds);
      break;

    case 'set-total-sets':
      gameState.setTotalSets(payload.total);
      break;

    case 'edit-set-history':
      gameState.editSetHistory(payload.setIndex, payload.homeScore, payload.awayScore, payload.winner);
      break;

    case 'start-penalty-phase':
      gameState.startPenaltyPhase();
      break;

    case 'end-penalty-phase':
      gameState.endPenaltyPhase();
      broadcastSound('buzzer');
      break;

    case 'skip-penalty-phase':
      gameState.skipPenaltyPhase();
      break;

    case 'add-sponsor':
      gameState.addSponsor(payload.name, payload.logoPath);
      break;

    case 'remove-sponsor':
      gameState.removeSponsor(payload.id);
      // Optionally delete the logo file
      if (payload.logoPath) {
        const userDataPath = app.getPath('userData');
        const logoPath = path.join(userDataPath, payload.logoPath);
        try {
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
          }
        } catch (error) {
          console.error('Error deleting logo file:', error);
        }
      }
      break;

    case 'update-sponsor':
      gameState.updateSponsor(payload.id, payload.name, payload.logoPath, payload.whiteBackground);
      break;

    case 'reorder-sponsors':
      gameState.reorderSponsors(payload.sponsorIds);
      break;

    case 'set-sponsor-label':
      gameState.setSponsorLabel(payload.label);
      break;

    default:
      console.log('Unknown command:', command);
  }

  broadcastState();
}

app.whenReady().then(() => {
  // Register custom protocol for sponsor images (must be done before creating windows)
  protocol.registerFileProtocol('sponsor', (request, callback) => {
    const url = request.url.substr(9); // Remove 'sponsor://' prefix
    const userDataPath = app.getPath('userData');

    // Security check: ensure the path doesn't contain directory traversal
    if (url.includes('..')) {
      callback({ error: -6 }); // FILE_NOT_FOUND
      return;
    }

    // The URL should be in format "sponsors/filename.png"
    // Join directly with userDataPath since logoPath already includes "sponsors/"
    const filePath = path.join(userDataPath, url);

    // Normalize and verify path is within sponsors directory
    try {
      const normalizedPath = path.normalize(filePath);
      const sponsorsDir = path.normalize(path.join(userDataPath, 'sponsors'));

      // Ensure the resolved path is within the sponsors directory
      if (!normalizedPath.startsWith(sponsorsDir + path.sep) && normalizedPath !== sponsorsDir) {
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }

      if (fs.existsSync(normalizedPath)) {
        callback({ path: normalizedPath });
      } else {
        callback({ error: -6 }); // FILE_NOT_FOUND
      }
    } catch (error) {
      console.error('Error serving sponsor image:', error);
      callback({ error: -6 });
    }
  });

  // Initialize game state with callbacks
  gameState = new GameState({
    onStateChange: broadcastState,
    onTimerEnd: () => {
      broadcastSound('buzzer');
      broadcastState();
    },
    onSetEnd: (stateSnapshot) => {
      saveMatchResult(stateSnapshot, false);
    },
    onMatchEnd: (stateSnapshot) => {
      saveMatchResult(stateSnapshot, true);
    }
  });

  setupIPC();
  createScoreboardWindow();
  createRefPanelWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createScoreboardWindow();
      createRefPanelWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (gameState) {
    gameState.cleanup();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
