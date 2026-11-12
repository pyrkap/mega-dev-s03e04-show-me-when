import { ack, fetchIncidents } from './api.js';
import { formatLocalTime, newestFirst } from './format.js';

const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const error = document.querySelector('[data-testid="error"]');
const updated = document.querySelector('[data-testid="updated"]');
const rows = new Map();
const acknowledged = new Map();
const pending = new Set();

function makeRow(incident) {
  const row = document.createElement('li');
  row.dataset.testid = 'incident-row';
  row.dataset.id = incident.id;
  row.className = 'row';
  for (const name of ['id', 'sev', 'what']) {
    const span = document.createElement('span');
    span.className = name;
    row.append(span);
  }
  row.append(document.createElement('time'));
  const action = document.createElement('span');
  action.className = 'action';
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.testid = 'ack';
  button.textContent = 'Ack';
  button.setAttribute('aria-label', `Ack ${incident.id}`);
  button.addEventListener('click', () => acknowledge(incident.id));
  action.append(button);
  row.append(action);
  return row;
}

function updateAction(id) {
  const row = rows.get(id);
  if (!row) return;
  const button = row.querySelector('[data-testid="ack"]');
  button.disabled = pending.has(id) || acknowledged.has(id);
  button.textContent = pending.has(id) ? 'Acking…' : 'Ack';
  if (acknowledged.has(id) && !row.querySelector('[data-testid="acked"]')) {
    const mark = document.createElement('span');
    mark.dataset.testid = 'acked';
    mark.textContent = 'Acked';
    mark.setAttribute('role', 'status');
    row.querySelector('.action').append(mark);
  }
}

async function acknowledge(id) {
  if (pending.has(id) || acknowledged.has(id)) return;
  pending.add(id);
  updateAction(id);
  try {
    const reply = await ack(id);
    acknowledged.set(id, reply);
    error.hidden = true;
  } catch (cause) {
    error.textContent = `Could not ack ${id}. Try again. ${cause.message}`;
    error.hidden = false;
  } finally {
    pending.delete(id);
    updateAction(id);
  }
}

function render(incidents) {
  const current = new Set(incidents.map((incident) => incident.id));
  for (const [id, row] of rows) {
    if (!current.has(id)) {
      row.remove();
      rows.delete(id);
    }
  }
  newestFirst(incidents).forEach((incident, index) => {
    let row = rows.get(incident.id);
    if (!row) {
      row = makeRow(incident);
      rows.set(incident.id, row);
    }
    row.className = `row ${['sev1', 'sev2', 'sev3'].includes(incident.severity) ? incident.severity : ''}`;
    row.querySelector('.id').textContent = incident.id;
    row.querySelector('.sev').textContent = incident.severity;
    row.querySelector('.what').textContent = `${incident.service} · ${incident.region} · ${incident.summary}`;
    const time = row.querySelector('time');
    time.dateTime = incident.openedAt;
    time.textContent = formatLocalTime(incident.openedAt);
    time.title = incident.openedAt;
    if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
    updateAction(incident.id);
  });
  empty.hidden = incidents.length !== 0;
}

let refreshing = false;
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const page = await fetchIncidents();
    render(page.incidents);
    loader.hidden = true;
    list.hidden = false;
    updated.textContent = `Updated ${formatLocalTime(page.updatedAt)}`;
    if (!pending.size) error.hidden = true;
  } catch (cause) {
    error.textContent = `Could not refresh incidents. Retrying automatically. ${cause.message}`;
    error.hidden = false;
  } finally {
    refreshing = false;
  }
}

void refresh();
setInterval(() => void refresh(), 2000);
