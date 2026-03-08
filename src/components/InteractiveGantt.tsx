import { useMemo, useState, useRef, useCallback } from 'react';
import { differenceInDays, format, startOfDay, addDays, max as maxDate, min as minDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, AlertTriangle, Milestone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTasks, saveTasks, getSettings, type Task } from '@/lib/storage';
import { useTaskDependencies } from './TaskDependencies';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-muted-foreground/60',
  'In Progress': 'bg-accent',
  'Blocked': 'bg-destructive',
  'In Review': 'bg-nc-warn',
  'Complete': 'bg-nc-success',
};

const PRIORITY_BORDER: Record<string, string> = {
  Critical: 'ring-2 ring-destructive/50',
  High: 'ring-2 ring-nc-warn/40',
  Medium: '',
  Low: '',
};

interface InteractiveGanttProps {
  className?: string;
}

// Critical path calculation using longest path algorithm
function computeCriticalPath(tasks: Task[], deps: { blockerId: string; blockedId: string }[]): Set<string> {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();

  tasks.forEach(t => {
    adj.set(t.id, []);
    inDeg.set(t.id, 0);
  });

  deps.forEach(d => {
    if (taskMap.has(d.blockerId) && taskMap.has(d.blockedId)) {
      adj.get(d.blockerId)!.push(d.blockedId);
      inDeg.set(d.blockedId, (inDeg.get(d.blockedId) || 0) + 1);
    }
  });

  // Topological sort + longest path
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  tasks.forEach(t => { dist.set(t.id, 0); prev.set(t.id, null); });

  const queue = tasks.filter(t => (inDeg.get(t.id) || 0) === 0).map(t => t.id);
  const topoOrder: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);
    const task = taskMap.get(u)!;
    const duration = task.dueDate && task.createdAt
      ? Math.max(1, differenceInDays(new Date(task.dueDate), new Date(task.createdAt)))
      : 1;

    for (const v of (adj.get(u) || [])) {
      const newDist = (dist.get(u) || 0) + duration;
      if (newDist > (dist.get(v) || 0)) {
        dist.set(v, newDist);
        prev.set(v, u);
      }
      inDeg.set(v, (inDeg.get(v) || 0) - 1);
      if ((inDeg.get(v) || 0) === 0) queue.push(v);
    }
  }

  // Find the task with maximum distance (end of critical path)
  let maxId = '';
  let maxDist = -1;
  dist.forEach((d, id) => {
    if (d > maxDist) { maxDist = d; maxId = id; }
  });

  // Trace back
  const criticalSet = new Set<string>();
  if (maxDist > 0) {
    let current: string | null = maxId;
    while (current) {
      criticalSet.add(current);
      current = prev.get(current) || null;
    }
  }

  return criticalSet;
}

// Cascade dates when a task is moved
function cascadeDates(
  taskId: string,
  daysDelta: number,
  tasks: Task[],
  deps: { blockerId: string; blockedId: string }[]
): Task[] {
  const updated = [...tasks];
  const taskMap = new Map(updated.map(t => [t.id, t]));
  const visited = new Set<string>();

  function cascade(id: string, delta: number) {
    if (visited.has(id) || delta === 0) return;
    visited.add(id);

    const blocked = deps.filter(d => d.blockerId === id).map(d => d.blockedId);
    for (const bid of blocked) {
      const blocker = taskMap.get(id);
      const blocked = taskMap.get(bid);
      if (!blocker || !blocked || !blocker.dueDate || !blocked.dueDate) continue;

      const blockerEnd = new Date(blocker.dueDate);
      const blockedStart = blocked.createdAt ? new Date(blocked.createdAt) : new Date(blocked.dueDate);

      // If blocked task starts before blocker ends, push it forward
      if (blockedStart <= blockerEnd) {
        const idx = updated.findIndex(t => t.id === bid);
        if (idx !== -1 && updated[idx].dueDate) {
          const oldDue = new Date(updated[idx].dueDate);
          oldDue.setDate(oldDue.getDate() + Math.max(0, delta));
          updated[idx] = { ...updated[idx], dueDate: oldDue.toISOString().split('T')[0], updatedAt: new Date().toISOString() };
          cascade(bid, delta);
        }
      }
    }
  }

  cascade(taskId, daysDelta);
  return updated;
}

export function InteractiveGantt({ className }: InteractiveGanttProps) {
  const [zoom, setZoom] = useState(1);
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());
  const { deps } = useTaskDependencies();
  const settings = getSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; origDate: string } | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  const refreshTasks = useCallback(() => setTasks(getTasks()), []);

  // Filter tasks with due dates for Gantt display
  const ganttTasks = useMemo(() =>
    tasks.filter(t => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks]
  );

  const criticalPath = useMemo(() =>
    showCriticalPath ? computeCriticalPath(ganttTasks, deps) : new Set<string>(),
    [ganttTasks, deps, showCriticalPath]
  );

  const { timelineStart, totalDays, months } = useMemo(() => {
    if (ganttTasks.length === 0) return { timelineStart: new Date(), totalDays: 60, months: [] };

    const allDates = ganttTasks.flatMap(t => {
      const dates = [new Date(t.dueDate)];
      if (t.createdAt) dates.push(new Date(t.createdAt));
      return dates;
    });
    allDates.push(new Date(settings.launchDate));

    const earliest = addDays(startOfDay(minDate(allDates)), -7);
    const latest = addDays(startOfDay(maxDate(allDates)), 14);
    const days = Math.max(differenceInDays(latest, earliest), 30);

    const monthLabels: { label: string; left: number; width: number }[] = [];
    let current = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    while (current <= latest) {
      const monthStart = maxDate([current, earliest]);
      const monthEnd = minDate([new Date(current.getFullYear(), current.getMonth() + 1, 0), latest]);
      const left = differenceInDays(monthStart, earliest) / days * 100;
      const width = (differenceInDays(monthEnd, monthStart) + 1) / days * 100;
      monthLabels.push({ label: format(current, 'MMM yyyy'), left, width });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return { timelineStart: earliest, totalDays: days, months: monthLabels };
  }, [ganttTasks, settings.launchDate]);

  const todayOffset = differenceInDays(startOfDay(new Date()), timelineStart) / totalDays * 100;
  const launchOffset = differenceInDays(new Date(settings.launchDate), timelineStart) / totalDays * 100;
  const chartWidth = Math.max(800, 800 * zoom);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string, dueDate: string) => {
    e.preventDefault();
    setDragging({ id: taskId, startX: e.clientX, origDate: dueDate });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const dx = e.clientX - dragging.startX;
    const containerWidth = containerRef.current.offsetWidth;
    const daysMoved = Math.round((dx / containerWidth) * totalDays);

    if (daysMoved !== 0) {
      const newDate = addDays(new Date(dragging.origDate), daysMoved);
      const newDateStr = newDate.toISOString().split('T')[0];

      setTasks(prev => {
        let updated = prev.map(t =>
          t.id === dragging.id ? { ...t, dueDate: newDateStr, updatedAt: new Date().toISOString() } : t
        );
        // Cascade to dependent tasks
        updated = cascadeDates(dragging.id, daysMoved, updated, deps);
        return updated;
      });

      setDragging(prev => prev ? { ...prev, startX: e.clientX, origDate: newDateStr } : null);
    }
  }, [dragging, totalDays, deps]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      saveTasks(tasks);
      setDragging(null);
    }
  }, [dragging, tasks]);

  // Dependency arrows calculation
  const depLines = useMemo(() => {
    const taskPositions = new Map<string, { left: number; row: number }>();
    ganttTasks.forEach((t, idx) => {
      const dueDate = new Date(t.dueDate);
      const startDate = t.createdAt ? new Date(t.createdAt) : addDays(dueDate, -7);
      const left = differenceInDays(startDate, timelineStart) / totalDays * 100;
      const right = differenceInDays(dueDate, timelineStart) / totalDays * 100;
      taskPositions.set(t.id, { left: right, row: idx });
    });

    return deps
      .filter(d => taskPositions.has(d.blockerId) && taskPositions.has(d.blockedId))
      .map(d => {
        const from = taskPositions.get(d.blockerId)!;
        const to = taskPositions.get(d.blockedId)!;
        return { fromX: from.left, fromY: from.row, toX: to.left, toY: to.row, key: `${d.blockerId}-${d.blockedId}` };
      });
  }, [ganttTasks, deps, timelineStart, totalDays]);

  if (ganttTasks.length === 0) {
    return (
      <div className="bg-card rounded-lg nc-shadow-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No tasks with due dates. Add due dates to tasks to see them on the Gantt chart.</p>
      </div>
    );
  }

  const rowHeight = 40;
  const headerHeight = 32;

  return (
    <div className={cn('bg-card rounded-lg nc-shadow-card', className)}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">{ganttTasks.length} tasks</span>
          <Button
            variant={showCriticalPath ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowCriticalPath(!showCriticalPath)}
          >
            <Milestone className="w-3 h-3" />
            Critical Path
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div
        className="overflow-x-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ minWidth: `${chartWidth}px` }} className="p-4 pt-1">
          {/* Month headers */}
          <div className="relative h-7 mb-1 border-b border-border/50">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute text-[10px] font-medium text-muted-foreground truncate px-1"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Gantt body */}
          <div
            ref={containerRef}
            className="relative"
            style={{ height: `${ganttTasks.length * rowHeight + 8}px` }}
          >
            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-destructive/60 z-20"
                style={{ left: `${todayOffset}%` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 text-[8px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                  Today
                </div>
              </div>
            )}

            {/* Launch line */}
            {launchOffset >= 0 && launchOffset <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-nc-success/60 z-20"
                style={{ left: `${launchOffset}%` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 text-[8px] font-semibold text-nc-success bg-nc-success/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                  🚀 Launch
                </div>
              </div>
            )}

            {/* Dependency arrows (SVG overlay) */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                </marker>
                <marker id="arrowhead-critical" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--destructive))" opacity="0.7" />
                </marker>
              </defs>
              {depLines.map(line => {
                const isCritical = criticalPath.has(line.key.split('-')[0]) && criticalPath.has(line.key.split('-')[1]);
                const x1 = `${line.fromX}%`;
                const y1 = line.fromY * rowHeight + rowHeight / 2;
                const x2 = `${line.toX - 1}%`;
                const y2 = line.toY * rowHeight + rowHeight / 2;

                return (
                  <line
                    key={line.key}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                    strokeWidth={isCritical ? 2 : 1}
                    strokeDasharray={isCritical ? '' : '4 3'}
                    opacity={isCritical ? 0.7 : 0.4}
                    markerEnd={isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                  />
                );
              })}
            </svg>

            {/* Task rows */}
            {ganttTasks.map((task, idx) => {
              const dueDate = new Date(task.dueDate);
              const startDate = task.createdAt ? new Date(task.createdAt) : addDays(dueDate, -7);
              const left = Math.max(0, differenceInDays(startDate, timelineStart) / totalDays * 100);
              const right = differenceInDays(dueDate, timelineStart) / totalDays * 100;
              const width = Math.max(1, right - left);
              const isOverdue = dueDate < new Date() && task.status !== 'Complete';
              const isCritical = criticalPath.has(task.id);
              const isDraggingThis = dragging?.id === task.id;

              // Completion based on subtasks
              const progress = task.subtasks.length > 0
                ? Math.round(task.subtasks.filter(s => s.done).length / task.subtasks.length * 100)
                : task.status === 'Complete' ? 100 : 0;

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center gap-2 w-full"
                  style={{ top: `${idx * rowHeight}px`, height: `${rowHeight}px` }}
                >
                  {/* Task label */}
                  <div className="w-36 shrink-0 truncate text-xs font-medium text-foreground pl-1 flex items-center gap-1.5" title={task.title}>
                    {isCritical && showCriticalPath && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={cn(isCritical && showCriticalPath && 'text-destructive font-semibold')}>
                      {task.title}
                    </span>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative h-7">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'absolute h-full rounded-md cursor-grab active:cursor-grabbing transition-shadow',
                            STATUS_COLORS[task.status] || 'bg-accent',
                            PRIORITY_BORDER[task.priority],
                            isCritical && showCriticalPath && 'ring-2 ring-destructive/60',
                            isOverdue && 'animate-pulse',
                            isDraggingThis && 'shadow-lg scale-[1.02]',
                          )}
                          style={{ left: `${left}%`, width: `${width}%`, minWidth: '12px' }}
                          onMouseDown={(e) => handleMouseDown(e, task.id, task.dueDate)}
                        >
                          {/* Progress fill */}
                          {progress > 0 && (
                            <div
                              className="absolute inset-0 bg-foreground/15 rounded-md"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                          <span className="relative z-10 text-[9px] font-medium text-accent-foreground px-1.5 truncate block leading-7">
                            {task.status === 'Complete' ? '✓' : `${progress > 0 ? progress + '%' : ''}`}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-xs">
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(task.dueDate), 'dd MMM yyyy')} · {task.status} · {task.priority}
                        </p>
                        {isOverdue && <p className="text-destructive">⚠ Overdue</p>}
                        {isCritical && <p className="text-destructive">🔴 Critical Path</p>}
                        <p className="text-muted-foreground mt-1 italic">Drag to reschedule</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 pb-3 border-t border-border/30 pt-2">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm', color)} />
            <span className="text-[10px] text-muted-foreground">{status}</span>
          </div>
        ))}
        {showCriticalPath && criticalPath.size > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm ring-2 ring-destructive/60 bg-transparent" />
            <span className="text-[10px] text-destructive font-medium">Critical Path</span>
          </div>
        )}
      </div>
    </div>
  );
}
