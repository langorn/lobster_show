# Lobster Desktop App 🦞

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English

A virtual pet desktop application built with Electron, Phaser 3, and MQTT. The app acts as a visual companion that plays animations based on state information received from **OpenClaw**.

### Features
- **OpenClaw Integration**: Driven by real-time data from OpenClaw via the built-in MQTT broker.
- **Dynamic Animations**: Animations are loaded from sprite sheets (256x128, 4x2 layout).
- **MQTT Integration**: Control the lobster's state and dialogue via a built-in MQTT broker.
- **Bilingual Support**: Toggle between English and Chinese.
- **Pixel-Perfect Rendering**: Sharp visuals using Phaser's pixel art mode.
- **Beautiful Background**: Dynamic background scaling for 1024x768 resolution.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. **Environment Variables**: Create a `.env` file in the root directory (one is provided as a template):
   ```env
   MQTT_USERNAME=your_username
   MQTT_PASSWORD=your_password
   ```
2. **Local Settings**: The application saves its state in `config.json` automatically, including the lobster's name, scale, and language preference.

### How to Run
Start the application using:
```bash
npm start
```

### OpenClaw Plugin Setup
To send data from OpenClaw to this desktop app, you need to install the `lobster-mqtt-reporter` plugin:

1. Create a `plugins` directory in your OpenClaw folder if it doesn't exist.
2. Place the `lobster-mqtt-reporter` folder inside that directory.
3. Run the installation command:
   ```bash
   openclaw plugins install ~/.openclaw/plugins/lobster-mqtt-reporter
   ```

#### Re-installing or Changing Parameters
If you change parameters inside the plugin, you must perform a clean re-installation:
1. Remove the existing extension folder:
   ```bash
   rm -rf extensions/lobster-mqtt-reporter/
   ```
2. Open `openclaw.json` and remove the `lobster-mqtt-reporter` entries from both `plugins.entries` and `plugins.installs`.
3. Run the installation command again:
   ```bash
   openclaw plugins install ~/.openclaw/plugins/lobster-mqtt-reporter
   ```

### MQTT Control
The app runs a built-in broker on:
- **TCP Port**: 1883
- **WebSocket Port**: 9001

To control the lobster manually (external to OpenClaw), publish a JSON message to `/lobster/status`:
```json
{
  "state": "thinking",
  "dialogue": "Optional custom text"
}
```
Supported states: `idle`, `eating`, `sleeping`, `thinking`, `responding`, `offline`, `tool_start`, `tool_end`.

---

<a name="中文"></a>
## 中文

基於 Electron、Phaser 3 和 MQTT 開發的虛擬寵物桌面應用。該應用作為一個視覺伴侶，根據從 **OpenClaw** 接收到的狀態信息播放相應的動畫。

### 功能特點
- **OpenClaw 集成**：通過內置的 MQTT 代理，根據 OpenClaw 的實時數據驅動龍蝦狀態。
- **動態動畫**：從精靈圖 (Sprite Sheets, 256x128, 4x2 排列) 動態加載。
- **MQTT 集成**：通過內置的 MQTT 代理控制龍蝦的狀態和對話。
- **多語言支持**：支持中英文切換。
- **像素級渲染**：開啟 Phaser 像素藝術模式，確保縮放時畫質銳利。
- **精美背景**：支持 1024x768 分辨率的背景自動縮放。

### 準備工作
- [Node.js](https://nodejs.org/) (建議 v16 或更高版本)
- [npm](https://www.npmjs.com/)

### 安裝步驟
1. 克隆或下載本倉庫到本地。
2. 在項目目錄下打開終端。
3. 安裝依賴庫：
   ```bash
   npm install
   ```

### 配置説明
1. **環境變量**：在根目錄創建 `.env` 文件（或修改現有文件）：
   ```env
   MQTT_USERNAME=你的用戶名
   MQTT_PASSWORD=你的密碼
   ```
2. **本地配置**：應用會自動將龍蝦名稱、縮放比例和語言設定保存在 `config.json` 中。

### 如何運行
使用以下命令啟動應用：
```bash
npm start
```

### OpenClaw 插件設置
若要將數據從 OpenClaw 發送到此桌面應用，您需要安裝 `lobster-mqtt-reporter` 插件：

1. 如果 OpenClaw 文件夾中不存在 `plugins` 目錄，請先建立一個。
2. 將 `lobster-mqtt-reporter` 文件夾放入該目錄。
3. 執行安裝指令：
   ```bash
   openclaw plugins install ~/.openclaw/plugins/lobster-mqtt-reporter
   ```

#### 重新安裝或修改參數
如果您修改了插件內部的參數，必須進行乾淨的重新安裝：
1. 刪除現有的擴展文件夾：
   ```bash
   rm -rf extensions/lobster-mqtt-reporter/
   ```
2. 打開 `openclaw.json`，手動刪除 `plugins.entries` 和 `plugins.installs` 中關於 `lobster-mqtt-reporter` 的內容。
3. 再次執行安裝指令：
   ```bash
   openclaw plugins install ~/.openclaw/plugins/lobster-mqtt-reporter
   ```

### MQTT 控制
應用內置代理端口如下：
- **TCP 端口**：1883
- **WebSocket 端口**：9001

手動控制龍蝦（非 OpenClaw 驅動）時，請向 `/lobster/status` 主題發送 JSON 消息：
```json
{
  "state": "thinking",
  "dialogue": "自定義文字（可選）"
}
```
支持的狀態：`idle`, `eating`, `sleeping`, `thinking`, `responding`, `offline`, `tool_start`, `tool_end`。
