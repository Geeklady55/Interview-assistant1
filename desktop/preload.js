const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Stealth mode
  toggleStealth: () => ipcRenderer.invoke('toggle-stealth'),
  
  // Update notifications
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  
  // Platform detection
  platform: process.platform,
  isElectron: true
});
