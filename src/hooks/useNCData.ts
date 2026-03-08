import { useState, useCallback } from 'react';
import {
  getTasks, saveTasks, getEvents, saveEvents, getExpenses,
  getSettings, saveSettings, type Task, type CalendarEvent,
  type Expense, type NCSettings, generateId,
} from '@/lib/storage';

export function useNCData() {
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [events, setEvents] = useState<CalendarEvent[]>(getEvents);
  const [expenses] = useState<Expense[]>(getExpenses);
  const [settings, setSettingsState] = useState<NCSettings>(getSettings);

  const refreshTasks = useCallback(() => {
    const t = getTasks();
    setTasks(t);
    return t;
  }, []);

  const upsertTask = useCallback((task: Partial<Task> & { title: string }) => {
    const all = getTasks();
    const now = new Date().toISOString();
    if (task.id) {
      const updated = all.map(t => t.id === task.id ? { ...t, ...task, updatedAt: now } : t);
      saveTasks(updated);
      setTasks(updated);
    } else {
      const newTask: Task = {
        id: generateId(),
        title: task.title,
        description: task.description || '',
        moduleTag: task.moduleTag || 'General',
        priority: task.priority || 'Medium',
        status: task.status || 'Not Started',
        owner: task.owner || settings.userName,
        dueDate: task.dueDate || '',
        subtasks: task.subtasks || [],
        notes: task.notes || [],
        pinned: false,
        createdBy: settings.userName,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...all, newTask];
      saveTasks(updated);
      setTasks(updated);
    }
  }, [settings.userName]);

  const removeTask = useCallback((id: string) => {
    const updated = getTasks().filter(t => t.id !== id);
    saveTasks(updated);
    setTasks(updated);
  }, []);

  const updateSettings = useCallback((s: NCSettings) => {
    saveSettings(s);
    setSettingsState(s);
  }, []);

  return {
    tasks, events, expenses, settings,
    upsertTask, removeTask, refreshTasks,
    updateSettings,
  };
}
