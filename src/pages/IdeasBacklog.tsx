import { useState, useEffect } from 'react';
import { ideaCRUD, generateId, getSettings, type Idea } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, Lightbulb, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: Idea['category'][] = ['Class Idea', 'Feature', 'Marketing', 'Partnership', 'Event', 'Other'];
const STATUSES: Idea['status'][] = ['Raw Idea', 'Under Consideration', 'Validated', 'In Backlog', 'Declined', 'Promoted'];
const statusBadge: Record<string, string> = {
  'Raw Idea': 'bg-muted text-muted-foreground', 'Under Consideration': 'bg-accent/10 text-accent',
  'Validated': 'bg-nc-success/10 text-nc-success', 'In Backlog': 'bg-primary/10 text-primary',
  'Declined': 'bg-nc-alert/10 text-nc-alert', 'Promoted': 'bg-nc-success/20 text-nc-success',
};

export default function IdeasBacklog() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editItem, setEditItem] = useState<Idea | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const refresh = () => setIdeas(ideaCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (item: Idea) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editItem) { ideaCRUD.update({ ...item, updatedAt: now }); logActivity('updated', 'Ideas', item.title, user); }
    else { ideaCRUD.add({ ...item, id: generateId(), submittedBy: user, createdAt: now, updatedAt: now }); logActivity('created', 'Ideas', item.title, user); }
    setIdeas(ideaCRUD.getAll());
    setEditItem(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const item = ideas.find(i => i.id === id);
    ideaCRUD.remove(id);
    if (item) logActivity('deleted', 'Ideas', item.title, getSettings().userName);
    setIdeas(ideaCRUD.getAll()); setEditItem(null);
  };

  const handleExport = () => exportToCSV(ideas, 'ideas', [
    { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' },
    { key: 'impactScore', label: 'Impact' }, { key: 'effortScore', label: 'Effort' }, { key: 'submittedBy', label: 'Submitted By' },
  ]);

  const filtered = filterStatus === 'all' ? ideas : ideas.filter(i => i.status === filterStatus);
  const sorted = [...filtered].sort((a, b) => (b.impactScore * b.effortScore) - (a.impactScore * a.effortScore));

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Idea
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No ideas yet" description="Capture your first idea to start building the backlog." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Idea</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(idea => (
            <div key={idea.id} onClick={() => setEditItem(idea)} className="bg-card rounded-lg p-4 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-accent shrink-0" />
                  <h4 className="text-sm font-semibold text-foreground">{idea.title}</h4>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(idea.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              {idea.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{idea.description}</p>}
              <div className="flex items-center justify-between">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[idea.status])}>{idea.status}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{idea.category}</span>
                  <span className="text-[10px] font-bold text-accent">Score: {idea.impactScore * idea.effortScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <IdeaDialog item={editItem} open={!!editItem || newOpen} onOpenChange={o => { if (!o) { setEditItem(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function IdeaDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: Idea | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (i: Idea) => void; onDelete: (id: string) => void;
}) {
  const blank: Idea = { id: '', title: '', description: '', category: 'Class Idea', submittedBy: '', status: 'Raw Idea', impactScore: 3, effortScore: 3, notes: [], createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<Idea>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<Idea>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Idea' : 'New Idea'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Idea title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <Textarea placeholder="Description..." value={form.description} onChange={e => u({ description: e.target.value })} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={v => u({ category: v as Idea['category'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as Idea['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Impact (1-5)</label>
              <Input type="number" min={1} max={5} className="mt-1" value={form.impactScore} onChange={e => u({ impactScore: Math.min(5, Math.max(1, +e.target.value)) })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Effort (1-5)</label>
              <Input type="number" min={1} max={5} className="mt-1" value={form.effortScore} onChange={e => u({ effortScore: Math.min(5, Math.max(1, +e.target.value)) })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Priority Score: <strong className="text-accent">{form.impactScore * form.effortScore}</strong></p>
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
