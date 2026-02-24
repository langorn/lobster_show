const mqtt = require('mqtt');

const broker = 'mqtt://192.168.1.12:1883';
const topic = '/lobster/status';

const client = mqtt.connect(broker, {
  username: 'lobster_user',
  password: 'lobster_pass_1234',
  clientId: 'lobster-reporter-' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', () => {
  console.log('[Lobster MQTT] Connected to broker');
});

client.on('error', (err) => {
  console.error('[Lobster MQTT] Connection error:', err);
});

function sendStatus(state, dialogue = '') {
  const payload = JSON.stringify({ state, dialogue });
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('[Lobster MQTT] Publish error:', err);
    } else {
      console.log(`[Lobster MQTT] Sent: ${state} - ${dialogue}`);
    }
  });
}

module.exports = { sendStatus };
