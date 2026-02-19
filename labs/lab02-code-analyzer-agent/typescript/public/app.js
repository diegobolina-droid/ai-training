(function () {
  const messagesEl = document.getElementById('messages');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const errorEl = document.getElementById('error-feedback');

  let messages = [];

  function hideError() {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = false;
  }

  const scrollGapTop = 16;

  function scrollToNewMessage(element) {
    if (!element) return;
    const top = Math.max(0, element.offsetTop - scrollGapTop);
    messagesEl.scrollTop = top;
  }

  function scrollToNewMessageAfterLayout(element) {
    requestAnimationFrame(function () {
      scrollToNewMessage(element);
    });
  }

  function addLoadingBubble() {
    const div = document.createElement('div');
    div.className = 'message message--loading';
    div.id = 'loading-bubble';
    div.setAttribute('aria-busy', 'true');
    div.textContent = 'Thinking…';
    messagesEl.appendChild(div);
    scrollToNewMessageAfterLayout(div);
  }

  function removeLoadingBubble() {
    const el = document.getElementById('loading-bubble');
    if (el) el.remove();
  }

  function renderMessages() {
    const loading = document.getElementById('loading-bubble');
    messagesEl.querySelectorAll('.message:not(#loading-bubble)').forEach(function (node) {
      node.remove();
    });
    messages.forEach(function (msg) {
      if (msg.role === 'system') return;
      const div = document.createElement('div');
      div.className = 'message message--' + msg.role;
      div.setAttribute('data-role', msg.role);
      const text = document.createTextNode(msg.content);
      div.appendChild(text);
      if (loading) {
        messagesEl.insertBefore(div, loading);
      } else {
        messagesEl.appendChild(div);
      }
    });
    const lastEl = document.getElementById('loading-bubble') || messagesEl.lastElementChild;
    scrollToNewMessageAfterLayout(lastEl);
  }

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = (inputEl.value || '').trim();
    if (!value) {
      inputEl.focus();
      return;
    }

    hideError();
    messages.push({ role: 'user', content: value });
    inputEl.value = '';
    renderMessages();
    addLoadingBubble();
    sendBtn.disabled = true;

    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        removeLoadingBubble();
        sendBtn.disabled = false;
        if (result.ok) {
          messages.push({ role: 'assistant', content: result.data.content || '' });
          renderMessages();
        } else {
          showError(result.data.error || 'Something went wrong');
          renderMessages();
        }
      })
      .catch(function () {
        removeLoadingBubble();
        sendBtn.disabled = false;
        showError('Network error. Please try again.');
        renderMessages();
      });
  });
})();
