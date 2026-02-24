const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getLobsterConfig: () => ipcRenderer.invoke('get-lobster-config'),
    setLobsterName: (name) => ipcRenderer.invoke('set-lobster-name', name),
    setLobsterScale: (scale) => ipcRenderer.invoke('set-lobster-scale', scale),
    setLobsterLanguage: (lang) => ipcRenderer.invoke('set-lobster-language', lang),
    getAnimationFrames: () => ipcRenderer.invoke('get-animation-frames'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
    getConfigPath: () => ipcRenderer.invoke('get-config-path'),
});

// Since the renderer needs to connect to MQTT via WebSockets,
// we can either expose the mqtt library through here or just use it directly in the renderer
// if we have a bundler. Since we're using simple script tags, we'll load mqtt.js in HTML.
