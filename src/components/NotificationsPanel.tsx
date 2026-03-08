import { useState, useEffect } from 'react';
import { getTasks, getExpenses, getSettings, documentCRUD, complianceCRUD } from '@/lib/storage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, AlertTriangle, Clock, FileWarning, PiggyBank, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  text: string;
  type: 'alert' | 'warn' | 'info';
  icon: React.ElementType;
}

function buildNotifications(): Notification[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const notes: Notification[] = [];

  // Overdue tasks
  const tasks = getTasks();
  tasks.filter(t => t.status !== 'Complete' && t.dueDate && t.dueDate < today)
    .forEach(t => notes.push({
      id: `task-overdue-${t.id}`, text: `Overdue: ${t.title} (due ${t.dueDate})`,
      type: 'alert', icon: Clock,
    }));

  // Blocked tasks
  tasks.filter(t => t.status === 'Blocked')
    .forEach(t => notes.push({
      id: `task-blocked-${t.id}`, text: `Blocked: ${t.title}`,
      type: 'warn', icon: AlertTriangle,
    }));

  // Budget warning
  const settings = getSettings();
  const totalSpent = getExpenses()
    .filter(e => e.status === 'Paid' || e.status === 'Approved')
    .reduce((s, e) => s + e.amount, 0);
  const remaining = settings.totalBudget - totalSpent;
  if (settings.totalBudget > 0 && remaining / settings.totalBudget < 0.2) {
    notes.push({
      id: 'budget-low', text: `Budget below 20% — £${remaining.toLocaleString()} remaining`,
      type: 'alert', icon: PiggyBank,
    });
  }

  // Documents due for review
  documentCRUD.getAll()
    .filter(d => d.nextReviewDate && d.nextReviewDate <= today && d.status !== 'Superseded')
    .forEach(d => notes.push({
      id: `doc-review-${d.id}`, text: `Review due: ${d.title}`,
      type: 'warn', icon: FileWarning,
    }));

  // Compliance actions required
  complianceCRUD.getAll()
    .filter(c => c.status === 'Action Required' && c.priority !== 'Low')
    .forEach(c => notes.push({
      id: `compliance-${c.id}`, text: `Compliance action: ${c.title}`,
      type: c.priority === 'Critical' ? 'alert' : 'warn', icon: Shield,
    }));

  return notes;
}

const typeStyles: Record<string, string> = {
  alert: 'bg-destructive/10 text-destructive',
  warn: 'bg-accent/10 text-accent',
  info: 'bg-muted text-muted-foreground',
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const refresh = () => setNotifications(buildNotifications());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground relative">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          <p className="text-xs text-muted-foreground">{count} active alert{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">All clear — no alerts.</p>
          ) : (
            <ul className="py-1">
              {notifications.map(n => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className={cn('p-1.5 rounded-md mt-0.5', typeStyles[n.type])}>
                    <n.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-foreground leading-relaxed">{n.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
