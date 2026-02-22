// Luneo Chat Widget Embed Script
// Usage: <script src="https://cdn.luneo.app/widget.js" data-widget="wdg_xxx" async></script>

(function() {
  const WIDGET_API = "https://api.luneo.app/api/v1/widget";

  const script = document.currentScript;
  const widgetId = script && script.getAttribute("data-widget");
  if (!widgetId) return;

  if (window.__luneo_initialized) return;
  window.__luneo_initialized = true;

  const container = document.createElement("div");
  container.id = "luneo-widget-container";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "closed" });

  let isOpen = false;
  let conversationId = localStorage.getItem("luneo_conv_" + widgetId);
  let config = null;

  fetch(WIDGET_API + "/config/" + widgetId)
    .then(r => r.json())
    .then(cfg => { config = cfg; render(); })
    .catch(err => console.error("[Luneo] Widget config error:", err));

  function render() {
    const primaryColor = config && config.color || "#6366F1";
    const position = config && config.position || "BOTTOM_RIGHT";
    const positionCSS = position === "BOTTOM_LEFT" ? "left: 20px;" : "right: 20px;";

    shadow.innerHTML = `<style>*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}.luneo-bubble{position:fixed;bottom:20px;${positionCSS}z-index:999999;width:60px;height:60px;border-radius:50%;background:${primaryColor};color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s,box-shadow 0.2s}.luneo-bubble:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,0.2)}.luneo-bubble svg{width:28px;height:28px}.luneo-window{position:fixed;bottom:90px;${positionCSS}z-index:999998;width:380px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:white;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);display:none;flex-direction:column;overflow:hidden}.luneo-window.open{display:flex}.luneo-header{background:${primaryColor};color:white;padding:16px 20px;display:flex;align-items:center;gap:12px}.luneo-header-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px}.luneo-header-info h3{font-size:15px;font-weight:600}.luneo-header-info p{font-size:12px;opacity:0.8}.luneo-close{margin-left:auto;cursor:pointer;opacity:0.8}.luneo-close:hover{opacity:1}.luneo-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}.luneo-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word}.luneo-msg.assistant{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}.luneo-msg.user{background:${primaryColor};color:white;align-self:flex-end;border-bottom-right-radius:4px}.luneo-msg.typing{opacity:0.6}.luneo-msg.typing::after{content:'u2026u2026u2026';animation:dots 1.5s steps(3) infinite}@keyframes dots{0%{content:'.'}33%{content:'..'}66%{content:'u2026u2026u2026'}}.luneo-input-area{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;align-items:center}.luneo-input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;resize:none}.luneo-input:focus{border-color:${primaryColor};box-shadow:0 0 0 2px ${primaryColor}20}.luneo-send{width:40px;height:40px;border-radius:8px;border:none;background:${primaryColor};color:white;cursor:pointer;display:flex;align-items:center;justify-content:center}.luneo-send:disabled{opacity:0.5;cursor:not-allowed}.luneo-send svg{width:18px;height:18px}.luneo-powered{text-align:center;padding:8px;font-size:11px;color:#9ca3af}.luneo-powered a{color:#6b7280;text-decoration:none}@media(max-width:480px){.luneo-window{width:100vw;height:100vh;max-height:100vh;bottom:0;right:0;left:0;border-radius:0}.luneo-bubble{bottom:16px;right:16px}}</style><div class="luneo-bubble" id="luneo-toggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="luneo-window" id="luneo-window"><div class="luneo-header"><div class="luneo-header-avatar">${(config&&config.agentAvatar||"🤖")}</div><div class="luneo-header-info"><h3>${(config&&config.agentName||"Assistant")}</h3><p>${(config&&config.brandName||"En ligne")}</p></div><div class="luneo-close" id="luneo-close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div class="luneo-messages" id="luneo-messages"></div><div class="luneo-input-area"><input class="luneo-input" id="luneo-input" placeholder="${(config&&config.placeholder||"Ecrivez votre message...")}" /><button class="luneo-send" id="luneo-send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg></button></div><div class="luneo-powered">Powered by <a href="https://luneo.app" target="_blank">Luneo</a></div></div>`;shadow.getElementById("luneo-toggle").addEventListener("click", toggleChat);
    shadow.getElementById("luneo-close").addEventListener("click", toggleChat);
    shadow.getElementById("luneo-send").addEventListener("click", sendMessage);
    shadow.getElementById("luneo-input").addEventListener("keypress", function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

    if (config && config.greeting) addMessage("assistant", config.greeting);
  }

  function toggleChat() {
    isOpen = !isOpen;
    const win = shadow.getElementById("luneo-window");
    if (win) win.classList.toggle("open", isOpen);
  }

  function addMessage(role, content) {
    const c = shadow.getElementById("luneo-messages");
    if (!c) return;
    const div = document.createElement("div");
    div.className = "luneo-msg " + role;
    div.textContent = content;
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  }

  async function sendMessage() {
    const input = shadow.getElementById("luneo-input");
    const content = input && input.value && input.value.trim();
    if (!content) return;

    input.value = "";
    addMessage("user", content);

    const typingDiv = document.createElement("div");
    typingDiv.className = "luneo-msg assistant typing";
    typingDiv.textContent = "En train de repondre";
    shadow.getElementById("luneo-messages").appendChild(typingDiv);

    try {
      if (!conversationId) {
        const startRes = await fetch(WIDGET_API + "/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widgetId }),
        });
        const startData = await startRes.json();
        conversationId = startData.conversationId;
        localStorage.setItem("luneo_conv_" + widgetId, conversationId);
      }

      const res = await fetch(WIDGET_API + "/conversations/" + conversationId + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      typingDiv.remove();
      addMessage("assistant", data.message && data.message.content || "Erreur");
    } catch (err) {
      typingDiv.remove();
      addMessage("assistant", "Desole, une erreur est survenue.");
    }
  }
})();
