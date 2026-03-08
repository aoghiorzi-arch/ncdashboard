import { useMemo } from 'react';
import { getTasks, getExpenses, getSettings, classCRUD, type Task } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, Zap, AlertTriangle,
  Target, Clock, Gauge, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts';

interface Forecast {
  label: string;
  value: string;
  subtext: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon: typeof TrendingUp;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PredictiveAnalytics() {
  const analysis = useMemo(() => {
    const tasks = getTasks();
    const expenses = getExpenses();
    const settings = getSettings();
    const classes = classCRUD.getAll();
    const now = new Date();
    const launchDate = new Date(settings.launchDate);
    const daysToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // --- Velocity Calculation ---
    const completedTasks = tasks.filter(t => t.status === 'Complete');
    const openTasks = tasks.filter(t => t.status !== 'Complete');

    // Calculate weekly velocity from completed tasks
    const fourWeeksAgo = addDays(now, -28);
    const recentlyCompleted = completedTasks.filter(t => new Date(t.updatedAt) >= fourWeeksAgo);
    const weeklyVelocity = recentlyCompleted.length / 4;

    // Projected completion date
    const weeksToComplete = weeklyVelocity > 0 ? openTasks.length / weeklyVelocity : Infinity;
    const projectedCompletionDate = weeklyVelocity > 0 ? addDays(now, weeksToComplete * 7) : null;
    const onTrack = projectedCompletionDate ? projectedCompletionDate <= launchDate : false;

    // --- Budget Runway ---
    const totalSpent = expenses.filter(e => e.status === 'Paid' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
    const remaining = settings.totalBudget - totalSpent;

    // Monthly burn rate (last 3 months average)
    const threeMonthsAgo = addDays(now, -90);
    const recentExpenses = expenses.filter(e =>
      (e.status === 'Paid' || e.status === 'Approved') && new Date(e.paymentDate || e.createdAt) >= threeMonthsAgo
    );
    const monthlyBurn = recentExpenses.reduce((s, e) => s + e.amount, 0) / 3;
    const runwayMonths = monthlyBurn > 0 ? remaining / monthlyBurn : Infinity;
    const runwayDate = monthlyBurn > 0 ? addDays(now, runwayMonths * 30) : null;
    const budgetSufficient = runwayDate ? runwayDate >= launchDate : remaining > 0;

    // --- Velocity Trend Data (8 weeks) ---
    const velocityData: { week: string; completed: number; target: number }[] = [];
    const targetPerWeek = openTasks.length > 0 && daysToLaunch > 0
      ? (openTasks.length + completedTasks.length) / (daysToLaunch / 7 + 4)
      : 0;

    for (let w = 7; w >= 0; w--) {
      const weekStart = addDays(now, -(w + 1) * 7);
      const weekEnd = addDays(now, -w * 7);
      const count = completedTasks.filter(t => {
        const d = new Date(t.updatedAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      velocityData.push({
        week: `W-${w}`,
        completed: count,
        target: Math.round(targetPerWeek * 10) / 10,
      });
    }

    // --- Budget Projection Data ---
    const budgetData: { month: string; actual: number | null; projected: number | null; budget: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Past 3 months + next 3 months
    let cumulativeSpent = 0;
    for (let m = -3; m <= 3; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + m + 1, 0);
      const monthLabel = monthNames[monthDate.getMonth()];

      if (m <= 0) {
        const monthExpenses = expenses
          .filter(e => (e.status === 'Paid' || e.status === 'Approved'))
          .filter(e => {
            const d = new Date(e.paymentDate || e.createdAt);
            return d >= monthDate && d <= monthEnd;
          })
          .reduce((s, e) => s + e.amount, 0);
        cumulativeSpent += monthExpenses;
        budgetData.push({ month: monthLabel, actual: cumulativeSpent, projected: null, budget: settings.totalBudget });
      } else {
        const projectedCumulative = totalSpent + monthlyBurn * m;
        budgetData.push({ month: monthLabel, actual: null, projected: projectedCumulative, budget: settings.totalBudget });
      }
    }

    // --- Completion Rate by Module ---
    const moduleStats: Record<string, { total: number; done: number }> = {};
    tasks.forEach(t => {
      if (!moduleStats[t.moduleTag]) moduleStats[t.moduleTag] = { total: 0, done: 0 };
      moduleStats[t.moduleTag].total++;
      if (t.status === 'Complete') moduleStats[t.moduleTag].done++;
    });

    // --- Early Warning Alerts ---
    const alerts: { severity: 'critical' | 'warning' | 'info'; message: string }[] = [];

    if (!onTrack && projectedCompletionDate) {
      const daysLate = Math.ceil((projectedCompletionDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({ severity: 'critical', message: `At current velocity, you'll miss launch by ${daysLate} days` });
    }
    if (!budgetSufficient && runwayDate) {
      alerts.push({ severity: 'critical', message: `Budget runs out ${formatDate(runwayDate)} — before launch` });
    }
    if (monthlyBurn > settings.totalBudget * 0.25) {
      alerts.push({ severity: 'warning', message: `Monthly burn rate (£${Math.round(monthlyBurn).toLocaleString()}) exceeds 25% of total budget` });
    }
    const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
    if (blockedCount > 0) {
      alerts.push({ severity: 'warning', message: `${blockedCount} task${blockedCount > 1 ? 's' : ''} currently blocked` });
    }
    const overdueCount = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length;
    if (overdueCount > 2) {
      alerts.push({ severity: 'warning', message: `${overdueCount} overdue tasks accumulating` });
    }
    if (weeklyVelocity === 0 && openTasks.length > 0) {
      alerts.push({ severity: 'warning', message: 'No tasks completed in the last 4 weeks' });
    }
    const classesLive = classes.filter(c => c.pipelineStage === 'Live').length;
    if (classesLive === 0 && daysToLaunch < 60) {
      alerts.push({ severity: 'info', message: 'No classes live yet — less than 60 days to launch' });
    }

    // --- Forecasts ---
    const forecasts: Forecast[] = [
      {
        label: 'Projected Completion',
        value: projectedCompletionDate ? formatDate(projectedCompletionDate) : 'N/A',
        subtext: onTrack ? `${Math.round(weeksToComplete)} weeks — on track` : projectedCompletionDate ? `${Math.round(weeksToComplete)} weeks — behind schedule` : 'No velocity data',
        trend: onTrack ? 'positive' : weeklyVelocity === 0 ? 'neutral' : 'negative',
        icon: Target,
      },
      {
        label: 'Budget Runway',
        value: runwayMonths === Infinity ? '∞' : `${Math.round(runwayMonths * 10) / 10} months`,
        subtext: budgetSufficient ? `£${Math.round(remaining).toLocaleString()} remaining` : `Depletes ${runwayDate ? formatDate(runwayDate) : 'soon'}`,
        trend: budgetSufficient ? 'positive' : 'negative',
        icon: DollarSign,
      },
      {
        label: 'Weekly Velocity',
        value: `${Math.round(weeklyVelocity * 10) / 10} tasks/wk`,
        subtext: `Need ${Math.round(targetPerWeek * 10) / 10}/wk to hit launch`,
        trend: weeklyVelocity >= targetPerWeek ? 'positive' : weeklyVelocity > 0 ? 'neutral' : 'negative',
        icon: Zap,
      },
      {
        label: 'Completion Rate',
        value: `${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%`,
        subtext: `${completedTasks.length} of ${tasks.length} tasks done`,
        trend: tasks.length > 0 && completedTasks.length / tasks.length > 0.5 ? 'positive' : 'neutral',
        icon: Gauge,
      },
    ];

    return { forecasts, velocityData, budgetData, moduleStats, alerts, daysToLaunch, weeklyVelocity };
  }, []);

  const trendColor = {
    positive: 'text-nc-success',
    negative: 'text-destructive',
    neutral: 'text-nc-warn',
  };

  const trendBg = {
    positive: 'bg-nc-success/10 border-nc-success/20',
    negative: 'bg-destructive/10 border-destructive/20',
    neutral: 'bg-nc-warn/10 border-nc-warn/20',
  };

  const trendIcon = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Clock,
  };

  return (
    <div className="space-y-6">
      {/* Early Warning Alerts */}
      {analysis.alerts.length > 0 && (
        <div className="space-y-2">
          {analysis.alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm',
                alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                alert.severity === 'warning' ? 'bg-nc-warn/10 border-nc-warn/20 text-nc-warn' :
                'bg-accent/10 border-accent/20 text-accent-foreground'
              )}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysis.forecasts.map(f => {
          const TrendIconComp = trendIcon[f.trend];
          const ForecastIcon = f.icon;
          return (
            <div key={f.label} className={cn('bg-card rounded-lg nc-shadow-card p-5 border', trendBg[f.trend])}>
              <div className="flex items-center justify-between mb-3">
                <ForecastIcon className={cn('w-5 h-5', trendColor[f.trend])} />
                <TrendIconComp className={cn('w-4 h-4', trendColor[f.trend])} />
              </div>
              <div className={cn('text-xl font-bold', trendColor[f.trend])}>{f.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.label}</div>
              <div className="text-[10px] text-muted-foreground mt-2">{f.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Task Velocity (8 weeks)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analysis.velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} name="Completed" />
              <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Projection Chart */}
        <div className="bg-card rounded-lg nc-shadow-card p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Budget Projection</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analysis.budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`£${Math.round(value).toLocaleString()}`, '']}
              />
              <ReferenceLine y={analysis.budgetData[0]?.budget || 0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Budget', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" strokeWidth={2} name="Actual Spend" />
              <Area type="monotone" dataKey="projected" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" strokeDasharray="5 5" strokeWidth={1.5} name="Projected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module Completion Breakdown */}
      <div className="bg-card rounded-lg nc-shadow-card p-5">
        <h3 className="font-semibold text-foreground text-sm mb-4">Completion by Module</h3>
        <div className="space-y-3">
          {Object.entries(analysis.moduleStats).map(([mod, stat]) => {
            const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
            return (
              <div key={mod} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-24 truncate">{mod}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      pct >= 70 ? 'bg-nc-success' : pct >= 40 ? 'bg-nc-warn' : 'bg-destructive'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{stat.done}/{stat.total} ({pct}%)</span>
              </div>
            );
          })}
          {Object.keys(analysis.moduleStats).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks yet — add tasks to see module breakdown</p>
          )}
        </div>
      </div>
    </div>
  );
}
