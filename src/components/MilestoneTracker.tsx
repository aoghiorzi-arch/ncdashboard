import { useState, useEffect, useMemo } from 'react';
import { generateId, getSettings, getTasks } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Flag, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  linkedModuleTags: string[];
  status: 'Not Started' | 'In Progress' | 'Complete';
  createdAt: string;
}

const MODULE_TAGS = ['Calendar', 'Class', 'Instructor', 'Legal', 'Event', 'Budget', 'Marketing', 'General'];

function getMilestones(): Milestone[] {
  try {
    return JSON.parse(localStorage.getItem('nc_milestones') || '[]');
  } catch { return []; }
}

function saveMilestones(ms: Milestone[]) {
  localStorage.setItem('nc_milestones', JSON.stringify(ms));
  window.dispatchEvent(new Event('nc-data-change'));
}

export function MilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>(getMilestones);
  const [dialogOpen, setDialogOpen] = useState(false);
  const tasks = getTasks();

  useEffect(() => {
    const refresh = () => setMilestones(getMilestones());
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const milestonesWithProgress = useMemo(() =>
    milestones.map(m => {
      const linked = tasks.filter(t => m.linkedModuleTags.includes(t.moduleTag));
      const total = linked.length;
      const done = linked.filter(t => t.status === 'Complete').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      const isOverdue = m.targetDate && new Date(m.targetDate) < new Date() && m.status !== 'Complete';
      return { ...m, progress, total, done, isOverdue };
    }), [milestones, tasks]);

  const handleSave = (m: Milestone) => {
    const existing = milestones.find(ms => ms.id === m.id);
    if (existing) saveMilestones(milestones.map(ms => ms.id === m.id ? m : ms));
    else saveMilestones([...milestones, { ...m, id: generateId(), createdAt: new Date().toISOString() }]);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    saveMilestones(milestones.filter(m => m.id !== id));
  };

  return (
    <div className="bg-card rounded-lg nc-shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Flag className="w-4 h-4 text-accent" />
          Milestones
        </h3>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>

      {milestonesWithProgress.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones yet. Define key project milestones to track progress.</p>
      ) : (
        <div className="space-y-3">
          {milestonesWithProgress.map(m => (
            <div key={m.id} className={cn(
              'rounded-lg p-3 border transition-all',
              m.status === 'Complete' ? 'border-nc-success/30 bg-nc-success/5' :
              m.isOverdue ? 'border-destructive/30 bg-destructive/5' :
              'border-border/50'
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {m.status === 'Complete' ?
                    <CheckCircle2 className="w-4 h-4 text-nc-success shrink-0" /> :
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <span className={cn('text-sm font-medium truncate', m.status === 'Complete' && 'line-through text-muted-foreground')}>
                    {m.title}
                  </span>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500',
                      m.progress >= 100 ? 'bg-nc-success' : m.isOverdue ? 'bg-destructive' : 'bg-accent'
                    )}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground w-10 text-right">{m.progress}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {m.done}/{m.total} tasks · Due {m.targetDate || 'TBD'}
                </span>
                {m.isOverdue && <span className="text-[10px] text-destructive font-medium">Overdue</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <MilestoneDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
    </div>
  );
}

function MilestoneDialog({ open, onOpenChange, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSave: (m: Milestone) => void;
}) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => { if (open) { setTitle(''); setTargetDate(''); setTags([]); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Milestone title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Target Date</label>
            <Input type="date" className="mt-1" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Linked Modules (tasks with these tags count toward progress)</label>
            <div className="flex flex-wrap gap-1.5">
              {MODULE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-full border transition-colors',
                    tags.includes(tag) ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted text-muted-foreground border-border'
                  )}
                >{tag}</button>
              ))}
            </div>
          </div>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => { if (title.trim()) onSave({ id: '', title, targetDate, linkedModuleTags: tags, status: 'Not Started', createdAt: '' }); }}
            disabled={!title.trim()}
          >Create Milestone</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
