import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  HelpCircle, X, ChevronDown, ChevronRight,
  LayoutDashboard, CheckSquare, Film, Users, FolderOpen,
  Lightbulb, PartyPopper, Handshake, PiggyBank, BarChart3,
  Shield, UserCog, CalendarDays, Settings, Globe, ShieldCheck,
  Flag, FileText, Link2, Users2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpSection {
  id: string;
  title: string;
  icon: typeof HelpCircle;
  content: string;
  link?: string;
  linkLabel?: string;
}

const CORE_MODULES: HelpSection[] = [
  {
    id: 'dashboard', icon: LayoutDashboard, title: 'Dashboard',
    content: 'Your command centre. See KPI cards with sparkline trends, project health score (RAG indicator across tasks, budget, schedule & compliance), milestone progress, workload heatmap, weekly status report, alerts, and activity feed — all in one view.',
    link: '/', linkLabel: 'Go to Dashboard',
  },
  {
    id: 'tasks', icon: CheckSquare, title: 'Tasks',
    content: 'Create, assign, and track tasks across three views: Board (Kanban drag-and-drop), Swim Lanes (grouped by priority), and List (sortable table). Each task supports status, priority, module tags, due dates, and dependencies (blocker/blocked-by). Use bulk actions to change status or delete multiple tasks at once. Smart warnings highlight overdue (🔴) and approaching (🟡) deadlines.',
    link: '/tasks', linkLabel: 'Go to Tasks',
  },
  {
    id: 'classes', icon: Film, title: 'Classes Pipeline',
    content: 'Track your content pipeline from concept to publication. Cards flow through stages via drag-and-drop: Concept → Pre-Production → Filming → Post-Production → Review → Published. Each card shows time-in-stage badges and overdue warnings. Switch to Timeline view for a Gantt-style overview.',
    link: '/classes', linkLabel: 'Go to Classes',
  },
  {
    id: 'instructors', icon: Users, title: 'Instructor CRM',
    content: 'Manage instructor relationships through pipeline stages (Identified → Contacted → Agreed → Filming → Active → Alumni). Cards show avatar initials, specialism, and days-in-stage. Drag between columns to update status. Click to edit full profile including agreements, fees, and ratings.',
    link: '/instructors', linkLabel: 'Go to Instructors',
  },
  {
    id: 'calendar', icon: CalendarDays, title: 'Calendar',
    content: 'Central calendar for milestones, filming days, meetings, deadlines, events, and reminders. Supports recurring events (weekly/monthly). View by month with event type colour coding.',
    link: '/calendar', linkLabel: 'Go to Calendar',
  },
  {
    id: 'documents', icon: FolderOpen, title: 'Documents',
    content: 'Organised document library with folders, version tracking, review dates, and status workflow (Draft → In Review → Final → Superseded). Link directly to files in SharePoint or Google Drive.',
    link: '/documents', linkLabel: 'Go to Documents',
  },
  {
    id: 'ideas', icon: Lightbulb, title: 'Ideas & Backlog',
    content: 'Capture and prioritise ideas with impact/effort scoring. Pipeline stages: Raw Idea → Under Consideration → Validated → In Backlog → Promoted/Declined. Sort by impact-to-effort ratio to find quick wins.',
    link: '/ideas', linkLabel: 'Go to Ideas',
  },
  {
    id: 'events', icon: PartyPopper, title: 'Events',
    content: 'Plan and manage events with programme scheduling, guest lists (VIP/Speaker/General/Press), RSVP tracking, venue details, and AV requirements.',
    link: '/events', linkLabel: 'Go to Events',
  },
  {
    id: 'partnerships', icon: Handshake, title: 'Partnerships',
    content: 'Track partner organisations through relationship stages (Identified → In Conversation → Agreed → Active → Dormant → Ended). Record agreement types, values, and next actions.',
    link: '/partnerships', linkLabel: 'Go to Partnerships',
  },
  {
    id: 'budget', icon: PiggyBank, title: 'Budget & Expenses',
    content: 'Full expense tracking with categories, approval workflow, payment methods, and recurring items. Income tracking for memberships, grants, and sponsorships. Dashboard shows a budget burn-down chart.',
    link: '/budget', linkLabel: 'Go to Budget',
  },
  {
    id: 'metrics', icon: BarChart3, title: 'Platform Metrics',
    content: 'Track key platform KPIs: total/active members, founders vs standard, single class purchases, revenue, course completion rates, and NPS scores over time.',
    link: '/metrics', linkLabel: 'Go to Metrics',
  },
  {
    id: 'legal', icon: Shield, title: 'Legal & Compliance',
    content: 'Monitor compliance across GDPR, PECR, Safeguarding, Trading Standards, and Employment categories. Traffic-light status with action tracking, due dates, and evidence links.',
    link: '/legal', linkLabel: 'Go to Legal',
  },
  {
    id: 'team', icon: UserCog, title: 'Team & Roles',
    content: 'Manage team members, contractors, volunteers, and instructors. Track roles, responsibilities, GDPR duties, start/end dates, and day rates.',
    link: '/team', linkLabel: 'Go to Team',
  },
];

const ADVANCED_FEATURES: HelpSection[] = [
  {
    id: 'health', icon: ShieldCheck, title: 'Project Health Score',
    content: 'The RAG health indicator on the dashboard auto-calculates a 0-100 score across four dimensions: Tasks (penalises overdue & blocked), Budget (remaining ratio), Schedule (days to launch vs completion rate), and Compliance (action items). Each factor shows a colour-coded progress bar — green (70+), amber (40-69), red (<40).',
  },
  {
    id: 'dependencies', icon: Link2, title: 'Task Dependencies',
    content: 'Link tasks as blocker/blocked-by relationships. Open any task and use the Dependencies section to add blockers or specify which tasks this one blocks. Unresolved blockers show warning badges on Kanban cards. Dependencies are tracked separately and persist across sessions.',
  },
  {
    id: 'milestones', icon: Flag, title: 'Milestone Tracker',
    content: 'Define key project milestones and link them to module tags (e.g. "Class", "Legal"). Progress auto-calculates from the completion rate of tasks with matching tags. Overdue milestones are highlighted in red. Add milestones from the dashboard widget.',
  },
  {
    id: 'heatmap', icon: Users2, title: 'Workload Heatmap',
    content: 'The heatmap shows task load per team member across a rolling 6-week window. Cells are colour-coded: green (low), gold (medium), orange (high), red (overloaded). Add team members in Team & Roles and assign tasks to see distribution.',
  },
  {
    id: 'status-report', icon: FileText, title: 'Weekly Status Report',
    content: 'Auto-generated weekly summary showing tasks completed, new tasks created, completion rate, days to launch, risks & blockers, upcoming deadlines, and key financial metrics. Updates in real-time as data changes.',
  },
];

const SHAREPOINT_GUIDE: HelpSection = {
  id: 'sharepoint', icon: Globe, title: 'SharePoint Integration',
  content: `Newbold Connect supports syncing all module data to Microsoft SharePoint lists, replacing the browser-based localStorage with a centralised, team-accessible data store.

**How to set up SharePoint:**

1. **Register an Azure AD App**
   • Go to portal.azure.com → Azure Active Directory → App Registrations → New Registration
   • Name: "Newbold Connect Dashboard"
   • Redirect URI: leave blank (this is a backend app)
   • Under API Permissions, add Microsoft Graph → Application → Sites.ReadWrite.All
   • Grant admin consent

2. **Create SharePoint Lists**
   • On your SharePoint site, create one list per module (e.g. "NC_Tasks", "NC_Classes", "NC_Instructors")
   • Each list should have columns matching the data fields (Title, Status, Priority, DueDate, etc.)
   • Use Single Line Text for most fields, Choice for status/priority, Date for dates, Number for numeric values

3. **Configure in Settings**
   • Go to Settings → SharePoint Integration
   • Enable SharePoint sync
   • Enter your Site URL, Tenant ID, and Client ID
   • Map each module to its SharePoint list name

4. **IT Team: Build the Graph API Proxy**
   • Create an Azure Function or API endpoint that authenticates via your App Registration
   • Proxy CRUD operations between the dashboard and SharePoint lists using the Microsoft Graph API
   • The dashboard will call this proxy instead of localStorage when SharePoint is enabled

5. **Microsoft SSO (Login Page)**
   • The login page includes a "Sign in with Microsoft" placeholder button
   • When SharePoint is configured, this button activates and can be connected to Azure AD OAuth
   • Configure the redirect URI in your Azure AD app to enable SSO

**Current Status:** Data is stored locally in your browser. Enabling SharePoint in settings saves the configuration — your IT team then connects the actual API proxy to make sync live.`,
  link: '/settings', linkLabel: 'Go to Settings',
};

export function DashboardHelp() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = [...CORE_MODULES, ...ADVANCED_FEATURES, SHAREPOINT_GUIDE].map(s => s.id);
    setExpanded(new Set(all));
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 w-10 h-10 rounded-full bg-primary text-primary-foreground nc-shadow-elevated flex items-center justify-center hover:scale-105 transition-transform z-50"
        title="Help & Guide"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 w-10 h-10 rounded-full bg-primary text-primary-foreground nc-shadow-elevated flex items-center justify-center hover:scale-105 transition-transform z-50"
        title="Help & Guide"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <div
          className="bg-card rounded-xl nc-shadow-elevated w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-accent" />
                Help & Feature Guide
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Everything you need to know about Newbold Connect Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={expandAll}>Expand all</Button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Core Modules */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Core Modules</h3>
              <div className="space-y-1">
                {CORE_MODULES.map(section => (
                  <HelpAccordion key={section.id} section={section} expanded={expanded.has(section.id)} onToggle={() => toggle(section.id)} />
                ))}
              </div>
            </div>

            {/* Advanced Features */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Advanced Features</h3>
              <div className="space-y-1">
                {ADVANCED_FEATURES.map(section => (
                  <HelpAccordion key={section.id} section={section} expanded={expanded.has(section.id)} onToggle={() => toggle(section.id)} />
                ))}
              </div>
            </div>

            {/* SharePoint Guide */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Integration Guide</h3>
              <HelpAccordion section={SHAREPOINT_GUIDE} expanded={expanded.has(SHAREPOINT_GUIDE.id)} onToggle={() => toggle(SHAREPOINT_GUIDE.id)} />
            </div>

            {/* Quick Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Quick Tips</h3>
              <ul className="space-y-1.5 text-xs text-foreground">
                <li>💡 Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to open global search across all modules</li>
                <li>💡 Use the gold <strong>+</strong> button (bottom right) to quickly add tasks, classes, or events from any page</li>
                <li>💡 Drag and drop cards between columns in Board view to update status instantly</li>
                <li>💡 Click any KPI card sparkline to see trend data at a glance</li>
                <li>💡 Export any module to CSV using the download button in the toolbar</li>
                <li>💡 Back up all your data from Settings → Export All Data (JSON)</li>
                <li>💡 Add task dependencies to prevent work from starting before blockers are resolved</li>
                <li>💡 Create milestones linked to module tags — progress auto-calculates from task completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HelpAccordion({ section, expanded, onToggle }: { section: HelpSection; expanded: boolean; onToggle: () => void }) {
  const Icon = section.icon;
  return (
    <div className={cn('rounded-lg border transition-colors', expanded ? 'border-accent/30 bg-accent/5' : 'border-transparent hover:bg-muted/30')}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-accent shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <Icon className={cn('w-4 h-4 shrink-0', expanded ? 'text-accent' : 'text-muted-foreground')} />
        <span className={cn('text-sm font-medium', expanded ? 'text-foreground' : 'text-foreground/80')}>{section.title}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-10">
          <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {section.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </div>
          {section.link && (
            <Link to={section.link} className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-accent hover:underline">
              {section.linkLabel} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
