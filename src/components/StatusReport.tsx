import { useMemo } from 'react';
import { getTasks, getExpenses, getSettings, classCRUD, complianceCRUD } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { FileText, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';

export function StatusReport() {
  const report = useMemo(() => {
    const tasks = getTasks();
    const expenses = getExpenses();
    const settings = getSettings();
    const classes = classCRUD.getAll();
    const compliance = complianceCRUD.getAll();
    const now = new Date();

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const completedThisWeek = tasks.filter(t => t.status === 'Complete' && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo).length;
    const createdThisWeek = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= oneWeekAgo).length;
    const overdue = tasks.filter(t => t.status !== 'Complete' && t.dueDate && new Date(t.dueDate) < now);
    const blocked = tasks.filter(t => t.status === 'Blocked');
    const upcomingDeadlines = tasks
      .filter(t => t.status !== 'Complete' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= nextWeek)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const totalSpent = expenses.filter(e => e.status === 'Paid' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
    const budgetRemaining = settings.totalBudget - totalSpent;
    const budgetPct = settings.totalBudget > 0 ? Math.round((budgetRemaining / settings.totalBudget) * 100) : 100;

    const daysToLaunch = Math.ceil((new Date(settings.launchDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((tasks.filter(t => t.status === 'Complete').length / totalTasks) * 100) : 0;

    const classesInProduction = classes.filter(c => !['Published', 'Archived', 'Concept / Approved'].includes(c.pipelineStage)).length;
    const complianceIssues = compliance.filter(c => c.status === 'Action Required').length;

    const risks: string[] = [];
    if (overdue.length > 3) risks.push(`${overdue.length} overdue tasks need attention`);
    if (blocked.length > 0) risks.push(`${blocked.length} blocked task${blocked.length > 1 ? 's' : ''} requiring resolution`);
    if (budgetPct < 20) risks.push(`Budget nearly exhausted (${budgetPct}% remaining)`);
    if (complianceIssues > 0) risks.push(`${complianceIssues} compliance items need action`);
    if (daysToLaunch < 30 && completionRate < 50) risks.push(`Launch in ${daysToLaunch}d but only ${completionRate}% tasks complete`);

    return {
      completedThisWeek, createdThisWeek, overdue, blocked, upcomingDeadlines,
      budgetRemaining, budgetPct, daysToLaunch, completionRate, classesInProduction,
      risks, totalTasks,
    };
  }, []);

  const weekDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-card rounded-lg nc-shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          Weekly Status Report
        </h3>
        <span className="text-[10px] text-muted-foreground">Week of {weekDate}</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Tasks Done', value: report.completedThisWeek, icon: '✅' },
          { label: 'New Tasks', value: report.createdThisWeek, icon: '📝' },
          { label: 'Completion', value: `${report.completionRate}%`, icon: '📊' },
          { label: 'Days to Launch', value: report.daysToLaunch, icon: '🚀' },
        ].map(s => (
          <div key={s.label} className="bg-muted/50 rounded-md p-2.5 text-center">
            <span className="text-sm">{s.icon}</span>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Risks */}
      {report.risks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-nc-warn" />
            Risks & Blockers
          </h4>
          <ul className="space-y-1">
            {report.risks.map((r, i) => (
              <li key={i} className="text-xs text-nc-warn bg-nc-warn/5 px-3 py-1.5 rounded-md">⚠ {r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {report.upcomingDeadlines.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-accent" />
            Upcoming This Week
          </h4>
          <ul className="space-y-1">
            {report.upcomingDeadlines.slice(0, 5).map(t => (
              <li key={t.id} className="text-xs flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded-md">
                <span className="text-foreground font-medium truncate">{t.title}</span>
                <span className="text-muted-foreground shrink-0 ml-2">{t.dueDate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Metrics */}
      <div className="border-t border-border pt-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          Key Metrics
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Budget Remaining</span><span className={cn('font-medium', report.budgetPct < 20 ? 'text-destructive' : 'text-foreground')}>£{report.budgetRemaining.toLocaleString()} ({report.budgetPct}%)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Classes in Production</span><span className="font-medium text-foreground">{report.classesInProduction}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Overdue Tasks</span><span className={cn('font-medium', report.overdue.length > 0 ? 'text-destructive' : 'text-foreground')}>{report.overdue.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Blocked Tasks</span><span className={cn('font-medium', report.blocked.length > 0 ? 'text-nc-warn' : 'text-foreground')}>{report.blocked.length}</span></div>
        </div>
      </div>
    </div>
  );
}
