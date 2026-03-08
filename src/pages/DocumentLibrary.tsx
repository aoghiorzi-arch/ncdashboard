import { useState, useEffect } from 'react';
import { documentCRUD, generateId, getSettings, type NCDocument } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, ExternalLink, FolderOpen, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOLDERS = ['Governance', 'Legal & Compliance', 'Brand & Content', 'Classes', 'Instructors', 'Marketing', 'Events', 'Finance', 'Production', 'Archive'];
const DOC_STATUSES: NCDocument['status'][] = ['Draft', 'In Review', 'Final', 'Superseded'];
const statusBadge: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground', 'In Review': 'bg-nc-warn/10 text-nc-warn',
  Final: 'bg-nc-success/10 text-nc-success', Superseded: 'bg-secondary text-secondary-foreground',
};

export default function DocumentLibrary() {
  const [docs, setDocs] = useState<NCDocument[]>([]);
  const [editDoc, setEditDoc] = useState<NCDocument | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filterFolder, setFilterFolder] = useState('all');

  useEffect(() => {
    const refresh = () => setDocs(documentCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (d: NCDocument) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editDoc) { documentCRUD.update({ ...d, updatedAt: now }); logActivity('updated', 'Documents', d.title, user); }
    else { documentCRUD.add({ ...d, id: generateId(), createdAt: now, updatedAt: now }); logActivity('created', 'Documents', d.title, user); }
    setDocs(documentCRUD.getAll());
    setEditDoc(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const doc = docs.find(d => d.id === id);
    documentCRUD.remove(id);
    if (doc) logActivity('deleted', 'Documents', doc.title, getSettings().userName);
    setDocs(documentCRUD.getAll()); setEditDoc(null);
  };

  const filtered = filterFolder === 'all' ? docs : docs.filter(d => d.folder === filterFolder);
  const { sorted, sortKey, sortDir, toggle } = useSortableData(filtered, 'title');

  const handleExport = () => exportToCSV(filtered, 'documents', [
    { key: 'title', label: 'Title' }, { key: 'folder', label: 'Folder' }, { key: 'version', label: 'Version' },
    { key: 'status', label: 'Status' }, { key: 'owner', label: 'Owner' }, { key: 'nextReviewDate', label: 'Next Review' },
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={filterFolder} onValueChange={setFilterFolder}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Filter by folder" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {FOLDERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Document
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b">
            <th className="text-left p-3"><SortableHeader label="Title" active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : null} onClick={() => toggle('title')} /></th>
            <th className="text-left p-3"><SortableHeader label="Folder" active={sortKey === 'folder'} direction={sortKey === 'folder' ? sortDir : null} onClick={() => toggle('folder')} /></th>
            <th className="text-left p-3"><SortableHeader label="Version" active={sortKey === 'version'} direction={sortKey === 'version' ? sortDir : null} onClick={() => toggle('version')} /></th>
            <th className="text-left p-3"><SortableHeader label="Status" active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : null} onClick={() => toggle('status')} /></th>
            <th className="text-left p-3"><SortableHeader label="Owner" active={sortKey === 'owner'} direction={sortKey === 'owner' ? sortDir : null} onClick={() => toggle('owner')} /></th>
            <th className="text-left p-3"><SortableHeader label="Next Review" active={sortKey === 'nextReviewDate'} direction={sortKey === 'nextReviewDate' ? sortDir : null} onClick={() => toggle('nextReviewDate')} /></th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {sorted.map(doc => (
              <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditDoc(doc)}>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-accent shrink-0" />{doc.title}
                  {doc.directLink && <a href={doc.directLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><ExternalLink className="w-3 h-3 text-muted-foreground" /></a>}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{doc.folder}</td>
                <td className="p-3 text-xs text-muted-foreground">{doc.version}</td>
                <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[doc.status])}>{doc.status}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{doc.owner}</td>
                <td className={cn('p-3 text-xs', doc.nextReviewDate && new Date(doc.nextReviewDate) < new Date() ? 'text-nc-alert font-medium' : 'text-muted-foreground')}>{doc.nextReviewDate || '—'}</td>
                <td className="p-3"><button onClick={e => { e.stopPropagation(); handleDelete(doc.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={7}><EmptyState icon={FolderOpen} title="No documents" description="Add your first document to start organising." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Document</Button>} /></td></tr>}
          </tbody>
        </table>
      </div>

      <DocDialog doc={editDoc} open={!!editDoc || newOpen} onOpenChange={o => { if (!o) { setEditDoc(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function DocDialog({ doc, open, onOpenChange, onSave, onDelete }: {
  doc: NCDocument | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (d: NCDocument) => void; onDelete: (id: string) => void;
}) {
  const blank: NCDocument = { id: '', title: '', folder: 'Governance', version: 'v1.0', status: 'Draft', owner: '', lastReviewedDate: '', nextReviewDate: '', directLink: '', tags: '', notes: '', createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<NCDocument>(blank);
  useEffect(() => { setForm(doc || blank); }, [doc]);
  const u = (p: Partial<NCDocument>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{doc ? 'Edit Document' : 'New Document'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Document title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Folder</label>
              <Select value={form.folder} onValueChange={v => u({ folder: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{FOLDERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Version (e.g. v2.1)" value={form.version} onChange={e => u({ version: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as NCDocument['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Owner" value={form.owner} onChange={e => u({ owner: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Last Reviewed</label><Input type="date" className="mt-1" value={form.lastReviewedDate} onChange={e => u({ lastReviewedDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Next Review</label><Input type="date" className="mt-1" value={form.nextReviewDate} onChange={e => u({ nextReviewDate: e.target.value })} /></div>
          </div>
          <Input placeholder="Direct link (URL)" value={form.directLink} onChange={e => u({ directLink: e.target.value })} />
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => u({ tags: e.target.value })} />
          <Textarea placeholder="Notes..." value={form.notes} onChange={e => u({ notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>{doc ? 'Save' : 'Create'}</Button>
            {doc && <Button variant="destructive" onClick={() => onDelete(doc.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
