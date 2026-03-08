import { useMemo } from 'react';
import { getTasks, teamCRUD } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const month = start.toLocaleString('default', { month: 'short' });
  return `${month} ${start.getDate()}`;
}

function getWeekKey(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return start.toISOString().split('T')[0];
}

export function WorkloadHeatmap() {
  const data = useMemo(() => {
    const tasks = getTasks().filter(t => t.status !== 'Complete' && t.dueDate);
    const members = teamCRUD.getAll();
    const owners = new Set<string>();
    tasks.forEach(t => { if (t.owner) owners.add(t.owner); });
    members.forEach(m => owners.add(m.name));

    const ownerList = Array.from(owners).sort();

    // Build 6-week window
    const weeks: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = -1; i < 5; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i * 7);
      const key = getWeekKey(d);
      if (!weeks.find(w => w.key === key)) {
        weeks.push({ key, label: getWeekLabel(d) });
      }
    }

    // Count tasks per owner per week
    const grid: Record<string, Record<string, number>> = {};
    ownerList.forEach(o => { grid[o] = {}; weeks.forEach(w => { grid[o][w.key] = 0; }); });

    tasks.forEach(t => {
      if (!t.owner || !owners.has(t.owner)) return;
      const wk = getWeekKey(new Date(t.dueDate));
      if (grid[t.owner] && grid[t.owner][wk] !== undefined) {
        grid[t.owner][wk]++;
      }
    });

    return { ownerList, weeks, grid };
  }, []);

  const { ownerList, weeks, grid } = data;

  if (ownerList.length === 0) {
    return (
      <div className="bg-card rounded-lg nc-shadow-card p-5">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent" />
          Workload Heatmap
        </h3>
        <p className="text-sm text-muted-foreground">Add team members and assign tasks to see workload distribution.</p>
      </div>
    );
  }

  const maxCount = Math.max(1, ...ownerList.flatMap(o => weeks.map(w => grid[o][w.key])));

  function heatColor(count: number): string {
    if (count === 0) return 'bg-muted';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-destructive/60';
    if (ratio > 0.5) return 'bg-nc-warn/50';
    if (ratio > 0.25) return 'bg-accent/40';
    return 'bg-nc-success/30';
  }

  return (
    <div className="bg-card rounded-lg nc-shadow-card p-5">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" />
        Workload Heatmap
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-medium text-muted-foreground pb-2 pr-3 w-24">Member</th>
              {weeks.map(w => (
                <th key={w.key} className="text-center text-[10px] font-medium text-muted-foreground pb-2 px-1">{w.label}</th>
              ))}
              <th className="text-center text-[10px] font-medium text-muted-foreground pb-2 px-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {ownerList.map(owner => {
              const total = weeks.reduce((s, w) => s + grid[owner][w.key], 0);
              return (
                <tr key={owner}>
                  <td className="text-xs font-medium text-foreground py-1 pr-3 truncate max-w-[100px]">{owner}</td>
                  {weeks.map(w => (
                    <td key={w.key} className="py-1 px-1">
                      <div className={cn(
                        'w-full h-7 rounded flex items-center justify-center text-[10px] font-medium transition-colors',
                        heatColor(grid[owner][w.key]),
                        grid[owner][w.key] > 0 ? 'text-foreground' : 'text-muted-foreground/50'
                      )}>
                        {grid[owner][w.key] || '·'}
                      </div>
                    </td>
                  ))}
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-full h-7 rounded flex items-center justify-center text-[10px] font-bold',
                      total > 6 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
                    )}>{total}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[9px] text-muted-foreground">Load:</span>
        {[['Low', 'bg-nc-success/30'], ['Medium', 'bg-accent/40'], ['High', 'bg-nc-warn/50'], ['Over', 'bg-destructive/60']].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded', cls)} />
            <span className="text-[9px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
