import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checklistCRUD, type Checklist } from '@/lib/storage';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChecklistWidget() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    const refresh = () => setChecklists(checklistCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const toggleItem = (checklistId: string, itemId: string) => {
    const cl = checklists.find(c => c.id === checklistId);
    if (!cl) return;
    checklistCRUD.update({
      ...cl,
      items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
      updatedAt: new Date().toISOString(),
    });
  };

  const active = checklists.filter(cl => {
    if (cl.items.length === 0) return true;
    return cl.items.some(i => !i.done);
  }).slice(0, 3);

  return (
    <div className="bg-card rounded-lg nc-shadow-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
          <ClipboardList className="w-4 h-4 text-accent" />
          Checklists
        </h3>
        <Link to="/checklists">
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {checklists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checklists yet. <Link to="/checklists" className="text-accent hover:underline">Create one</Link>.
        </p>
      ) : active.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-nc-success">
          <CheckCircle2 className="w-4 h-4" />
          All checklists complete!
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(cl => {
            const done = cl.items.filter(i => i.done).length;
            const total = cl.items.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={cl.id}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cl.color }} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{cl.title}</span>
                  <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
                </div>
                <Progress value={pct} className="h-1 mb-1.5" />
                <ul className="space-y-1">
                  {cl.items.filter(i => !i.done).slice(0, 3).map(item => (
                    <li key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleItem(cl.id, item.id)}
                        className="shrink-0 h-3.5 w-3.5"
                      />
                      <span className="text-xs text-foreground truncate">{item.label}</span>
                    </li>
                  ))}
                  {cl.items.filter(i => !i.done).length > 3 && (
                    <li className="text-[10px] text-muted-foreground pl-5">
                      +{cl.items.filter(i => !i.done).length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
