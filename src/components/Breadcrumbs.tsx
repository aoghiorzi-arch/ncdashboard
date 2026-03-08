import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const PATH_LABELS: Record<string, { section: string; label: string }> = {
  '/': { section: 'Overview', label: 'Dashboard' },
  '/calendar': { section: 'Overview', label: 'Calendar' },
  '/tasks': { section: 'Operations', label: 'Tasks' },
  '/classes': { section: 'Operations', label: 'Classes Pipeline' },
  '/instructors': { section: 'Operations', label: 'Instructor CRM' },
  '/documents': { section: 'Operations', label: 'Documents' },
  '/ideas': { section: 'Operations', label: 'Ideas & Backlog' },
  '/events': { section: 'Operations', label: 'Events' },
  '/partnerships': { section: 'Operations', label: 'Partnerships' },
  '/budget': { section: 'Administration', label: 'Budget & Expenses' },
  '/metrics': { section: 'Administration', label: 'Platform Metrics' },
  '/legal': { section: 'Administration', label: 'Legal & Compliance' },
  '/team': { section: 'Administration', label: 'Team & Roles' },
  '/settings': { section: 'Administration', label: 'Settings' },
};

export function Breadcrumbs() {
  const location = useLocation();
  const info = PATH_LABELS[location.pathname];
  if (!info || location.pathname === '/') return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-muted-foreground/70">{info.section}</span>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground font-medium">{info.label}</span>
    </nav>
  );
}
