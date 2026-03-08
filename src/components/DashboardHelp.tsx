import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  HelpCircle, X, ChevronDown, ChevronRight,
  LayoutDashboard, CheckSquare, Film, Users, FolderOpen,
  Lightbulb, PartyPopper, Handshake, PiggyBank, BarChart3,
  Shield, UserCog, CalendarDays, Settings, Globe, ShieldCheck,
  Flag, FileText, Link2, Users2, Moon, Upload, Download,
  Repeat, MessageSquare, Paperclip, Bell, History, LayoutGrid,
  Mail, Lock, ClipboardList, Zap, TrendingUp, ExternalLink, GanttChart,
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
    content: 'Your command centre. See KPI cards with sparkline trends, project health score (RAG indicator across tasks, budget, schedule & compliance), milestone progress, workload heatmap, weekly status report, alerts, and activity feed — all in one view. Use the **Customize** button to show/hide and reorder widgets. Generate a printable **PDF Status Report** from the toolbar.',
    link: '/', linkLabel: 'Go to Dashboard',
  },
  {
    id: 'tasks', icon: CheckSquare, title: 'Tasks',
    content: 'Create, assign, and track tasks across four views: **Board** (Kanban drag-and-drop), **Swim Lanes** (grouped by priority), **List** (sortable table), and **Gantt** (timeline chart with zoom, progress bars, and today marker). Each task supports status, priority, module tags, due dates, recurrence, dependencies, comments, and file attachments. Use bulk actions to change status or delete multiple tasks. Smart warnings highlight overdue (🔴) and approaching (🟡) deadlines. **Import tasks from CSV** using the upload button, or **export to CSV** for reporting.',
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
    content: 'Central calendar for milestones, filming days, meetings, deadlines, events, and reminders. Supports recurring events (weekly/monthly). View by month with event type colour coding. When SharePoint is configured, syncs with Outlook Calendar.',
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
    content: 'Track partner organisations through relationship stages (Identified → In Conversation → Agreed → Active → Dormant → Ended). Record agreement types, values, and next actions. Overdue partnership actions appear in notifications.',
    link: '/partnerships', linkLabel: 'Go to Partnerships',
  },
  {
    id: 'budget', icon: PiggyBank, title: 'Budget & Expenses',
    content: 'Full expense tracking with categories, approval workflow, payment methods, and recurring items. Income tracking for memberships, grants, and sponsorships. Dashboard shows a budget burn-down chart. Low budget warnings (below 20%) appear in notifications.',
    link: '/budget', linkLabel: 'Go to Budget',
  },
  {
    id: 'metrics', icon: BarChart3, title: 'Platform Metrics',
    content: 'Track key platform KPIs: total/active members, founders vs standard, single class purchases, revenue, course completion rates, and NPS scores over time.',
    link: '/metrics', linkLabel: 'Go to Metrics',
  },
  {
    id: 'legal', icon: Shield, title: 'Legal & Compliance',
    content: 'Monitor compliance across GDPR, PECR, Safeguarding, Trading Standards, and Employment categories. Traffic-light status with action tracking, due dates, and evidence links. Overdue compliance items surface in the notifications panel.',
    link: '/legal', linkLabel: 'Go to Legal',
  },
  {
    id: 'team', icon: UserCog, title: 'Team & Roles',
    content: 'Manage team members, contractors, volunteers, and instructors. Track roles, responsibilities, GDPR duties, start/end dates, and day rates.',
    link: '/team', linkLabel: 'Go to Team',
  },
  {
    id: 'audit', icon: History, title: 'Audit Trail',
    content: 'Full activity log of all changes across the dashboard. Search by keyword, filter by module or action type. Entries are grouped by date and show who did what, when. Tracks creates, updates, deletes, comments, attachments, and status changes.',
    link: '/audit', linkLabel: 'Go to Audit Trail',
  },
  {
    id: 'checklists', icon: ClipboardList, title: 'Checklists',
    content: 'Create unlimited personalised checklists with colour-coded headers, descriptions, and progress tracking. Use **templates** (Launch Readiness, Team Onboarding, Weekly Review, Event Planning) to get started quickly, or build from scratch. Tick items off from the dashboard widget or the dedicated Checklists page.',
    link: '/checklists', linkLabel: 'Go to Checklists',
  },
  {
    id: 'workflows', icon: Zap, title: 'Automated Workflows',
    content: 'No-code automation rules that trigger actions when your data changes. Set triggers like "When a class reaches Final QA" and define actions: **Create Checklist**, **Create Task**, or **Send Notification**. Use dynamic `{title}` variables in action text. Browse **presets** for common rules or build custom ones. View the **execution log** to track what fired and when. Enable/disable individual workflows with a toggle.',
    link: '/workflows', linkLabel: 'Go to Workflows',
  },
  {
    id: 'forecasting', icon: TrendingUp, title: 'Predictive Analytics',
    content: 'Forecasting dashboard with four key predictions: **Projected Completion** (based on velocity), **Budget Runway** (months until depletion), **Weekly Velocity** (tasks/week vs target), and **Completion Rate**. Charts show 8-week velocity trends and budget projections. **Early warning alerts** flag schedule slippage, budget risks, blocked tasks, and zero-velocity periods. Module completion breakdown shows progress by department.',
    link: '/forecasting', linkLabel: 'Go to Forecasting',
  },
  {
    id: 'interactive-gantt', icon: CalendarDays, title: 'Interactive Gantt Chart',
    content: 'Full-page interactive Gantt chart with **drag-to-reschedule** — grab any task bar and slide it to a new date. Dependent tasks **auto-cascade** when you move a blocker. Toggle **Critical Path** to highlight the longest dependency chain in red. Dependency arrows connect blocker → blocked tasks. Today and Launch date markers provide context. Tasks are colour-coded by status with priority rings and overdue pulse animations.',
    link: '/gantt', linkLabel: 'Go to Gantt Chart',
  },
  {
    id: 'portal', icon: ExternalLink, title: 'Stakeholder Portal',
    content: 'Read-only branded view for external partners, funders, and board members at **/portal**. Shows curated KPIs (health, days to launch, tasks, classes, budget), health breakdown with circular score, content pipeline stages, upcoming events, and partnership summary. No sidebar or admin controls — just a clean, shareable progress report. Share the URL directly with stakeholders.',
    link: '/portal', linkLabel: 'Open Portal',
  },
];

const ADVANCED_FEATURES: HelpSection[] = [
  {
    id: 'gantt', icon: BarChart3, title: 'Gantt Chart View',
    content: 'A visual timeline for tasks showing start-to-due date bars with progress fills, a red "Today" marker, and zoom controls. Tasks are colour-coded by status: green (complete), gold (in progress), red (blocked/critical). Click any bar to open the task for editing. Access it from the **Gantt** tab in the Tasks toolbar.',
  },
  {
    id: 'csv', icon: Download, title: 'CSV Import & Export',
    content: 'Export filtered tasks to CSV using the **download** button in the Tasks toolbar. Import tasks from CSV using the **upload** button — the importer maps columns by header name (Title, Status, Priority, Module, Owner, Due Date, Description). All other modules support CSV export from their respective toolbars.',
  },
  {
    id: 'dependencies', icon: Link2, title: 'Task Dependencies',
    content: 'Link tasks as blocker/blocked-by relationships. Open any task and use the Dependencies section to add blockers or specify which tasks this one blocks. Unresolved blockers show warning badges on Kanban cards and in the Gantt chart. Dependencies are tracked separately and persist across sessions.',
  },
  {
    id: 'recurring', icon: Repeat, title: 'Recurring Tasks',
    content: 'Set tasks to recur daily, weekly, bi-weekly, or monthly. When a recurring task is completed, a new instance is automatically generated with the next due date. Optionally set a recurrence end date. Recurring tasks show a repeat icon in views.',
  },
  {
    id: 'comments', icon: MessageSquare, title: 'Task Comments',
    content: 'Add threaded comments to any task. Comments are timestamped, attributed to the current user, and logged in the audit trail. Remove comments by hovering and clicking the X icon.',
  },
  {
    id: 'attachments', icon: Paperclip, title: 'Task Attachments',
    content: 'Attach links to files on SharePoint, OneDrive, Google Drive, or any URL. Each attachment records the file name, URL, who added it, and when. Attachments appear in the task dialog with external link icons.',
  },
  {
    id: 'darkmode', icon: Moon, title: 'Dark Mode',
    content: 'Toggle dark mode from **Settings → General → Dark Mode**. The theme applies immediately across all pages with no flash on page load. The entire colour system adapts — navy sidebar, cream backgrounds, and gold accents transform into deep blues and warm golds.',
    link: '/settings', linkLabel: 'Go to Settings',
  },
  {
    id: 'notifications', icon: Bell, title: 'Smart Notifications',
    content: 'The notification bell in the top bar aggregates alerts from all modules: overdue tasks, tasks due within 3 days, blocked tasks, low budget warnings, document reviews due, compliance actions required, upcoming calendar events (7 days), and overdue partnership actions. Filter by category (Tasks, Budget, Documents, Compliance, Calendar, Partnerships) to focus on what matters.',
  },
  {
    id: 'widgets', icon: LayoutGrid, title: 'Dashboard Customisation',
    content: 'Click **Customize** on the dashboard to show/hide widgets and reorder them using up/down arrows. Available widgets: KPI Cards, Project Health, Milestones, Status Report, Heatmap, Weekly Digest, Agenda, Alerts, Budget Burn-down, Recent Tasks, Activity Feed. Reset to defaults at any time. Viewer role users cannot customise.',
  },
  {
    id: 'health', icon: ShieldCheck, title: 'Project Health Score',
    content: 'The RAG health indicator auto-calculates a 0-100 score across four dimensions: Tasks (penalises overdue & blocked), Budget (remaining ratio), Schedule (days to launch vs completion rate), and Compliance (action items). Each factor shows a colour-coded progress bar — green (70+), amber (40-69), red (<40).',
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
    id: 'status-report', icon: FileText, title: 'Weekly Status Report & PDF',
    content: 'Auto-generated weekly summary showing tasks completed, new tasks created, completion rate, days to launch, risks & blockers, upcoming deadlines, and key financial metrics. Click **Generate Report** to open a print-friendly PDF view with full KPIs, risk summary, budget overview, and overdue tasks.',
  },
  {
    id: 'rbac', icon: Lock, title: 'Role-Based Access Control',
    content: 'Three roles control access: **Admin** (full access to all features and settings), **Editor** (create and edit content, no settings access), **Viewer** (read-only dashboards and reports). Set your role in Settings → Access Control. When connected to SharePoint, roles map to Azure AD groups managed by your IT admin.',
    link: '/settings', linkLabel: 'Go to Settings',
  },
];

const INTEGRATION_GUIDES: HelpSection[] = [
  {
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
   • Map each module to its SharePoint list name (including Outlook Calendar for sync)

4. **IT Team: Build the Graph API Proxy**
   • Create an Azure Function or API endpoint that authenticates via your App Registration
   • Proxy CRUD operations between the dashboard and SharePoint lists using the Microsoft Graph API
   • The dashboard will call this proxy instead of localStorage when SharePoint is enabled

5. **Microsoft SSO (Login Page)**
   • The login page includes a "Sign in with Microsoft" button
   • When SharePoint is configured, this button activates and connects to Azure AD OAuth
   • Configure the redirect URI in your Azure AD app to enable SSO

**Current Status:** Data is stored locally in your browser. Enabling SharePoint in settings saves the configuration — your IT team then connects the actual API proxy to make sync live.`,
    link: '/settings', linkLabel: 'Go to Settings',
  },
  {
    id: 'outlook', icon: CalendarDays, title: 'Outlook Calendar Sync',
    content: `When SharePoint integration is enabled, the Calendar module can sync bi-directionally with an Outlook Calendar.

**Setup:**
1. In Settings → SharePoint Integration → List Mappings, enter your Outlook Calendar list name
2. Ensure the Azure AD app has **Calendars.ReadWrite** permission
3. Your IT team's Graph API proxy should handle calendar event CRUD via the /me/calendar/events endpoint

**Supported sync:** Milestones, Filming Days, Meetings, Deadlines, Events, and Reminders all map to Outlook event types with appropriate categories.`,
    link: '/calendar', linkLabel: 'Go to Calendar',
  },
  {
    id: 'email', icon: Mail, title: 'Email Notifications (Power Automate)',
    content: `Email notifications can be set up using Microsoft Power Automate to send alerts for key events.

**Recommended flows:**

1. **Overdue Task Alert** — Trigger: scheduled (daily), reads NC_Tasks list, filters for overdue open tasks, sends email digest to task owners
2. **Task Assignment** — Trigger: when item created/modified in NC_Tasks, sends notification to the assigned owner
3. **Compliance Deadline** — Trigger: scheduled (weekly), checks NC_Compliance list for upcoming due dates, sends reminder to compliance owners
4. **Budget Threshold** — Trigger: when item modified in NC_Expenses, calculates total vs budget, sends alert if below 20%
5. **Weekly Digest** — Trigger: scheduled (Friday), compiles weekly stats and sends summary to all team members

**Setup:**
1. Create a Power Automate flow in your Microsoft 365 environment
2. Use the "When an item is created or modified" trigger for your SharePoint lists
3. Configure conditions and email templates
4. No changes needed in this dashboard — Power Automate reads directly from SharePoint

**Note:** Email notifications require the SharePoint integration to be active so that Power Automate can read from the shared lists.`,
  },
  {
    id: 'sso', icon: Lock, title: 'Microsoft SSO / Azure AD',
    content: `The login page supports Microsoft Single Sign-On when SharePoint is configured.

**How it works:**
1. Enable SharePoint in Settings with your Tenant ID and Client ID
2. The "Sign in with Microsoft" button on the login page becomes active
3. Users authenticate via Azure AD and are redirected back to the dashboard
4. User roles can be mapped from Azure AD security groups to Admin/Editor/Viewer

**Azure AD Configuration:**
• Add a redirect URI: https://yourdomain.com/login/callback
• Under Authentication, enable "ID tokens" and "Access tokens"
• Under Token Configuration, add optional claims for "groups"
• Map security groups to dashboard roles in your Graph API proxy

**Current Status:** The button and flow are built. When your IT team completes the Azure AD app registration and Graph API proxy, SSO will activate automatically based on the SharePoint configuration.`,
    link: '/login', linkLabel: 'Go to Login',
  },
];

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
    const all = [...CORE_MODULES, ...ADVANCED_FEATURES, ...INTEGRATION_GUIDES].map(s => s.id);
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Core Modules ({CORE_MODULES.length})</h3>
              <div className="space-y-1">
                {CORE_MODULES.map(section => (
                  <HelpAccordion key={section.id} section={section} expanded={expanded.has(section.id)} onToggle={() => toggle(section.id)} />
                ))}
              </div>
            </div>

            {/* Advanced Features */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Advanced Features ({ADVANCED_FEATURES.length})</h3>
              <div className="space-y-1">
                {ADVANCED_FEATURES.map(section => (
                  <HelpAccordion key={section.id} section={section} expanded={expanded.has(section.id)} onToggle={() => toggle(section.id)} />
                ))}
              </div>
            </div>

            {/* Integration Guides */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Integration & Setup Guides ({INTEGRATION_GUIDES.length})</h3>
              <div className="space-y-1">
                {INTEGRATION_GUIDES.map(section => (
                  <HelpAccordion key={section.id} section={section} expanded={expanded.has(section.id)} onToggle={() => toggle(section.id)} />
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Quick Tips</h3>
              <ul className="space-y-1.5 text-xs text-foreground">
                <li>💡 Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to open global search across all modules</li>
                <li>💡 Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">N</kbd> to quickly add a new item from anywhere</li>
                <li>💡 Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> to open keyboard shortcuts</li>
                <li>💡 Use the gold <strong>+</strong> button (bottom right) to quickly add tasks, classes, or events from any page</li>
                <li>💡 Drag and drop cards between columns in Board view to update status instantly</li>
                <li>💡 Switch to **Gantt view** in Tasks for a visual timeline with progress bars</li>
                <li>💡 **Import CSV** to bulk-create tasks — the importer auto-maps standard column headers</li>
                <li>💡 Toggle **dark mode** in Settings for comfortable late-night work sessions</li>
                <li>💡 Check the **notification bell** for a categorised summary of all alerts across modules</li>
                <li>💡 Use the **Customize** button on the dashboard to hide widgets you don't need</li>
                <li>💡 Export any module to CSV using the download button in the toolbar</li>
                <li>💡 Back up all your data from Settings → Export All Data (JSON)</li>
                <li>💡 Add task **dependencies** to prevent work from starting before blockers are resolved</li>
                <li>💡 Set tasks to **recur** automatically — complete one, and the next instance appears</li>
                <li>💡 Create milestones linked to module tags — progress auto-calculates from task completion</li>
                <li>💡 Visit the **Audit Trail** to see a full history of all changes across the dashboard</li>
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
