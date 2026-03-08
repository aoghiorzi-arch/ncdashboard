import { useEffect, useState } from 'react';
import { getTasks, getExpenses, getSettings, type Task } from '@/lib/storage';
import { KPICard } from '@/components/KPICard';
import {
  Film, Clapperboard, CheckSquare, CalendarClock, Users, PiggyBank,
  AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const priorityColor: Record<string, string> = {
  Critical: 'bg-nc-alert/10 text-nc-alert',
  High: 'bg-nc-warn/10 text-nc-warn',
  Medium: 'bg-accent/10 text-accent',
  Low: 'bg-muted text-muted-foreground',
};

const statusColor: Record<string, string> = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-accent/10 text-accent',
  'Blocked': 'bg-nc-alert/10 text-nc-alert',
  'In Review': 'bg-nc-warn/10 text-nc-warn',
  'Complete': 'bg-nc-success/10 text-nc-success',
};

export default function DashboardHome() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const refresh = () => {
      setTasks(getTasks());
      setSettings(getSettings());
    };
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const openTasks = tasks.filter(t => t.status !== 'Complete');
  const overdueTasks = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const todayTasks = openTasks.filter(t => {
    if (!t.dueDate) return false;
    return t.dueDate === new Date().toISOString().split('T')[0];
  });

  const totalExpenses = getExpenses()
    .filter(e => e.status === 'Paid' || e.status === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const alerts = [
    ...overdueTasks.map(t => ({ text: `Overdue: ${t.title}`, type: 'alert' as const })),
    ...(tasks.filter(t => t.status === 'Blocked').map(t => ({ text: `Blocked: ${t.title}`, type: 'warn' as const }))),
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Classes Live" value={0} icon={Film} />
        <KPICard label="In Production" value={0} icon={Clapperboard} />
        <KPICard
          label="Open Tasks"
          value={openTasks.length}
          subtitle={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined}
          icon={CheckSquare}
          variant={overdueTasks.length > 0 ? 'alert' : 'default'}
        />
        <KPICard
          label="Days to Launch"
          value={daysUntil(settings.launchDate)}
          icon={CalendarClock}
          variant={daysUntil(settings.launchDate) < 30 ? 'warn' : 'default'}
        />
        <KPICard label="Total Members" value={settings.totalMembers} icon={Users} />
        <KPICard
          label="Budget Remaining"
          value={`£${(settings.totalBudget - totalExpenses).toLocaleString()}`}
          icon={PiggyBank}
          variant={(settings.totalBudget - totalExpenses) / settings.totalBudget < 0.2 ? 'alert' : 'default'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Agenda */}
        <div className="lg:col-span-2 bg-card rounded-lg nc-shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Today's Agenda
          </h3>
          {todayTasks.length === 0 && overdueTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks due today. Use the + button to add tasks.</p>
          ) : (
            <ul className="space-y-2">
              {[...overdueTasks, ...todayTasks].slice(0, 10).map(task => (
                <li key={task.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusColor[task.status])}>
                      {task.status}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', priorityColor[task.priority])}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alert Feed */}
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-nc-warn" />
            Alerts
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts — everything on track.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 8).map((alert, i) => (
                <li key={i} className={cn(
                  'text-xs px-3 py-2 rounded-md font-medium',
                  alert.type === 'alert' ? 'bg-nc-alert/10 text-nc-alert' : 'bg-nc-warn/10 text-nc-warn'
                )}>
                  {alert.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card rounded-lg nc-shadow-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Click the gold + button to create your first task.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left pb-2 font-medium">Task</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Priority</th>
                  <th className="text-left pb-2 font-medium">Owner</th>
                  <th className="text-left pb-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(-5).reverse().map(task => (
                  <tr key={task.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{task.title}</td>
                    <td>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusColor[task.status])}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityColor[task.priority])}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{task.owner}</td>
                    <td className="text-muted-foreground">{task.dueDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
