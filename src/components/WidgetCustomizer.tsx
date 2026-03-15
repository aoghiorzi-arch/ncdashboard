import { useState } from 'react';
import { getSettings, saveSettings, DEFAULT_WIDGETS, type DashboardWidget } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react';

const WIDGET_LABELS: Record<string, string> = {
  kpis: 'KPI Cards',
  health: 'Project Health Score',
  milestones: 'Milestone Tracker',
  statusReport: 'Weekly Status Report',
  heatmap: 'Workload Heatmap',
  weeklyDigest: 'Weekly Digest Stats',
  agenda: "Today's Agenda",
  alerts: 'Alerts',
  riskRegister: 'Risk Register',
  burndown: 'Budget Burn-down Chart',
  upcomingDeadlines: 'Upcoming Deadlines',
  recentTasks: 'Recent Tasks',
  activityFeed: 'Recent Activity',
  checklists: 'Checklists',
};

export function WidgetCustomizer() {
  const [open, setOpen] = useState(false);
  const settings = getSettings();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    settings.dashboardWidgets?.length ? settings.dashboardWidgets : DEFAULT_WIDGETS
  );

  const toggle = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    saveSettings({ ...getSettings(), dashboardWidgets: updated });
  };

  const move = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= widgets.length) return;
    const updated = [...widgets];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setWidgets(updated);
    saveSettings({ ...getSettings(), dashboardWidgets: updated });
  };

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    saveSettings({ ...getSettings(), dashboardWidgets: DEFAULT_WIDGETS });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LayoutGrid className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Customize</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Toggle widgets on/off and reorder them using the arrows.</p>
          <div className="space-y-1 mt-2">
            {widgets.map((widget, i) => (
              <div key={widget.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  <Switch checked={widget.visible} onCheckedChange={() => toggle(widget.id)} />
                  <span className="text-sm font-medium text-foreground">{WIDGET_LABELS[widget.id] || widget.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === widgets.length - 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={resetToDefault}>Reset to Default</Button>
            <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
