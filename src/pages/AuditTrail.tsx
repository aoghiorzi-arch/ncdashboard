import { useState, useEffect, useMemo } from 'react';
import { getActivityLog, clearActivityLog, type ActivityEntry } from '@/lib/activityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Trash2, Plus, Pencil, Trash, MessageSquare, Paperclip, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { EmptyState } from '@/components/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const actionIcons: Record<string, React.ElementType> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash,
  commented: MessageSquare,
  attached: Paperclip,
  status_changed: ArrowRightLeft,
  completed: CheckCircle2,
};

const actionColors: Record<string, string> = {
  created: 'bg-nc-success/10 text-nc-success',
  updated: 'bg-accent/10 text-accent',
  deleted: 'bg-destructive/10 text-destructive',
  commented: 'bg-primary/10 text-primary',
  attached: 'bg-secondary text-secondary-foreground',
  status_changed: 'bg-accent/10 text-accent',
  completed: 'bg-nc-success/10 text-nc-success',
};

const actionLabels: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  commented: 'Commented',
  attached: 'Attached file',
  status_changed: 'Changed status',
  completed: 'Completed',
};

export default function AuditTrail() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [clearOpen, setClearOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setEntries(getActivityLog());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const modules = useMemo(() => {
    const set = new Set(entries.map(e => e.module));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterModule !== 'all' && e.module !== filterModule) return false;
      if (filterAction !== 'all' && e.action !== filterAction) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.itemTitle.toLowerCase().includes(q) ||
          e.user.toLowerCase().includes(q) ||
          e.module.toLowerCase().includes(q) ||
          (e.details || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, filterModule, filterAction, search]);

  const handleClear = () => {
    clearActivityLog();
    setEntries([]);
    setClearOpen(false);
    toast.success('Audit trail cleared');
  };

  // Group entries by date
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    filtered.forEach(e => {
      const day = e.timestamp.split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="max-w-[1000px] mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search audit trail..."
              className="pl-9 h-8 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setClearOpen(true)}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Log
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} entries</p>

      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit trail entries"
          description="Actions like creating, updating, and deleting items will be recorded here automatically."
        />
      ) : grouped.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No entries match your filters.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayEntries]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {format(new Date(date), 'EEEE, d MMMM yyyy')}
              </h3>
              <div className="bg-card rounded-lg nc-shadow-card divide-y divide-border">
                {dayEntries.map(entry => {
                  const Icon = actionIcons[entry.action] || Pencil;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 p-4">
                      <div className={cn('p-1.5 rounded-md mt-0.5 shrink-0', actionColors[entry.action])}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{entry.user}</span>
                          {' '}<span className="text-muted-foreground">{actionLabels[entry.action] || entry.action}</span>{' '}
                          <span className="font-medium">{entry.itemTitle}</span>
                          {' '}in <span className="text-accent">{entry.module}</span>
                        </p>
                        {entry.details && <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                        {format(new Date(entry.timestamp), 'HH:mm')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Clear Audit Trail</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete all audit trail entries. This cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClear}>Clear All</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
