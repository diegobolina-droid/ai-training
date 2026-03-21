const SESSION_KEY = 'lab05_session_id';
/** Same prefix as Vercel catch-all + local node-dev relay */
const API = '/api';

function $(id) {
  return document.getElementById(id);
}

function loadSessionId() {
  const input = $('session_id');
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved && input && !input.value) {
    input.value = saved;
  }
}

function saveSessionId() {
  const v = $('session_id')?.value?.trim();
  if (v) {
    localStorage.setItem(SESSION_KEY, v);
  }
}

function renderTrace(trace, container) {
  container.innerHTML = '';
  if (!trace || trace.length === 0) {
    container.textContent = 'No trace events.';
    return;
  }
  for (const ev of trace) {
    const div = document.createElement('div');
    div.className = `trace-item ${ev.type}`;
    const type = document.createElement('div');
    type.className = 'trace-type';
    type.textContent = ev.type.replace(/_/g, ' ');
    div.appendChild(type);
    if (ev.type === 'supervisor') {
      const pre = document.createElement('pre');
      pre.textContent = ev.content || '';
      div.appendChild(pre);
    } else if (ev.type === 'delegate') {
      const pre = document.createElement('pre');
      pre.textContent = `${ev.agent}\n${ev.task || ''}`;
      div.appendChild(pre);
    } else if (ev.type === 'worker_result') {
      const pre = document.createElement('pre');
      pre.textContent = `${ev.agent}\n${ev.output || ''}`;
      div.appendChild(pre);
    } else if (ev.type === 'note') {
      const pre = document.createElement('pre');
      pre.textContent = ev.message || '';
      div.appendChild(pre);
    }
    container.appendChild(div);
  }
}

async function fetchInfo() {
  try {
    const r = await fetch(`${API}/info`);
    const j = await r.json();
    $('provider').textContent = j.provider || '—';
  } catch {
    $('provider').textContent = '—';
  }
}

async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg =
      r.status === 504
        ? 'Gateway timeout — use fewer max iterations or a Vercel plan with a longer function limit.'
        : j.error || r.statusText || 'Request failed';
    throw new Error(msg);
  }
  return j;
}

function collectBody() {
  const task = $('task').value.trim();
  const max_iterations = parseInt($('max_iterations').value, 10) || 5;
  const session_id = $('session_id').value.trim() || undefined;
  if (!task) {
    throw new Error('Task is required.');
  }
  saveSessionId();
  return { task, max_iterations, session_id };
}

async function runQuick() {
  const err = $('error');
  const out = $('output');
  const traceEl = $('trace');
  const status = $('status');
  err.textContent = '';
  out.textContent = '';
  traceEl.innerHTML = '';
  status.textContent = 'Running…';
  $('btn-quick').disabled = true;
  try {
    const body = collectBody();
    const j = await postJson(`${API}/run`, body);
    status.textContent = `Done — ${j.steps_taken ?? 0} worker step(s).`;
    out.textContent = j.result || '';
    renderTrace(j.trace, traceEl);
    $('hitl-panel').innerHTML = '';
  } catch (e) {
    err.textContent = e.message || String(e);
    status.textContent = '';
  } finally {
    $('btn-quick').disabled = false;
  }
}

let activeRunId = null;

function buildHitlPanel(pending, runId) {
  const panel = $('hitl-panel');
  panel.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'hitl-pending';
  const h = document.createElement('h3');
  h.textContent = 'Human approval required';
  wrap.appendChild(h);
  const ids = [];

  pending.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'pending-row';
    row.innerHTML = `<label>Task for <strong>${escapeHtml(p.agent)}</strong></label>`;
    const ta = document.createElement('textarea');
    ta.id = `edit-task-${i}`;
    ta.value = p.task || '';
    row.appendChild(ta);
    wrap.appendChild(row);
    ids.push({ agent: p.agent, taId: ta.id });
  });

  const actions = document.createElement('div');
  actions.className = 'actions';

  const approve = document.createElement('button');
  approve.className = 'primary';
  approve.textContent = 'Approve';
  approve.onclick = () => resumeHitl(runId, 'approve', ids);

  const edit = document.createElement('button');
  edit.textContent = 'Approve with edits';
  edit.onclick = () => resumeHitl(runId, 'edit', ids);

  const reject = document.createElement('button');
  reject.textContent = 'Reject';
  reject.onclick = () => resumeHitl(runId, 'reject', ids);

  actions.append(approve, edit, reject);
  wrap.appendChild(actions);

  const fbLabel = document.createElement('label');
  fbLabel.textContent = 'Rejection feedback (optional)';
  const fb = document.createElement('textarea');
  fb.id = 'reject-feedback';
  fb.style.minHeight = '64px';
  wrap.appendChild(fbLabel);
  wrap.appendChild(fb);

  panel.appendChild(wrap);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function resumeHitl(runId, action, idRows) {
  const err = $('error');
  const out = $('output');
  const traceEl = $('trace');
  const status = $('status');
  err.textContent = '';
  status.textContent = 'Resuming…';
  $('btn-hitl-start').disabled = true;

  const body = { action, feedback: undefined, edited_tasks: undefined };
  if (action === 'reject') {
    body.feedback = $('reject-feedback')?.value?.trim() || undefined;
  }
  if (action === 'edit') {
    body.edited_tasks = {};
    for (const { agent, taId } of idRows) {
      body.edited_tasks[agent] = document.getElementById(taId).value;
    }
  }

  try {
    const j = await postJson(`${API}/run/${runId}/resume`, body);
    renderTrace(j.trace, traceEl);

    if (j.status === 'awaiting_approval') {
      activeRunId = j.run_id;
      status.textContent = 'Awaiting approval (next batch).';
      buildHitlPanel(j.pending, j.run_id);
      return;
    }

    activeRunId = null;
    $('hitl-panel').innerHTML = '';
    status.textContent = `Done — ${j.steps_taken ?? 0} worker step(s).`;
    out.textContent = j.result || '';
  } catch (e) {
    err.textContent = e.message || String(e);
    status.textContent = '';
  } finally {
    $('btn-hitl-start').disabled = false;
  }
}

async function startHitl() {
  const err = $('error');
  const out = $('output');
  const traceEl = $('trace');
  const status = $('status');
  err.textContent = '';
  out.textContent = '';
  traceEl.innerHTML = '';
  $('hitl-panel').innerHTML = '';
  status.textContent = 'Starting (HITL)…';
  $('btn-hitl-start').disabled = true;
  activeRunId = null;

  try {
    const base = collectBody();
    const j = await postJson(`${API}/run/start`, { ...base, hitl: true });

    renderTrace(j.trace, traceEl);

    if (j.status === 'awaiting_approval') {
      activeRunId = j.run_id;
      status.textContent = 'Awaiting approval.';
      buildHitlPanel(j.pending, j.run_id);
      return;
    }

    status.textContent = `Done — ${j.steps_taken ?? 0} worker step(s).`;
    out.textContent = j.result || '';
  } catch (e) {
    err.textContent = e.message || String(e);
    status.textContent = '';
  } finally {
    $('btn-hitl-start').disabled = false;
  }
}

$('btn-quick').addEventListener('click', runQuick);
$('btn-hitl-start').addEventListener('click', startHitl);

loadSessionId();
fetchInfo();

if (typeof location !== 'undefined' && /\.vercel\.app$/i.test(location.hostname)) {
  const hint = $('timeout-hint');
  if (hint) {
    hint.hidden = false;
  }
}
