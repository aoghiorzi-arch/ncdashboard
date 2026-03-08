import { AnimatedPage } from '@/components/AnimatedPage';
import { InteractiveGantt } from '@/components/InteractiveGantt';

export default function GanttPage() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gantt Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive timeline with drag-to-reschedule, dependency arrows, and critical path highlighting.
          </p>
        </div>
        <InteractiveGantt />
      </div>
    </AnimatedPage>
  );
}
