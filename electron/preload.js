const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send command to main process
  sendCommand: (command, payload) => {
    ipcRenderer.send('command', { command, payload });
  },

  // Request current state
  requestState: () => {
    ipcRenderer.send('request-state');
  },

  // Listen for state updates
  onStateUpdate: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on('state-update', handler);
    return () => {
      ipcRenderer.removeListener('state-update', handler);
    };
  },

  // Listen for sound triggers
  onPlaySound: (callback) => {
    const handler = (event, soundName) => callback(soundName);
    ipcRenderer.on('play-sound', handler);
    return () => {
      ipcRenderer.removeListener('play-sound', handler);
    };
  },

  // Select logo file
  selectLogoFile: () => {
    return ipcRenderer.invoke('select-logo-file');
  },

  // Select folder
  selectFolder: () => {
    return ipcRenderer.invoke('select-folder');
  }
});

