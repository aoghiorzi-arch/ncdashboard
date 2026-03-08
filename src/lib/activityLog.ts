// Activity log — lightweight audit trail stored in localStorage
import { generateId } from './storage';

export interface ActivityEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'attached' | 'status_changed' | 'completed';
  module: string;
  itemTitle: string;
  user: string;
  details?: string;
  timestamp: string;
}

const KEY = 'nc_activity_log';
const MAX_ENTRIES = 200;

function getLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLog(entries: ActivityEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function logActivity(
  action: ActivityEntry['action'],
  module: string,
  itemTitle: string,
  user: string,
  details?: string
) {
  const entry: ActivityEntry = {
    id: generateId(),
    action,
    module,
    itemTitle,
    user,
    details,
    timestamp: new Date().toISOString(),
  };
  const log = [entry, ...getLog()];
  saveLog(log);
  window.dispatchEvent(new Event('nc-data-change'));
}

export function getActivityLog(): ActivityEntry[] {
  return getLog();
}

export function clearActivityLog() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('nc-data-change'));
}
