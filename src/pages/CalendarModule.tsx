import { useState, useEffect, useMemo } from 'react';
import { calendarCRUD, generateId, type CalendarEvent } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronLeft, ChevronRight, Trash2, List, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO, getDay } from 'date-fns';

const EVENT_TYPES: CalendarEvent['type'][] = ['Milestone', 'Filming Day', 'Meeting', 'Deadline', 'Event', 'Reminder'];
const typeColors: Record<string, string> = {
  Milestone: 'bg-accent/20 text-accent border-accent/30',
  'Filming Day': 'bg-primary/20 text-primary border-primary/30',
  Meeting: 'bg-muted text-muted-foreground border-border',
  Deadline: 'bg-nc-alert/20 text-nc-alert border-nc-alert/30',
  Event: 'bg-nc-success/20 text-nc-success border-nc-success/30',
  Reminder: 'bg-secondary text-secondary-foreground border-secondary',
};

export default function CalendarModule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const refresh = () => setEvents(calendarCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null).concat(allDays);
    return paddedDays;
  }, [currentMonth]);

  const handleSave = (ev: CalendarEvent) => {
    if (editEvent) { calendarCRUD.update(ev); }
    else { calendarCRUD.add({ ...ev, id: generateId(), createdAt: new Date().toISOString() }); }
    setEvents(calendarCRUD.getAll());
    setEditEvent(null);
    setNewOpen(false);
  };

  const handleDelete = (id: string) => {
    calendarCRUD.remove(id);
    setEvents(calendarCRUD.getAll());
    setEditEvent(null);
  };

  const openNewOnDate = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setNewOpen(true);
  };

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setView('month')}>
            <CalendarDays className="w-4 h-4 mr-1" /> Month
          </Button>
          <Button variant={view === 'agenda' ? 'default' : 'outline'} size="sm" onClick={() => setView('agenda')}>
            <List className="w-4 h-4 mr-1" /> Agenda
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setNewOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Event
        </Button>
      </div>

      {view === 'month' && (
        <div className="bg-card rounded-lg nc-shadow-card overflow-hidden">
          <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} className="min-h-[100px] border-b border-r bg-muted/30" />;
              const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors',
                    !isSameMonth(day, currentMonth) && 'opacity-40'
                  )}
                  onClick={() => openNewOnDate(day)}
                >
                  <span className={cn(
                    'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                    isToday && 'bg-accent text-accent-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setEditEvent(ev); }}
                        className={cn('text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer', typeColors[ev.type])}
                      >
                        {ev.startTime && `${ev.startTime} `}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'agenda' && (
        <div className="bg-card rounded-lg nc-shadow-card">
          {sortedEvents.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">No events. Click "New Event" to add one.</p>
          ) : (
            <div className="divide-y">
              {sortedEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer" onClick={() => setEditEvent(ev)}>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', typeColors[ev.type])}>
                      {ev.type}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.date} {ev.startTime && `• ${ev.startTime}`}{ev.endTime && ` – ${ev.endTime}`}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <EventDialog
        event={editEvent}
        open={!!editEvent || newOpen}
        defaultDate={selectedDate}
        onOpenChange={(o) => { if (!o) { setEditEvent(null); setNewOpen(false); } }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

function EventDialog({ event, open, defaultDate, onOpenChange, onSave, onDelete }: {
  event: CalendarEvent | null; open: boolean; defaultDate: string;
  onOpenChange: (o: boolean) => void; onSave: (e: CalendarEvent) => void; onDelete: (id: string) => void;
}) {
  const blank: CalendarEvent = { id: '', title: '', type: 'Meeting', date: defaultDate, startTime: '', endTime: '', location: '', attendees: '', notes: '', recurrence: 'none', createdAt: '' };
  const [form, setForm] = useState<CalendarEvent>(blank);
  useEffect(() => { setForm(event || { ...blank, date: defaultDate }); }, [event, defaultDate]);
  const u = (p: Partial<CalendarEvent>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Event title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={form.type} onValueChange={v => u({ type: v as CalendarEvent['type'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" className="mt-1" value={form.date} onChange={e => u({ date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <Input type="time" className="mt-1" value={form.startTime} onChange={e => u({ startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Time</label>
              <Input type="time" className="mt-1" value={form.endTime} onChange={e => u({ endTime: e.target.value })} />
            </div>
          </div>
          <Input placeholder="Location" value={form.location} onChange={e => u({ location: e.target.value })} />
          <Input placeholder="Attendees" value={form.attendees} onChange={e => u({ attendees: e.target.value })} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Recurrence</label>
            <Select value={form.recurrence} onValueChange={v => u({ recurrence: v as CalendarEvent['recurrence'] })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Notes..." value={form.notes} onChange={e => u({ notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()}>
              {event ? 'Save' : 'Create'}
            </Button>
            {event && <Button variant="destructive" onClick={() => onDelete(event.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
