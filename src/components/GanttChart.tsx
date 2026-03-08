import { useMemo, useState } from 'react';
import { differenceInDays, format, startOfDay, addDays, max, min } from 'date-fns';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color?: string;
  stage?: string;
  progress?: number; // 0-100
  dependencies?: string[]; // IDs this item depends on
}

interface GanttChartProps {
  items: GanttItem[];
  className?: string;
  onItemClick?: (item: GanttItem) => void;
}

export function GanttChart({ items, className, onItemClick }: GanttChartProps) {
  const [zoom, setZoom] = useState(1); // 0.5 = zoomed out, 2 = zoomed in
  const validItems = items.filter(i => i.startDate && i.endDate);

  const { timelineStart, totalDays, months } = useMemo(() => {
    if (validItems.length === 0) return { timelineStart: new Date(), totalDays: 30, months: [] };

    const allStarts = validItems.map(i => new Date(i.startDate));
    const allEnds = validItems.map(i => new Date(i.endDate));
    const earliest = startOfDay(min(allStarts));
    const latest = startOfDay(max(allEnds));
    const days = Math.max(differenceInDays(latest, earliest) + 7, 14);

    const monthLabels: { label: string; left: number; width: number }[] = [];
    let current = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    while (current <= addDays(latest, 7)) {
      const monthStart = max([current, earliest]);
      const monthEnd = min([new Date(current.getFullYear(), current.getMonth() + 1, 0), addDays(latest, 7)]);
      const left = differenceInDays(monthStart, earliest) / days * 100;
      const width = (differenceInDays(monthEnd, monthStart) + 1) / days * 100;
      monthLabels.push({ label: format(current, 'MMM yyyy'), left, width });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return { timelineStart: earliest, totalDays: days, months: monthLabels };
  }, [validItems]);

  if (validItems.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No items with date ranges to display.</p>;
  }

  const todayOffset = differenceInDays(startOfDay(new Date()), timelineStart) / totalDays * 100;
  const chartWidth = Math.max(600, 600 * zoom);

  return (
    <div className={cn('bg-card rounded-lg nc-shadow-card', className)}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-medium text-muted-foreground">{validItems.length} items</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${chartWidth}px` }} className="p-4 pt-1">
          {/* Month headers */}
          <div className="relative h-6 mb-1 border-b border-border/50">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute text-[10px] font-medium text-muted-foreground truncate"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1.5 relative">
            {todayOffset >= 0 && todayOffset <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-destructive/50 z-10"
                style={{ left: `${todayOffset}%` }}
              >
                <div className="absolute -top-5 -translate-x-1/2 text-[8px] font-medium text-destructive bg-destructive/10 px-1 rounded">
                  Today
                </div>
              </div>
            )}

            {validItems.map(item => {
              const start = differenceInDays(new Date(item.startDate), timelineStart);
              const duration = differenceInDays(new Date(item.endDate), new Date(item.startDate)) + 1;
              const left = (start / totalDays) * 100;
              const width = (duration / totalDays) * 100;
              const progress = item.progress ?? 0;

              return (
                <div
                  key={item.id}
                  className={cn('flex items-center gap-3 h-8', onItemClick && 'cursor-pointer')}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="w-32 shrink-0 truncate text-xs font-medium text-foreground" title={item.title}>
                    {item.title}
                  </div>
                  <div className="flex-1 relative h-6 bg-muted/30 rounded">
                    <div
                      className={cn(
                        'absolute h-full rounded text-[9px] font-medium flex items-center px-2 text-accent-foreground truncate overflow-hidden',
                        item.color || 'bg-accent'
                      )}
                      style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` }}
                      title={`${format(new Date(item.startDate), 'dd MMM')} – ${format(new Date(item.endDate), 'dd MMM')}${progress > 0 ? ` (${progress}%)` : ''}`}
                    >
                      {/* Progress fill */}
                      {progress > 0 && (
                        <div
                          className="absolute inset-0 bg-foreground/10 rounded"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                      <span className="relative z-10">{item.stage || ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
