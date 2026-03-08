import { useState, useEffect } from 'react';
import { partnershipCRUD, generateId, type Partnership } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES: Partnership['type'][] = ['Church', 'Academic', 'Media', 'Funder', 'Supplier', 'Other'];
const STATUSES: Partnership['status'][] = ['Identified', 'In Conversation', 'Agreed', 'Active', 'Dormant', 'Ended'];
const AGREEMENT_TYPES: Partnership['agreementType'][] = ['MOU', 'Contract', 'Informal', 'None'];
const statusBadge: Record<string, string> = {
  Identified: 'bg-muted text-muted-foreground', 'In Conversation': 'bg-accent/10 text-accent',
  Agreed: 'bg-nc-success/10 text-nc-success', Active: 'bg-nc-success/20 text-nc-success',
  Dormant: 'bg-nc-warn/10 text-nc-warn', Ended: 'bg-secondary text-secondary-foreground',
};

export default function Partnerships() {
  const [items, setItems] = useState<Partnership[]>([]);
  const [editItem, setEditItem] = useState<Partnership | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(partnershipCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (item: Partnership) => {
    const now = new Date().toISOString();
    if (editItem) { partnershipCRUD.update({ ...item, updatedAt: now }); }
    else { partnershipCRUD.add({ ...item, id: generateId(), createdAt: now, updatedAt: now }); }
    setItems(partnershipCRUD.getAll());
    setEditItem(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => { partnershipCRUD.remove(id); setItems(partnershipCRUD.getAll()); setEditItem(null); };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Partnership
        </Button>
      </div>

      <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground border-b">
            <th className="text-left p-3 font-medium">Organisation</th><th className="text-left p-3 font-medium">Type</th>
            <th className="text-left p-3 font-medium">Status</th><th className="text-left p-3 font-medium">Contact</th>
            <th className="text-left p-3 font-medium">Agreement</th><th className="text-left p-3 font-medium">Next Action</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditItem(p)}>
                <td className="p-3 font-medium text-foreground">{p.organisationName}</td>
                <td className="p-3 text-xs text-muted-foreground">{p.type}</td>
                <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[p.status])}>{p.status}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{p.primaryContactName}</td>
                <td className="p-3 text-xs text-muted-foreground">{p.agreementType}</td>
                <td className="p-3 text-xs text-muted-foreground">{p.nextActionDate || '—'}</td>
                <td className="p-3"><button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">No partnerships yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <PartnerDialog item={editItem} open={!!editItem || newOpen} onOpenChange={o => { if (!o) { setEditItem(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function PartnerDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: Partnership | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (p: Partnership) => void; onDelete: (id: string) => void;
}) {
  const blank: Partnership = {
    id: '', organisationName: '', type: 'Other', primaryContactName: '', email: '', phone: '',
    relationshipOwner: '', status: 'Identified', agreementType: 'None', agreementDocLink: '',
    value: '', nextAction: '', nextActionDate: '', notes: [], createdAt: '', updatedAt: '',
  };
  const [form, setForm] = useState<Partnership>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<Partnership>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Partnership' : 'New Partnership'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Organisation name" value={form.organisationName} onChange={e => u({ organisationName: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={form.type} onValueChange={v => u({ type: v as Partnership['type'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as Partnership['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Input placeholder="Primary contact name" value={form.primaryContactName} onChange={e => u({ primaryContactName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" value={form.email} onChange={e => u({ email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={e => u({ phone: e.target.value })} />
          </div>
          <Input placeholder="Relationship owner (NC team member)" value={form.relationshipOwner} onChange={e => u({ relationshipOwner: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Agreement</label>
              <Select value={form.agreementType} onValueChange={v => u({ agreementType: v as Partnership['agreementType'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{AGREEMENT_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Agreement doc link" value={form.agreementDocLink} onChange={e => u({ agreementDocLink: e.target.value })} />
          </div>
          <Textarea placeholder="Value (financial or strategic)" value={form.value} onChange={e => u({ value: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Next action" value={form.nextAction} onChange={e => u({ nextAction: e.target.value })} />
            <div><label className="text-xs font-medium text-muted-foreground">Next Action Date</label><Input type="date" className="mt-1" value={form.nextActionDate} onChange={e => u({ nextActionDate: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.organisationName.trim()) onSave(form); }} disabled={!form.organisationName.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
