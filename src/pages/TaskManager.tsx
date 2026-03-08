import { useState, useEffect, useCallback } from 'react';
import { getTasks, saveTasks, generateId, getSettings, type Task } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LayoutGrid, List, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES: Task['status'][] = ['Not Started', 'In Progress', 'Blocked', 'In Review', 'Complete'];
const PRIORITIES: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
const MODULE_TAGS: Task['moduleTag'][] = ['Calendar', 'Class', 'Instructor', 'Legal', 'Event', 'Budget', 'Marketing', 'General'];

const statusColors: Record<string, string> = {
  'Not Started': 'bg-muted border-muted-foreground/20',
  'In Progress': 'bg-accent/5 border-accent/30',
  'Blocked': 'bg-nc-alert/5 border-nc-alert/30',
  'In Review': 'bg-nc-warn/5 border-nc-warn/30',
  'Complete': 'bg-nc-success/5 border-nc-success/30',
};

const priorityBadge: Record<string, string> = {
  Critical: 'bg-nc-alert/10 text-nc-alert',
  High: 'bg-nc-warn/10 text-nc-warn',
  Medium: 'bg-accent/10 text-accent',
  Low: 'bg-muted text-muted-foreground',
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const refresh = useCallback(() => { setTasks(getTasks()); }, []);

  useEffect(() => {
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, [refresh]);

  const persist = (updated: Task[]) => { saveTasks(updated); setTasks(updated); };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    );
    persist(updated);
  };

  const deleteTaskById = (id: string) => {
    persist(tasks.filter(t => t.id !== id));
  };

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('board')}
          >
            <LayoutGrid className="w-4 h-4 mr-1" /> Board
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4 mr-1" /> List
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-5 gap-3 overflow-x-auto">
          {STATUSES.map(status => {
            const col = filtered.filter(t => t.status === status);
            return (
              <div key={status} className={cn('rounded-lg p-3 min-h-[300px] border', statusColors[status])}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">{status}</h4>
                  <span className="text-[10px] font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {col.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setEditTask(task)}
                      className="bg-card rounded-md p-3 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow group"
                    >
                      <p className="text-sm font-medium text-foreground mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[task.priority])}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{task.owner}</span>
                      </div>
                      {task.dueDate && (
                        <p className={cn(
                          'text-[10px] mt-2',
                          new Date(task.dueDate) < new Date() && task.status !== 'Complete'
                            ? 'text-nc-alert font-medium'
                            : 'text-muted-foreground'
                        )}>
                          Due: {task.dueDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left p-3 font-medium">Task</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Priority</th>
                <th className="text-left p-3 font-medium">Module</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Due</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <tr
                  key={task.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setEditTask(task)}
                >
                  <td className="p-3 font-medium text-foreground">{task.title}</td>
                  <td className="p-3">
                    <select
                      value={task.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => moveTask(task.id, e.target.value as Task['status'])}
                      className="text-xs bg-transparent border rounded px-1 py-0.5"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{task.moduleTag}</td>
                  <td className="p-3 text-muted-foreground">{task.owner}</td>
                  <td className={cn('p-3', task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Complete' ? 'text-nc-alert font-medium' : 'text-muted-foreground')}>
                    {task.dueDate || '—'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={e => { e.stopPropagation(); deleteTaskById(task.id); }}
                      className="text-muted-foreground hover:text-nc-alert transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No tasks found. Create your first task with the + button.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Edit/Create Dialog */}
      <TaskDialog
        task={editTask}
        open={!!editTask || newOpen}
        onOpenChange={(open) => { if (!open) { setEditTask(null); setNewOpen(false); } }}
        onSave={(task) => {
          const now = new Date().toISOString();
          if (editTask) {
            persist(tasks.map(t => t.id === task.id ? { ...task, updatedAt: now } : t));
          } else {
            persist([...tasks, { ...task, id: generateId(), createdAt: now, updatedAt: now, createdBy: getSettings().userName }]);
          }
          setEditTask(null);
          setNewOpen(false);
        }}
      />
    </div>
  );
}

function TaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (t: Task) => void;
}) {
  const settings = getSettings();
  const [form, setForm] = useState<Task>({
    id: '',
    title: '',
    description: '',
    moduleTag: 'General',
    priority: 'Medium',
    status: 'Not Started',
    owner: settings.userName,
    dueDate: '',
    subtasks: [],
    notes: [],
    pinned: false,
    createdBy: settings.userName,
    createdAt: '',
    updatedAt: '',
  });

  useEffect(() => {
    if (task) setForm(task);
    else setForm({
      id: '', title: '', description: '', moduleTag: 'General', priority: 'Medium',
      status: 'Not Started', owner: settings.userName, dueDate: '', subtasks: [],
      notes: [], pinned: false, createdBy: settings.userName, createdAt: '', updatedAt: '',
    });
  }, [task, settings.userName]);

  const update = (patch: Partial<Task>) => setForm(f => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Task title" value={form.title} onChange={e => update({ title: e.target.value })} autoFocus />
          <Textarea placeholder="Description..." value={form.description} onChange={e => update({ description: e.target.value })} rows={3} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => update({ status: v as Task['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={form.priority} onValueChange={v => update({ priority: v as Task['priority'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Module</label>
              <Select value={form.moduleTag} onValueChange={v => update({ moduleTag: v as Task['moduleTag'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MODULE_TAGS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <Input type="date" className="mt-1" value={form.dueDate} onChange={e => update({ dueDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Owner</label>
            <Input className="mt-1" value={form.owner} onChange={e => update({ owner: e.target.value })} />
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => { if (form.title.trim()) onSave(form); }}
            disabled={!form.title.trim()}
          >
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
