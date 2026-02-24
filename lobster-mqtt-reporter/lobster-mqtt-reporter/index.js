const { sendStatus } = require('./mqtt-sender');

module.exports = function register(api, config) {

  console.log('[Lobster MQTT Reporter] Plugin loaded');

  // Agent 准备调用模型 → thinking
  api.on("before_prompt_build", (ctx) => {
    try {
      const msg =
        ctx?.messages?.slice(-1)?.[0]?.content?.slice(0, 60) ||
        '思考中...';

      sendStatus('thinking', msg);

    } catch (err) {
      console.error('[MQTT Reporter] thinking hook error:', err.message);
    }
  });


  // Tool 开始
  api.on("before_tool_call", (ctx) => {
    try {
      const toolName = ctx?.tool?.name || '調用Tools';

      sendStatus('tool_start', `正在調用工具：${toolName}`);

    } catch (err) {
      console.error('[MQTT Reporter] tool_start error:', err.message);
    }
  });


  // Tool 完成
  api.on("after_tool_call", (ctx) => {
    try {
      const toolName = ctx?.tool?.name || '調用Tools';

      sendStatus('tool_end', `${toolName} 完成`);

    } catch (err) {
      console.error('[MQTT Reporter] tool_end error:', err.message);
    }
  });


  // 回覆準備送出
  api.on("message_sending", (ctx) => {
    try {
      sendStatus('responding', '正在整理回覆給你...');

    } catch (err) {
      console.error('[MQTT Reporter] responding error:', err.message);
    }
  });


  // 回覆完成 → idle
  api.on("message_sent", (ctx) => {
    try {
      sendStatus('sleeping', '回覆完成，等待下一個任務');

    } catch (err) {
      console.error('[MQTT Reporter] idle error:', err.message);
    }
  });

  api.on("agent_end", (ctx) => {
    //sendStatus('offline', 'Agent 已停止');
    sendStatus('offline', 'Agent已停止');
  });

  // Session 開始（可選）
  api.on("session_start", (ctx) => {
    sendStatus('idle', 'Agent 已啟動');
  });


  // Session 結束（可選）
  api.on("session_end", (ctx) => {
    //sendStatus('offline', 'Agent 已停止');
    sendStatus('offline', 'Agent已停止');
  });

};
