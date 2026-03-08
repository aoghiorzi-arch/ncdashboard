import { useState, useEffect } from 'react';
import { instructorCRUD, generateId, getSettings, type Instructor } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, Star, Download, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanBoard, type KanbanCard } from '@/components/KanbanBoard';

const STATUSES = ['Identified', 'Approached', 'In Conversation', 'Agreement Sent', 'Contracted', 'Class in Production', 'Class Live', 'Relationship Paused'];
const statusColors: Record<string, string> = {
  'Identified': 'bg-muted border-muted-foreground/20',
  'Approached': 'bg-accent/5 border-accent/20',
  'In Conversation': 'bg-accent/10 border-accent/30',
  'Agreement Sent': 'bg-nc-warn/5 border-nc-warn/20',
  'Contracted': 'bg-nc-success/5 border-nc-success/20',
  'Class in Production': 'bg-nc-success/10 border-nc-success/30',
  'Class Live': 'bg-nc-success/20 border-nc-success/40',
  'Relationship Paused': 'bg-secondary border-secondary',
};

export default function InstructorCRM() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [editItem, setEditItem] = useState<Instructor | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { sorted, sortKey, sortDir, toggle } = useSortableData(instructors, 'fullName');

  useEffect(() => {
    const refresh = () => setInstructors(instructorCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (item: Instructor) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editItem) {
      instructorCRUD.update({ ...item, updatedAt: now });
      logActivity('updated', 'Instructors', item.fullName, user);
    } else {
      instructorCRUD.add({ ...item, id: generateId(), createdAt: now, updatedAt: now });
      logActivity('created', 'Instructors', item.fullName, user);
    }
    setInstructors(instructorCRUD.getAll());
    setEditItem(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const item = instructors.find(i => i.id === id);
    instructorCRUD.remove(id);
    if (item) logActivity('deleted', 'Instructors', item.fullName, getSettings().userName);
    setInstructors(instructorCRUD.getAll());
    setEditItem(null);
  };

  const handleExport = () => exportToCSV(instructors, 'instructors', [
    { key: 'fullName', label: 'Name' }, { key: 'status', label: 'Status' },
    { key: 'specialism', label: 'Specialism' }, { key: 'email', label: 'Email' },
    { key: 'institution', label: 'Institution' }, { key: 'rating', label: 'Rating' },
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')}>Pipeline</Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Instructor
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' && (
        instructors.length === 0 ? (
          <EmptyState icon={Users} title="No instructors yet" description="Add your first instructor to start building the pipeline." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Instructor</Button>} />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STATUSES.map(status => {
              const col = instructors.filter(i => i.status === status);
              return (
                <div key={status} className={cn('rounded-lg p-3 min-w-[200px] min-h-[200px] border flex-shrink-0', statusColors[status])}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wide text-foreground">{status}</h4>
                    <span className="text-[10px] font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map(inst => (
                      <div key={inst.id} onClick={() => setEditItem(inst)} className="bg-card rounded-md p-3 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow">
                        <p className="text-sm font-medium text-foreground">{inst.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{inst.specialism || inst.institution}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className={cn('w-3 h-3', s <= inst.rating ? 'text-accent fill-accent' : 'text-muted')} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {viewMode === 'list' && (
        <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left p-3"><SortableHeader label="Name" active={sortKey === 'fullName'} direction={sortKey === 'fullName' ? sortDir : null} onClick={() => toggle('fullName')} /></th>
              <th className="text-left p-3"><SortableHeader label="Status" active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : null} onClick={() => toggle('status')} /></th>
              <th className="text-left p-3"><SortableHeader label="Specialism" active={sortKey === 'specialism'} direction={sortKey === 'specialism' ? sortDir : null} onClick={() => toggle('specialism')} /></th>
              <th className="text-left p-3"><SortableHeader label="Email" active={sortKey === 'email'} direction={sortKey === 'email' ? sortDir : null} onClick={() => toggle('email')} /></th>
              <th className="text-left p-3"><SortableHeader label="Rating" active={sortKey === 'rating'} direction={sortKey === 'rating' ? sortDir : null} onClick={() => toggle('rating')} /></th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {sorted.map(inst => (
                <tr key={inst.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditItem(inst)}>
                  <td className="p-3 font-medium text-foreground">{inst.fullName}</td>
                  <td className="p-3 text-xs">{inst.status}</td>
                  <td className="p-3 text-muted-foreground text-xs">{inst.specialism}</td>
                  <td className="p-3 text-muted-foreground text-xs">{inst.email}</td>
                  <td className="p-3"><div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={cn('w-3 h-3', s <= inst.rating ? 'text-accent fill-accent' : 'text-muted')} />)}</div></td>
                  <td className="p-3"><button onClick={e => { e.stopPropagation(); handleDelete(inst.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} title="No instructors yet" description="Add your first instructor to get started." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Instructor</Button>} /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <InstructorDialog item={editItem} open={!!editItem || newOpen} onOpenChange={o => { if (!o) { setEditItem(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function InstructorDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: Instructor | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (i: Instructor) => void; onDelete: (id: string) => void;
}) {
  const blank: Instructor = {
    id: '', fullName: '', title: '', institution: '', email: '', phone: '', specialism: '',
    categoryAlignment: '', adventistConnection: 'No', status: 'Identified', proposedClassTitles: '',
    agreementVersion: '', engagementFee: '', ipAssignmentStatus: 'N/A', filmingDates: '',
    classesProduced: 0, lastContactDate: '', rating: 3, tags: '', notes: [], createdAt: '', updatedAt: '',
  };
  const [form, setForm] = useState<Instructor>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<Instructor>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Instructor' : 'New Instructor'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Full name" value={form.fullName} onChange={e => u({ fullName: e.target.value })} autoFocus />
            <Input placeholder="Title" value={form.title} onChange={e => u({ title: e.target.value })} />
          </div>
          <Input placeholder="Institution / Affiliation" value={form.institution} onChange={e => u({ institution: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" value={form.email} onChange={e => u({ email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={e => u({ phone: e.target.value })} />
          </div>
          <Input placeholder="Specialism / Subject area" value={form.specialism} onChange={e => u({ specialism: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pipeline Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Adventist Connection</label>
              <Select value={form.adventistConnection} onValueChange={v => u({ adventistConnection: v as Instructor['adventistConnection'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Sympathetic">Sympathetic</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Textarea placeholder="Proposed class titles" value={form.proposedClassTitles} onChange={e => u({ proposedClassTitles: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Engagement fee" value={form.engagementFee} onChange={e => u({ engagementFee: e.target.value })} />
            <div>
              <label className="text-xs font-medium text-muted-foreground">IP Assignment</label>
              <Select value={form.ipAssignmentStatus} onValueChange={v => u({ ipAssignmentStatus: v as Instructor['ipAssignmentStatus'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Signed">Signed</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Rating</label>
            <div className="flex gap-1 mt-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => u({ rating: s })}><Star className={cn('w-5 h-5', s <= form.rating ? 'text-accent fill-accent' : 'text-muted')} /></button>)}</div>
          </div>
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => u({ tags: e.target.value })} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.fullName.trim()) onSave(form); }} disabled={!form.fullName.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
