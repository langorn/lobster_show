const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const httpServer = require('http').createServer();
const ws = require('websocket-stream');
const mqtt = require('mqtt');
// Local Config Path (directly in project folder for visibility)
const CONFIG_PATH = path.join(__dirname, 'config.json');

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      try {
        const parsed = JSON.parse(data);
        console.log('Read config success from:', CONFIG_PATH);
        return parsed;
      } catch (parseErr) {
        console.error('JSON Parse Error, backing up config:', parseErr);
        fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak');
        return {}; // Start fresh but save backup
      }
    }
  } catch (e) {
    console.error('CRITICAL: Read config error:', e);
  }
  return {};
}

function writeConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_PATH, data, 'utf8');
    // Force immediate sync to disk
    const fd = fs.openSync(CONFIG_PATH, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    console.log('Config physically saved to:', CONFIG_PATH);
    return true;
  } catch (e) {
    console.error('CRITICAL: Write config error:', e);
    return false;
  }
}

// Initial Config setup
let configData = readConfig();
if (!configData) {
  console.log('No existing config or read failed, initializing new config.');
  configData = {};
}

// MQTT Ports & Credentials
const TCP_PORT = 1883;
const WS_PORT = 9001;

// Default Credentials from .env
const defaultUser = process.env.MQTT_USERNAME || 'lobster_user';
const defaultPass = process.env.MQTT_PASSWORD || 'lobster_pass_1234';

// Initialize MQTT Auth from Config or .env (ONLY if not already present)
let needsUpdate = false;
if (!configData.mqtt_user) { configData.mqtt_user = defaultUser; needsUpdate = true; }
if (!configData.mqtt_pass) { configData.mqtt_pass = defaultPass; needsUpdate = true; }
if (!configData.lobsterName) { configData.lobsterName = 'Clawdy'; needsUpdate = true; }
if (!configData.lobsterScale) { configData.lobsterScale = 3.0; needsUpdate = true; } // Default scale

if (needsUpdate) {
  console.log('Updating initial defaults...');
  writeConfig(configData);
}

aedes.authenticate = (client, username, password, callback) => {
  const storedUser = configData.mqtt_user;
  const storedPass = configData.mqtt_pass;
  const authorized = (username === storedUser && password.toString() === storedPass);
  if (authorized) {
    callback(null, true);
  } else {
    const error = new Error('Auth error');
    error.returnCode = 4;
    callback(error, null);
  }
};

// --- MQTT Broker Logging (Added for visibility) ---
aedes.on('clientReady', (client) => {
  console.log(`[Broker] Client Connected: ${client ? client.id : 'unknown'}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`[Broker] Client Disconnected: ${client ? client.id : 'unknown'}`);
});

aedes.on('publish', (packet, client) => {
  if (packet.topic.startsWith('$SYS')) return; // Ignore system messages
  console.log(`[Broker] Published on ${packet.topic}: ${packet.payload.toString()}`);
});
// ----------------------------------------------------

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Lobster Desktop App',
    autoHideMenuBar: false,
  });

  // Create a simple menu for fallback
  const template = [
    {
      label: '選單',
      submenu: [
        { label: '開啟設置', click: () => { mainWindow.webContents.send('open-settings'); } },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.loadFile('index.html');

  // Open DevTools during development if needed
  // mainWindow.webContents.openDevTools();
}

// IPC Handlers for Persistence
ipcMain.handle('get-lobster-config', () => {
  configData = readConfig();
  return {
    name: configData.lobsterName || 'Clawdy',
    scale: configData.lobsterScale || 3.0,
    language: configData.language || 'zh',
    mqtt_user: configData.mqtt_user,
    mqtt_pass: configData.mqtt_pass
  };
});

ipcMain.handle('set-lobster-name', (event, name) => {
  try {
    configData.lobsterName = name;
    writeConfig(configData);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('set-lobster-scale', (event, scale) => {
  try {
    configData.lobsterScale = parseFloat(scale);
    writeConfig(configData);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('set-lobster-language', (event, lang) => {
  try {
    configData.language = lang;
    writeConfig(configData);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('close-window', () => {
  app.quit();
});

ipcMain.handle('get-config-path', () => {
  return CONFIG_PATH;
});

ipcMain.handle('get-animation-frames', (event) => {
  const assetsPath = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsPath)) {
    fs.mkdirSync(assetsPath, { recursive: true });
  }

  // Dynamically get all subdirectories in assets
  const folders = fs.readdirSync(assetsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const animations = {};

  folders.forEach(folder => {
    const folderPath = path.join(assetsPath, folder);
    const files = fs.readdirSync(folderPath);
    // Look for a file named {folder}.png (or with other common extensions)
    const spriteSheet = files.find(f => f.match(new RegExp(`^${folder}\\.(png|jpg|jpeg|gif)$`, 'i')));
    if (spriteSheet) {
      animations[folder] = spriteSheet;
    }
  });

  return animations;
});

ipcMain.handle('upload-frame', async (event, folder) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const src = result.filePaths[0];
    const folderPath = path.join(__dirname, 'assets', folder);
    const files = fs.readdirSync(folderPath);
    const nextNum = files.length + 1;
    const ext = path.extname(src);
    const dest = path.join(folderPath, `${nextNum}${ext}`);

    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
});

// Start MQTT Broker
server.listen(TCP_PORT, '0.0.0.0', function () {
  console.log(`MQTT Broker (TCP) started and listening on port ${TCP_PORT}`);
});

ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(WS_PORT, '0.0.0.0', function () {
  console.log(`MQTT Broker (WebSocket) started and listening on port ${WS_PORT}`);
});

// Clawdbot Simulation
let clawdbotClient;

function startClawdbot() {
  // End existing client if running
  if (clawdbotClient) {
    console.log('CMD: Restarting Clawdbot...');
    clawdbotClient.end();
  }

  const user = configData.mqtt_user;
  const pass = configData.mqtt_pass;

  clawdbotClient = mqtt.connect(`mqtt://0.0.0.0:${TCP_PORT}`, {
    username: user,
    password: pass
  });

  const states = ['idle', 'eating', 'sleeping'];
  const dialogues = {
    idle: ["我在發呆呢！", "無聊中...", "聽說大海很漂亮？", "嘿！看我！"],
    eating: ["好吃！", "嚼嚼嚼～", "這是美味的海藻嗎？", "好飽喔～"],
    sleeping: ["Zzz...", "夢到大海！", "別吵我...", "睡個午覺～"]
  };

  clawdbotClient.on('connect', () => {
    console.log('Clawdbot connected to local broker');

    // Clear previous interval if any (though client.end() usually handles connection, we need to stop the loop)
    if (clawdbotClient.publishInterval) clearInterval(clawdbotClient.publishInterval);

    clawdbotClient.publishInterval = setInterval(() => {
      const state = states[Math.floor(Math.random() * states.length)];
      const dialogueList = dialogues[state];
      const dialogue = dialogueList[Math.floor(Math.random() * dialogueList.length)];

      const message = JSON.stringify({ state, dialogue });
      clawdbotClient.publish('/lobster/status', message);
      console.log(`Clawdbot published: ${message}`);
    }, 10000); // Every 10 seconds
  });

  clawdbotClient.on('error', (err) => {
    console.error('Clawdbot Connection Error:', err.message);
  });
}

app.whenReady().then(() => {
  createWindow();
  // startClawdbot();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up broker on exit
app.on('will-quit', () => {
  if (clawdbotClient) clawdbotClient.end();
  server.close();
  httpServer.close();
  aedes.close();
});
