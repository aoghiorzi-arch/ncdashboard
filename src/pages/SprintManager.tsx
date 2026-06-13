import { Timer, Plus, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const SPRINTS = [
  {
    id: 12, name: 'Sprint 12', status: 'active',
    start: 'Jun 9', end: 'Jun 22', target: 55, burned: 34,
    items: 12, completed: 7,
  },
  {
    id: 11, name: 'Sprint 11', status: 'completed',
    start: 'May 26', end: 'Jun 8', target: 50, burned: 48,
    items: 10, completed: 10,
  },
  {
    id: 10, name: 'Sprint 10', status: 'completed',
    start: 'May 12', end: 'May 25', target: 45, burned: 42,
    items: 9, completed: 8,
  },
];

export default function SprintManager() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl av-gradient-primary flex items-center justify-center">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sprint Manager</h1>
            <p className="text-sm text-muted-foreground">2-week cycles · Avg velocity 43 pts</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 av-gradient-primary text-white border-0">
          <Plus className="w-3.5 h-3.5" /> New Sprint
        </Button>
      </div>

      <div className="grid gap-4">
        {SPRINTS.map(sprint => {
          const pct = Math.round((sprint.burned / sprint.target) * 100);
          const isActive = sprint.status === 'active';
          return (
            <div
              key={sprint.id}
              className={`av-glass-card rounded-2xl p-5 cursor-pointer hover:av-shadow transition-all ${isActive ? 'ring-2 ring-av-indigo/30' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isActive
                    ? <Circle className="w-5 h-5 text-av-indigo fill-av-indigo/20" />
                    : <CheckCircle2 className="w-5 h-5 text-av-success" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{sprint.name}</span>
                      {isActive && (
                        <Badge className="bg-av-indigo/10 text-av-indigo border-0 text-[10px]">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{sprint.start} → {sprint.end} · {sprint.completed}/{sprint.items} tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Burned / Target</p>
                    <p className="font-bold text-foreground">{sprint.burned} <span className="text-muted-foreground font-normal">/ {sprint.target} pts</span></p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Burn-down progress</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
