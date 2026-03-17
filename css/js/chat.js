/* ============================================
   Team Chat Module
   ============================================ */

const Chat = (() => {
  function init() {
    const panel = document.getElementById('chatPanel');
    const openBtn = document.getElementById('btnChat');
    const closeBtn = document.getElementById('chatPanelClose');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');

    openBtn.addEventListener('click', () => {
      panel.classList.add('chat-panel--visible');
      renderMessages();
      scrollToBottom();
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('chat-panel--visible');
    });

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const username = Auth.getUsername();

    Store.update(data => {
      if (!data.chat) data.chat = [];
      data.chat.push({
        id: 'msg_' + Date.now(),
        user: username,
        text,
        timestamp: new Date().toISOString()
      });
      if (data.chat.length > 500) data.chat = data.chat.slice(-500);
    });

    Store.logActivity('sent_message', text.substring(0, 40));

    input.value = '';
    renderMessages();
    scrollToBottom();
  }

  function renderMessages() {
    const data = Store.get();
    const messages = data.chat || [];
    const el = document.getElementById('chatMessages');
    const currentUser = Auth.getUsername();

    if (messages.length === 0) {
      el.innerHTML = '<div class="chat-panel__empty">No messages yet. Say hello! 👋</div>';
      return;
    }

    el.innerHTML = messages.map(msg => {
      const isSelf = msg.user === currentUser;
      const initials = msg.user.substring(0, 2).toUpperCase();
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="chat-msg ${isSelf ? 'chat-msg--self' : 'chat-msg--other'}">
          ${!isSelf ? `<div class="chat-msg__author">${msg.user}</div>` : ''}
          <div>${escapeHtml(msg.text)}</div>
          <div class="chat-msg__time">${time}</div>
        </div>
      `;
    }).join('');
  }

  function scrollToBottom() {
    const el = document.getElementById('chatMessages');
    el.scrollTop = el.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return { init };
})();
