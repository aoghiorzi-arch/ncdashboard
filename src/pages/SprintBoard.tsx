import { Kanban, Plus, Filter, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLUMNS = ['Backlog', 'In Progress', 'In Review', 'Done'];

const COLUMN_STYLES: Record<string, string> = {
  Backlog: 'border-t-slate-400',
  'In Progress': 'border-t-av-indigo',
  'In Review': 'border-t-av-violet',
  Done: 'border-t-av-success',
};

const MOCK_CARDS = [
  { id: '1', col: 'Backlog', title: 'Q3 Social Campaign Brief', points: 3, assignee: 'AR', tag: 'Content' },
  { id: '2', col: 'Backlog', title: 'Landing page copy refresh', points: 5, assignee: 'MK', tag: 'Copywriting' },
  { id: '3', col: 'In Progress', title: 'Hero banner A/B variants', points: 8, assignee: 'AR', tag: 'Design' },
  { id: '4', col: 'In Progress', title: 'Email drip sequence — launch', points: 5, assignee: 'SL', tag: 'Email' },
  { id: '5', col: 'In Review', title: 'Brand guidelines v2', points: 13, assignee: 'MK', tag: 'Design' },
  { id: '6', col: 'Done', title: 'Competitor analysis deck', points: 3, assignee: 'SL', tag: 'Research' },
  { id: '7', col: 'Done', title: 'Instagram grid planning', points: 2, assignee: 'AR', tag: 'Social' },
];

const TAG_COLORS: Record<string, string> = {
  Content: 'bg-blue-100 text-blue-700',
  Design: 'bg-purple-100 text-purple-700',
  Email: 'bg-orange-100 text-orange-700',
  Copywriting: 'bg-pink-100 text-pink-700',
  Research: 'bg-green-100 text-green-700',
  Social: 'bg-yellow-100 text-yellow-700',
};

export default function SprintBoard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl av-gradient-primary flex items-center justify-center">
            <Kanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sprint Board</h1>
            <p className="text-sm text-muted-foreground">Sprint 12 · Jun 9–Jun 22 · <span className="text-av-indigo font-medium">34 / 55 pts</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button size="sm" className="gap-2 av-gradient-primary text-white border-0">
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* Sprint velocity chip */}
      <div className="flex items-center gap-2 p-3 rounded-xl av-glass-card w-fit">
        <Zap className="w-4 h-4 text-av-indigo" />
        <span className="text-sm font-medium text-foreground">Team velocity</span>
        <Badge className="bg-av-indigo/10 text-av-indigo border-0">42 pts / sprint avg</Badge>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const cards = MOCK_CARDS.filter(c => c.col === col);
          return (
            <div
              key={col}
              className={`av-glass-card rounded-2xl border-t-4 ${COLUMN_STYLES[col]} flex flex-col min-h-[320px]`}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-sm font-semibold text-foreground">{col}</span>
                <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2 px-3 pb-4">
                {cards.map(card => (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl border border-border p-3 cursor-pointer hover:border-av-indigo/40 hover:av-shadow transition-all duration-150 group"
                  >
                    <p className="text-sm font-medium text-foreground mb-2 group-hover:text-av-indigo transition-colors">
                      {card.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${TAG_COLORS[card.tag] ?? 'bg-gray-100 text-gray-600'}`}>
                        {card.tag}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">{card.points} pts</span>
                        <div className="w-6 h-6 rounded-full av-gradient-primary flex items-center justify-center text-[9px] font-bold text-white">
                          {card.assignee}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-av-indigo transition-colors p-1.5 rounded-lg hover:bg-av-indigo/5">
                  <Plus className="w-3.5 h-3.5" /> Add card
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
