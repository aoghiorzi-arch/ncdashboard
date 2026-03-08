import { getTasks, getExpenses, getSettings, classCRUD, complianceCRUD, calendarCRUD } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

function generateReportHTML() {
  const tasks = getTasks();
  const expenses = getExpenses();
  const settings = getSettings();
  const classes = classCRUD.getAll();
  const compliance = complianceCRUD.getAll();
  const events = calendarCRUD.getAll();
  const now = new Date();

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const completedThisWeek = tasks.filter(t => t.status === 'Complete' && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo).length;
  const createdThisWeek = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= oneWeekAgo).length;
  const overdue = tasks.filter(t => t.status !== 'Complete' && t.dueDate && new Date(t.dueDate) < now);
  const blocked = tasks.filter(t => t.status === 'Blocked');
  const totalSpent = expenses.filter(e => e.status === 'Paid' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
  const budgetRemaining = settings.totalBudget - totalSpent;
  const budgetPct = settings.totalBudget > 0 ? Math.round((budgetRemaining / settings.totalBudget) * 100) : 100;
  const daysToLaunch = Math.ceil((new Date(settings.launchDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Complete').length / tasks.length) * 100) : 0;
  const classesLive = classes.filter(c => c.pipelineStage === 'Published').length;
  const classesInProd = classes.filter(c => !['Published', 'Archived', 'Concept / Approved'].includes(c.pipelineStage)).length;
  const complianceIssues = compliance.filter(c => c.status === 'Action Required').length;

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcoming = tasks
    .filter(t => t.status !== 'Complete' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= nextWeek)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= now && new Date(e.date) <= nextWeek)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${settings.platformName} - Status Report - ${dateStr}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #8B7335; }
  h2 { font-size: 15px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #8B7335; color: #333; }
  .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .kpi { background: #f8f7f4; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #e8e4d9; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #1a1a1a; }
  .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e8e4d9; font-size: 12px; }
  th { font-weight: 600; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f8f7f4; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .badge-alert { background: #fde2e2; color: #c0392b; }
  .badge-warn { background: #fef3cd; color: #856404; }
  .badge-ok { background: #d4edda; color: #155724; }
  .badge-info { background: #e8e4d9; color: #555; }
  .risk-item { background: #fef3cd; padding: 8px 12px; border-radius: 6px; margin: 4px 0; font-size: 12px; color: #856404; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e4d9; color: #aaa; font-size: 10px; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>${settings.platformName} — Status Report</h1>
<p class="subtitle">Generated ${dateStr} • ${daysToLaunch} days to launch</p>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value">${completedThisWeek}</div><div class="kpi-label">Tasks Done This Week</div></div>
  <div class="kpi"><div class="kpi-value">${createdThisWeek}</div><div class="kpi-label">New Tasks This Week</div></div>
  <div class="kpi"><div class="kpi-value">${completionRate}%</div><div class="kpi-label">Overall Completion</div></div>
  <div class="kpi"><div class="kpi-value">£${budgetRemaining.toLocaleString()}</div><div class="kpi-label">Budget Remaining (${budgetPct}%)</div></div>
</div>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value">${classesLive}</div><div class="kpi-label">Classes Live</div></div>
  <div class="kpi"><div class="kpi-value">${classesInProd}</div><div class="kpi-label">In Production</div></div>
  <div class="kpi"><div class="kpi-value">${overdue.length}</div><div class="kpi-label">Overdue Tasks</div></div>
  <div class="kpi"><div class="kpi-value">${blocked.length}</div><div class="kpi-label">Blocked Tasks</div></div>
</div>

${(() => {
  const risks: string[] = [];
  if (overdue.length > 0) risks.push(`${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} need attention`);
  if (blocked.length > 0) risks.push(`${blocked.length} blocked task${blocked.length > 1 ? 's' : ''} requiring resolution`);
  if (budgetPct < 20) risks.push(`Budget nearly exhausted (${budgetPct}% remaining)`);
  if (complianceIssues > 0) risks.push(`${complianceIssues} compliance items need action`);
  if (daysToLaunch < 30 && completionRate < 50) risks.push(`Launch in ${daysToLaunch}d but only ${completionRate}% complete`);
  if (risks.length === 0) return '';
  return `<h2>⚠ Risks & Blockers</h2>${risks.map(r => `<div class="risk-item">⚠ ${r}</div>`).join('')}`;
})()}

${overdue.length > 0 ? `
<h2>🔴 Overdue Tasks</h2>
<table><thead><tr><th>Task</th><th>Due Date</th><th>Priority</th><th>Owner</th></tr></thead><tbody>
${overdue.map(t => `<tr><td>${t.title}</td><td>${t.dueDate}</td><td><span class="badge badge-alert">${t.priority}</span></td><td>${t.owner}</td></tr>`).join('')}
</tbody></table>` : ''}

${upcoming.length > 0 ? `
<h2>📅 Upcoming This Week</h2>
<table><thead><tr><th>Task</th><th>Due Date</th><th>Status</th><th>Owner</th></tr></thead><tbody>
${upcoming.map(t => `<tr><td>${t.title}</td><td>${t.dueDate}</td><td><span class="badge badge-info">${t.status}</span></td><td>${t.owner}</td></tr>`).join('')}
</tbody></table>` : ''}

${upcomingEvents.length > 0 ? `
<h2>📆 Upcoming Events</h2>
<table><thead><tr><th>Event</th><th>Date</th><th>Type</th><th>Location</th></tr></thead><tbody>
${upcomingEvents.map(e => `<tr><td>${e.title}</td><td>${e.date}</td><td><span class="badge badge-info">${e.type}</span></td><td>${e.location || '—'}</td></tr>`).join('')}
</tbody></table>` : ''}

<h2>📊 All Open Tasks by Status</h2>
<table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>
${['Not Started', 'In Progress', 'Blocked', 'In Review'].map(s => {
  const count = tasks.filter(t => t.status === s).length;
  return count > 0 ? `<tr><td>${s}</td><td>${count}</td></tr>` : '';
}).join('')}
<tr style="font-weight:600"><td>Total Open</td><td>${tasks.filter(t => t.status !== 'Complete').length}</td></tr>
</tbody></table>

<h2>💰 Budget Summary</h2>
<table><thead><tr><th>Metric</th><th>Amount</th></tr></thead><tbody>
<tr><td>Total Budget</td><td>£${settings.totalBudget.toLocaleString()}</td></tr>
<tr><td>Total Spent</td><td>£${totalSpent.toLocaleString()}</td></tr>
<tr><td>Remaining</td><td>£${budgetRemaining.toLocaleString()} (${budgetPct}%)</td></tr>
</tbody></table>

<div class="footer">
  ${settings.platformName} Dashboard • Auto-generated report • ${dateStr}
</div>
</body></html>`;
}

export function StatusReportPDFButton() {
  const handleGenerate = () => {
    const html = generateReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 500);
      };
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate}>
      <FileDown className="w-4 h-4 mr-2" />
      Generate Report
    </Button>
  );
}
