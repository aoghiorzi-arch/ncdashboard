import { useState, useEffect } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/storage';
import {
  workflowStore, TRIGGER_FIELDS, MODULE_LABELS,
  type Workflow, type WorkflowTrigger, type WorkflowAction, type TriggerModule, type WorkflowLogEntry,
} from '@/lib/workflows';
import {
  Zap, Plus, Trash2, Edit2, Play, History, ChevronRight,
  AlertTriangle, CheckCircle2, ArrowRight, Settings2,
} from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  create_checklist_from_template: 'Create Checklist',
  create_task: 'Create Task',
  send_notification: 'Send Notification',
  update_field: 'Update Field',
};

const PRESET_WORKFLOWS: { name: string; description: string; trigger: WorkflowTrigger; actions: WorkflowAction[] }[] = [
  {
    name: 'Class → Final QA → Launch Checklist',
    description: 'When a class reaches Final QA, auto-create a Launch Readiness checklist',
    trigger: { module: 'class', field: 'pipelineStage', operator: 'changes_to', value: 'Final QA' },
    actions: [{
      type: 'create_checklist_from_template',
      config: {
        templateName: 'Launch Readiness: {title}',
        color: 'hsl(var(--destructive))',
        items: 'Legal & compliance review complete\nAll content proofread and approved\nTechnical QA passed\nMarketing materials ready\nPayment systems tested\nSupport documentation updated\nLaunch communications drafted\nFinal stakeholder sign-off',
      },
    }],
  },
  {
    name: 'Task Blocked → Notify',
    description: 'Send a notification when any task becomes blocked',
    trigger: { module: 'task', field: 'status', operator: 'changes_to', value: 'Blocked' },
    actions: [{
      type: 'send_notification',
      config: { message: '🚫 Task "{title}" is now blocked — needs attention' },
    }],
  },
  {
    name: 'Expense Approved → Create Payment Task',
    description: 'When an expense is approved, create a task to process payment',
    trigger: { module: 'expense', field: 'status', operator: 'changes_to', value: 'Approved' },
    actions: [{
      type: 'create_task',
      config: { taskTitle: 'Process payment: {title}', moduleTag: 'Budget', priority: 'High', dueInDays: '3' },
    }],
  },
  {
    name: 'Compliance Action Required → Alert',
    description: 'Notify when a compliance item needs action',
    trigger: { module: 'compliance', field: 'status', operator: 'changes_to', value: 'Action Required' },
    actions: [{
      type: 'send_notification',
      config: { message: '⚠️ Compliance item "{title}" requires action' },
    }],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(workflowStore.getAll);
  const [log, setLog] = useState<WorkflowLogEntry[]>(workflowStore.getLog);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Editor state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerModule, setTriggerModule] = useState<TriggerModule>('task');
  const [triggerField, setTriggerField] = useState('');
  const [triggerOperator, setTriggerOperator] = useState<WorkflowTrigger['operator']>('changes_to');
  const [triggerValue, setTriggerValue] = useState('');
  const [actions, setActions] = useState<WorkflowAction[]>([]);

  useEffect(() => {
    const refresh = () => { setWorkflows(workflowStore.getAll()); setLog(workflowStore.getLog()); };
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const fields = TRIGGER_FIELDS[triggerModule] || [];

  function resetEditor() {
    setName(''); setDescription('');
    setTriggerModule('task'); setTriggerField(''); setTriggerOperator('changes_to'); setTriggerValue('');
    setActions([]); setEditing(null);
  }

  function openEditor(wf?: Workflow) {
    if (wf) {
      setEditing(wf);
      setName(wf.name); setDescription(wf.description);
      setTriggerModule(wf.trigger.module); setTriggerField(wf.trigger.field);
      setTriggerOperator(wf.trigger.operator); setTriggerValue(wf.trigger.value);
      setActions([...wf.actions]);
    } else {
      resetEditor();
    }
    setShowEditor(true);
  }

  function applyPreset(preset: typeof PRESET_WORKFLOWS[0]) {
    setName(preset.name); setDescription(preset.description);
    setTriggerModule(preset.trigger.module); setTriggerField(preset.trigger.field);
    setTriggerOperator(preset.trigger.operator); setTriggerValue(preset.trigger.value);
    setActions([...preset.actions]);
    setShowPresets(false);
    setShowEditor(true);
  }

  function saveWorkflow() {
    if (!name.trim() || !triggerField || !triggerValue) return;
    const now = new Date().toISOString();
    const wf: Workflow = {
      id: editing?.id || generateId(),
      name, description,
      enabled: editing?.enabled ?? true,
      trigger: { module: triggerModule, field: triggerField, operator: triggerOperator, value: triggerValue },
      actions,
      triggerCount: editing?.triggerCount || 0,
      lastTriggered: editing?.lastTriggered,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    };
    if (editing) { workflowStore.update(wf); } else { workflowStore.add(wf); }
    setWorkflows(workflowStore.getAll());
    setShowEditor(false);
    resetEditor();
  }

  function toggleEnabled(wf: Workflow) {
    wf.enabled = !wf.enabled;
    wf.updatedAt = new Date().toISOString();
    workflowStore.update(wf);
    setWorkflows(workflowStore.getAll());
  }

  function deleteWorkflow(id: string) {
    workflowStore.remove(id);
    setWorkflows(workflowStore.getAll());
  }

  function addAction(type: WorkflowAction['type']) {
    const defaults: Record<string, Record<string, string>> = {
      create_checklist_from_template: { templateName: 'Checklist: {title}', color: 'hsl(var(--accent))', items: '' },
      create_task: { taskTitle: 'Follow-up: {title}', moduleTag: 'General', priority: 'Medium', dueInDays: '7' },
      send_notification: { message: 'Workflow triggered for "{title}"' },
      update_field: { targetField: '', targetValue: '' },
    };
    setActions(prev => [...prev, { type, config: defaults[type] || {} }]);
  }

  function updateActionConfig(idx: number, key: string, value: string) {
    setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, [key]: value } } : a));
  }

  function removeAction(idx: number) {
    setActions(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automated Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">No-code rules that trigger actions when your data changes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLog(true)} className="gap-1.5">
              <History className="w-4 h-4" /> Log
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)} className="gap-1.5">
              <Settings2 className="w-4 h-4" /> Presets
            </Button>
            <Button size="sm" onClick={() => openEditor()} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Rule
            </Button>
          </div>
        </div>

        {/* Workflow List */}
        {workflows.length === 0 ? (
          <div className="bg-card rounded-lg nc-shadow-card p-8 text-center space-y-3">
            <Zap className="w-10 h-10 mx-auto text-accent" />
            <h3 className="font-semibold text-foreground">No workflows yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create automated rules to trigger actions when your data changes. Start with a preset or build from scratch.
            </p>
            <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-1.5">
              <Settings2 className="w-4 h-4" /> Browse Presets
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(wf => (
              <div key={wf.id} className={cn('bg-card rounded-lg nc-shadow-card p-4 border-l-4 transition-all', wf.enabled ? 'border-l-nc-success' : 'border-l-muted opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{wf.name}</h3>
                      <Badge variant={wf.enabled ? 'default' : 'secondary'} className="text-[10px]">
                        {wf.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    {wf.description && <p className="text-xs text-muted-foreground mt-1">{wf.description}</p>}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="bg-muted px-2 py-0.5 rounded font-medium">
                        When {MODULE_LABELS[wf.trigger.module]} {wf.trigger.field} {wf.trigger.operator.replace('_', ' ')} "{wf.trigger.value}"
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      {wf.actions.map((a, i) => (
                        <span key={i} className="bg-accent/10 text-accent px-2 py-0.5 rounded font-medium">
                          {ACTION_LABELS[a.type] || a.type}
                        </span>
                      ))}
                    </div>

                    {wf.lastTriggered && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Last triggered: {new Date(wf.lastTriggered).toLocaleString()} · {wf.triggerCount} total
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={wf.enabled} onCheckedChange={() => toggleEnabled(wf)} />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditor(wf)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteWorkflow(wf.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Presets Dialog */}
        <Dialog open={showPresets} onOpenChange={setShowPresets}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Workflow Presets</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {PRESET_WORKFLOWS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(p)}
                  className="w-full text-left bg-muted/50 hover:bg-muted rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent shrink-0" />
                    <span className="font-medium text-sm text-foreground">{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">{p.description}</p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Log Dialog */}
        <Dialog open={showLog} onOpenChange={setShowLog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Workflow Log</DialogTitle></DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No workflow executions yet.</p>
              ) : log.map(entry => (
                <div key={entry.id} className={cn('text-xs p-3 rounded-lg border', entry.success ? 'bg-nc-success/5 border-nc-success/20' : 'bg-destructive/5 border-destructive/20')}>
                  <div className="flex items-center gap-2">
                    {entry.success ? <CheckCircle2 className="w-3.5 h-3.5 text-nc-success" /> : <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                    <span className="font-medium text-foreground">{entry.workflowName}</span>
                    <span className="text-muted-foreground ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  {entry.actions.map((a, i) => (
                    <p key={i} className="text-muted-foreground mt-1 ml-5">→ {a}</p>
                  ))}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Workflow' : 'New Workflow'}</DialogTitle></DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Auto-checklist on QA" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Description (optional)</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this rule do?" />
              </div>

              {/* Trigger */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-accent" /> When…
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Module</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={triggerModule}
                      onChange={e => { setTriggerModule(e.target.value as TriggerModule); setTriggerField(''); setTriggerValue(''); }}
                    >
                      {Object.entries(MODULE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={triggerField}
                      onChange={e => { setTriggerField(e.target.value); setTriggerValue(''); }}
                    >
                      <option value="">Select field…</option>
                      {fields.map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Operator</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={triggerOperator}
                      onChange={e => setTriggerOperator(e.target.value as WorkflowTrigger['operator'])}
                    >
                      <option value="changes_to">Changes to</option>
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater than</option>
                      <option value="less_than">Less than</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Value</label>
                    {fields.find(f => f.field === triggerField)?.values ? (
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={triggerValue}
                        onChange={e => setTriggerValue(e.target.value)}
                      >
                        <option value="">Select…</option>
                        {fields.find(f => f.field === triggerField)!.values!.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <Input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} placeholder="Value" />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 bg-accent/5 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-accent" /> Then…
                </h4>

                {actions.map((action, idx) => (
                  <div key={idx} className="bg-card rounded-lg p-3 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{ACTION_LABELS[action.type]}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeAction(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {action.type === 'create_checklist_from_template' && (
                      <div className="space-y-2">
                        <Input
                          value={action.config.templateName || ''}
                          onChange={e => updateActionConfig(idx, 'templateName', e.target.value)}
                          placeholder="Checklist name (use {title} for dynamic)"
                          className="text-xs h-8"
                        />
                        <Textarea
                          value={action.config.items || ''}
                          onChange={e => updateActionConfig(idx, 'items', e.target.value)}
                          placeholder="One item per line"
                          rows={4}
                          className="text-xs"
                        />
                      </div>
                    )}

                    {action.type === 'create_task' && (
                      <div className="space-y-2">
                        <Input
                          value={action.config.taskTitle || ''}
                          onChange={e => updateActionConfig(idx, 'taskTitle', e.target.value)}
                          placeholder="Task title (use {title})"
                          className="text-xs h-8"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={action.config.priority || 'Medium'}
                            onChange={e => updateActionConfig(idx, 'priority', e.target.value)}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                          <Input
                            value={action.config.dueInDays || ''}
                            onChange={e => updateActionConfig(idx, 'dueInDays', e.target.value)}
                            placeholder="Due in X days"
                            type="number"
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    )}

                    {action.type === 'send_notification' && (
                      <Input
                        value={action.config.message || ''}
                        onChange={e => updateActionConfig(idx, 'message', e.target.value)}
                        placeholder="Notification message (use {title})"
                        className="text-xs h-8"
                      />
                    )}
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => addAction('create_checklist_from_template')}>
                    + Checklist
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => addAction('create_task')}>
                    + Task
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => addAction('send_notification')}>
                    + Notification
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
                <Button onClick={saveWorkflow} disabled={!name.trim() || !triggerField || !triggerValue || actions.length === 0}>
                  {editing ? 'Update' : 'Create'} Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedPage>
  );
}
