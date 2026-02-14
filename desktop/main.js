const { app, BrowserWindow, shell, Menu, Tray, globalShortcut, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuration
const CONFIG = {
  // Change this to your deployed URL or localhost for development
  APP_URL: process.env.STEALTH_APP_URL || 'https://tech-interview-pro-1.preview.emergentagent.com',
  
  // Update server URL (for custom update server)
  UPDATE_SERVER_URL: process.env.STEALTH_UPDATE_URL || 'https://tech-interview-pro-1.preview.emergentagent.com/api',
  
  // Window settings
  WINDOW: {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600
  },
  
  // Stealth overlay settings
  STEALTH: {
    width: 450,
    height: 500,
    opacity: 0.95
  }
};

let mainWindow = null;
let stealthWindow = null;
let tray = null;
let isQuitting = false;
let updateAvailable = false;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// For custom update server (optional)
if (process.env.STEALTH_UPDATE_URL) {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `${CONFIG.UPDATE_SERVER_URL}/updates/${process.platform}`
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.WINDOW.width,
    height: CONFIG.WINDOW.height,
    minWidth: CONFIG.WINDOW.minWidth,
    minHeight: CONFIG.WINDOW.minHeight,
    title: 'StealthInterview.ai',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    backgroundColor: '#050505',
    show: false,
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : true
  });

  // Load the app
  mainWindow.loadURL(CONFIG.APP_URL);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check for updates
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle close
  mainWindow.on('close', (event) => {
    if (!isQuitting && process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createStealthWindow() {
  if (stealthWindow) {
    stealthWindow.focus();
    return;
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  stealthWindow = new BrowserWindow({
    width: CONFIG.STEALTH.width,
    height: CONFIG.STEALTH.height,
    x: screenWidth - CONFIG.STEALTH.width - 20,
    y: screenHeight - CONFIG.STEALTH.height - 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the live interview page directly in stealth mode
  stealthWindow.loadURL(`${CONFIG.APP_URL}/live-interview`);

  // Set opacity
  stealthWindow.setOpacity(CONFIG.STEALTH.opacity);

  stealthWindow.on('closed', () => {
    stealthWindow = null;
  });

  return stealthWindow;
}

function createTray() {
  // Create tray icon (use a simple placeholder for now)
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    // Create a simple icon if file doesn't exist
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open StealthInterview',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: 'Stealth Mode',
      click: () => createStealthWindow()
    },
    { type: 'separator' },
    {
      label: 'Quick Interview',
      submenu: [
        {
          label: 'Live Interview',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/live-interview`);
              mainWindow.show();
            }
          }
        },
        {
          label: 'Code Interview',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/code-interview`);
              mainWindow.show();
            }
          }
        },
        {
          label: 'Mock Practice',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/dashboard`);
              mainWindow.show();
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.loadURL(`${CONFIG.APP_URL}/settings`);
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('StealthInterview.ai');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function registerGlobalShortcuts() {
  // Global shortcut to toggle stealth mode
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (stealthWindow) {
      stealthWindow.close();
    } else {
      createStealthWindow();
    }
  });

  // Global shortcut to show/hide main window
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'StealthInterview',
      submenu: [
        { label: 'About StealthInterview', role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CommandOrControl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/settings`);
            }
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CommandOrControl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Interview',
      submenu: [
        {
          label: 'Live Interview',
          accelerator: 'CommandOrControl+1',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/live-interview`);
            }
          }
        },
        {
          label: 'Code Interview',
          accelerator: 'CommandOrControl+2',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/code-interview`);
            }
          }
        },
        {
          label: 'Mock Practice',
          accelerator: 'CommandOrControl+3',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${CONFIG.APP_URL}/dashboard`);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Stealth Mode',
          accelerator: 'CommandOrControl+Shift+S',
          click: () => {
            if (stealthWindow) {
              stealthWindow.close();
            } else {
              createStealthWindow();
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'StealthInterview Shortcuts',
              detail: `
Global Shortcuts:
• Ctrl/Cmd + Shift + S: Toggle Stealth Mode
• Ctrl/Cmd + Shift + I: Show/Hide Main Window

In-App Shortcuts:
• Ctrl/Cmd + Enter: Submit Question
• Ctrl/Cmd + M: Toggle Microphone
• Escape: Minimize Stealth Overlay
• Ctrl/Cmd + Shift + C: Copy Answer

Navigation:
• Ctrl/Cmd + 1: Live Interview
• Ctrl/Cmd + 2: Code Interview
• Ctrl/Cmd + 3: Dashboard
              `
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  createMenu();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

// IPC handlers
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('toggle-stealth', () => {
  if (stealthWindow) {
    stealthWindow.close();
    return false;
  } else {
    createStealthWindow();
    return true;
  }
});
