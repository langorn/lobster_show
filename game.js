// Phaser Game Config
const phaserConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#002b36',
    transparent: false,
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let lobster;
let dialogueText;
let dialogueBubble;
let lobsterName = 'Clawdy';
let lobsterScale = 3.0;
let currentLanguage = 'zh';
let currentMQTTState = 'idle';
let animationFrames = {};
let isSettingsOpen = false;

const translations = {
    zh: {
        settings_title: "⚙️ 設置",
        lang_group: "🌐 語言 / Language",
        lobster_group: "🏷️ 龍蝦設定",
        scale_label: "大小:",
        save_btn: "儲存設定",
        close_btn: "完成",
        name_placeholder: "輸入名字...",
        mqtt_success: "MQTT 連線成功！",
        mqtt_fail: "MQTT 連線失敗，請檢查憑證！",
        save_success: "設定已保存！",
        save_error: "錯誤：部分設定保存失敗。",
        interact_msg: "你點到我了！嘿嘿～",
        speak_prefix: "說：",
        changed_msg: "我變了！看看我的新樣子！",
        state_dialogues: {
            idle: "我在發呆呢～",
            eating: "嚼嚼嚼...真好吃！",
            sleeping: "Zzz...夢到龍蝦大餐...",
            thinking: "思考龍生中...",
            responding: "來啦來啦！我在聽喔！",
            offline: "我要去休息一下了，待會見！",
            tool_start: "啟動完成！開始工作！",
            tool_end: "搞定！我是不是超厲害？"
        }
    },
    en: {
        settings_title: "⚙️ Settings",
        lang_group: "🌐 Language",
        lobster_group: "🏷️ Lobster Settings",
        scale_label: "Scale:",
        save_btn: "Save Settings",
        close_btn: "Done",
        name_placeholder: "Enter name...",
        mqtt_success: "MQTT Connected!",
        mqtt_fail: "MQTT Connection Failed!",
        save_success: "Settings Saved!",
        save_error: "Error: Failed to save settings.",
        interact_msg: "You clicked me! Hehe~",
        speak_prefix: "says:",
        changed_msg: "I've changed! Look at me now!",
        state_dialogues: {
            idle: "Just daydreaming...",
            eating: "Munch munch... so delicious!",
            sleeping: "Zzz... dreaming of the deep blue...",
            thinking: "Thinking about life...",
            responding: "Coming! I'm listening!",
            offline: "Going for a break, see ya!",
            tool_start: "Ready to roll! Let's work!",
            tool_end: "Done! Am I awesome or what?"
        }
    }
};

function updateUILanguage() {
    const t = translations[currentLanguage];
    document.getElementById('settings-title').innerText = t.settings_title;
    document.getElementById('language-group-title').innerText = t.lang_group;
    document.getElementById('lobster-group-title').innerText = t.lobster_group;
    document.getElementById('scale-label').innerText = t.scale_label;
    document.getElementById('save-settings-btn').innerText = t.save_btn;
    document.getElementById('close-settings-btn').innerText = t.close_btn;
    document.getElementById('name-input').placeholder = t.name_placeholder;
}

// We fetch frame data before starting the game
async function initGame() {
    animationFrames = await window.electronAPI.getAnimationFrames();
    const config = await window.electronAPI.getLobsterConfig();
    currentLanguage = config.language || 'zh';
    new Phaser.Game(phaserConfig); // Renamed config to phaserConfig to avoid confusion
}

function preload() {
    // Load background
    this.load.image('background', 'assets/background.jpg');

    // Load each animation sprite sheet from each folder
    for (const [folder, fileName] of Object.entries(animationFrames)) {
        this.load.spritesheet(folder, `assets/${folder}/${fileName}`, {
            frameWidth: 64,
            frameHeight: 64
        });
    }
}

let mqttClient; // Declare mqttClient globally or in a higher scope

async function create() {
    const scene = this;

    // Fetch initial config
    const lobsterConfig = await window.electronAPI.getLobsterConfig();
    lobsterName = lobsterConfig.name;
    lobsterScale = lobsterConfig.scale;
    currentLanguage = lobsterConfig.language || 'zh';

    updateUILanguage();
    document.getElementById('language-select').value = currentLanguage;

    // Setup Animations dynamically
    function setupAnimations(sceneContext) {
        for (const [folder, fileName] of Object.entries(animationFrames)) {
            // Remove existing if any (for dynamic refresh)
            if (sceneContext.anims.exists(folder)) sceneContext.anims.remove(folder);

            const defaultFrameRates = {
                eating: 4,
                sleeping: 1,
                idle: 2,
                thinking: 3,
                responding: 4
            };

            sceneContext.anims.create({
                key: folder,
                frames: sceneContext.anims.generateFrameNumbers(folder, { start: 0, end: 7 }),
                frameRate: defaultFrameRates[folder] || 2,
                repeat: -1
            });
        }
    }
    setupAnimations(this);

    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Add Background
    const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'background');
    // Scale background to fit canvas if it's different
    const scaleX = canvasWidth / bg.width;
    const scaleY = canvasHeight / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Create Lobster
    const hasIdle = animationFrames.idle !== undefined;

    if (hasIdle) {
        lobster = this.add.sprite(canvasWidth / 2, canvasHeight / 2, 'idle', 0).setScale(lobsterScale);
        lobster.play('idle');
    } else {
        lobster = this.add.sprite(canvasWidth / 2, canvasHeight / 2, 64, 64, 0xff0000).setScale(lobsterScale);
        this.add.text(canvasWidth / 2, canvasHeight / 2 + 80, 'Assets Missing', { fontSize: '16px' }).setOrigin(0.5);
    }
    lobster.setInteractive();

    // Interaction Reaction
    lobster.on('pointerdown', () => {
        if (isSettingsOpen) return;
        scene.tweens.add({
            targets: lobster,
            y: lobster.y - 50,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
        showDialogue(translations[currentLanguage].interact_msg);
    });

    // Dialogue Elements
    dialogueBubble = this.add.graphics();
    dialogueText = this.add.text(400, 200, '', {
        fontSize: '20px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 300 }
    }).setOrigin(0.5);
    dialogueBubble.setVisible(false);
    dialogueText.setVisible(false);

    // MQTT Connection
    async function connectMQTT() {
        if (mqttClient) {
            console.log('Closing existing MQTT connection...');
            mqttClient.end();
        }

        const config = await window.electronAPI.getLobsterConfig();

        console.log('Connecting to MQTT with user:', config.mqtt_user);

        mqttClient = mqtt.connect('ws://localhost:9001', {
            username: config.mqtt_user,
            password: config.mqtt_pass
        });

        mqttClient.on('connect', () => {
            console.log('Phaser connected to MQTT Broker via WS');
            mqttClient.subscribe('/lobster/status');
            showDialogue(translations[currentLanguage].mqtt_success);
        });

        mqttClient.on('message', (topic, payload) => {
            if (topic === '/lobster/status') {
                try {
                    const data = JSON.parse(payload.toString());
                    console.log(`[Phaser MQTT] Topic: ${topic} | Payload:`, data);

                    const state = data.state;
                    const cuteDialogue = translations[currentLanguage].state_dialogues[state] || data.dialogue || state;

                    if (state) showDialogue(cuteDialogue);

                    if (state && state !== currentMQTTState) {
                        currentMQTTState = state;
                        if (scene.anims.exists(state)) {
                            lobster.play(state);
                        } else {
                            console.warn(`Animation ${state} not found!`);
                        }
                    }
                } catch (e) {
                    console.error('[Phaser MQTT] Parse error:', e, payload.toString());
                }
            }
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT Connection Error:', err);
            showDialogue(translations[currentLanguage].mqtt_fail);
        });
    }
    connectMQTT();

    // --- UI Logic ---
    const settingsPanel = document.getElementById('settings-panel');
    const menuBtn = document.getElementById('menu-toggle-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    const openSettings = async () => {
        isSettingsOpen = true;
        settingsPanel.classList.remove('hidden');
        scene.input.enabled = false;
        document.getElementById('game-container').style.pointerEvents = 'none';

        const config = await window.electronAPI.getLobsterConfig();
        document.getElementById('name-input').value = config.name;
        document.getElementById('scale-input').value = config.scale;
        document.getElementById('language-select').value = config.language;
    };

    menuBtn.onclick = openSettings;
    window.electronAPI.onOpenSettings(openSettings);

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openSettings();
    });

    closeSettingsBtn.onclick = () => {
        isSettingsOpen = false;
        settingsPanel.classList.add('hidden');
        scene.input.enabled = true;
        document.getElementById('game-container').style.pointerEvents = 'auto';
    };

    document.getElementById('save-settings-btn').onclick = async (e) => {
        e.stopPropagation();
        const newName = document.getElementById('name-input').value.trim();
        const newScale = parseFloat(document.getElementById('scale-input').value);
        const newLang = document.getElementById('language-select').value;

        if (newName && !isNaN(newScale)) {
            const nameSuccess = await window.electronAPI.setLobsterName(newName);
            const scaleSuccess = await window.electronAPI.setLobsterScale(newScale);
            const langSuccess = await window.electronAPI.setLobsterLanguage(newLang);

            if (nameSuccess && scaleSuccess && langSuccess) {
                lobsterName = newName;
                lobsterScale = newScale;
                currentLanguage = newLang;

                if (lobster) lobster.setScale(lobsterScale);
                updateUILanguage();

                alert(translations[currentLanguage].save_success);
                showDialogue(translations[currentLanguage].changed_msg);
                closeSettingsBtn.onclick();
            } else {
                alert(translations[currentLanguage].save_error);
            }
        }
    };
}

function update() { }

function showDialogue(text) {
    const t = translations[currentLanguage];
    const fullText = `${lobsterName} ${t.speak_prefix}\n${text}`;
    dialogueText.setText(fullText);

    const canvasWidth = dialogueText.scene.sys.game.config.width;
    const canvasHeight = dialogueText.scene.sys.game.config.height;

    // Reposition text for the new resolution
    dialogueText.setPosition(canvasWidth / 2, canvasHeight / 3);

    dialogueBubble.clear();
    dialogueBubble.fillStyle(0x000000, 0.7);
    const padding = 20;
    const width = dialogueText.width + padding * 2;
    const height = dialogueText.height + padding * 2;
    dialogueBubble.fillRoundedRect(dialogueText.x - width / 2, dialogueText.y - height / 2, width, height, 15);
    dialogueBubble.setVisible(true);
    dialogueText.setVisible(true);

    if (window.dialogueTimeout) clearTimeout(window.dialogueTimeout);
    window.dialogueTimeout = setTimeout(() => {
        dialogueBubble.setVisible(false);
        dialogueText.setVisible(false);
    }, 5000);
}

initGame();
