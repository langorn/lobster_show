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

### MQTT Control
The app runs a built-in broker on:
- **TCP Port**: 1883
- **WebSocket Port**: 9001

To control the lobster, publish a JSON message to `/lobster/status`:
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

### MQTT 控制
應用內置代理端口如下：
- **TCP 端口**：1883
- **WebSocket 端口**：9001

通過向 `/lobster/status` 主題發送 JSON 消息來控制龍蝦：
```json
{
  "state": "thinking",
  "dialogue": "自定義文字（可選）"
}
```
支持的狀態：`idle`, `eating`, `sleeping`, `thinking`, `responding`, `offline`, `tool_start`, `tool_end`。
