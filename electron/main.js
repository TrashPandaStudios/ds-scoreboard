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
