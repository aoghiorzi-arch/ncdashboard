import { useState, useEffect } from 'react';
import { getTasks, getExpenses, getSettings, documentCRUD, complianceCRUD, calendarCRUD, partnershipCRUD } from '@/lib/storage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, AlertTriangle, Clock, FileWarning, PiggyBank, Shield, CalendarDays, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  text: string;
  type: 'alert' | 'warn' | 'info';
  icon: React.ElementType;
  category: string;
}

function buildNotifications(): Notification[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split('T')[0];
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];
  const notes: Notification[] = [];

  // Overdue tasks
  const tasks = getTasks();
  tasks.filter(t => t.status !== 'Complete' && t.dueDate && t.dueDate < today)
    .forEach(t => notes.push({
      id: `task-overdue-${t.id}`, text: `Overdue: ${t.title} (due ${t.dueDate})`,
      type: 'alert', icon: Clock, category: 'Tasks',
    }));

  // Tasks due in 3 days
  tasks.filter(t => t.status !== 'Complete' && t.dueDate && t.dueDate >= today && t.dueDate <= in3DaysStr)
    .forEach(t => notes.push({
      id: `task-soon-${t.id}`, text: `Due soon: ${t.title} (${t.dueDate})`,
      type: 'warn', icon: Clock, category: 'Tasks',
    }));

  // Blocked tasks
  tasks.filter(t => t.status === 'Blocked')
    .forEach(t => notes.push({
      id: `task-blocked-${t.id}`, text: `Blocked: ${t.title}`,
      type: 'warn', icon: AlertTriangle, category: 'Tasks',
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
      type: 'alert', icon: PiggyBank, category: 'Budget',
    });
  }

  // Documents due for review
  documentCRUD.getAll()
    .filter(d => d.nextReviewDate && d.nextReviewDate <= today && d.status !== 'Superseded')
    .forEach(d => notes.push({
      id: `doc-review-${d.id}`, text: `Review due: ${d.title}`,
      type: 'warn', icon: FileWarning, category: 'Documents',
    }));

  // Compliance actions required
  complianceCRUD.getAll()
    .filter(c => c.status === 'Action Required' && c.priority !== 'Low')
    .forEach(c => notes.push({
      id: `compliance-${c.id}`, text: `Compliance action: ${c.title}`,
      type: c.priority === 'Critical' ? 'alert' : 'warn', icon: Shield, category: 'Compliance',
    }));

  // Upcoming calendar events (next 7 days)
  calendarCRUD.getAll()
    .filter(e => e.date >= today && e.date <= in7DaysStr)
    .forEach(e => notes.push({
      id: `cal-${e.id}`, text: `Upcoming: ${e.title} (${e.date})`,
      type: 'info', icon: CalendarDays, category: 'Calendar',
    }));

  // Partnership next actions due
  partnershipCRUD.getAll()
    .filter(p => p.nextActionDate && p.nextActionDate <= today && p.status !== 'Ended')
    .forEach(p => notes.push({
      id: `partner-${p.id}`, text: `Action due: ${p.organisationName} — ${p.nextAction}`,
      type: 'warn', icon: Handshake, category: 'Partnerships',
    }));

  // Compliance items due
  complianceCRUD.getAll()
    .filter(c => c.dueDate && c.dueDate < today && c.status !== 'Compliant' && c.status !== 'Not Applicable')
    .forEach(c => notes.push({
      id: `compliance-due-${c.id}`, text: `Overdue compliance: ${c.title}`,
      type: 'alert', icon: Shield, category: 'Compliance',
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
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const refresh = () => setNotifications(buildNotifications());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category)))];
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.category === filter);
  const alertCount = notifications.filter(n => n.type === 'alert').length;
  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground relative">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
              alertCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-accent text-accent-foreground'
            )}>
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          <p className="text-xs text-muted-foreground">{count} active alert{count !== 1 ? 's' : ''}</p>
        </div>

        {/* Category filter */}
        {categories.length > 2 && (
          <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap transition-colors',
                  filter === c ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">All clear — no alerts.</p>
          ) : (
            <ul className="py-1">
              {filtered.map(n => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className={cn('p-1.5 rounded-md mt-0.5 shrink-0', typeStyles[n.type])}>
                    <n.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-foreground leading-relaxed">{n.text}</span>
                    <span className="text-[9px] text-muted-foreground ml-2">{n.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
