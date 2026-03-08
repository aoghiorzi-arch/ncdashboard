import { useState, useEffect, useCallback } from 'react';
import { getTasks, saveTasks, generateId, getSettings, type Task, type Attachment } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
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
import { LayoutGrid, List, Plus, Trash2, Download, Upload, CheckSquare, Rows3, Repeat, MessageSquare, Paperclip, ExternalLink, X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { exportToCSV, importCSVFile, parseCSV } from '@/lib/csv';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { KanbanBoard, type KanbanCard } from '@/components/KanbanBoard';
import { TaskDependencyEditor, DependencyBadge } from '@/components/TaskDependencies';
import { GanttChart, type GanttItem } from '@/components/GanttChart';
import { toast } from 'sonner';

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
  const [view, setView] = useState<'board' | 'list' | 'swimlane' | 'gantt'>('board');
  const [editTask, setEditTask] = useState<Task | null>(null);
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
          <Button variant={view === 'swimlane' ? 'default' : 'outline'} size="sm" onClick={() => setView('swimlane')}>
            <Rows3 className="w-4 h-4 mr-1" /> Swim Lanes
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
            <KanbanBoard<Task & KanbanCard>
              columns={STATUSES}
              columnColors={statusColors}
              items={filtered.map(t => ({ ...t, column: t.status }))}
              onMove={(id, newStatus) => moveTask(id, newStatus as Task['status'])}
              onCardClick={setEditTask}
              searchFields={['title', 'owner', 'moduleTag'] as (keyof Task)[]}
              searchPlaceholder="Search tasks…"
              renderCard={task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Complete';
                const daysUntilDue = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <div className={cn(isOverdue && 'ring-1 ring-destructive/40 rounded -m-1 p-1')}>
                    <p className="text-sm font-medium text-foreground mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[task.priority])}>{task.priority}</span>
                      <span className="text-[10px] text-muted-foreground">{task.owner}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center justify-between mt-2">
                        <p className={cn(
                          'text-[10px]',
                          isOverdue ? 'text-destructive font-medium' :
                          daysUntilDue !== null && daysUntilDue <= 3 ? 'text-nc-warn font-medium' :
                          'text-muted-foreground'
                        )}>
                          {isOverdue ? '🔴 ' : daysUntilDue !== null && daysUntilDue <= 3 ? '🟡 ' : ''}
                          Due: {task.dueDate}
                        </p>
                      </div>
                    )}
                    <DependencyBadge taskId={task.id} tasks={tasks} />
                  </div>
                );
              }}
            />
          )}

          {/* Swim Lane View (grouped by priority) */}
          {view === 'swimlane' && (
            <div className="space-y-4">
              {PRIORITIES.slice().reverse().map(priority => {
                const priorityTasks = filtered.filter(t => t.priority === priority);
                if (priorityTasks.length === 0) return null;
                return (
                  <div key={priority} className="bg-card rounded-lg nc-shadow-card overflow-hidden">
                    <div className={cn('px-4 py-2 border-b flex items-center justify-between', priorityBadge[priority])}>
                      <h4 className="text-xs font-semibold uppercase tracking-wide">{priority} Priority</h4>
                      <span className="text-[10px] font-medium">{priorityTasks.length} tasks</span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-5 gap-2">
                        {STATUSES.map(status => {
                          const col = priorityTasks.filter(t => t.status === status);
                          return (
                            <div key={status} className="min-h-[60px]">
                              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{status}</p>
                              <div className="space-y-1.5">
                                {col.map(task => (
                                  <div
                                    key={task.id}
                                    onClick={() => setEditTask(task)}
                                    className={cn(
                                      'rounded p-2 text-xs cursor-pointer hover:nc-shadow-card transition-shadow border',
                                      statusColors[status]
                                    )}
                                  >
                                    <p className="font-medium text-foreground truncate">{task.title}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">{task.owner}</p>
                                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Complete' && (
                                      <p className="text-[9px] text-destructive mt-0.5">🔴 Overdue</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
    notes: [], attachments: [], pinned: false, createdBy: settings.userName, createdAt: '', updatedAt: '',
    recurrence: 'none', recurrenceEndDate: '',
  };
  const [form, setForm] = useState<Task>(blank);
  const [newNote, setNewNote] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  useEffect(() => { setForm(task || blank); setNewNote(''); setNewAttachmentName(''); setNewAttachmentUrl(''); }, [task, settings.userName]);

  const update = (patch: Partial<Task>) => setForm(f => ({ ...f, ...patch }));

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = { id: generateId(), text: newNote.trim(), author: settings.userName, timestamp: new Date().toISOString() };
    update({ notes: [...(form.notes || []), note] });
    setNewNote('');
    if (task) logActivity('commented', 'Tasks', form.title, settings.userName, newNote.trim());
  };

  const removeNote = (noteId: string) => {
    update({ notes: (form.notes || []).filter(n => n.id !== noteId) });
  };

  const addAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    const att: Attachment = {
      id: generateId(), name: newAttachmentName.trim(), url: newAttachmentUrl.trim(),
      type: 'link', addedBy: settings.userName, addedAt: new Date().toISOString(),
    };
    update({ attachments: [...(form.attachments || []), att] });
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    if (task) logActivity('attached', 'Tasks', form.title, settings.userName, newAttachmentName.trim());
  };

  const removeAttachment = (attId: string) => {
    update({ attachments: (form.attachments || []).filter(a => a.id !== attId) });
  };

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Recurrence
              </label>
              <Select value={form.recurrence || 'none'} onValueChange={v => update({ recurrence: v as Task['recurrence'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recurrence && form.recurrence !== 'none' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Recurrence End Date</label>
                <Input type="date" className="mt-1" value={form.recurrenceEndDate || ''} onChange={e => update({ recurrenceEndDate: e.target.value })} />
              </div>
            )}
          </div>
          {task && (
            <TaskDependencyEditor taskId={task.id} tasks={getTasks()} />
          )}

          {/* Comments / Notes */}
          {task && (
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-accent" />
                Comments ({(form.notes || []).length})
              </h4>
              {(form.notes || []).length > 0 && (
                <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                  {(form.notes || []).map(note => (
                    <div key={note.id} className="bg-muted/50 rounded-md p-2.5 group relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-foreground">{note.author}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(note.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button onClick={() => removeNote(note.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-foreground">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  className="text-xs h-8"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addNote(); }}
                />
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={addNote} disabled={!newNote.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Attachments */}
          {task && (
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <Paperclip className="w-3.5 h-3.5 text-accent" />
                Attachments ({(form.attachments || []).length})
              </h4>
              {(form.attachments || []).length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {(form.attachments || []).map(att => (
                    <div key={att.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent hover:underline truncate">
                          {att.name}
                        </a>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">{att.addedBy}</span>
                        <button onClick={() => removeAttachment(att.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="File name"
                  className="text-xs h-8 flex-1"
                  value={newAttachmentName}
                  onChange={e => setNewAttachmentName(e.target.value)}
                />
                <Input
                  placeholder="URL / SharePoint link"
                  className="text-xs h-8 flex-[2]"
                  value={newAttachmentUrl}
                  onChange={e => setNewAttachmentUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addAttachment(); }}
                />
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={addAttachment} disabled={!newAttachmentName.trim() || !newAttachmentUrl.trim()}>
                  Add
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Link to files on SharePoint, OneDrive, or any URL.</p>
            </div>
          )}

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
