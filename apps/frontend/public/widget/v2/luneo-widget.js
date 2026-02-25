/**
 * Luneo Widget V2 - AI Agent Chat Widget
 * Embed on any website with a single script tag:
 * <script src="https://cdn.luneo.app/widget/v2/luneo-widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
 */
(function () {
  'use strict';

  const API_BASE = (window.LUNEO_API_URL || 'https://api.luneo.app') + '/api/v1/widget';
  const script = document.currentScript;
  const widgetId = script && script.getAttribute('data-widget-id');

  if (!widgetId || window.__luneo_v2_initialized) return;
  window.__luneo_v2_initialized = true;

  let config = null;
  let conversationId = localStorage.getItem('luneo_conv_v2_' + widgetId);
  let isOpen = false;
  let isTyping = false;
  let messages = [];

  const container = document.createElement('div');
  container.id = 'luneo-widget-v2';
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: 'closed' });

  fetchConfig().then(render).catch(function (e) {
    console.error('[Luneo] Widget config error:', e);
  });

  function fetchConfig() {
    return fetch(API_BASE + '/config/' + widgetId)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        config = data.data || data;
        return config;
      });
  }

  function getStyles() {
    const c = (config && config.color) || '#6366F1';
    const pos = (config && config.position) || 'BOTTOM_RIGHT';
    const posCSS = pos === 'BOTTOM_LEFT' ? 'left: 20px;' : 'right: 20px;';
    const windowPos = pos === 'BOTTOM_LEFT' ? 'left: 20px;' : 'right: 20px;';

    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      :host { --primary: ${c}; --primary-light: ${c}20; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

      .widget-bubble {
        position: fixed; bottom: 20px; ${posCSS} z-index: 999999;
        width: 56px; height: 56px; border-radius: 50%;
        background: var(--primary); color: white;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; border: none; outline: none;
        box-shadow: 0 4px 20px rgba(99,102,241,0.3), 0 0 0 0 rgba(99,102,241,0.4);
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        animation: pulse 3s ease-in-out infinite;
      }
      .widget-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(99,102,241,0.4); }
      .widget-bubble.open { transform: rotate(90deg) scale(1); animation: none; }
      .widget-bubble svg { width: 26px; height: 26px; transition: transform 0.3s; }

      @keyframes pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.3), 0 0 0 0 rgba(99,102,241,0.4); }
        50% { box-shadow: 0 4px 20px rgba(99,102,241,0.3), 0 0 0 8px rgba(99,102,241,0); }
      }

      .widget-window {
        position: fixed; bottom: 88px; ${windowPos} z-index: 999998;
        width: 400px; max-width: calc(100vw - 32px);
        height: 560px; max-height: calc(100vh - 120px);
        border-radius: 20px; overflow: hidden;
        display: flex; flex-direction: column;
        background: rgba(255,255,255,0.98);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05);
        transform: translateY(12px) scale(0.95); opacity: 0;
        pointer-events: none;
        transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      }
      .widget-window.open {
        transform: translateY(0) scale(1); opacity: 1;
        pointer-events: auto;
      }

      .widget-header {
        background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black));
        color: white; padding: 16px 20px;
        display: flex; align-items: center; gap: 12px;
        position: relative; overflow: hidden;
      }
      .widget-header::after {
        content: ''; position: absolute; top: -50%; right: -50%;
        width: 100%; height: 200%; border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      }

      .header-avatar {
        width: 40px; height: 40px; border-radius: 12px;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; position: relative; z-index: 1;
      }
      .header-avatar .online-dot {
        position: absolute; bottom: -2px; right: -2px;
        width: 12px; height: 12px; border-radius: 50%;
        background: #22c55e; border: 2px solid var(--primary);
      }

      .header-info { flex: 1; position: relative; z-index: 1; }
      .header-info h3 { font-size: 15px; font-weight: 600; }
      .header-info p { font-size: 12px; opacity: 0.85; }

      .header-close {
        cursor: pointer; opacity: 0.8; transition: opacity 0.2s;
        position: relative; z-index: 1; background: none; border: none; color: white;
      }
      .header-close:hover { opacity: 1; }

      .messages-area {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 8px;
        scroll-behavior: smooth;
      }
      .messages-area::-webkit-scrollbar { width: 4px; }
      .messages-area::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

      .msg {
        max-width: 82%; padding: 10px 14px; font-size: 14px; line-height: 1.6;
        word-wrap: break-word; animation: msgIn 0.3s ease-out;
      }
      @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

      .msg.assistant {
        align-self: flex-start; background: #f3f4f6; color: #1f2937;
        border-radius: 4px 16px 16px 16px;
      }
      .msg.user {
        align-self: flex-end; background: var(--primary); color: white;
        border-radius: 16px 4px 16px 16px;
      }

      .typing-indicator {
        align-self: flex-start; display: flex; gap: 4px;
        padding: 12px 16px; background: #f3f4f6;
        border-radius: 4px 16px 16px 16px;
      }
      .typing-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #9ca3af;
        animation: typingBounce 1.4s ease-in-out infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

      .input-area {
        padding: 12px 16px; border-top: 1px solid #f3f4f6;
        display: flex; gap: 8px; align-items: flex-end;
        background: white;
      }
      .input-field {
        flex: 1; border: 1.5px solid #e5e7eb; border-radius: 12px;
        padding: 10px 14px; font-size: 14px; font-family: inherit;
        outline: none; resize: none; max-height: 100px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
      .input-field::placeholder { color: #9ca3af; }

      .send-btn {
        width: 40px; height: 40px; border-radius: 12px;
        border: none; background: var(--primary); color: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; flex-shrink: 0;
      }
      .send-btn:hover { filter: brightness(1.1); transform: scale(1.05); }
      .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .send-btn svg { width: 18px; height: 18px; }

      .powered-by {
        text-align: center; padding: 6px; font-size: 11px; color: #9ca3af;
        background: white;
      }
      .powered-by a { color: #6b7280; text-decoration: none; }
      .powered-by a:hover { color: var(--primary); }

      @media (max-width: 480px) {
        .widget-window {
          width: 100vw; height: 100vh; max-height: 100vh;
          bottom: 0; right: 0; left: 0; border-radius: 0;
        }
        .widget-window.open { transform: none; }
        .widget-bubble { bottom: 16px; }
      }
    `;
  }

  function render() {
    const avatar = (config && config.agentAvatar) || '\u{1F916}';
    const name = (config && config.agentName) || 'Assistant';
    const brand = (config && config.brandName) || 'En ligne';
    const placeholder = (config && config.placeholder) || '\u00C9crivez votre message...';

    shadow.innerHTML = '<style>' + getStyles() + '</style>' +
      '<button class="widget-bubble" id="toggle" aria-label="Ouvrir le chat">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
      '</button>' +
      '<div class="widget-window" id="window">' +
        '<div class="widget-header">' +
          '<div class="header-avatar">' + avatar + '<div class="online-dot"></div></div>' +
          '<div class="header-info"><h3>' + name + '</h3><p>' + brand + '</p></div>' +
          '<button class="header-close" id="close" aria-label="Fermer">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="messages-area" id="messages"></div>' +
        '<div class="input-area">' +
          '<input class="input-field" id="input" placeholder="' + placeholder + '" autocomplete="off" />' +
          '<button class="send-btn" id="send" aria-label="Envoyer">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="powered-by">Powered by <a href="https://luneo.app" target="_blank" rel="noopener">Luneo</a></div>' +
      '</div>';

    shadow.getElementById('toggle').addEventListener('click', toggleWidget);
    shadow.getElementById('close').addEventListener('click', toggleWidget);
    shadow.getElementById('send').addEventListener('click', sendMessage);
    shadow.getElementById('input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    if (config && config.greeting) {
      addMessage('assistant', config.greeting);
    }
  }

  function toggleWidget() {
    isOpen = !isOpen;
    var win = shadow.getElementById('window');
    var btn = shadow.getElementById('toggle');
    if (win) win.classList.toggle('open', isOpen);
    if (btn) btn.classList.toggle('open', isOpen);

    if (isOpen) {
      setTimeout(function () {
        var input = shadow.getElementById('input');
        if (input) input.focus();
      }, 400);
    }
  }

  function addMessage(role, content) {
    var area = shadow.getElementById('messages');
    if (!area) return;
    var div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = content;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    messages.push({ role: role, content: content });
  }

  function showTyping() {
    var area = shadow.getElementById('messages');
    if (!area) return;
    var div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typing';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function hideTyping() {
    var el = shadow.getElementById('typing');
    if (el) el.remove();
  }

  async function sendMessage() {
    var input = shadow.getElementById('input');
    var text = input && input.value && input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    addMessage('user', text);
    isTyping = true;
    showTyping();

    try {
      if (!conversationId) {
        var convRes = await fetch(API_BASE + '/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId: widgetId }),
        });
        var convData = await convRes.json();
        conversationId = (convData.data || convData).conversationId;
        localStorage.setItem('luneo_conv_v2_' + widgetId, conversationId);
      }

      var msgRes = await fetch(API_BASE + '/conversations/' + conversationId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      var msgData = await msgRes.json();
      var response = (msgData.data || msgData);
      var content = (response.message && response.message.content) || response.content || 'Erreur';

      hideTyping();
      addMessage('assistant', content);
    } catch (err) {
      hideTyping();
      addMessage('assistant', 'D\u00e9sol\u00e9, une erreur est survenue. Veuillez r\u00e9essayer.');
    } finally {
      isTyping = false;
    }
  }

  // Public API for programmatic control
  window.LuneoWidget = {
    open: function () { if (!isOpen) toggleWidget(); },
    close: function () { if (isOpen) toggleWidget(); },
    toggle: toggleWidget,
    sendMessage: function (text) {
      var input = shadow.getElementById('input');
      if (input) { input.value = text; sendMessage(); }
    },
    destroy: function () {
      container.remove();
      window.__luneo_v2_initialized = false;
    },
  };
})();
