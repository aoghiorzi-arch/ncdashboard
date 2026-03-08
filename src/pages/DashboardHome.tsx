import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, getExpenses, getSettings, classCRUD, type Task } from '@/lib/storage';
import { KPICard } from '@/components/KPICard';
import { ActivityFeed } from '@/components/ActivityFeed';
import {
  Film, Clapperboard, CheckSquare, CalendarClock, Users, PiggyBank,
  AlertTriangle, Clock, Activity, TrendingDown, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';

function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const priorityColor: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive',
  High: 'bg-accent/10 text-accent',
  Medium: 'bg-muted text-muted-foreground',
  Low: 'bg-muted text-muted-foreground',
};

const statusColor: Record<string, string> = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-accent/10 text-accent',
  'Blocked': 'bg-destructive/10 text-destructive',
  'In Review': 'bg-accent/10 text-accent',
  'Complete': 'bg-nc-success/10 text-nc-success',
};

function buildBurndownData() {
  const expenses = getExpenses();
  const settings = getSettings();
  const budget = settings.totalBudget;

  // Group paid expenses by month
  const byMonth: Record<string, number> = {};
  expenses
    .filter(e => e.status === 'Paid' && e.paymentDate)
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))
    .forEach(e => {
      const month = e.paymentDate.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + e.amount;
    });

  let cumulative = 0;
  return Object.entries(byMonth).map(([month, amount]) => {
    cumulative += amount;
    return { month, spent: cumulative, remaining: budget - cumulative };
  });
}

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

  const classes = classCRUD.getAll();
  const publishedClasses = classes.filter(c => c.pipelineStage === 'Published').length;
  const inProduction = classes.filter(c => !['Published', 'Archived', 'Concept / Approved'].includes(c.pipelineStage)).length;

  const alerts = [
    ...overdueTasks.map(t => ({ text: `Overdue: ${t.title}`, type: 'alert' as const })),
    ...(tasks.filter(t => t.status === 'Blocked').map(t => ({ text: `Blocked: ${t.title}`, type: 'warn' as const }))),
  ];

  const burndownData = buildBurndownData();

  // Weekly digest
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekCompleted = tasks.filter(
    t => t.status === 'Complete' && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo
  ).length;
  const thisWeekCreated = tasks.filter(
    t => t.createdAt && new Date(t.createdAt) >= oneWeekAgo
  ).length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Classes Live" value={publishedClasses} icon={Film} />
        <KPICard label="In Production" value={inProduction} icon={Clapperboard} />
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

      {/* Weekly Digest */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 nc-shadow-card">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tasks Created This Week</p>
          <p className="text-2xl font-bold text-foreground mt-1">{thisWeekCreated}</p>
        </div>
        <div className="bg-card rounded-lg p-4 nc-shadow-card">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tasks Completed This Week</p>
          <p className="text-2xl font-bold text-foreground mt-1">{thisWeekCompleted}</p>
        </div>
        <div className="bg-card rounded-lg p-4 nc-shadow-card">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Blocked Items</p>
          <p className="text-2xl font-bold text-foreground mt-1">{tasks.filter(t => t.status === 'Blocked').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 nc-shadow-card">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Completion Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {tasks.length > 0 ? Math.round(tasks.filter(t => t.status === 'Complete').length / tasks.length * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Agenda */}
        <div className="lg:col-span-2 bg-card rounded-lg nc-shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Today's Agenda
            </h3>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
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
            <AlertTriangle className="w-4 h-4 text-accent" />
            Alerts
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts — everything on track.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 8).map((alert, i) => (
                <li key={i} className={cn(
                  'text-xs px-3 py-2 rounded-md font-medium',
                  alert.type === 'alert' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'
                )}>
                  {alert.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Budget Burn-down Chart */}
      {burndownData.length > 0 && (
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent" />
              Budget Burn-down
            </h3>
            <Link to="/budget">
              <Button variant="ghost" size="sm" className="text-xs">
                View budget <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => [`£${value.toLocaleString()}`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="remaining" stroke="hsl(38, 62%, 45%)" fill="hsl(38, 62%, 45%)" fillOpacity={0.15} name="Remaining" />
                <Area type="monotone" dataKey="spent" stroke="hsl(0, 67%, 35%)" fill="hsl(0, 67%, 35%)" fillOpacity={0.1} name="Spent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Tasks</h3>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet. Click the gold + button to create your first task.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left pb-2 font-medium">Task</th>
                    <th className="text-left pb-2 font-medium">Status</th>
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
                      <td className="text-muted-foreground text-xs">{task.dueDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Recent Activity
          </h3>
          <ActivityFeed limit={10} />
        </div>
      </div>
    </div>
  );
}
