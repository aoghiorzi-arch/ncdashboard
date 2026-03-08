import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { generateId, getTasks, saveTasks, getSettings, type Task } from '@/lib/storage';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Task'>('Task');
  const [priority, setPriority] = useState<Task['priority']>('Medium');

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
    }

    setTitle('');
    onOpenChange(false);
    window.dispatchEvent(new Event('nc-data-change'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={type} onValueChange={(v) => setType(v as 'Task')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Task">Task</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />

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

          <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
