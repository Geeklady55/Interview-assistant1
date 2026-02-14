# StealthInterview Desktop App

A native desktop application for StealthInterview.ai - your invisible AI co-pilot for technical interviews.

## Features

- **Native Desktop Experience**: Runs as a standalone app on Windows and Mac
- **System Tray Integration**: Quick access from your system tray/menu bar
- **Global Shortcuts**: Toggle stealth mode from anywhere with `Ctrl/Cmd + Shift + S`
- **Stealth Overlay**: Floating, transparent window that stays on top
- **Auto-Updates**: Automatic updates when new versions are released

## Installation

### Download Pre-built Binaries

Download the latest release for your platform:

- **Windows**: `StealthInterview-x.x.x-Windows.exe` (installer) or `.portable.exe`
- **Mac (Intel)**: `StealthInterview-x.x.x-Mac-x64.dmg`
- **Mac (Apple Silicon)**: `StealthInterview-x.x.x-Mac-arm64.dmg`

### Build from Source

#### Prerequisites

- Node.js 18+ 
- Yarn package manager
- For Windows builds: Windows 10+
- For Mac builds: macOS 10.15+

#### Build Steps

1. **Install dependencies**:
   ```bash
   cd desktop
   yarn install
   ```

2. **Build for your platform**:
   ```bash
   # Windows
   yarn build:win
   
   # Mac
   yarn build:mac
   
   # Linux
   yarn build:linux
   
   # All platforms
   yarn build:all
   ```

3. **Find your build**: Built files will be in the `dist/` folder

## Configuration

### Custom Backend URL

By default, the app connects to the hosted StealthInterview.ai service. To use a custom backend:

1. Set the environment variable before running:
   ```bash
   # Windows (PowerShell)
   $env:STEALTH_APP_URL="http://localhost:3000"
   
   # Mac/Linux
   export STEALTH_APP_URL="http://localhost:3000"
   ```

2. Or modify `CONFIG.APP_URL` in `main.js`

## Keyboard Shortcuts

### Global Shortcuts (work anywhere)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + S` | Toggle Stealth Mode |
| `Ctrl/Cmd + Shift + I` | Show/Hide Main Window |

### In-App Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Submit Question |
| `Ctrl/Cmd + M` | Toggle Microphone |
| `Escape` | Minimize Stealth Overlay |
| `Ctrl/Cmd + Shift + C` | Copy Answer |
| `Ctrl/Cmd + 1` | Open Live Interview |
| `Ctrl/Cmd + 2` | Open Code Interview |
| `Ctrl/Cmd + 3` | Open Dashboard |

## System Tray

Right-click the tray icon for quick access to:
- Open main window
- Launch Stealth Mode
- Quick navigation to interview modes
- Settings
- Quit

## Stealth Mode

The stealth overlay is designed to be invisible during screen sharing:
- Semi-transparent floating window
- Always stays on top of other windows
- Draggable and resizable
- Hidden from taskbar
- Configurable opacity in Settings

## Troubleshooting

### App won't start
- Make sure you have the latest version
- Try running as administrator (Windows)
- Check if another instance is already running

### Microphone not working
- Grant microphone permissions in system settings
- Check if your browser blocks microphone access

### Updates not installing
- Download the latest version manually from releases
- Make sure you have write permissions to the installation directory

## Development

### Running in Development Mode

```bash
yarn start
```

### Creating Icons

Place your icon files in the `assets/` folder:
- `icon.png` - 512x512 PNG for Linux
- `icon.ico` - Windows icon
- `icon.icns` - Mac icon
- `tray-icon.png` - 16x16 or 22x22 for system tray

## License

MIT License - See LICENSE file for details.
