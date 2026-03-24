const ENTRIES_KEY = 'pgapool_entries';
const HISTORY_KEY = 'pgapool_history';

export function getEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY)) || {}; }
  catch { return {}; }
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

export function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}