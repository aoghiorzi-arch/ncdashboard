import { useState, useEffect } from 'react';
import { expenseCRUD, incomeCRUD, getSettings, generateId, type Expense, type Income } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { exportToCSV, importCSVFile, parseCSV } from '@/lib/csv';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SortableHeader, useSortableData } from '@/components/SortableHeader';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Trash2, TrendingUp, TrendingDown, Download, Upload, PiggyBank, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteWithUndo } from '@/lib/undoDelete';
import { toast as sonnerToast } from 'sonner';

const EXPENSE_CATS = ['Instructor Fees', 'Production', 'Platform & Tech', 'Legal & Compliance', 'Marketing', 'Events', 'Staff', 'Miscellaneous'];
const EXPENSE_STATUSES: Expense['status'][] = ['Draft', 'Approved', 'Paid', 'Disputed', 'Cancelled'];
const INCOME_SOURCES: Income['source'][] = ['Membership', 'Single Class', 'Founders', 'Grant', 'Sponsorship', 'Other'];
const INCOME_STATUSES: Income['status'][] = ['Expected', 'Received', 'Refunded'];

const statusBadge: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground', Approved: 'bg-accent/10 text-accent',
  Paid: 'bg-nc-success/10 text-nc-success', Disputed: 'bg-nc-alert/10 text-nc-alert',
  Cancelled: 'bg-secondary text-secondary-foreground',
  Expected: 'bg-accent/10 text-accent', Received: 'bg-nc-success/10 text-nc-success',
  Refunded: 'bg-nc-warn/10 text-nc-warn',
};

export default function BudgetExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [newIncomeOpen, setNewIncomeOpen] = useState(false);

  const expenseSort = useSortableData(expenses, 'description');
  const incomeSort = useSortableData(income, 'description');

  useEffect(() => {
    const refresh = () => { setExpenses(expenseCRUD.getAll()); setIncome(incomeCRUD.getAll()); };
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const settings = getSettings();
  const committed = expenses.filter(e => e.status === 'Approved' || e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const spent = expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const totalIncome = income.filter(i => i.status === 'Received').reduce((s, i) => s + i.amount, 0);
  const remaining = settings.totalBudget - committed;
  const pct = settings.totalBudget > 0 ? Math.round((spent / settings.totalBudget) * 100) : 0;

  const handleSaveExpense = (e: Expense) => {
    const user = settings.userName;
    if (editExpense) { expenseCRUD.update(e); logActivity('updated', 'Budget', e.description, user); }
    else { expenseCRUD.add({ ...e, id: generateId(), createdAt: new Date().toISOString() }); logActivity('created', 'Budget', e.description, user); }
    setExpenses(expenseCRUD.getAll()); setEditExpense(null); setNewExpenseOpen(false);
  };
  const handleDeleteExpense = (id: string) => {
    const item = expenses.find(e => e.id === id);
    if (!item) return;
    deleteWithUndo(item.description, item, () => {
      expenseCRUD.remove(id);
      logActivity('deleted', 'Budget', item.description, settings.userName);
      setExpenses(expenseCRUD.getAll()); setEditExpense(null);
    }, (restored) => {
      expenseCRUD.add(restored);
      setExpenses(expenseCRUD.getAll());
    });
  };

  const duplicateExpense = (e: Expense) => {
    const dup: Expense = { ...e, id: generateId(), description: `${e.description} (Copy)`, status: 'Draft', createdAt: new Date().toISOString() };
    expenseCRUD.add(dup);
    logActivity('created', 'Budget', dup.description, settings.userName);
    setExpenses(expenseCRUD.getAll());
    sonnerToast.success(`Duplicated "${e.description}"`);
  };

  const handleSaveIncome = (i: Income) => {
    const user = settings.userName;
    if (editIncome) { incomeCRUD.update(i); logActivity('updated', 'Income', i.description, user); }
    else { incomeCRUD.add({ ...i, id: generateId(), createdAt: new Date().toISOString() }); logActivity('created', 'Income', i.description, user); }
    setIncome(incomeCRUD.getAll()); setEditIncome(null); setNewIncomeOpen(false);
  };
  const handleDeleteIncome = (id: string) => {
    const item = income.find(i => i.id === id);
    incomeCRUD.remove(id);
    if (item) logActivity('deleted', 'Income', item.description, settings.userName);
    setIncome(incomeCRUD.getAll()); setEditIncome(null);
  };

  const { toast } = useToast();

  const handleImportExpenses = async () => {
    try {
      const csvText = await importCSVFile();
      const rows = parseCSV(csvText);
      if (rows.length === 0) { toast({ title: 'Empty CSV', description: 'No data rows found.', variant: 'destructive' }); return; }
      const now = new Date().toISOString();
      const user = settings.userName;
      let imported = 0;
      rows.forEach(row => {
        const description = row['Description'] || row['description'] || '';
        if (!description) return;
        const amount = parseFloat(row['Amount'] || row['amount'] || '0');
        const expense: Expense = {
          id: generateId(),
          description,
          category: row['Category'] || row['category'] || 'Miscellaneous',
          supplier: row['Supplier'] || row['supplier'] || row['Payee'] || row['payee'] || '',
          amount: isNaN(amount) ? 0 : amount,
          status: (row['Status'] || row['status'] || 'Draft') as Expense['status'],
          paymentMethod: (row['Payment Method'] || row['paymentMethod'] || 'Invoice') as Expense['paymentMethod'],
          invoiceRef: row['Invoice Ref'] || row['invoiceRef'] || '',
          invoiceDocLink: '',
          budgetLine: row['Budget Line'] || row['budgetLine'] || '',
          phase: (row['Phase'] || row['phase'] || 'Phase 1') as Expense['phase'],
          paymentDate: row['Date'] || row['Payment Date'] || row['paymentDate'] || '',
          recurring: false,
          recurrenceType: 'none',
          nextDueDate: '',
          notes: row['Notes'] || row['notes'] || '',
          createdBy: user,
          approvedBy: '',
          createdAt: now,
        };
        expenseCRUD.add(expense);
        imported++;
      });
      setExpenses(expenseCRUD.getAll());
      logActivity('imported', 'Budget', `${imported} expenses from CSV`, user);
      toast({ title: 'Import complete', description: `${imported} expense(s) imported successfully.` });
    } catch (err) {
      if (err instanceof Error && err.message !== 'No file selected') {
        toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Budget', value: `£${settings.totalBudget.toLocaleString()}` },
          { label: 'Committed', value: `£${committed.toLocaleString()}` },
          { label: 'Spent', value: `£${spent.toLocaleString()}` },
          { label: 'Remaining', value: `£${remaining.toLocaleString()}`, alert: remaining / settings.totalBudget < 0.2 },
          { label: 'Income Received', value: `£${totalIncome.toLocaleString()}` },
        ].map(item => (
          <div key={item.label} className={cn('bg-card rounded-lg p-4 nc-shadow-card border-l-4', item.alert ? 'border-l-nc-alert' : 'border-l-accent')}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg p-4 nc-shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Budget Utilisation</span>
          <span className="text-xs font-bold text-foreground">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', pct > 80 ? 'bg-nc-alert' : pct > 60 ? 'bg-nc-warn' : 'bg-accent')} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="income">Income</TabsTrigger></TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleImportExpenses}><Upload className="w-4 h-4 mr-1" /> Import CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(expenses, 'expenses', [
              { key: 'description', label: 'Description' }, { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'phase', label: 'Phase' }, { key: 'paymentDate', label: 'Date' },
            ])}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewExpenseOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Expense
            </Button>
          </div>
          <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left p-3"><SortableHeader label="Description" active={expenseSort.sortKey === 'description'} direction={expenseSort.sortKey === 'description' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('description')} /></th>
                <th className="text-left p-3"><SortableHeader label="Category" active={expenseSort.sortKey === 'category'} direction={expenseSort.sortKey === 'category' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('category')} /></th>
                <th className="text-right p-3"><SortableHeader label="Amount" active={expenseSort.sortKey === 'amount'} direction={expenseSort.sortKey === 'amount' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('amount')} className="justify-end" /></th>
                <th className="text-left p-3"><SortableHeader label="Status" active={expenseSort.sortKey === 'status'} direction={expenseSort.sortKey === 'status' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('status')} /></th>
                <th className="text-left p-3"><SortableHeader label="Phase" active={expenseSort.sortKey === 'phase'} direction={expenseSort.sortKey === 'phase' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('phase')} /></th>
                <th className="text-left p-3"><SortableHeader label="Date" active={expenseSort.sortKey === 'paymentDate'} direction={expenseSort.sortKey === 'paymentDate' ? expenseSort.sortDir : null} onClick={() => expenseSort.toggle('paymentDate')} /></th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {expenseSort.sorted.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditExpense(e)}>
                    <td className="p-3 font-medium text-foreground flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 text-nc-alert shrink-0" />{e.description}</td>
                    <td className="p-3 text-xs text-muted-foreground">{e.category}</td>
                    <td className="p-3 text-right font-medium">£{e.amount.toLocaleString()}</td>
                    <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[e.status])}>{e.status}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{e.phase}</td>
                    <td className="p-3 text-xs text-muted-foreground">{e.paymentDate || '—'}</td>
                    <td className="p-3"><button onClick={ev => { ev.stopPropagation(); handleDeleteExpense(e.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
                {expenseSort.sorted.length === 0 && <tr><td colSpan={7}><EmptyState icon={PiggyBank} title="No expenses recorded" description="Add your first expense to start tracking your budget." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewExpenseOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Expense</Button>} /></td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCSV(income, 'income', [
              { key: 'description', label: 'Description' }, { key: 'source', label: 'Source' },
              { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'dateReceived', label: 'Date' },
            ])}><Download className="w-4 h-4 mr-1" /> CSV</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewIncomeOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Income
            </Button>
          </div>
          <div className="bg-card rounded-lg nc-shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left p-3"><SortableHeader label="Description" active={incomeSort.sortKey === 'description'} direction={incomeSort.sortKey === 'description' ? incomeSort.sortDir : null} onClick={() => incomeSort.toggle('description')} /></th>
                <th className="text-left p-3"><SortableHeader label="Source" active={incomeSort.sortKey === 'source'} direction={incomeSort.sortKey === 'source' ? incomeSort.sortDir : null} onClick={() => incomeSort.toggle('source')} /></th>
                <th className="text-right p-3"><SortableHeader label="Amount" active={incomeSort.sortKey === 'amount'} direction={incomeSort.sortKey === 'amount' ? incomeSort.sortDir : null} onClick={() => incomeSort.toggle('amount')} className="justify-end" /></th>
                <th className="text-left p-3"><SortableHeader label="Status" active={incomeSort.sortKey === 'status'} direction={incomeSort.sortKey === 'status' ? incomeSort.sortDir : null} onClick={() => incomeSort.toggle('status')} /></th>
                <th className="text-left p-3"><SortableHeader label="Date" active={incomeSort.sortKey === 'dateReceived'} direction={incomeSort.sortKey === 'dateReceived' ? incomeSort.sortDir : null} onClick={() => incomeSort.toggle('dateReceived')} /></th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {incomeSort.sorted.map(i => (
                  <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setEditIncome(i)}>
                    <td className="p-3 font-medium text-foreground flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-nc-success shrink-0" />{i.description}</td>
                    <td className="p-3 text-xs text-muted-foreground">{i.source}</td>
                    <td className="p-3 text-right font-medium">£{i.amount.toLocaleString()}</td>
                    <td className="p-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusBadge[i.status])}>{i.status}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{i.dateReceived || '—'}</td>
                    <td className="p-3"><button onClick={ev => { ev.stopPropagation(); handleDeleteIncome(i.id); }} className="text-muted-foreground hover:text-nc-alert"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
                {incomeSort.sorted.length === 0 && <tr><td colSpan={6}><EmptyState icon={TrendingUp} title="No income recorded" description="Add your first income entry." action={<Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewIncomeOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Income</Button>} /></td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <ExpenseDialog item={editExpense} open={!!editExpense || newExpenseOpen} onOpenChange={o => { if (!o) { setEditExpense(null); setNewExpenseOpen(false); } }} onSave={handleSaveExpense} onDelete={handleDeleteExpense} />
      <IncomeDialog item={editIncome} open={!!editIncome || newIncomeOpen} onOpenChange={o => { if (!o) { setEditIncome(null); setNewIncomeOpen(false); } }} onSave={handleSaveIncome} onDelete={handleDeleteIncome} />
    </div>
  );
}

function ExpenseDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: Expense | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (e: Expense) => void; onDelete: (id: string) => void;
}) {
  const blank: Expense = { id: '', description: '', category: 'Miscellaneous', supplier: '', amount: 0, status: 'Draft', paymentMethod: 'Invoice', invoiceRef: '', invoiceDocLink: '', budgetLine: '', phase: 'Phase 1', paymentDate: '', recurring: false, recurrenceType: 'none', nextDueDate: '', notes: '', createdBy: '', approvedBy: '', createdAt: '' };
  const [form, setForm] = useState<Expense>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<Expense>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Expense' : 'New Expense'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Description" value={form.description} onChange={e => u({ description: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={v => u({ category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Amount (£)</label><Input type="number" className="mt-1" value={form.amount || ''} onChange={e => u({ amount: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Supplier / Payee" value={form.supplier} onChange={e => u({ supplier: e.target.value })} />
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as Expense['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={form.paymentMethod} onValueChange={v => u({ paymentMethod: v as Expense['paymentMethod'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Invoice','Card','Transfer','Other'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phase</label>
              <Select value={form.phase} onValueChange={v => u({ phase: v as Expense['phase'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Phase 1','Phase 2','General Overhead'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Invoice/Receipt ref" value={form.invoiceRef} onChange={e => u({ invoiceRef: e.target.value })} />
            <div><label className="text-xs font-medium text-muted-foreground">Payment Date</label><Input type="date" className="mt-1" value={form.paymentDate} onChange={e => u({ paymentDate: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.recurring} onCheckedChange={v => u({ recurring: v })} />
            <label className="text-xs font-medium text-muted-foreground">Recurring</label>
            {form.recurring && (
              <Select value={form.recurrenceType} onValueChange={v => u({ recurrenceType: v as Expense['recurrenceType'] })}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
              </Select>
            )}
          </div>
          <Textarea placeholder="Notes..." value={form.notes} onChange={e => u({ notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.description.trim()) onSave(form); }} disabled={!form.description.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncomeDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: Income | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (i: Income) => void; onDelete: (id: string) => void;
}) {
  const blank: Income = { id: '', source: 'Membership', description: '', amount: 0, dateReceived: '', reference: '', status: 'Expected', createdAt: '' };
  const [form, setForm] = useState<Income>(blank);
  useEffect(() => { setForm(item || blank); }, [item]);
  const u = (p: Partial<Income>) => setForm(f => ({ ...f, ...p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Income' : 'New Income'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Description" value={form.description} onChange={e => u({ description: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Source</label>
              <Select value={form.source} onValueChange={v => u({ source: v as Income['source'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Amount (£)</label><Input type="number" className="mt-1" value={form.amount || ''} onChange={e => u({ amount: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => u({ status: v as Income['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Date Received</label><Input type="date" className="mt-1" value={form.dateReceived} onChange={e => u({ dateReceived: e.target.value })} /></div>
          </div>
          <Input placeholder="Reference" value={form.reference} onChange={e => u({ reference: e.target.value })} />
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.description.trim()) onSave(form); }} disabled={!form.description.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
