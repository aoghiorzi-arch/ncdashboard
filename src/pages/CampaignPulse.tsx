import { BarChart3, TrendingUp, MousePointerClick, Eye, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const DATA = [
  { sprint: 'S-08', points: 38, impressions: 24000, conversions: 310 },
  { sprint: 'S-09', points: 42, impressions: 31000, conversions: 420 },
  { sprint: 'S-10', points: 45, impressions: 28000, conversions: 380 },
  { sprint: 'S-11', points: 48, impressions: 39000, conversions: 510 },
  { sprint: 'S-12', points: 34, impressions: 27000, conversions: 360 },
];

const KPI_CARDS = [
  { label: 'Total Impressions', value: '149K', delta: '+18%', icon: Eye, color: 'text-blue-500 bg-blue-50' },
  { label: 'Conversions', value: '1,980', delta: '+12%', icon: MousePointerClick, color: 'text-green-500 bg-green-50' },
  { label: 'Avg Velocity', value: '41 pts', delta: '+5 pts', icon: TrendingUp, color: 'text-av-indigo bg-av-indigo/10' },
  { label: 'Points Burned', value: '207', delta: '5 sprints', icon: RefreshCw, color: 'text-violet-500 bg-violet-50' },
];

export default function CampaignPulse() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl av-gradient-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Campaign Pulse</h1>
          <p className="text-sm text-muted-foreground">Effort → Impact correlation across sprints</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="av-glass-card rounded-2xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className="font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-av-success font-medium">{kpi.delta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dual-axis chart */}
      <div className="av-glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Story Points Burned vs Marketing KPIs</h2>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={DATA} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="sprint" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="points" name="Story Points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke="hsl(var(--av-success))" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
