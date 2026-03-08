import { useState, useEffect } from 'react';
import { metricCRUD, generateId, type MetricEntry } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function PlatformMetrics() {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [editEntry, setEditEntry] = useState<MetricEntry | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setEntries(metricCRUD.getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const handleSave = (entry: MetricEntry) => {
    if (editEntry) { metricCRUD.update(entry); }
    else { metricCRUD.add({ ...entry, id: generateId(), createdAt: new Date().toISOString() }); }
    setEntries(metricCRUD.getAll());
    setEditEntry(null); setNewOpen(false);
  };

  const handleDelete = (id: string) => { metricCRUD.remove(id); setEntries(metricCRUD.getAll()); setEditEntry(null); };

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-end">
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* Latest KPIs */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Members', value: latest.totalMembers },
            { label: 'Active Members', value: latest.activeMembers },
            { label: 'Founders Sold', value: latest.foundersMembers },
            { label: 'Total Revenue', value: `£${latest.totalRevenue.toLocaleString()}` },
            { label: 'NPS', value: latest.nps },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card rounded-lg p-4 nc-shadow-card border-l-4 border-l-accent">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {sorted.length > 1 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 nc-shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Member Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="totalMembers" stroke="hsl(var(--nc-gold))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg p-5 nc-shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="revenueThisMonth" fill="hsl(var(--nc-gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground border-b">
            <th className="text-left p-3 font-medium">Date</th><th className="text-right p-3 font-medium">Members</th>
            <th className="text-right p-3 font-medium">Active</th><th className="text-right p-3 font-medium">Founders</th>
            <th className="text-right p-3 font-medium">Revenue</th><th className="text-right p-3 font-medium">Monthly</th>
            <th className="text-right p-3 font-medium">NPS</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {sorted.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditEntry(e)}>
                <td className="p-3 font-medium text-foreground">{e.date}</td>
                <td className="p-3 text-right">{e.totalMembers}</td>
                <td className="p-3 text-right">{e.activeMembers}</td>
                <td className="p-3 text-right">{e.foundersMembers}</td>
                <td className="p-3 text-right">£{e.totalRevenue.toLocaleString()}</td>
                <td className="p-3 text-right">£{e.revenueThisMonth.toLocaleString()}</td>
                <td className="p-3 text-right">{e.nps}</td>
                <td className="p-3"><button onClick={ev => { ev.stopPropagation(); handleDelete(e.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">No metric entries yet. Add monthly snapshots to track growth.</td></tr>}
          </tbody>
        </table>
      </div>

      <MetricDialog entry={editEntry} open={!!editEntry || newOpen} onOpenChange={o => { if (!o) { setEditEntry(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function MetricDialog({ entry, open, onOpenChange, onSave, onDelete }: {
  entry: MetricEntry | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (e: MetricEntry) => void; onDelete: (id: string) => void;
}) {
  const blank: MetricEntry = { id: '', date: new Date().toISOString().split('T')[0], totalMembers: 0, activeMembers: 0, foundersMembers: 0, standardMembers: 0, singleClassPurchases: 0, totalRevenue: 0, revenueThisMonth: 0, courseCompletionRate: 0, nps: 0, notes: '', createdAt: '' };
  const [form, setForm] = useState<MetricEntry>(blank);
  useEffect(() => { setForm(entry || blank); }, [entry]);
  const u = (p: Partial<MetricEntry>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{entry ? 'Edit Entry' : 'New Metric Entry'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">Date</label><Input type="date" className="mt-1" value={form.date} onChange={e => u({ date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Total Members</label><Input type="number" className="mt-1" value={form.totalMembers} onChange={e => u({ totalMembers: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Active Members</label><Input type="number" className="mt-1" value={form.activeMembers} onChange={e => u({ activeMembers: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Founders Sold</label><Input type="number" className="mt-1" value={form.foundersMembers} onChange={e => u({ foundersMembers: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Standard Members</label><Input type="number" className="mt-1" value={form.standardMembers} onChange={e => u({ standardMembers: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Single Class Purchases</label><Input type="number" className="mt-1" value={form.singleClassPurchases} onChange={e => u({ singleClassPurchases: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Total Revenue (£)</label><Input type="number" className="mt-1" value={form.totalRevenue} onChange={e => u({ totalRevenue: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Revenue This Month (£)</label><Input type="number" className="mt-1" value={form.revenueThisMonth} onChange={e => u({ revenueThisMonth: +e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Course Completion %</label><Input type="number" className="mt-1" value={form.courseCompletionRate} onChange={e => u({ courseCompletionRate: +e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">NPS</label><Input type="number" className="mt-1" value={form.nps} onChange={e => u({ nps: +e.target.value })} /></div>
          <Textarea placeholder="Notes..." value={form.notes} onChange={e => u({ notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onSave(form)}>{entry ? 'Save' : 'Create'}</Button>
            {entry && <Button variant="destructive" onClick={() => onDelete(entry.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
