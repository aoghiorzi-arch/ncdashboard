// localStorage data layer for NC Dashboard

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  addedBy: string;
  addedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  moduleTag: 'Calendar' | 'Class' | 'Instructor' | 'Legal' | 'Event' | 'Budget' | 'Marketing' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'In Review' | 'Complete';
  owner: string;
  dueDate: string;
  subtasks: { id: string; label: string; done: boolean }[];
  notes: { id: string; text: string; author: string; timestamp: string }[];
  attachments?: Attachment[];
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: string;
  parentTaskId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'Milestone' | 'Filming Day' | 'Meeting' | 'Deadline' | 'Event' | 'Reminder';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string;
  notes: string;
  recurrence: 'none' | 'weekly' | 'monthly';
  createdAt: string;
}

export interface ClassRecord {
  id: string;
  title: string;
  instructorName: string;
  category: string;
  subCategory: string;
  episodeCountTarget: number;
  episodeCountDelivered: number;
  pipelineStage: string;
  qaTier: 'Standard' | 'Elevated';
  disclaimerRequired: boolean;
  classGuideStatus: 'Not Started' | 'Draft' | 'Review' | 'Final';
  kajabiPageStatus: 'Not Built' | 'Stub' | 'Complete' | 'Live';
  targetPublicationDate: string;
  actualPublicationDate: string;
  notes: { id: string; text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  fullName: string;
  title: string;
  institution: string;
  email: string;
  phone: string;
  specialism: string;
  categoryAlignment: string;
  adventistConnection: 'Yes' | 'No' | 'Sympathetic';
  status: string;
  proposedClassTitles: string;
  agreementVersion: string;
  engagementFee: string;
  ipAssignmentStatus: 'Pending' | 'Signed' | 'N/A';
  filmingDates: string;
  classesProduced: number;
  lastContactDate: string;
  rating: number;
  tags: string;
  notes: { id: string; text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface NCDocument {
  id: string;
  title: string;
  folder: string;
  version: string;
  status: 'Draft' | 'In Review' | 'Final' | 'Superseded';
  owner: string;
  lastReviewedDate: string;
  nextReviewDate: string;
  directLink: string;
  tags: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'Class Idea' | 'Feature' | 'Marketing' | 'Partnership' | 'Event' | 'Other';
  submittedBy: string;
  status: 'Raw Idea' | 'Under Consideration' | 'Validated' | 'In Backlog' | 'Declined' | 'Promoted';
  impactScore: number;
  effortScore: number;
  notes: { id: string; text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface NCEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  capacity: number;
  status: 'Planning' | 'Confirmed' | 'In Progress' | 'Complete' | 'Cancelled';
  leadOrganiser: string;
  programme: { id: string; segment: string; time: string; owner: string; avRequirements: string }[];
  guestList: { id: string; name: string; type: 'VIP' | 'Speaker' | 'General' | 'Press'; rsvp: 'Pending' | 'Confirmed' | 'Declined'; dietary: string }[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partnership {
  id: string;
  organisationName: string;
  type: 'Church' | 'Academic' | 'Media' | 'Funder' | 'Supplier' | 'Other';
  primaryContactName: string;
  email: string;
  phone: string;
  relationshipOwner: string;
  status: 'Identified' | 'In Conversation' | 'Agreed' | 'Active' | 'Dormant' | 'Ended';
  agreementType: 'MOU' | 'Contract' | 'Informal' | 'None';
  agreementDocLink: string;
  value: string;
  nextAction: string;
  nextActionDate: string;
  notes: { id: string; text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstalment {
  id: string;
  amount: number;
  date: string;
  reference: string;
  status: 'Pending' | 'Paid';
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  supplier: string;
  amount: number;
  totalAmount?: number;
  payments?: PaymentInstalment[];
  classId?: string;
  status: 'Draft' | 'Approved' | 'Paid' | 'Partially Paid' | 'Disputed' | 'Cancelled';
  paymentMethod: 'Invoice' | 'Card' | 'Transfer' | 'Other';
  invoiceRef: string;
  invoiceDocLink: string;
  budgetLine: string;
  phase: 'Phase 1' | 'Phase 2' | 'General Overhead';
  paymentDate: string;
  recurring: boolean;
  recurrenceType: 'monthly' | 'annual' | 'none';
  nextDueDate: string;
  notes: string;
  createdBy: string;
  approvedBy: string;
  createdAt: string;
}

export interface Income {
  id: string;
  source: 'Membership' | 'Single Class' | 'Founders' | 'Grant' | 'Sponsorship' | 'Other';
  description: string;
  amount: number;
  dateReceived: string;
  reference: string;
  status: 'Expected' | 'Received' | 'Refunded';
  createdAt: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  category: 'GDPR' | 'PECR' | 'Safeguarding' | 'Trading Standards' | 'Employment' | 'Other';
  status: 'Compliant' | 'Action Required' | 'In Progress' | 'Not Applicable';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  actionRequired: string;
  owner: string;
  dueDate: string;
  evidenceLink: string;
  notes: { id: string; text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  roleTitle: string;
  employmentType: 'Staff' | 'Contractor' | 'Volunteer' | 'Instructor';
  email: string;
  phone: string;
  responsibilities: string;
  gdprResponsibilities: string;
  startDate: string;
  endDate: string;
  dayRate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricEntry {
  id: string;
  date: string;
  totalMembers: number;
  activeMembers: number;
  foundersMembers: number;
  standardMembers: number;
  singleClassPurchases: number;
  totalRevenue: number;
  revenueThisMonth: number;
  courseCompletionRate: number;
  nps: number;
  notes: string;
  createdAt: string;
}

export interface SharePointConfig {
  enabled: boolean;
  siteUrl: string;
  tenantId: string;
  clientId: string;
  listMappings: Record<string, string>; // module key -> SharePoint list name
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface DashboardWidget {
  id: string;
  visible: boolean;
}

export interface NCSettings {
  platformName: string;
  launchDate: string;
  foundersCap: number;
  userName: string;
  totalBudget: number;
  totalMembers: number;
  foundersMembers: number;
  darkMode: boolean;
  sharePoint: SharePointConfig;
  userRole: UserRole;
  dashboardWidgets: DashboardWidget[];
}

const DEFAULT_SHAREPOINT: SharePointConfig = {
  enabled: false,
  siteUrl: '',
  tenantId: '',
  clientId: '',
  listMappings: {
    tasks: '', calendar: '', classes: '', instructors: '',
    documents: '', ideas: '', events: '', partnerships: '',
    expenses: '', income: '', compliance: '', team: '', metrics: '',
    checklists: '', workflows: '', outlookCalendar: '',
  },
};

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'kpis', visible: true },
  { id: 'health', visible: true },
  { id: 'milestones', visible: true },
  { id: 'statusReport', visible: true },
  { id: 'heatmap', visible: true },
  { id: 'weeklyDigest', visible: true },
  { id: 'agenda', visible: true },
  { id: 'alerts', visible: true },
  { id: 'burndown', visible: true },
  { id: 'recentTasks', visible: true },
  { id: 'activityFeed', visible: true },
  { id: 'checklists', visible: true },
];

const DEFAULT_SETTINGS: NCSettings = {
  platformName: 'Newbold Connect',
  launchDate: '2026-06-27',
  foundersCap: 200,
  userName: 'Alex',
  totalBudget: 50000,
  totalMembers: 0,
  foundersMembers: 0,
  darkMode: false,
  sharePoint: DEFAULT_SHAREPOINT,
  userRole: 'admin',
  dashboardWidgets: DEFAULT_WIDGETS,
};

function getStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const generateId = () => crypto.randomUUID();
const notify = () => window.dispatchEvent(new Event('nc-data-change'));

// Generic CRUD factory
function createCRUD<T extends { id: string }>(key: string) {
  return {
    getAll: (): T[] => getStore(key, []),
    save: (items: T[]) => { setStore(key, items); notify(); },
    add: (item: T) => { const all = getStore<T[]>(key, []); all.push(item); setStore(key, all); notify(); },
    update: (item: T) => { const all = getStore<T[]>(key, []).map(i => i.id === item.id ? item : i); setStore(key, all); notify(); },
    remove: (id: string) => { setStore(key, getStore<T[]>(key, []).filter(i => i.id !== id)); notify(); },
  };
}

// Tasks
export const getTasks = (): Task[] => getStore('nc_tasks', []);
export const saveTasks = (tasks: Task[]) => { setStore('nc_tasks', tasks); notify(); };

// Recurring Task Generation
export function generateRecurringTasks(): void {
  const tasks = getTasks();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const newTasks: Task[] = [];

  tasks.forEach(task => {
    if (!task.recurrence || task.recurrence === 'none' || !task.dueDate) return;
    if (task.status !== 'Complete') return;
    if (task.recurrenceEndDate && task.recurrenceEndDate < todayStr) return;

    // Check if a future instance already exists
    const hasUpcoming = tasks.some(t =>
      t.parentTaskId === task.id && t.status !== 'Complete' && t.dueDate >= todayStr
    );
    if (hasUpcoming) return;

    const lastDue = new Date(task.dueDate);
    let nextDue: Date;

    switch (task.recurrence) {
      case 'daily': nextDue = new Date(lastDue); nextDue.setDate(nextDue.getDate() + 1); break;
      case 'weekly': nextDue = new Date(lastDue); nextDue.setDate(nextDue.getDate() + 7); break;
      case 'biweekly': nextDue = new Date(lastDue); nextDue.setDate(nextDue.getDate() + 14); break;
      case 'monthly': nextDue = new Date(lastDue); nextDue.setMonth(nextDue.getMonth() + 1); break;
      default: return;
    }

    if (task.recurrenceEndDate && nextDue.toISOString().split('T')[0] > task.recurrenceEndDate) return;

    const newTask: Task = {
      ...task,
      id: generateId(),
      status: 'Not Started',
      dueDate: nextDue.toISOString().split('T')[0],
      parentTaskId: task.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      subtasks: task.subtasks.map(s => ({ ...s, done: false })),
      notes: [],
    };
    newTasks.push(newTask);
  });

  if (newTasks.length > 0) {
    saveTasks([...tasks, ...newTasks]);
  }
}

// All module CRUDs
export const calendarCRUD = createCRUD<CalendarEvent>('nc_calendar');
export const classCRUD = createCRUD<ClassRecord>('nc_classes');
export const instructorCRUD = createCRUD<Instructor>('nc_instructors');
export const documentCRUD = createCRUD<NCDocument>('nc_documents');
export const ideaCRUD = createCRUD<Idea>('nc_ideas');
export const eventCRUD = createCRUD<NCEvent>('nc_events');
export const partnershipCRUD = createCRUD<Partnership>('nc_partnerships');
export const expenseCRUD = createCRUD<Expense>('nc_expenses');
export const incomeCRUD = createCRUD<Income>('nc_income');
export const complianceCRUD = createCRUD<ComplianceItem>('nc_compliance');
export const teamCRUD = createCRUD<TeamMember>('nc_team');
export const metricCRUD = createCRUD<MetricEntry>('nc_metrics');
export const checklistCRUD = createCRUD<Checklist>('nc_checklists');

// Legacy compat
export const getExpenses = (): Expense[] => expenseCRUD.getAll();
export const getEvents = (): CalendarEvent[] => calendarCRUD.getAll();

// Settings
export const getSettings = (): NCSettings => getStore('nc_settings', DEFAULT_SETTINGS);
export const saveSettings = (s: NCSettings) => { setStore('nc_settings', s); notify(); };

// Backup
export const exportAllData = () => {
  const keys = ['nc_tasks','nc_calendar','nc_classes','nc_instructors','nc_documents',
    'nc_ideas','nc_events','nc_partnerships','nc_expenses','nc_income',
    'nc_compliance','nc_team','nc_metrics','nc_checklists','nc_settings'];
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  keys.forEach(k => { data[k] = getStore(k, k === 'nc_settings' ? DEFAULT_SETTINGS : []); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nc_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importAllData = (json: string) => {
  try {
    const data = JSON.parse(json);
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('nc_')) localStorage.setItem(key, JSON.stringify(value));
    });
    notify();
    return true;
  } catch {
    return false;
  }
};
