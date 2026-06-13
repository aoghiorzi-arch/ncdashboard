import { ListChecks, Plus, Search, Tag, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const BACKLOG_ITEMS = [
  { id: 'B-01', title: 'Q3 Influencer outreach campaign', project: 'Q3 Launch', points: 8, priority: 'High', status: 'Backlog' },
  { id: 'B-02', title: 'Podcast sponsorship creative assets', project: 'Brand', points: 5, priority: 'Medium', status: 'Backlog' },
  { id: 'B-03', title: 'Customer testimonial video series', project: 'Content Hub', points: 13, priority: 'High', status: 'Backlog' },
  { id: 'B-04', title: 'SEO audit & keyword mapping', project: 'Growth', points: 8, priority: 'Medium', status: 'Backlog' },
  { id: 'B-05', title: 'Newsletter template redesign', project: 'Email', points: 3, priority: 'Low', status: 'Backlog' },
  { id: 'B-06', title: 'Paid social creative refresh', project: 'Q3 Launch', points: 5, priority: 'High', status: 'Backlog' },
  { id: 'B-07', title: 'Partner co-marketing one-pager', project: 'Brand', points: 3, priority: 'Low', status: 'Backlog' },
];

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-50 text-red-600 border-red-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low: 'bg-green-50 text-green-600 border-green-200',
};

export default function MarketingBacklog() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl av-gradient-primary flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Marketing Backlog</h1>
            <p className="text-sm text-muted-foreground">{BACKLOG_ITEMS.length} items · 45 story points</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 av-gradient-primary text-white border-0">
          <Plus className="w-3.5 h-3.5" /> New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search backlog…" className="pl-9 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Tag className="w-3.5 h-3.5" /> Project
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <SortAsc className="w-3.5 h-3.5" /> Priority
        </Button>
      </div>

      {/* Items list */}
      <div className="av-glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
          <span>Title</span>
          <span className="hidden sm:block">Project</span>
          <span>Priority</span>
          <span className="text-right">Points</span>
        </div>
        <div className="divide-y divide-border">
          {BACKLOG_ITEMS.map(item => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-av-indigo/3 transition-colors cursor-pointer group"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground mr-2">{item.id}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-av-indigo transition-colors">
                  {item.title}
                </span>
              </div>
              <Badge variant="outline" className="hidden sm:flex text-[11px] font-medium whitespace-nowrap">
                {item.project}
              </Badge>
              <Badge variant="outline" className={`text-[11px] font-semibold whitespace-nowrap ${PRIORITY_STYLES[item.priority]}`}>
                {item.priority}
              </Badge>
              <span className="text-sm font-bold text-av-indigo text-right">{item.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
