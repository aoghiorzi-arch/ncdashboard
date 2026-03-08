import { useState, useEffect } from 'react';
import { complianceCRUD, generateId, getSettings, type ComplianceItem } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, Shield, AlertTriangle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: ComplianceItem['category'][] = ['GDPR', 'PECR', 'Safeguarding', 'Trading Standards', 'Employment', 'Other'];
const STATUSES: ComplianceItem['status'][] = ['Compliant', 'Action Required', 'In Progress', 'Not Applicable'];
const PRIORITIES: ComplianceItem['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

const statusBadge: Record<string, string> = {
  Compliant: 'bg-nc-success/10 text-nc-success', 'Action Required': 'bg-nc-alert/10 text-nc-alert',
  'In Progress': 'bg-nc-warn/10 text-nc-warn', 'Not Applicable': 'bg-muted text-muted-foreground',
};
const priorityBadge: Record<string, string> = {
  Critical: 'bg-nc-alert/10 text-nc-alert', High: 'bg-nc-warn/10 text-nc-warn',
  Medium: 'bg-accent/10 text-accent', Low: 'bg-muted text-muted-foreground',
};

export default function LegalCompliance() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [editItem, setEditItem] = useState<ComplianceItem | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const { sorted, sortKey, sortDir, toggle } = useSortableData(items, 'title');

  useEffect(() => {
    const refresh = () => setItems(complianceCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (item: ComplianceItem) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editItem) { complianceCRUD.update({ ...item, updatedAt: now }); logActivity('updated', 'Legal', item.title, user); }
    else { complianceCRUD.add({ ...item, id: generateId(), createdAt: now, updatedAt: now }); logActivity('created', 'Legal', item.title, user); }
    setItems(complianceCRUD.getAll());
    setEditItem(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    complianceCRUD.remove(id);
    if (item) logActivity('deleted', 'Legal', item.title, getSettings().userName);
    setItems(complianceCRUD.getAll()); setEditItem(null);
  };

  const handleExport = () => exportToCSV(items, 'compliance', [
    { key: 'title', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due Date' },
  ]);

  const actionRequired = items.filter(i => i.status === 'Action Required' || i.priority === 'Critical');

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {actionRequired.length > 0 && (
        <div className="bg-nc-alert/5 border border-nc-alert/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-nc-alert shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-nc-alert">{actionRequired.length} item(s) require attention</p>
            <ul className="text-xs text-nc-alert/80 mt-1 space-y-0.5">
              {actionRequired.slice(0, 3).map(i => <li key={i.id}>• {i.title}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Item
        </Button>
      </div>

      <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b">
            <th className="text-left p-3"><SortableHeader label="Item" active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : null} onClick={() => toggle('title')} /></th>
            <th className="text-left p-3"><SortableHeader label="Category" active={sortKey === 'category'} direction={sortKey === 'category' ? sortDir : null} onClick={() => toggle('category')} /></th>
            <th className="text-left p-3"><SortableHeader label="Status" active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : null} onClick={() => toggle('status')} /></th>
            <th className="text-left p-3"><SortableHeader label="Priority" active={sortKey === 'priority'} direction={sortKey === 'priority' ? sortDir : null} onClick={() => toggle('priority')} /></th>
            <th className="text-left p-3"><SortableHeader label="Owner" active={sortKey === 'owner'} direction={sortKey === 'owner' ? sortDir : null} onClick={() => toggle('owner')} /></th>
            <th className="text-left p-3"><SortableHeader label="Due" active={sortKey === 'dueDate'} direction={sortKey === 'dueDate' ? sortDir : null} onClick={() => toggle('dueDate')} /></th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {sorted.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditItem(item)}>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-accent shrink-0" />{item.title}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{item.category}</td>
                <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[item.status])}>{item.status}</span></td>
                <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityBadge[item.priority])}>{item.priority}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{item.owner}</td>
                <td className={cn('p-3 text-xs', item.dueDate && new Date(item.dueDate) < new Date() ? 'text-nc-alert font-medium' : 'text-muted-foreground')}>{item.dueDate || '—'}</td>
                <td className="p-3"><button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={7}><EmptyState icon={Shield} title="No compliance items" description="Add one to track your legal obligations." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Item</Button>} /></td></tr>}
          </tbody>
        </table>
      </div>

      <ComplianceDialog item={editItem} open={!!editItem || newOpen} onOpenChange={o => { if (!o) { setEditItem(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function ComplianceDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: ComplianceItem | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (c: ComplianceItem) => void; onDelete: (id: string) => void;
}) {
  const blank: ComplianceItem = { id: '', title: '', category: 'GDPR', status: 'Action Required', priority: 'Medium', description: '', actionRequired: '', owner: '', dueDate: '', evidenceLink: '', notes: [], createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<ComplianceItem>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<ComplianceItem>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Compliance Item' : 'New Compliance Item'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={v => u({ category: v as ComplianceItem['category'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as ComplianceItem['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={form.priority} onValueChange={v => u({ priority: v as ComplianceItem['priority'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Due Date</label><Input type="date" className="mt-1" value={form.dueDate} onChange={e => u({ dueDate: e.target.value })} /></div>
          </div>
          <Textarea placeholder="Description of requirement" value={form.description} onChange={e => u({ description: e.target.value })} rows={2} />
          <Textarea placeholder="Action required" value={form.actionRequired} onChange={e => u({ actionRequired: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Owner" value={form.owner} onChange={e => u({ owner: e.target.value })} />
            <Input placeholder="Evidence / doc link" value={form.evidenceLink} onChange={e => u({ evidenceLink: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
