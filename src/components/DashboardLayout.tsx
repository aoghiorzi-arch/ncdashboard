import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CheckSquare, Film, Users,
  FolderOpen, Lightbulb, PartyPopper, Handshake, PiggyBank,
  BarChart3, Shield, UserCog, Settings, ChevronLeft, ChevronRight,
  Search, Plus, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAddDialog } from './QuickAddDialog';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsPanel } from './NotificationsPanel';
import { AnimatedPage } from './AnimatedPage';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Breadcrumbs } from './Breadcrumbs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', path: '/', icon: LayoutDashboard },
      { title: 'Calendar', path: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Tasks', path: '/tasks', icon: CheckSquare },
      { title: 'Classes Pipeline', path: '/classes', icon: Film },
      { title: 'Instructor CRM', path: '/instructors', icon: Users },
      { title: 'Documents', path: '/documents', icon: FolderOpen },
      { title: 'Ideas & Backlog', path: '/ideas', icon: Lightbulb },
      { title: 'Events', path: '/events', icon: PartyPopper },
      { title: 'Partnerships', path: '/partnerships', icon: Handshake },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Budget & Expenses', path: '/budget', icon: PiggyBank },
      { title: 'Platform Metrics', path: '/metrics', icon: BarChart3 },
      { title: 'Legal & Compliance', path: '/legal', icon: Shield },
      { title: 'Team & Roles', path: '/team', icon: UserCog },
      { title: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto py-3 space-y-4">
      {NAV_SECTIONS.map(section => (
        <div key={section.label}>
          {!collapsed && (
            <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map(item => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-[13px] font-medium rounded-md mx-1 transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                    title={item.title}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setQuickAddOpen(true);
    window.addEventListener('nc-quick-add', handler);
    return () => window.removeEventListener('nc-quick-add', handler);
  }, []);

  const currentModule = NAV_SECTIONS
    .flatMap(s => s.items)
    .find(i => i.path === location.pathname)?.title || 'Dashboard';

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded nc-gradient-gold flex items-center justify-center text-xs font-bold text-primary shrink-0">
            NC
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-wide truncate">
              Newbold Connect
            </span>
          )}
        </div>
        <SidebarNav collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
            <div className="w-7 h-7 rounded nc-gradient-gold flex items-center justify-center text-xs font-bold text-primary shrink-0">
              NC
            </div>
            <span className="font-semibold text-sm tracking-wide truncate">
              Newbold Connect
            </span>
          </div>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-card border-b shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-lg text-foreground truncate">{currentModule}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => window.dispatchEvent(new Event('nc-open-search'))}
              className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs hidden sm:inline text-muted-foreground">⌘K</span>
            </button>
            <NotificationsPanel />
          </div>
        </header>

        {/* Content with animation */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Breadcrumbs />
          <AnimatedPage>
            <Outlet />
          </AnimatedPage>
        </main>
      </div>

      {/* Quick-Add FAB */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full nc-gradient-gold nc-shadow-elevated flex items-center justify-center text-primary hover:scale-105 transition-transform z-50"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <GlobalSearch />
    </div>
  );
}
