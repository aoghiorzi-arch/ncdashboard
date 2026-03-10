import { useState, useEffect } from 'react';
import { classCRUD, generateId, type ClassRecord } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Download, Film, LayoutGrid, GanttChartSquare } from 'lucide-react';
import { deleteWithUndo } from '@/lib/undoDelete';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { exportToCSV } from '@/lib/csv';
import { GanttChart, type GanttItem } from '@/components/GanttChart';
import { KanbanBoard, type KanbanCard } from '@/components/KanbanBoard';

const STAGES = ['Concept / Approved', 'Instructor Briefed', 'Pre-Production', 'Filming Scheduled', 'Filming Complete', 'Editing', 'QA Review', 'Kajabi Build', 'Published', 'Archived'];
const stageColors: Record<string, string> = {
  'Concept / Approved': 'bg-muted border-muted-foreground/20',
  'Instructor Briefed': 'bg-accent/5 border-accent/30',
  'Pre-Production': 'bg-accent/10 border-accent/40',
  'Filming Scheduled': 'bg-primary/5 border-primary/20',
  'Filming Complete': 'bg-primary/10 border-primary/30',
  'Editing': 'bg-accent/5 border-accent/20',
  'QA Review': 'bg-accent/10 border-accent/30',
  'Kajabi Build': 'bg-nc-success/5 border-nc-success/20',
  'Published': 'bg-nc-success/10 border-nc-success/30',
  'Archived': 'bg-secondary border-secondary',
};

export default function ClassesPipeline() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [editClass, setEditClass] = useState<ClassRecord | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'gantt'>('pipeline');

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

  const handleDelete = (id: string) => {
    const item = classes.find(c => c.id === id);
    if (!item) return;
    deleteWithUndo(item.title, item, () => {
      classCRUD.remove(id);
      setClasses(classCRUD.getAll()); setEditClass(null);
    }, (restored) => {
      classCRUD.add(restored);
      setClasses(classCRUD.getAll());
    });
  };

  const handleKanbanMove = (itemId: string, newStage: string) => {
    const item = classes.find(c => c.id === itemId);
    if (item) {
      const now = new Date().toISOString();
      classCRUD.update({ ...item, pipelineStage: newStage, updatedAt: now });
      setClasses(classCRUD.getAll());
    }
  };

  const handleCSV = () => {
    exportToCSV(classes, 'classes_pipeline', [
      { key: 'title', label: 'Title' }, { key: 'instructorName', label: 'Instructor' },
      { key: 'pipelineStage', label: 'Stage' }, { key: 'category', label: 'Category' },
      { key: 'episodeCountTarget', label: 'Target Episodes' }, { key: 'episodeCountDelivered', label: 'Delivered' },
      { key: 'classGuideStatus', label: 'Guide Status' }, { key: 'kajabiPageStatus', label: 'Kajabi' },
    ]);
  };

  // Pipeline progress summary
  const totalClasses = classes.length;
  const published = classes.filter(c => c.pipelineStage === 'Published').length;
  const stageProgress = totalClasses > 0
    ? Math.round(classes.reduce((sum, c) => sum + STAGES.indexOf(c.pipelineStage), 0) / totalClasses / (STAGES.length - 1) * 100)
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {totalClasses > 0 && (
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">Pipeline Progress</span>
                <span className="text-xs font-semibold text-foreground">{stageProgress}%</span>
              </div>
              <Progress value={stageProgress} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {published}/{totalClasses} published
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'pipeline' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('pipeline')}>
            <LayoutGrid className="w-4 h-4 mr-1" /> Pipeline
          </Button>
          <Button variant={viewMode === 'gantt' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('gantt')}>
            <GanttChartSquare className="w-4 h-4 mr-1" /> Timeline
          </Button>
          <Button variant="outline" size="sm" onClick={handleCSV} title="Export CSV">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Class
          </Button>
        </div>
      </div>

      {totalClasses === 0 ? (
        <EmptyState
          icon={Film}
          title="No classes in the pipeline"
          description="Start building your curriculum by adding your first class."
          action={
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add First Class
            </Button>
          }
        />
      ) : viewMode === 'gantt' ? (
        <GanttChart
          items={classes
            .filter(c => c.targetPublicationDate)
            .map(c => ({
              id: c.id,
              title: c.title,
              startDate: c.createdAt.split('T')[0],
              endDate: c.targetPublicationDate || c.createdAt.split('T')[0],
              stage: c.pipelineStage,
              color: 'bg-accent',
            } as GanttItem))
          }
        />
      ) : (
        <KanbanBoard<ClassRecord & KanbanCard>
          columns={STAGES}
          columnColors={stageColors}
          items={classes.map(c => ({ ...c, column: c.pipelineStage }))}
          onMove={handleKanbanMove}
          onCardClick={c => setEditClass(c)}
          searchFields={['title', 'instructorName', 'category'] as (keyof ClassRecord)[]}
          searchPlaceholder="Search classes…"
          renderCard={c => {
            const epProgress = c.episodeCountTarget > 0
              ? Math.round((c.episodeCountDelivered / c.episodeCountTarget) * 100)
              : 0;
            const isOverdue = c.targetPublicationDate && new Date(c.targetPublicationDate) < new Date() && c.pipelineStage !== 'Published' && c.pipelineStage !== 'Archived';
            const daysInStage = Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div className={cn(isOverdue && 'ring-1 ring-destructive/30 rounded-md -m-1 p-1')}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1',
                    daysInStage > 21 ? 'bg-destructive/10 text-destructive' :
                    daysInStage > 7 ? 'bg-nc-warn/10 text-nc-warn' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {daysInStage}d
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{c.instructorName || 'No instructor'}</p>
                {c.episodeCountTarget > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-muted-foreground">Episodes</span>
                      <span className="text-[9px] text-muted-foreground">{c.episodeCountDelivered}/{c.episodeCountTarget}</span>
                    </div>
                    <Progress value={epProgress} className="h-1" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {c.qaTier === 'Elevated' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">Elevated QA</span>}
                  {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Overdue</span>}
                </div>
              </div>
            );
          }}
        />
      )}

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
