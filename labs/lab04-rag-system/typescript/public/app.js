const DEFAULT_FILES = [
  {
    name: 'auth.py',
    content:
      'def login(user, password):\n    # Validate credentials\n    return token',
  },
  {
    name: 'api.py',
    content: 'def get_users():\n    return db.query(User).all()',
  },
];

const README_EVAL_JSON = `{
  "examples": [{
    "question": "How does login work?",
    "expected_answer": "Login validates credentials and returns a token",
    "relevant_files": ["auth.py"]
  }]
}`;

async function apiJson(method, path, body) {
  const opts = { method };
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.error || data.message || res.statusText || 'Request failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(data));
  }
  return data;
}

function showPre(el, obj, isError) {
  el.hidden = false;
  el.textContent =
    typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  el.classList.toggle('error', !!isError);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {HTMLButtonElement} btn */
function setButtonLoading(btn, loading, loadingText) {
  if (loading) {
    if (!btn.dataset.defaultLabel) {
      btn.dataset.defaultLabel = btn.textContent.trim();
    }
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${escapeHtml(loadingText)}</span>`;
  } else {
    btn.disabled = false;
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    const label = btn.dataset.defaultLabel ?? '';
    btn.textContent = label;
  }
}

// ——— File rows ———
const fileRowsEl = document.getElementById('file-rows');

function createFileRow(name = '', content = '') {
  const row = document.createElement('div');
  row.className = 'file-row';
  row.innerHTML = `
    <div class="file-row-header">
      <input type="text" class="file-name" placeholder="path/to/file.py" />
      <button type="button" class="btn btn-secondary btn-remove-file">Remove</button>
    </div>
    <textarea class="file-content" spellcheck="false" placeholder="File contents…"></textarea>
  `;
  row.querySelector('.file-name').value = name;
  row.querySelector('.file-content').value = content;
  row.querySelector('.btn-remove-file').addEventListener('click', () => {
    row.remove();
    if (!fileRowsEl.querySelector('.file-row')) {
      fileRowsEl.appendChild(createFileRow());
    }
  });
  return row;
}

function initFileRows() {
  fileRowsEl.innerHTML = '';
  for (const f of DEFAULT_FILES) {
    fileRowsEl.appendChild(createFileRow(f.name, f.content));
  }
}

document.getElementById('btn-add-file').addEventListener('click', () => {
  fileRowsEl.appendChild(createFileRow());
});

document.getElementById('btn-index-files').addEventListener('click', async () => {
  const out = document.getElementById('out-index');
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-index-files'));
  const files = {};
  for (const row of fileRowsEl.querySelectorAll('.file-row')) {
    const name = row.querySelector('.file-name')?.value?.trim();
    const content = row.querySelector('.file-content')?.value ?? '';
    if (name) {
      files[name] = content;
    }
  }
  if (Object.keys(files).length === 0) {
    showPre(out, 'Add at least one file with a non-empty path.', true);
    return;
  }
  setButtonLoading(btn, true, 'Indexing…');
  try {
    const data = await apiJson('POST', '/index/files', { files });
    showPre(out, data, false);
  } catch (e) {
    showPre(out, e.message, true);
  } finally {
    setButtonLoading(btn, false);
  }
});

// ——— Query ———
const formQuery = document.getElementById('form-query');
const btnQuerySubmit = /** @type {HTMLButtonElement} */ (
  document.getElementById('btn-query-submit')
);

formQuery.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = /** @type {HTMLFormElement} */ (ev.target);
  const fd = new FormData(form);
  const question = (fd.get('question') || '').toString().trim();
  const nRaw = fd.get('n_results');
  const n_results = nRaw === '' || nRaw == null ? 5 : parseInt(String(nRaw), 10);
  const filter_language = (fd.get('filter_language') || '').toString().trim();
  const body = { question, n_results };
  if (filter_language) {
    body.filter_language = filter_language;
  }
  const container = document.getElementById('out-query');
  container.hidden = true;
  container.innerHTML = '';
  setButtonLoading(btnQuerySubmit, true, 'Querying…');
  try {
    const data = await apiJson('POST', '/query', body);
    const sourcesHtml =
      Array.isArray(data.sources) && data.sources.length
        ? `<ul class="sources-list">${data.sources
            .map(
              (s) =>
                `<li><strong>${escapeHtml(s.file || '')}</strong>${s.name != null ? ` — ${escapeHtml(String(s.name))}` : ''}${s.line != null ? ` (line ${s.line})` : ''} — relevance ${s.relevance != null ? Number(s.relevance).toFixed(4) : '—'}</li>`
            )
            .join('')}</ul>`
        : '<p class="muted">No sources returned.</p>';
    container.innerHTML = `
      <h3>Answer</h3>
      <p class="answer">${escapeHtml(data.answer || '')}</p>
      <h3>Sources</h3>
      ${sourcesHtml}
      <details class="context-used">
        <summary>Context used</summary>
        <pre>${escapeHtml(data.context_used || '')}</pre>
      </details>
    `;
    container.hidden = false;
  } catch (e) {
    container.innerHTML = `<pre class="output error" style="margin:0">${escapeHtml(e.message)}</pre>`;
    container.hidden = false;
  } finally {
    setButtonLoading(btnQuerySubmit, false);
  }
});

// ——— Evaluate ———
const evalJsonEl = document.getElementById('eval-json');
evalJsonEl.value = README_EVAL_JSON.trim();

document.getElementById('btn-eval-example').addEventListener('click', () => {
  evalJsonEl.value = README_EVAL_JSON.trim();
});

document.getElementById('btn-eval-run').addEventListener('click', async () => {
  const out = document.getElementById('out-eval');
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-eval-run'));
  let body;
  try {
    body = JSON.parse(evalJsonEl.value);
  } catch (e) {
    showPre(out, `Invalid JSON: ${e.message}`, true);
    return;
  }
  setButtonLoading(btn, true, 'Evaluating…');
  try {
    const data = await apiJson('POST', '/evaluate', body);
    showPre(out, data, false);
  } catch (e) {
    showPre(out, e.message, true);
  } finally {
    setButtonLoading(btn, false);
  }
});

// ——— Header actions ———
document.getElementById('btn-health').addEventListener('click', async () => {
  const out = document.getElementById('out-index');
  try {
    const data = await apiJson('GET', '/health');
    showPre(out, data, false);
  } catch (e) {
    showPre(out, e.message, true);
  }
});

document.getElementById('btn-stats').addEventListener('click', async () => {
  const out = document.getElementById('out-index');
  try {
    const data = await apiJson('GET', '/stats');
    showPre(out, data, false);
  } catch (e) {
    showPre(out, e.message, true);
  }
});

document.getElementById('btn-clear').addEventListener('click', async () => {
  if (!confirm('Clear the in-memory index?')) return;
  const out = document.getElementById('out-index');
  try {
    const data = await apiJson('DELETE', '/index');
    showPre(out, data, false);
  } catch (e) {
    showPre(out, e.message, true);
  }
});

initFileRows();
