import { useState, useEffect } from 'react';
import { classCRUD, generateId, type ClassRecord } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ['Concept / Approved', 'Instructor Briefed', 'Pre-Production', 'Filming Scheduled', 'Filming Complete', 'Editing', 'QA Review', 'Kajabi Build', 'Published', 'Archived'];
const stageColors: Record<string, string> = {
  'Concept / Approved': 'bg-muted border-muted-foreground/20',
  'Instructor Briefed': 'bg-accent/5 border-accent/30',
  'Pre-Production': 'bg-accent/10 border-accent/40',
  'Filming Scheduled': 'bg-primary/5 border-primary/20',
  'Filming Complete': 'bg-primary/10 border-primary/30',
  'Editing': 'bg-nc-warn/5 border-nc-warn/20',
  'QA Review': 'bg-nc-warn/10 border-nc-warn/30',
  'Kajabi Build': 'bg-nc-success/5 border-nc-success/20',
  'Published': 'bg-nc-success/10 border-nc-success/30',
  'Archived': 'bg-secondary border-secondary',
};

export default function ClassesPipeline() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [editClass, setEditClass] = useState<ClassRecord | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setClasses(classCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (c: ClassRecord) => {
    const now = new Date().toISOString();
    if (editClass) { classCRUD.update({ ...c, updatedAt: now }); }
    else { classCRUD.add({ ...c, id: generateId(), createdAt: now, updatedAt: now }); }
    setClasses(classCRUD.getAll());
    setEditClass(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => { classCRUD.remove(id); setClasses(classCRUD.getAll()); setEditClass(null); };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Class
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const col = classes.filter(c => c.pipelineStage === stage);
          return (
            <div key={stage} className={cn('rounded-lg p-3 min-w-[200px] min-h-[250px] border flex-shrink-0', stageColors[stage])}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-foreground">{stage}</h4>
                <span className="text-[10px] font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map(c => (
                  <div key={c.id} onClick={() => setEditClass(c)} className="bg-card rounded-md p-3 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow">
                    <p className="text-sm font-medium text-foreground mb-1">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.instructorName || 'No instructor'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">{c.episodeCountDelivered}/{c.episodeCountTarget} episodes</span>
                      {c.qaTier === 'Elevated' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-nc-warn/10 text-nc-warn">Elevated QA</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ClassDialog cls={editClass} open={!!editClass || newOpen} onOpenChange={o => { if (!o) { setEditClass(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function ClassDialog({ cls, open, onOpenChange, onSave, onDelete }: {
  cls: ClassRecord | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (c: ClassRecord) => void; onDelete: (id: string) => void;
}) {
  const blank: ClassRecord = {
    id: '', title: '', instructorName: '', category: '', subCategory: '',
    episodeCountTarget: 0, episodeCountDelivered: 0, pipelineStage: 'Concept / Approved',
    qaTier: 'Standard', disclaimerRequired: false, classGuideStatus: 'Not Started',
    kajabiPageStatus: 'Not Built', targetPublicationDate: '', actualPublicationDate: '',
    notes: [], createdAt: '', updatedAt: '',
  };
  const [form, setForm] = useState<ClassRecord>(blank);
  useEffect(() => { setForm(cls || blank); }, [cls]);
  const u = (p: Partial<ClassRecord>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{cls ? 'Edit Class' : 'New Class'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Class title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <Input placeholder="Instructor name" value={form.instructorName} onChange={e => u({ instructorName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Category" value={form.category} onChange={e => u({ category: e.target.value })} />
            <Input placeholder="Sub-category" value={form.subCategory} onChange={e => u({ subCategory: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pipeline Stage</label>
            <Select value={form.pipelineStage} onValueChange={v => u({ pipelineStage: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Target Episodes</label><Input type="number" className="mt-1" value={form.episodeCountTarget} onChange={e => u({ episodeCountTarget: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Delivered Episodes</label><Input type="number" className="mt-1" value={form.episodeCountDelivered} onChange={e => u({ episodeCountDelivered: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">QA Tier</label>
              <Select value={form.qaTier} onValueChange={v => u({ qaTier: v as ClassRecord['qaTier'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Elevated">Elevated</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Guide Status</label>
              <Select value={form.classGuideStatus} onValueChange={v => u({ classGuideStatus: v as ClassRecord['classGuideStatus'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Not Started','Draft','Review','Final'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kajabi Page</label>
              <Select value={form.kajabiPageStatus} onValueChange={v => u({ kajabiPageStatus: v as ClassRecord['kajabiPageStatus'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Not Built','Stub','Complete','Live'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.disclaimerRequired} onCheckedChange={v => u({ disclaimerRequired: v })} />
              <label className="text-xs font-medium text-muted-foreground">Disclaimer Required</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Target Publication</label><Input type="date" className="mt-1" value={form.targetPublicationDate} onChange={e => u({ targetPublicationDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Actual Publication</label><Input type="date" className="mt-1" value={form.actualPublicationDate} onChange={e => u({ actualPublicationDate: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>{cls ? 'Save' : 'Create'}</Button>
            {cls && <Button variant="destructive" onClick={() => onDelete(cls.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
