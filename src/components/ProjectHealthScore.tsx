import { useMemo } from 'react';
import { getTasks, getExpenses, getSettings, complianceCRUD } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

type HealthLevel = 'green' | 'amber' | 'red';

interface HealthFactor {
  label: string;
  score: number; // 0-100
  level: HealthLevel;
  detail: string;
}

function getLevel(score: number): HealthLevel {
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'red';
}

const levelStyles: Record<HealthLevel, string> = {
  green: 'text-nc-success bg-nc-success/10 border-nc-success/30',
  amber: 'text-nc-warn bg-nc-warn/10 border-nc-warn/30',
  red: 'text-destructive bg-destructive/10 border-destructive/30',
};

const levelIcon: Record<HealthLevel, typeof ShieldCheck> = {
  green: ShieldCheck,
  amber: AlertTriangle,
  red: XCircle,
};

export function ProjectHealthScore() {
  const factors = useMemo<HealthFactor[]>(() => {
    const tasks = getTasks();
    const expenses = getExpenses();
    const settings = getSettings();
    const compliance = complianceCRUD.getAll();

    // 1. Task Health: penalize overdue & blocked
    const openTasks = tasks.filter(t => t.status !== 'Complete');
    const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const taskPenalty = Math.min(100, (overdue * 15) + (blocked * 10));
    const taskScore = Math.max(0, 100 - taskPenalty);

    // 2. Budget Health: remaining ratio
    const totalSpent = expenses
      .filter(e => e.status === 'Paid' || e.status === 'Approved')
      .reduce((s, e) => s + e.amount, 0);
    const budgetRatio = settings.totalBudget > 0 ? (settings.totalBudget - totalSpent) / settings.totalBudget : 1;
    const budgetScore = Math.max(0, Math.min(100, Math.round(budgetRatio * 100)));

    // 3. Schedule Health: days to launch
    const daysToLaunch = Math.ceil((new Date(settings.launchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const completionRate = tasks.length > 0 ? tasks.filter(t => t.status === 'Complete').length / tasks.length : 1;
    const scheduleScore = daysToLaunch <= 0 ? 20 : daysToLaunch < 14 ? (completionRate > 0.7 ? 60 : 30) : daysToLaunch < 30 ? (completionRate > 0.5 ? 70 : 50) : 90;

    // 4. Compliance Health
    const actionRequired = compliance.filter(c => c.status === 'Action Required').length;
    const complianceScore = compliance.length === 0 ? 100 : Math.max(0, 100 - (actionRequired * 20));

    return [
      { label: 'Tasks', score: taskScore, level: getLevel(taskScore), detail: `${overdue} overdue, ${blocked} blocked` },
      { label: 'Budget', score: budgetScore, level: getLevel(budgetScore), detail: `${Math.round(budgetRatio * 100)}% remaining` },
      { label: 'Schedule', score: scheduleScore, level: getLevel(scheduleScore), detail: `${daysToLaunch}d to launch, ${Math.round(completionRate * 100)}% done` },
      { label: 'Compliance', score: complianceScore, level: getLevel(complianceScore), detail: `${actionRequired} actions needed` },
    ];
  }, []);

  const overallScore = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const overallLevel = getLevel(overallScore);
  const OverallIcon = levelIcon[overallLevel];

  return (
    <div className="bg-card rounded-lg nc-shadow-card p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center border-2', levelStyles[overallLevel])}>
          <OverallIcon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Project Health</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-2xl font-bold', overallLevel === 'green' ? 'text-nc-success' : overallLevel === 'amber' ? 'text-nc-warn' : 'text-destructive')}>
              {overallScore}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {factors.map(f => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground w-20">{f.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500',
                  f.level === 'green' ? 'bg-nc-success' : f.level === 'amber' ? 'bg-nc-warn' : 'bg-destructive'
                )}
                style={{ width: `${f.score}%` }}
              />
            </div>
            <span className={cn('text-[10px] font-medium w-8 text-right',
              f.level === 'green' ? 'text-nc-success' : f.level === 'amber' ? 'text-nc-warn' : 'text-destructive'
            )}>{f.score}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1">
        {factors.filter(f => f.level !== 'green').map(f => (
          <p key={f.label} className={cn('text-[10px]', f.level === 'red' ? 'text-destructive' : 'text-nc-warn')}>
            ⚠ {f.label}: {f.detail}
          </p>
        ))}
      </div>
    </div>
  );
}
