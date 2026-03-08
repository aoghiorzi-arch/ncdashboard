import { useState, useEffect, useCallback } from 'react';
import { getTasks, saveTasks, generateId, getSettings, type Task } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LayoutGrid, List, Plus, Trash2, Download, CheckSquare, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { exportToCSV } from '@/lib/csv';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { logActivity } from '@/lib/activityLog';
import { KanbanBoard, type KanbanCard } from '@/components/KanbanBoard';

const STATUSES: Task['status'][] = ['Not Started', 'In Progress', 'Blocked', 'In Review', 'Complete'];
const PRIORITIES: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
const MODULE_TAGS: Task['moduleTag'][] = ['Calendar', 'Class', 'Instructor', 'Legal', 'Event', 'Budget', 'Marketing', 'General'];

const statusColors: Record<string, string> = {
  'Not Started': 'bg-muted border-muted-foreground/20',
  'In Progress': 'bg-accent/5 border-accent/30',
  'Blocked': 'bg-destructive/5 border-destructive/30',
  'In Review': 'bg-accent/10 border-accent/40',
  'Complete': 'bg-nc-success/5 border-nc-success/30',
};

const priorityBadge: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive',
  High: 'bg-accent/10 text-accent',
  Medium: 'bg-muted text-muted-foreground',
  Low: 'bg-muted text-muted-foreground',
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [view, setView] = useState<'board' | 'list' | 'swimlane'>('board');
  const [newOpen, setNewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => { setTasks(getTasks()); }, []);

  useEffect(() => {
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, [refresh]);

  const persist = (updated: Task[]) => { saveTasks(updated); setTasks(updated); };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    persist(tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));
  };

  const deleteTaskById = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) logActivity('deleted', 'Tasks', task.title, getSettings().userName);
    persist(tasks.filter(t => t.id !== id));
  };

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const { sorted: sortedFiltered, sortKey, sortDir, toggle: toggleSort } = useSortableData(filtered);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const bulkDelete = () => {
    persist(tasks.filter(t => !selected.has(t.id)));
    setSelected(new Set());
  };

  const bulkChangeStatus = (status: Task['status']) => {
    const now = new Date().toISOString();
    persist(tasks.map(t => selected.has(t.id) ? { ...t, status, updatedAt: now } : t));
    setSelected(new Set());
  };

  const handleCSVExport = () => {
    exportToCSV(filtered, 'tasks', [
      { key: 'title', label: 'Title' }, { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' }, { key: 'moduleTag', label: 'Module' },
      { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due Date' },
      { key: 'description', label: 'Description' },
    ]);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant={view === 'board' ? 'default' : 'outline'} size="sm" onClick={() => setView('board')}>
            <LayoutGrid className="w-4 h-4 mr-1" /> Board
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <List className="w-4 h-4 mr-1" /> List
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCSVExport} title="Export CSV">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
          <span className="text-xs font-medium text-foreground">{selected.size} selected</span>
          <Select onValueChange={v => bulkChangeStatus(v as Task['status'])}>
            <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Change status…" /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={bulkDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to start tracking your work across all modules."
          action={
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create First Task
            </Button>
          }
        />
      ) : (
        <>
          {/* Board View */}
          {view === 'board' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {STATUSES.map(status => {
                const col = filtered.filter(t => t.status === status);
                return (
                  <div key={status} className={cn('rounded-lg p-3 min-h-[200px] border', statusColors[status])}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">{status}</h4>
                      <span className="text-[10px] font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">{col.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setEditTask(task)}
                          className="bg-card rounded-md p-3 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow"
                        >
                          <p className="text-sm font-medium text-foreground mb-2">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[task.priority])}>{task.priority}</span>
                            <span className="text-[10px] text-muted-foreground">{task.owner}</span>
                          </div>
                          {task.dueDate && (
                            <p className={cn('text-[10px] mt-2', new Date(task.dueDate) < new Date() && task.status !== 'Complete' ? 'text-destructive font-medium' : 'text-muted-foreground')}>
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
                  <tr className="border-b">
                    <th className="p-3 w-8">
                      <Checkbox
                        checked={selected.size === sortedFiltered.length && sortedFiltered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-3">
                      <SortableHeader label="Task" active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : null} onClick={() => toggleSort('title')} />
                    </th>
                    <th className="text-left p-3">
                      <SortableHeader label="Status" active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : null} onClick={() => toggleSort('status')} />
                    </th>
                    <th className="text-left p-3">
                      <SortableHeader label="Priority" active={sortKey === 'priority'} direction={sortKey === 'priority' ? sortDir : null} onClick={() => toggleSort('priority')} />
                    </th>
                    <th className="text-left p-3 hidden md:table-cell">
                      <SortableHeader label="Module" active={sortKey === 'moduleTag'} direction={sortKey === 'moduleTag' ? sortDir : null} onClick={() => toggleSort('moduleTag')} />
                    </th>
                    <th className="text-left p-3 hidden sm:table-cell">
                      <SortableHeader label="Owner" active={sortKey === 'owner'} direction={sortKey === 'owner' ? sortDir : null} onClick={() => toggleSort('owner')} />
                    </th>
                    <th className="text-left p-3">
                      <SortableHeader label="Due" active={sortKey === 'dueDate'} direction={sortKey === 'dueDate' ? sortDir : null} onClick={() => toggleSort('dueDate')} />
                    </th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map(task => (
                    <tr
                      key={task.id}
                      className={cn(
                        'border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer',
                        selected.has(task.id) && 'bg-accent/5'
                      )}
                      onClick={() => setEditTask(task)}
                    >
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selected.has(task.id)} onCheckedChange={() => toggleSelect(task.id)} />
                      </td>
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
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[task.priority])}>{task.priority}</span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">{task.moduleTag}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{task.owner}</td>
                      <td className={cn('p-3', task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Complete' ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                        {task.dueDate || '—'}
                      </td>
                      <td className="p-3">
                        <button onClick={e => { e.stopPropagation(); deleteTaskById(task.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedFiltered.length === 0 && (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No tasks match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <TaskDialog
        task={editTask}
        open={!!editTask || newOpen}
        onOpenChange={(open) => { if (!open) { setEditTask(null); setNewOpen(false); } }}
        onSave={(task) => {
          const now = new Date().toISOString();
          const user = getSettings().userName;
          if (editTask) {
            persist(tasks.map(t => t.id === task.id ? { ...task, updatedAt: now } : t));
            logActivity('updated', 'Tasks', task.title, user);
          } else {
            persist([...tasks, { ...task, id: generateId(), createdAt: now, updatedAt: now, createdBy: user }]);
            logActivity('created', 'Tasks', task.title, user);
          }
          setEditTask(null);
          setNewOpen(false);
        }}
      />
    </div>
  );
}

function TaskDialog({
  task, open, onOpenChange, onSave,
}: {
  task: Task | null; open: boolean; onOpenChange: (o: boolean) => void; onSave: (t: Task) => void;
}) {
  const settings = getSettings();
  const blank: Task = {
    id: '', title: '', description: '', moduleTag: 'General', priority: 'Medium',
    status: 'Not Started', owner: settings.userName, dueDate: '', subtasks: [],
    notes: [], pinned: false, createdBy: settings.userName, createdAt: '', updatedAt: '',
  };
  const [form, setForm] = useState<Task>(blank);

  useEffect(() => { setForm(task || blank); }, [task, settings.userName]);

  const update = (patch: Partial<Task>) => setForm(f => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
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
