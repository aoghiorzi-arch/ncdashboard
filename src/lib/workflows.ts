import { generateId, checklistCRUD, type Checklist } from './storage';

// --- Workflow Data Model ---

export type TriggerModule = 'task' | 'class' | 'instructor' | 'event' | 'expense' | 'compliance' | 'partnership';

export interface WorkflowTrigger {
  module: TriggerModule;
  field: string;
  operator: 'equals' | 'changes_to' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

export type ActionType =
  | 'create_checklist_from_template'
  | 'create_task'
  | 'send_notification'
  | 'update_field';

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, string>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- Storage ---
const STORAGE_KEY = 'nc_workflows';
const LOG_KEY = 'nc_workflow_log';

export interface WorkflowLogEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  timestamp: string;
  actions: string[];
  success: boolean;
}

function getWorkflows(): Workflow[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveWorkflows(wfs: Workflow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wfs));
  window.dispatchEvent(new Event('nc-data-change'));
}

function getLog(): WorkflowLogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch { return []; }
}

function addLogEntry(entry: WorkflowLogEntry) {
  const log = getLog();
  log.unshift(entry);
  if (log.length > 100) log.length = 100;
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export const workflowStore = {
  getAll: getWorkflows,
  save: saveWorkflows,
  getLog,
  add: (wf: Workflow) => { const all = getWorkflows(); all.push(wf); saveWorkflows(all); },
  update: (wf: Workflow) => { saveWorkflows(getWorkflows().map(w => w.id === wf.id ? wf : w)); },
  remove: (id: string) => { saveWorkflows(getWorkflows().filter(w => w.id !== id)); },
};

// --- Trigger Field Options ---
export const TRIGGER_FIELDS: Record<TriggerModule, { field: string; label: string; values?: string[] }[]> = {
  task: [
    { field: 'status', label: 'Status', values: ['Not Started', 'In Progress', 'Blocked', 'In Review', 'Complete'] },
    { field: 'priority', label: 'Priority', values: ['Low', 'Medium', 'High', 'Critical'] },
    { field: 'moduleTag', label: 'Module Tag', values: ['Calendar', 'Class', 'Instructor', 'Legal', 'Event', 'Budget', 'Marketing', 'General'] },
  ],
  class: [
    { field: 'pipelineStage', label: 'Pipeline Stage', values: ['Concept', 'Contracted', 'Pre-production', 'Filming', 'Post-production', 'QA', 'Final QA', 'Live'] },
    { field: 'classGuideStatus', label: 'Class Guide Status', values: ['Not Started', 'Draft', 'Review', 'Final'] },
    { field: 'kajabiPageStatus', label: 'Kajabi Page Status', values: ['Not Built', 'Stub', 'Complete', 'Live'] },
  ],
  instructor: [
    { field: 'status', label: 'Status', values: ['Identified', 'Approached', 'In Discussion', 'Contracted', 'Filming', 'Complete', 'Inactive'] },
    { field: 'ipAssignmentStatus', label: 'IP Assignment', values: ['Pending', 'Signed', 'N/A'] },
  ],
  event: [
    { field: 'status', label: 'Status', values: ['Planning', 'Confirmed', 'In Progress', 'Complete', 'Cancelled'] },
  ],
  expense: [
    { field: 'status', label: 'Status', values: ['Draft', 'Approved', 'Paid', 'Disputed', 'Cancelled'] },
  ],
  compliance: [
    { field: 'status', label: 'Status', values: ['Compliant', 'Action Required', 'In Progress', 'Not Applicable'] },
    { field: 'priority', label: 'Priority', values: ['Low', 'Medium', 'High', 'Critical'] },
  ],
  partnership: [
    { field: 'status', label: 'Status', values: ['Identified', 'In Conversation', 'Agreed', 'Active', 'Dormant', 'Ended'] },
  ],
};

export const MODULE_LABELS: Record<TriggerModule, string> = {
  task: 'Task',
  class: 'Class',
  instructor: 'Instructor',
  event: 'Event',
  expense: 'Expense',
  compliance: 'Compliance',
  partnership: 'Partnership',
};

// --- Action Execution ---
function executeAction(action: WorkflowAction, triggerData: Record<string, unknown>): string {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'create_checklist_from_template': {
      const templateName = action.config.templateName || 'Workflow Checklist';
      const items = (action.config.items || '').split('\n').filter(Boolean).map(label => ({
        id: generateId(),
        label: label.trim(),
        done: false,
      }));
      const checklist: Checklist = {
        id: generateId(),
        title: templateName.replace('{title}', String(triggerData.title || '')),
        description: `Auto-created by workflow at ${new Date().toLocaleString()}`,
        items,
        color: action.config.color || 'hsl(var(--accent))',
        createdAt: now,
        updatedAt: now,
      };
      checklistCRUD.add(checklist);
      return `Created checklist "${checklist.title}" with ${items.length} items`;
    }

    case 'create_task': {
      // Import dynamically to avoid circular deps
      const tasksRaw = localStorage.getItem('nc_tasks');
      const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
      const newTask = {
        id: generateId(),
        title: (action.config.taskTitle || 'Auto-created task').replace('{title}', String(triggerData.title || '')),
        description: action.config.taskDescription || '',
        moduleTag: action.config.moduleTag || 'General',
        priority: action.config.priority || 'Medium',
        status: 'Not Started',
        owner: action.config.owner || 'System',
        dueDate: action.config.dueInDays
          ? new Date(Date.now() + parseInt(action.config.dueInDays) * 86400000).toISOString().split('T')[0]
          : '',
        subtasks: [],
        notes: [],
        pinned: false,
        createdBy: 'Workflow',
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(newTask);
      localStorage.setItem('nc_tasks', JSON.stringify(tasks));
      window.dispatchEvent(new Event('nc-data-change'));
      return `Created task "${newTask.title}"`;
    }

    case 'send_notification': {
      const message = (action.config.message || 'Workflow triggered')
        .replace('{title}', String(triggerData.title || ''));
      // Store as a notification in localStorage
      const notifs = JSON.parse(localStorage.getItem('nc_notifications') || '[]');
      notifs.unshift({ id: generateId(), message, timestamp: now, read: false });
      if (notifs.length > 50) notifs.length = 50;
      localStorage.setItem('nc_notifications', JSON.stringify(notifs));
      window.dispatchEvent(new Event('nc-data-change'));
      return `Notification sent: "${message}"`;
    }

    default:
      return `Unknown action: ${action.type}`;
  }
}

// --- Workflow Evaluation ---
export function evaluateWorkflows(
  module: TriggerModule,
  oldRecord: Record<string, unknown> | null,
  newRecord: Record<string, unknown>
) {
  const workflows = getWorkflows().filter(w => w.enabled && w.trigger.module === module);
  if (workflows.length === 0) return;

  for (const wf of workflows) {
    const { field, operator, value } = wf.trigger;
    const newVal = String(newRecord[field] || '');
    const oldVal = oldRecord ? String(oldRecord[field] || '') : '';
    let triggered = false;

    switch (operator) {
      case 'equals':
        triggered = newVal === value;
        break;
      case 'changes_to':
        triggered = newVal === value && oldVal !== value;
        break;
      case 'greater_than':
        triggered = parseFloat(newVal) > parseFloat(value);
        break;
      case 'less_than':
        triggered = parseFloat(newVal) < parseFloat(value);
        break;
      case 'contains':
        triggered = newVal.toLowerCase().includes(value.toLowerCase());
        break;
    }

    if (triggered) {
      const actionResults: string[] = [];
      let success = true;

      for (const action of wf.actions) {
        try {
          const result = executeAction(action, newRecord);
          actionResults.push(result);
        } catch (err) {
          actionResults.push(`Error: ${err}`);
          success = false;
        }
      }

      // Update workflow stats
      wf.lastTriggered = new Date().toISOString();
      wf.triggerCount++;
      workflowStore.update(wf);

      // Log
      addLogEntry({
        id: generateId(),
        workflowId: wf.id,
        workflowName: wf.name,
        timestamp: new Date().toISOString(),
        actions: actionResults,
        success,
      });
    }
  }
}
