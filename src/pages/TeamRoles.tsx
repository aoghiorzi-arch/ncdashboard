import { useState, useEffect } from 'react';
import { teamCRUD, generateId, getSettings, type TeamMember } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, User, Download, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPLOYMENT_TYPES: TeamMember['employmentType'][] = ['Staff', 'Contractor', 'Volunteer', 'Instructor'];
const typeBadge: Record<string, string> = {
  Staff: 'bg-primary/10 text-primary', Contractor: 'bg-accent/10 text-accent',
  Volunteer: 'bg-nc-success/10 text-nc-success', Instructor: 'bg-nc-warn/10 text-nc-warn',
};

export default function TeamRoles() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setMembers(teamCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (m: TeamMember) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editMember) { teamCRUD.update({ ...m, updatedAt: now }); logActivity('updated', 'Team', m.name, user); }
    else { teamCRUD.add({ ...m, id: generateId(), createdAt: now, updatedAt: now }); logActivity('created', 'Team', m.name, user); }
    setMembers(teamCRUD.getAll());
    setEditMember(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const m = members.find(i => i.id === id);
    teamCRUD.remove(id);
    if (m) logActivity('deleted', 'Team', m.name, getSettings().userName);
    setMembers(teamCRUD.getAll()); setEditMember(null);
  };

  const handleExport = () => exportToCSV(members, 'team', [
    { key: 'name', label: 'Name' }, { key: 'roleTitle', label: 'Role' }, { key: 'employmentType', label: 'Type' },
    { key: 'email', label: 'Email' }, { key: 'startDate', label: 'Start Date' },
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={UserCog} title="No team members" description="Add your first team member to start managing roles." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Member</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} onClick={() => setEditMember(m)} className="bg-card rounded-lg p-5 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{m.name}</h4>
                    <p className="text-xs text-muted-foreground">{m.roleTitle}</p>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', typeBadge[m.employmentType])}>{m.employmentType}</span>
              {m.email && <p className="text-xs text-muted-foreground mt-2">{m.email}</p>}
            </div>
          ))}
        </div>
      )}

      <MemberDialog member={editMember} open={!!editMember || newOpen} onOpenChange={o => { if (!o) { setEditMember(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function MemberDialog({ member, open, onOpenChange, onSave, onDelete }: {
  member: TeamMember | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (m: TeamMember) => void; onDelete: (id: string) => void;
}) {
  const blank: TeamMember = { id: '', name: '', roleTitle: '', employmentType: 'Staff', email: '', phone: '', responsibilities: '', gdprResponsibilities: '', startDate: '', endDate: '', dayRate: '', createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<TeamMember>(blank);
  useEffect(() => { setForm(member || blank); }, [member]);
  const u = (p: Partial<TeamMember>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{member ? 'Edit Member' : 'New Member'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Full name" value={form.name} onChange={e => u({ name: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Role title" value={form.roleTitle} onChange={e => u({ roleTitle: e.target.value })} />
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={form.employmentType} onValueChange={v => u({ employmentType: v as TeamMember['employmentType'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" value={form.email} onChange={e => u({ email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={e => u({ phone: e.target.value })} />
          </div>
          <Textarea placeholder="Responsibilities" value={form.responsibilities} onChange={e => u({ responsibilities: e.target.value })} rows={3} />
          <Textarea placeholder="GDPR responsibilities" value={form.gdprResponsibilities} onChange={e => u({ gdprResponsibilities: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Start Date</label><Input type="date" className="mt-1" value={form.startDate} onChange={e => u({ startDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">End Date</label><Input type="date" className="mt-1" value={form.endDate} onChange={e => u({ endDate: e.target.value })} /></div>
          </div>
          <Input placeholder="Day rate / fee" value={form.dayRate} onChange={e => u({ dayRate: e.target.value })} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.name.trim()) onSave(form); }} disabled={!form.name.trim()}>{member ? 'Save' : 'Create'}</Button>
            {member && <Button variant="destructive" onClick={() => onDelete(member.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
