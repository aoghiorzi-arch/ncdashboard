import { useState, useEffect } from 'react';
import { getTasks, saveTasks, type Task } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Link2, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Dependencies stored as a separate localStorage key
export interface TaskDependency {
  blockerId: string;
  blockedId: string;
}

function getDependencies(): TaskDependency[] {
  try { return JSON.parse(localStorage.getItem('nc_task_deps') || '[]'); }
  catch { return []; }
}

function saveDependencies(deps: TaskDependency[]) {
  localStorage.setItem('nc_task_deps', JSON.stringify(deps));
  window.dispatchEvent(new Event('nc-data-change'));
}

export function useTaskDependencies() {
  const [deps, setDeps] = useState<TaskDependency[]>(getDependencies);

  useEffect(() => {
    const refresh = () => setDeps(getDependencies());
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const addDep = (blockerId: string, blockedId: string) => {
    if (blockerId === blockedId) return;
    const current = getDependencies();
    if (current.some(d => d.blockerId === blockerId && d.blockedId === blockedId)) return;
    saveDependencies([...current, { blockerId, blockedId }]);
  };

  const removeDep = (blockerId: string, blockedId: string) => {
    saveDependencies(getDependencies().filter(d => !(d.blockerId === blockerId && d.blockedId === blockedId)));
  };

  const getBlockers = (taskId: string) => deps.filter(d => d.blockedId === taskId).map(d => d.blockerId);
  const getBlocking = (taskId: string) => deps.filter(d => d.blockerId === taskId).map(d => d.blockedId);

  return { deps, addDep, removeDep, getBlockers, getBlocking };
}

// Inline component to show/edit dependencies for a task
export function TaskDependencyEditor({ taskId, tasks }: { taskId: string; tasks: Task[] }) {
  const { deps, addDep, removeDep, getBlockers, getBlocking } = useTaskDependencies();
  const [addingBlocker, setAddingBlocker] = useState(false);
  const [addingBlocking, setAddingBlocking] = useState(false);

  const blockers = getBlockers(taskId);
  const blocking = getBlocking(taskId);
  const currentTask = tasks.find(t => t.id === taskId);

  const availableForBlocker = tasks.filter(t => t.id !== taskId && !blockers.includes(t.id));
  const availableForBlocking = tasks.filter(t => t.id !== taskId && !blocking.includes(t.id));

  const unresolvedBlockers = blockers.filter(bid => {
    const t = tasks.find(tt => tt.id === bid);
    return t && t.status !== 'Complete';
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Dependencies</span>
        {unresolvedBlockers.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-nc-warn">
            <AlertTriangle className="w-3 h-3" /> {unresolvedBlockers.length} unresolved
          </span>
        )}
      </div>

      {/* Blocked by */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Blocked by</p>
        {blockers.length === 0 && !addingBlocker && (
          <p className="text-[10px] text-muted-foreground italic">No blockers</p>
        )}
        <div className="space-y-1">
          {blockers.map(bid => {
            const t = tasks.find(tt => tt.id === bid);
            if (!t) return null;
            const resolved = t.status === 'Complete';
            return (
              <div key={bid} className={cn(
                'flex items-center justify-between text-xs px-2 py-1.5 rounded border',
                resolved ? 'bg-nc-success/5 border-nc-success/20' : 'bg-nc-warn/5 border-nc-warn/20'
              )}>
                <span className={cn('truncate', resolved && 'line-through text-muted-foreground')}>{t.title}</span>
                <button onClick={() => removeDep(bid, taskId)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {addingBlocker ? (
            <Select onValueChange={v => { addDep(v, taskId); setAddingBlocker(false); }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select blocker..." /></SelectTrigger>
              <SelectContent>{availableForBlocker.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setAddingBlocker(true)}>+ Add blocker</Button>
          )}
        </div>
      </div>

      {/* Blocking */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Blocking</p>
        {blocking.length === 0 && !addingBlocking && (
          <p className="text-[10px] text-muted-foreground italic">Not blocking anything</p>
        )}
        <div className="space-y-1">
          {blocking.map(bid => {
            const t = tasks.find(tt => tt.id === bid);
            if (!t) return null;
            return (
              <div key={bid} className="flex items-center justify-between text-xs px-2 py-1.5 rounded border border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{t.title}</span>
                </div>
                <button onClick={() => removeDep(taskId, bid)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {addingBlocking ? (
            <Select onValueChange={v => { addDep(taskId, v); setAddingBlocking(false); }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select task..." /></SelectTrigger>
              <SelectContent>{availableForBlocking.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setAddingBlocking(true)}>+ Add blocking</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Badge for Kanban cards
export function DependencyBadge({ taskId, tasks }: { taskId: string; tasks: Task[] }) {
  const deps = getDependencies();
  const blockers = deps.filter(d => d.blockedId === taskId);
  const unresolvedCount = blockers.filter(d => {
    const t = tasks.find(tt => tt.id === d.blockerId);
    return t && t.status !== 'Complete';
  }).length;

  if (unresolvedCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-nc-warn/10 text-nc-warn font-medium">
      <Link2 className="w-2.5 h-2.5" /> {unresolvedCount} blocker{unresolvedCount > 1 ? 's' : ''}
    </span>
  );
}
