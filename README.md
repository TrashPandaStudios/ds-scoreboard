# Drone Soccer Scoreboard

An official scoreboard application for Drone Soccer following FAI rules. Built with Electron and React for a portable, offline experience with multi-monitor support.

![Drone Soccer Scoreboard](https://img.shields.io/badge/FAI-Drone%20Soccer-blue)
![Electron](https://img.shields.io/badge/Electron-28-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)

## Features

- **Dual Window Display** - Scoreboard display for spectators and Referee control panel
- **Multi-Monitor Support** - Automatically places scoreboard on secondary display
- **FAI Rules Compliant** - Default 3-minute match timer
- **Configurable Timer** - Quick presets (1, 2, 3, 5 min) or custom time
- **Score & Penalty Tracking** - Easy increment/decrement controls
- **Team Customization** - Editable team names and colors
- **Sound Effects** - Goal celebration and match end buzzer (uses audio files)
- **Offline Capable** - No internet required, fully portable

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or download the project
cd DroneSoccerScoreboard

# Install dependencies
npm install

# Start in development mode
npm run electron:dev
```

### Building for Distribution

```bash
# Build production app
npm run package
```

The packaged application will be in the `release` folder.

## Usage

### Starting a Match

1. Launch the application - two windows will open:
   - **Scoreboard** (displays on secondary monitor if available)
   - **Referee Control Panel** (displays on primary monitor)

2. Configure team names and colors in the Referee Panel

3. Set match time (default: 3:00)

4. Press **Start** to begin the countdown

### Referee Controls

| Control | Function |
|---------|----------|
| **+/-** Score | Increment/decrement team scores |
| **+/-** Penalties | Track penalty count per team |
| **Start/Pause** | Control match timer |
| **Reset Timer** | Reset to configured time |
| **Quick Set** | 1, 2, 3, or 5 minute presets |
| **Custom Time** | Set any MM:SS duration |
| **Reset Match** | Clear scores, keep settings |
| **🔊/🔇** | Toggle sound effects |

### Keyboard Shortcuts

The application is designed for touch/click control, but future versions may include keyboard shortcuts.

## Project Structure

```
DroneSoccerScoreboard/
├── electron/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Secure IPC bridge
│   └── gameState.js     # Centralized state management
├── src/
│   ├── components/
│   │   ├── Scoreboard/  # Display window components
│   │   └── RefPanel/    # Control panel components
│   ├── hooks/
│   │   └── useGameState.js  # React state hook
│   └── styles/
│       └── global.css   # Global styles
├── package.json
└── vite.config.js
```

## Technical Details

### Architecture

- **Main Process**: Holds authoritative game state, manages timer
- **Renderer Windows**: React apps connected via IPC
- **State Sync**: All state changes broadcast to both windows
- **Sound System**: Audio file playback for timer end buzzer (buzzer.mp3 or buzzer.wav in public directory)

### Technologies

- **Electron 28** - Desktop application framework
- **React 18** - UI components
- **Vite 5** - Build tool
- **Web Audio API** - Sound generation

## FAI Drone Soccer Rules Reference

- Standard match duration: **3 minutes**
- Penalties tracked per team
- No halftime in standard format

For complete rules, visit [FAI Drone Sports](https://www.fai.org/)

## Development

```bash
# Run Vite dev server only (for UI development)
npm run dev

# Run full Electron app in development
npm run electron:dev

# Build React app
npm run build

# Package Electron app
npm run package
```

## License

MIT License - Free to use for competitions and events.

---

Made for the Drone Soccer community 🚁⚽

