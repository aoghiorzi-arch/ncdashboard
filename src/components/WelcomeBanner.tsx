import { Link } from 'react-router-dom';
import { getTasks, getSettings } from '@/lib/storage';
import { AlertTriangle, CalendarClock, Sparkles } from 'lucide-react';

export function WelcomeBanner() {
  const tasks = getTasks();
  const settings = getSettings();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const overdue = tasks.filter(t => t.status !== 'Complete' && t.dueDate && t.dueDate < todayStr).length;

  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = weekFromNow.toISOString().split('T')[0];
  const dueThisWeek = tasks.filter(t => t.status !== 'Complete' && t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekStr).length;

  const lastVisit = localStorage.getItem('nc_last_visit');
  const newSinceLastVisit = lastVisit
    ? tasks.filter(t => t.createdAt && t.createdAt > lastVisit).length
    : 0;

  // Update last visit
  localStorage.setItem('nc_last_visit', now.toISOString());

  if (overdue === 0 && dueThisWeek === 0 && newSinceLastVisit === 0) return null;

  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 nc-shadow-card flex items-center gap-3 flex-wrap text-sm">
      <Sparkles className="w-4 h-4 text-accent shrink-0" />
      <span className="text-foreground font-medium">Welcome back, {settings.userName}!</span>
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {overdue > 0 && (
          <Link to="/tasks" className="flex items-center gap-1 text-destructive hover:underline">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdue} overdue task{overdue !== 1 ? 's' : ''}
          </Link>
        )}
        {dueThisWeek > 0 && (
          <Link to="/tasks" className="flex items-center gap-1 text-nc-warn hover:underline">
            <CalendarClock className="w-3.5 h-3.5" />
            {dueThisWeek} due this week
          </Link>
        )}
        {newSinceLastVisit > 0 && (
          <span className="text-muted-foreground">
            {newSinceLastVisit} new task{newSinceLastVisit !== 1 ? 's' : ''} since last visit
          </span>
        )}
      </div>
    </div>
  );
}
