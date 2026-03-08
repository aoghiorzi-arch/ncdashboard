import { useMemo } from 'react';
import { getTasks, getExpenses, getSettings, classCRUD, complianceCRUD, eventCRUD, partnershipCRUD } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  Shield, TrendingUp, Film, CheckCircle2, Clock, AlertTriangle,
  CalendarDays, Users, DollarSign, Target, Milestone as MilestoneIcon,
} from 'lucide-react';

const BRAND_GRADIENT = 'bg-gradient-to-br from-primary to-primary/80';

function PortalKPI({ icon: Icon, label, value, subtext, accent }: {
  icon: typeof Shield; label: string; value: string; subtext?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl p-5 text-center transition-all',
      accent ? `${BRAND_GRADIENT} text-primary-foreground` : 'bg-card border border-border nc-shadow-card'
    )}>
      <Icon className={cn('w-6 h-6 mx-auto mb-2', accent ? 'text-primary-foreground/80' : 'text-accent')} />
      <div className={cn('text-2xl font-bold', accent ? '' : 'text-foreground')}>{value}</div>
      <div className={cn('text-xs mt-1', accent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{label}</div>
      {subtext && <div className={cn('text-[10px] mt-1', accent ? 'text-primary-foreground/50' : 'text-muted-foreground')}>{subtext}</div>}
    </div>
  );
}

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-foreground w-28 truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function StakeholderPortal() {
  const data = useMemo(() => {
    const tasks = getTasks();
    const expenses = getExpenses();
    const settings = getSettings();
    const classes = classCRUD.getAll();
    const compliance = complianceCRUD.getAll();
    const events = eventCRUD.getAll();
    const partnerships = partnershipCRUD.getAll();
    const now = new Date();
    const launchDate = new Date(settings.launchDate);
    const daysToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Complete').length;
    const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Budget
    const totalSpent = expenses.filter(e => e.status === 'Paid' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
    const remaining = settings.totalBudget - totalSpent;
    const budgetPct = settings.totalBudget > 0 ? Math.round((totalSpent / settings.totalBudget) * 100) : 0;

    // Classes
    const classesLive = classes.filter(c => c.pipelineStage === 'Live').length;
    const classesInProd = classes.filter(c => !['Live', 'Concept'].includes(c.pipelineStage || '')).length;

    // Health score
    const openTasks = tasks.filter(t => t.status !== 'Complete');
    const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const taskHealth = Math.max(0, 100 - Math.min(100, overdue * 15 + blocked * 10));
    const budgetHealth = Math.max(0, Math.min(100, Math.round((remaining / Math.max(1, settings.totalBudget)) * 100)));
    const complianceHealth = compliance.length === 0 ? 100 : Math.max(0, 100 - compliance.filter(c => c.status === 'Action Required').length * 20);
    const overallHealth = Math.round((taskHealth + budgetHealth + complianceHealth) / 3);

    // Pipeline stages
    const stageOrder = ['Concept', 'Contracted', 'Pre-production', 'Filming', 'Post-production', 'QA', 'Final QA', 'Live'];
    const pipeline = stageOrder.map(stage => ({
      stage,
      count: classes.filter(c => c.pipelineStage === stage).length,
    })).filter(s => s.count > 0);

    // Key milestones (upcoming events + tasks with milestones)
    const upcomingEvents = events
      .filter(e => e.status !== 'Cancelled' && e.status !== 'Complete' && e.date >= now.toISOString().split('T')[0])
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    // Active partnerships
    const activePartners = partnerships.filter(p => p.status === 'Active' || p.status === 'Agreed').length;

    return {
      settings, daysToLaunch, taskPct, completedTasks, totalTasks,
      totalSpent, remaining, budgetPct, classesLive, classesInProd,
      overallHealth, taskHealth, budgetHealth, complianceHealth,
      pipeline, upcomingEvents, activePartners, classes: classes.length,
    };
  }, []);

  const healthColor = data.overallHealth >= 70 ? 'text-nc-success' : data.overallHealth >= 40 ? 'text-nc-warn' : 'text-destructive';
  const healthBg = data.overallHealth >= 70 ? 'bg-nc-success' : data.overallHealth >= 40 ? 'bg-nc-warn' : 'bg-destructive';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className={cn(BRAND_GRADIENT, 'text-primary-foreground py-10 px-6')}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">{data.settings.platformName}</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            Stakeholder Progress Report · Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6 space-y-8 pb-12">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <PortalKPI icon={Target} label="Project Health" value={`${data.overallHealth}/100`} accent />
          <PortalKPI icon={Clock} label="Days to Launch" value={`${data.daysToLaunch}`} subtext={new Date(data.settings.launchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />
          <PortalKPI icon={CheckCircle2} label="Tasks Complete" value={`${data.taskPct}%`} subtext={`${data.completedTasks} of ${data.totalTasks}`} />
          <PortalKPI icon={Film} label="Classes Live" value={`${data.classesLive}`} subtext={`${data.classesInProd} in production`} />
          <PortalKPI icon={DollarSign} label="Budget Used" value={`${data.budgetPct}%`} subtext={`£${Math.round(data.remaining).toLocaleString()} remaining`} />
        </div>

        {/* Health Breakdown + Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health */}
          <div className="bg-card rounded-xl nc-shadow-card p-6 border border-border">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Health Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className={cn('w-24 h-24 rounded-full flex items-center justify-center border-4', healthBg + '/10', healthColor.replace('text-', 'border-'))}>
                  <span className={cn('text-3xl font-bold', healthColor)}>{data.overallHealth}</span>
                </div>
              </div>
              <ProgressBar label="Tasks" pct={data.taskHealth} color={data.taskHealth >= 70 ? 'bg-nc-success' : data.taskHealth >= 40 ? 'bg-nc-warn' : 'bg-destructive'} />
              <ProgressBar label="Budget" pct={data.budgetHealth} color={data.budgetHealth >= 70 ? 'bg-nc-success' : data.budgetHealth >= 40 ? 'bg-nc-warn' : 'bg-destructive'} />
              <ProgressBar label="Compliance" pct={data.complianceHealth} color={data.complianceHealth >= 70 ? 'bg-nc-success' : data.complianceHealth >= 40 ? 'bg-nc-warn' : 'bg-destructive'} />
            </div>
          </div>

          {/* Class Pipeline */}
          <div className="bg-card rounded-xl nc-shadow-card p-6 border border-border">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" /> Content Pipeline
            </h2>
            {data.pipeline.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No classes in pipeline yet</p>
            ) : (
              <div className="space-y-3">
                {data.pipeline.map(p => {
                  const maxCount = Math.max(...data.pipeline.map(x => x.count));
                  const pct = maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0;
                  return (
                    <div key={p.stage} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground w-28 truncate">{p.stage}</span>
                      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className="h-full bg-accent/70 rounded-md transition-all duration-500 flex items-center px-2"
                          style={{ width: `${Math.max(15, pct)}%` }}
                        >
                          <span className="text-[10px] font-bold text-accent-foreground">{p.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">{data.classes}</div>
                <div className="text-[10px] text-muted-foreground">Total Classes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-nc-success">{data.classesLive}</div>
                <div className="text-[10px] text-muted-foreground">Live</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events + Partnerships */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl nc-shadow-card p-6 border border-border">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" /> Upcoming Events
            </h2>
            {data.upcomingEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingEvents.map(e => (
                  <div key={e.id} className="flex items-center gap-3 text-xs">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-accent font-medium">{new Date(e.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-accent">{new Date(e.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{e.title}</p>
                      <p className="text-muted-foreground">{e.venue} · {e.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl nc-shadow-card p-6 border border-border">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Partnership Summary
            </h2>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">{data.activePartners}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Partnerships</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <div className="font-bold text-foreground">{data.taskPct}%</div>
                  <div className="text-muted-foreground">Overall Progress</div>
                </div>
                <div>
                  <div className="font-bold text-foreground">{data.daysToLaunch}d</div>
                  <div className="text-muted-foreground">Until Launch</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground">
            {data.settings.platformName} · Confidential Stakeholder Report · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
