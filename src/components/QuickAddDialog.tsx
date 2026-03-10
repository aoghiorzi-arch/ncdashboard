import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { generateId, getTasks, saveTasks, getSettings, eventCRUD, type Task, type NCEvent } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';

type QuickAddType = 'Task' | 'Event';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<QuickAddType>('Task');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    const settings = getSettings();
    const now = new Date().toISOString();

    if (type === 'Task') {
      const task: Task = {
        id: generateId(),
        title: title.trim(),
        description: '',
        moduleTag: 'General',
        priority,
        status: 'Not Started',
        owner: settings.userName,
        dueDate: '',
        subtasks: [],
        notes: [],
        pinned: false,
        createdBy: settings.userName,
        createdAt: now,
        updatedAt: now,
      };
      const all = getTasks();
      all.push(task);
      saveTasks(all);
      logActivity('created', 'Tasks', title.trim(), settings.userName);
    } else if (type === 'Event') {
      const event: NCEvent = {
        id: generateId(),
        title: title.trim(),
        date: eventDate,
        venue: eventVenue,
        capacity: 0,
        status: 'Planning',
        leadOrganiser: settings.userName,
        programme: [],
        guestList: [],
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      eventCRUD.add(event);
      logActivity('created', 'Events', title.trim(), settings.userName);
    }

    setTitle('');
    setEventDate('');
    setEventVenue('');
    onOpenChange(false);
    window.dispatchEvent(new Event('nc-data-change'));
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setTitle('');
      setEventDate('');
      setEventVenue('');
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={type} onValueChange={(v) => setType(v as QuickAddType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Task">Task</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder={type === 'Task' ? 'Task title...' : 'Event title...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />

          {type === 'Task' && (
            <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          )}

          {type === 'Event' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <Input type="date" className="mt-1" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Venue</label>
                <Input className="mt-1" placeholder="Venue..." value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} />
              </div>
            </div>
          )}

          <Button onClick={handleAdd} disabled={!title.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Add {type}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
