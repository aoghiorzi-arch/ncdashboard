// localStorage data layer for NC Dashboard

export interface Task {
  id: string;
  title: string;
  description: string;
  moduleTag: 'Calendar' | 'Class' | 'Instructor' | 'Legal' | 'Event' | 'Budget' | 'Marketing' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'In Review' | 'Complete';
  owner: string;
  dueDate: string;
  subtasks: { id: string; label: string; done: boolean }[];
  notes: { id: string; text: string; author: string; timestamp: string }[];
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'Milestone' | 'Filming Day' | 'Meeting' | 'Deadline' | 'Event' | 'Reminder';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: 'Draft' | 'Approved' | 'Paid' | 'Disputed' | 'Cancelled';
  paymentDate: string;
  createdAt: string;
}

export interface NCSettings {
  platformName: string;
  launchDate: string;
  foundersCap: number;
  userName: string;
  totalBudget: number;
  totalMembers: number;
  foundersMembers: number;
}

const DEFAULT_SETTINGS: NCSettings = {
  platformName: 'Newbold Connect',
  launchDate: '2026-06-27',
  foundersCap: 200,
  userName: 'Alex',
  totalBudget: 50000,
  totalMembers: 0,
  foundersMembers: 0,
};

function getStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Tasks
export const getTasks = (): Task[] => getStore('nc_tasks', []);
export const saveTasks = (tasks: Task[]) => setStore('nc_tasks', tasks);
export const addTask = (task: Task) => { const t = getTasks(); t.push(task); saveTasks(t); };
export const updateTask = (task: Task) => {
  const tasks = getTasks().map(t => t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t);
  saveTasks(tasks);
};
export const deleteTask = (id: string) => saveTasks(getTasks().filter(t => t.id !== id));

// Calendar
export const getEvents = (): CalendarEvent[] => getStore('nc_calendar', []);
export const saveEvents = (events: CalendarEvent[]) => setStore('nc_calendar', events);

// Expenses
export const getExpenses = (): Expense[] => getStore('nc_expenses', []);
export const saveExpenses = (expenses: Expense[]) => setStore('nc_expenses', expenses);

// Settings
export const getSettings = (): NCSettings => getStore('nc_settings', DEFAULT_SETTINGS);
export const saveSettings = (s: NCSettings) => setStore('nc_settings', s);

// Backup
export const exportAllData = () => {
  const data = {
    nc_tasks: getTasks(),
    nc_calendar: getEvents(),
    nc_expenses: getExpenses(),
    nc_settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nc_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateId = () => crypto.randomUUID();
