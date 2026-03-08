import { useState, useEffect } from 'react';
import { checklistCRUD, generateId, type Checklist, type ChecklistItem } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  ClipboardList, Plus, Trash2, Edit2, GripVertical, CheckCircle2, Circle,
} from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(38, 62%, 45%)',
  'hsl(160, 50%, 40%)',
  'hsl(260, 50%, 50%)',
];

interface ChecklistTemplate {
  title: string;
  description: string;
  color: string;
  items: string[];
}

const TEMPLATES: ChecklistTemplate[] = [
  {
    title: 'Launch Readiness',
    description: 'Pre-launch checklist to ensure everything is ready',
    color: 'hsl(var(--destructive))',
    items: [
      'Legal & compliance review complete',
      'All content proofread and approved',
      'Technical QA passed',
      'Marketing materials ready',
      'Payment systems tested',
      'Support team briefed',
      'Analytics tracking verified',
      'Rollback plan documented',
    ],
  },
  {
    title: 'Team Onboarding',
    description: 'Steps for onboarding a new team member',
    color: 'hsl(160, 50%, 40%)',
    items: [
      'Send welcome email with login credentials',
      'Schedule intro call with team lead',
      'Grant access to tools & platforms',
      'Share brand guidelines & docs',
      'Assign first-week buddy',
      'Set up recurring 1:1 meetings',
      'Complete HR paperwork',
    ],
  },
  {
    title: 'Weekly Review',
    description: 'End-of-week review routine',
    color: 'hsl(var(--primary))',
    items: [
      'Review task completion vs. plan',
      'Update budget tracker',
      'Check upcoming deadlines',
      'Prepare status report highlights',
      'Flag blockers for next week',
      'Celebrate wins with the team',
    ],
  },
  {
    title: 'Event Planning',
    description: 'Checklist for organising an event or workshop',
    color: 'hsl(260, 50%, 50%)',
    items: [
      'Confirm venue / virtual platform',
      'Send invitations & collect RSVPs',
      'Prepare agenda & materials',
      'Arrange catering or refreshments',
      'Test AV / tech equipment',
      'Assign roles (host, moderator, etc.)',
      'Send post-event follow-up',
    ],
  },
];

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [newItemText, setNewItemText] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const refresh = () => setChecklists(checklistCRUD.getAll());

  useEffect(() => {
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setColor(COLORS[0]);
    setItems([]);
    setNewItemText('');
    setDialogOpen(true);
  };

  const openEdit = (cl: Checklist) => {
    setEditing(cl);
    setTitle(cl.title);
    setDescription(cl.description);
    setColor(cl.color);
    setItems([...cl.items]);
    setNewItemText('');
    setDialogOpen(true);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, { id: generateId(), label: newItemText.trim(), done: false }]);
    setNewItemText('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const save = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      checklistCRUD.update({
        ...editing,
        title: title.trim(),
        description: description.trim(),
        color,
        items,
        updatedAt: now,
      });
    } else {
      checklistCRUD.add({
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        color,
        items,
        createdAt: now,
        updatedAt: now,
      });
    }
    setDialogOpen(false);
    refresh();
  };

  const toggleItem = (checklistId: string, itemId: string) => {
    const cl = checklists.find(c => c.id === checklistId);
    if (!cl) return;
    checklistCRUD.update({
      ...cl,
      items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
      updatedAt: new Date().toISOString(),
    });
    refresh();
  };

  const deleteChecklist = (id: string) => {
    checklistCRUD.remove(id);
    refresh();
  };

  const getProgress = (cl: Checklist) => {
    if (cl.items.length === 0) return 0;
    return Math.round((cl.items.filter(i => i.done).length / cl.items.length) * 100);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-accent" />
          Checklists
        </h2>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <div className="bg-card rounded-lg nc-shadow-card p-8 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No checklists yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {checklists.map(cl => {
            const progress = getProgress(cl);
            const doneCount = cl.items.filter(i => i.done).length;
            return (
              <div key={cl.id} className="bg-card rounded-lg nc-shadow-card overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: cl.color }} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{cl.title}</h3>
                      {cl.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cl.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(cl)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteChecklist(cl.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {doneCount}/{cl.items.length}
                    </span>
                  </div>

                  {cl.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No items yet — edit to add some.</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                      {cl.items.map(item => (
                        <li key={item.id} className="flex items-center gap-2 group">
                          <Checkbox
                            checked={item.done}
                            onCheckedChange={() => toggleItem(cl.id, item.id)}
                            className="shrink-0"
                          />
                          <span className={cn(
                            'text-xs sm:text-sm',
                            item.done ? 'line-through text-muted-foreground' : 'text-foreground'
                          )}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {progress === 100 && cl.items.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-nc-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      All done!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Checklist' : 'New Checklist'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Launch Readiness" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this checklist for?" className="mt-1" rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2 mt-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Items</label>
              <div className="space-y-1.5 mt-1.5 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50">
                    <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground flex-1">{item.label}</span>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  placeholder="Add an item..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                  className="flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addItem}>Add</Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save Changes' : 'Create Checklist'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
