(function () {
  const messages = [];
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const codeInput = document.getElementById('code-input');
  const errorEl = document.getElementById('error-feedback');
  const LOADING_ID = 'loading-indicator';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderContent(text) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('```') && parts[i].endsWith('```')) {
        const pre = document.createElement('pre');
        pre.className = 'message__code';
        pre.textContent = parts[i].slice(3, -3).trim();
        fragment.appendChild(pre);
      } else {
        const span = document.createElement('span');
        span.innerHTML = escapeHtml(parts[i]).replace(/\n/g, '<br>');
        fragment.appendChild(span);
      }
    }
    return fragment;
  }

  function renderMessages() {
    messagesEl.querySelectorAll('.message, .welcome').forEach((el) => el.remove());
    const loading = document.getElementById(LOADING_ID);
    if (loading) loading.remove();

    if (messages.length === 0) {
      const welcome = document.createElement('div');
      welcome.className = 'welcome';
      welcome.textContent =
        "Describe a migration, e.g. 'Migrate Express to FastAPI', and optionally paste code below.";
      messagesEl.appendChild(welcome);
      return;
    }

    for (const msg of messages) {
      const div = document.createElement('div');
      div.className = 'message message--' + msg.role;
      if (msg.role === 'assistant') {
        div.appendChild(renderContent(msg.content));
      } else {
        div.textContent = msg.content;
      }
      messagesEl.appendChild(div);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showLoading() {
    const el = document.createElement('div');
    el.id = LOADING_ID;
    el.className = 'loading-indicator';
    el.textContent = 'Thinking…';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeLoading() {
    const el = document.getElementById(LOADING_ID);
    if (el) el.remove();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const messageTrimmed = messageInput.value.trim();
    const codeTrimmed = codeInput.value.trim();
    if (!messageTrimmed) {
      messageInput.focus();
      return;
    }

    const displayText = messageTrimmed + (codeTrimmed ? '\n[Code attached]' : '');
    messages.push({ role: 'user', content: displayText });
    messageInput.value = '';
    codeInput.value = '';
    errorEl.textContent = '';
    renderMessages();
    showLoading();

    fetch('/migrate/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageTrimmed,
        code: codeTrimmed || undefined,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data };
        });
      })
      .then(function ({ ok, data }) {
        removeLoading();
        if (ok) {
          messages.push({ role: 'assistant', content: data.content });
          errorEl.textContent = '';
          renderMessages();
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } else {
          errorEl.textContent = data.error || 'Something went wrong';
        }
      })
      .catch(function () {
        removeLoading();
        errorEl.textContent = 'Something went wrong';
      });
  });

  renderMessages();
})();
