import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Kanban, ListChecks, Timer, CalendarDays, Images,
  BarChart3, Users, Settings, ChevronLeft, ChevronRight,
  Search, Plus, Menu, TrendingUp, ExternalLink, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAddDialog } from './QuickAddDialog';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsPanel } from './NotificationsPanel';
import { AnimatedPage } from './AnimatedPage';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { DashboardHelp } from './DashboardHelp';
import { Breadcrumbs } from './Breadcrumbs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Sprint',
    items: [
      { title: 'Sprint Board', path: '/sprint', icon: Kanban },
      { title: 'Marketing Backlog', path: '/backlog', icon: ListChecks },
      { title: 'Sprint Manager', path: '/sprints', icon: Timer },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Content Calendar', path: '/calendar', icon: CalendarDays },
      { title: 'Asset Gallery', path: '/assets', icon: Images },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Campaign Pulse', path: '/campaign-pulse', icon: BarChart3 },
      { title: 'Velocity Charts', path: '/metrics', icon: TrendingUp },
    ],
  },
  {
    label: 'Team',
    items: [
      { title: 'Stakeholder Portal', path: '/portal', icon: ExternalLink },
      { title: 'Team & Roles', path: '/team', icon: Users },
      { title: 'Automations', path: '/workflows', icon: Zap },
      { title: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
      {NAV_SECTIONS.map(section => (
        <div key={section.label} className="mb-1">
          {!collapsed && (
            <p className="px-4 mb-1 mt-3 text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
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
                    title={item.title}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-[12px] font-medium rounded-lg mx-2 transition-all duration-150',
                      active
                        ? 'bg-sidebar-primary/20 text-sidebar-primary border-l-2 border-sidebar-primary pl-2.5'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', active && 'text-sidebar-primary')} />
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

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
      <div className="w-7 h-7 rounded-lg av-gradient-primary flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-white" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-sidebar-foreground leading-tight truncate">Agile Velocity</p>
          <p className="text-[9px] text-sidebar-foreground/40 leading-tight tracking-wide">MARKETING OPS</p>
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setQuickAddOpen(true);
    window.addEventListener('nc-quick-add', handler);
    return () => window.removeEventListener('nc-quick-add', handler);
  }, []);

  const currentModule = NAV_SECTIONS
    .flatMap(s => s.items)
    .find(i => i.path === location.pathname)?.title ?? 'Dashboard';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col av-gradient-sidebar text-sidebar-foreground transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        <LogoMark collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />
        {/* User chip */}
        {!collapsed && user && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/40">
              <div className="w-7 h-7 rounded-full av-gradient-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-[9px] text-sidebar-foreground/50 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-9 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 av-gradient-sidebar text-sidebar-foreground border-sidebar-border">
          <LogoMark collapsed={false} />
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — glassmorphism */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 av-glass border-b border-border/60 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-foreground truncate">{currentModule}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('nc-open-search'))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">⌘K</span>
            </button>
            <NotificationsPanel />
          </div>
        </header>

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
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full av-gradient-primary av-shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <GlobalSearch />
      <KeyboardShortcuts />
      <DashboardHelp />
    </div>
  );
}
