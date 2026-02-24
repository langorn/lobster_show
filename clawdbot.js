const mqtt = require('mqtt');

// Connect to the local broker started by the Electron app
const client = mqtt.connect('mqtt://localhost:1883');

const states = ['idle', 'eating', 'sleeping'];
const dialogues = {
    idle: ["我在外面發消息喔！", "這是外部腳本送來的～", "看我從獨立進程控制龍蝦！"],
    eating: ["好吃好吃！", "餵食中...", "外送來啦～"],
    sleeping: ["外部控制關燈...", "晚安，外面很安靜。", "夢到外面的大海..."]
};

client.on('connect', () => {
    console.log('External Clawdbot connected to Electron broker');

    setInterval(() => {
        const state = states[Math.floor(Math.random() * states.length)];
        const dialogueList = dialogues[state];
        const dialogue = dialogueList[Math.floor(Math.random() * dialogueList.length)];

        const message = JSON.stringify({ state, dialogue });
        client.publish('/lobster/status', message);
        console.log(`[External] Sent: ${message}`);
    }, 15000); // Pulse every 15 seconds
});

client.on('error', (err) => {
    console.error('Connection error: Make sure the Electron app is running first!', err.message);
    process.exit(1);
});
