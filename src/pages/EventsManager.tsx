import { useState, useEffect } from 'react';
import { eventCRUD, generateId, getSettings, type NCEvent } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, Users, CalendarDays, Download, PartyPopper, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteWithUndo } from '@/lib/undoDelete';
import { toast } from 'sonner';

const EVENT_STATUSES: NCEvent['status'][] = ['Planning', 'Confirmed', 'In Progress', 'Complete', 'Cancelled'];
const statusBadge: Record<string, string> = {
  Planning: 'bg-accent/10 text-accent', Confirmed: 'bg-nc-success/10 text-nc-success',
  'In Progress': 'bg-nc-warn/10 text-nc-warn', Complete: 'bg-nc-success/20 text-nc-success',
  Cancelled: 'bg-nc-alert/10 text-nc-alert',
};

export default function EventsManager() {
  const [events, setEvents] = useState<NCEvent[]>([]);
  const [editEvent, setEditEvent] = useState<NCEvent | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setEvents(eventCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (ev: NCEvent) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    if (editEvent) { eventCRUD.update({ ...ev, updatedAt: now }); logActivity('updated', 'Events', ev.title, user); }
    else { eventCRUD.add({ ...ev, id: generateId(), createdAt: now, updatedAt: now }); logActivity('created', 'Events', ev.title, user); }
    setEvents(eventCRUD.getAll());
    setEditEvent(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    const ev = events.find(e => e.id === id);
    eventCRUD.remove(id);
    if (ev) logActivity('deleted', 'Events', ev.title, getSettings().userName);
    setEvents(eventCRUD.getAll()); setEditEvent(null);
  };

  const handleExport = () => exportToCSV(events, 'events', [
    { key: 'title', label: 'Title' }, { key: 'date', label: 'Date' }, { key: 'venue', label: 'Venue' },
    { key: 'status', label: 'Status' }, { key: 'capacity', label: 'Capacity' }, { key: 'leadOrganiser', label: 'Lead Organiser' },
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> CSV</Button>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={PartyPopper} title="No events yet" description="Create your first event workspace to start planning." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Event</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <div key={ev.id} onClick={() => setEditEvent(ev)} className="bg-card rounded-lg p-5 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-base font-semibold text-foreground">{ev.title}</h4>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', statusBadge[ev.status])}>{ev.status}</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{ev.date || 'No date set'}</p>
                <p>{ev.venue || 'No venue set'}</p>
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{ev.guestList.length} guests • Capacity: {ev.capacity || '—'}</p>
                <p>{ev.programme.length} programme segments</p>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={e => { e.stopPropagation(); handleDelete(ev.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EventDialog event={editEvent} open={!!editEvent || newOpen} onOpenChange={o => { if (!o) { setEditEvent(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function EventDialog({ event, open, onOpenChange, onSave, onDelete }: {
  event: NCEvent | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (e: NCEvent) => void; onDelete: (id: string) => void;
}) {
  const blank: NCEvent = { id: '', title: '', date: '', venue: '', capacity: 0, status: 'Planning', leadOrganiser: '', programme: [], guestList: [], notes: '', createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<NCEvent>(blank);
  useEffect(() => { setForm(event || blank); }, [event]);
  const u = (p: Partial<NCEvent>) => setForm(f => ({ ...f, ...p }));

  const addGuest = () => u({ guestList: [...form.guestList, { id: generateId(), name: '', type: 'General', rsvp: 'Pending', dietary: '' }] });
  const removeGuest = (id: string) => u({ guestList: form.guestList.filter(g => g.id !== id) });
  const updateGuest = (id: string, patch: Partial<NCEvent['guestList'][0]>) => u({ guestList: form.guestList.map(g => g.id === id ? { ...g, ...patch } : g) });

  const addSegment = () => u({ programme: [...form.programme, { id: generateId(), segment: '', time: '', owner: '', avRequirements: '' }] });
  const removeSegment = (id: string) => u({ programme: form.programme.filter(s => s.id !== id) });
  const updateSegment = (id: string, patch: Partial<NCEvent['programme'][0]>) => u({ programme: form.programme.map(s => s.id === id ? { ...s, ...patch } : s) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Event title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.date} onChange={e => u({ date: e.target.value })} />
            <Input placeholder="Venue" value={form.venue} onChange={e => u({ venue: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input type="number" placeholder="Capacity" value={form.capacity || ''} onChange={e => u({ capacity: +e.target.value })} />
            <div>
              <Select value={form.status} onValueChange={v => u({ status: v as NCEvent['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Lead organiser" value={form.leadOrganiser} onChange={e => u({ leadOrganiser: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Programme</h4>
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addSegment}>+ Segment</Button>
            </div>
            {form.programme.map(seg => (
              <div key={seg.id} className="grid grid-cols-4 gap-2 mb-2 items-center">
                <Input placeholder="Time" value={seg.time} onChange={e => updateSegment(seg.id, { time: e.target.value })} className="text-xs h-8" />
                <Input placeholder="Segment" value={seg.segment} onChange={e => updateSegment(seg.id, { segment: e.target.value })} className="text-xs h-8 col-span-2" />
                <div className="flex gap-1">
                  <Input placeholder="Owner" value={seg.owner} onChange={e => updateSegment(seg.id, { owner: e.target.value })} className="text-xs h-8" />
                  <button onClick={() => removeSegment(seg.id)} className="text-muted-foreground hover:text-nc-alert shrink-0"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Guest List</h4>
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addGuest}>+ Guest</Button>
            </div>
            {form.guestList.map(g => (
              <div key={g.id} className="grid grid-cols-4 gap-2 mb-2 items-center">
                <Input placeholder="Name" value={g.name} onChange={e => updateGuest(g.id, { name: e.target.value })} className="text-xs h-8" />
                <Select value={g.type} onValueChange={v => updateGuest(g.id, { type: v as typeof g.type })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['VIP','Speaker','General','Press'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={g.rsvp} onValueChange={v => updateGuest(g.id, { rsvp: v as typeof g.rsvp })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Pending','Confirmed','Declined'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Dietary" value={g.dietary} onChange={e => updateGuest(g.id, { dietary: e.target.value })} className="text-xs h-8" />
                  <button onClick={() => removeGuest(g.id)} className="text-muted-foreground hover:text-nc-alert shrink-0"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <Textarea placeholder="Notes..." value={form.notes} onChange={e => u({ notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>{event ? 'Save' : 'Create'}</Button>
            {event && <Button variant="destructive" onClick={() => onDelete(event.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
