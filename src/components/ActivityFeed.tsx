import { useState, useEffect } from 'react';
import { getActivityLog, type ActivityEntry } from '@/lib/activityLog';
import { Activity, Plus, Pencil, Trash2, MessageSquare, Paperclip, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const actionIcons: Record<string, React.ElementType> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
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

export function ActivityFeed({ limit = 15 }: { limit?: number }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(getActivityLog());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const visible = entries.slice(0, limit);

  if (visible.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet. Changes will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {visible.map(entry => {
        const Icon = actionIcons[entry.action] || Pencil;
        return (
          <li key={entry.id} className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
            <div className={cn('p-1.5 rounded-md mt-0.5 shrink-0', actionColors[entry.action])}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">
                <span className="font-medium">{entry.user}</span>
                {' '}{entry.action}{' '}
                <span className="font-medium">{entry.itemTitle}</span>
                {' '}in <span className="text-muted-foreground">{entry.module}</span>
              </p>
              {entry.details && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.details}</p>}
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
