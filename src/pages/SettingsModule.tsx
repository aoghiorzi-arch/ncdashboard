import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, importAllData, type NCSettings, type SharePointConfig, type UserRole } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Trash2, AlertTriangle, Globe, Info, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const MODULE_LABELS: Record<string, string> = {
  tasks: 'Tasks', calendar: 'Calendar', classes: 'Classes Pipeline',
  instructors: 'Instructor CRM', documents: 'Documents', ideas: 'Ideas & Backlog',
  events: 'Events', partnerships: 'Partnerships', expenses: 'Budget & Expenses',
  income: 'Income', compliance: 'Legal & Compliance', team: 'Team & Roles', metrics: 'Platform Metrics',
  outlookCalendar: 'Outlook Calendar',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access — can manage settings, data, and all modules',
  editor: 'Can create and edit content but cannot change settings or delete data',
  viewer: 'Read-only access — can view dashboards and reports only',
};

export default function SettingsModule() {
  const [settings, setSettings] = useState<NCSettings>(getSettings);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearPhrase, setClearPhrase] = useState('');

  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  const update = (patch: Partial<NCSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
  };

  const updateSP = (patch: Partial<SharePointConfig>) => {
    update({ sharePoint: { ...settings.sharePoint, ...patch } });
  };

  const updateListMapping = (key: string, value: string) => {
    update({
      sharePoint: {
        ...settings.sharePoint,
        listMappings: { ...settings.sharePoint.listMappings, [key]: value },
      },
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const success = importAllData(reader.result as string);
        if (success) {
          setSettings(getSettings());
          toast.success('Data imported successfully');
        } else {
          toast.error('Import failed — invalid file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearAll = () => {
    if (clearPhrase !== 'DELETE ALL DATA') return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith('nc_'));
    keys.forEach(k => localStorage.removeItem(k));
    setSettings(getSettings());
    setClearOpen(false);
    setClearPhrase('');
    toast.success('All data cleared');
    window.dispatchEvent(new Event('nc-data-change'));
  };

  const sp = settings.sharePoint;

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* General */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">General</h3>
        <div className="bg-card rounded-lg p-4 sm:p-5 nc-shadow-card space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Platform Name</label>
            <Input className="mt-1" value={settings.platformName} onChange={e => update({ platformName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Launch Milestone Date</label>
            <Input type="date" className="mt-1" value={settings.launchDate} onChange={e => update({ launchDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Founders Membership Cap</label>
              <Input type="number" className="mt-1" value={settings.foundersCap} onChange={e => update({ foundersCap: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Your Name</label>
              <Input className="mt-1" value={settings.userName} onChange={e => update({ userName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Total Budget (£)</label>
              <Input type="number" className="mt-1" value={settings.totalBudget} onChange={e => update({ totalBudget: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Total Members</label>
              <Input type="number" className="mt-1" value={settings.totalMembers} onChange={e => update({ totalMembers: +e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={settings.darkMode} onCheckedChange={v => update({ darkMode: v })} />
            <label className="text-sm font-medium text-foreground">Dark Mode</label>
          </div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          Access Control
        </h3>
        <div className="bg-card rounded-lg p-4 sm:p-5 nc-shadow-card space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Current User Role</label>
            <Select value={settings.userRole || 'admin'} onValueChange={v => update({ userRole: v as UserRole })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {(Object.entries(ROLE_DESCRIPTIONS) as [UserRole, string][]).map(([role, desc]) => (
              <div key={role} className={`flex items-start gap-3 p-3 rounded-md ${settings.userRole === role ? 'bg-accent/10 border border-accent/30' : 'bg-muted/50'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${settings.userRole === role ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground capitalize">{role}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/60">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              In the current offline version, this role applies to <strong>your browser session</strong>. 
              When connected to SharePoint, roles will be managed by your IT admin via Azure AD groups.
            </p>
          </div>
        </div>
      </section>

      {/* SharePoint Integration */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          SharePoint Integration
        </h3>
        <div className="bg-card rounded-lg p-4 sm:p-5 nc-shadow-card space-y-5">
          <div className="flex items-center gap-3">
            <Switch checked={sp.enabled} onCheckedChange={v => updateSP({ enabled: v })} />
            <label className="text-sm font-medium text-foreground">Enable SharePoint sync</label>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/60">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              To connect to SharePoint, you'll need to register an Azure AD app with <strong>Sites.ReadWrite.All</strong> permissions.
              Enter your Tenant ID, Client ID, and SharePoint site URL below. Map each module to a SharePoint list name.
              Data will continue to use localStorage until your IT team configures the Microsoft Graph API connection.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">SharePoint Site URL</label>
            <Input
              className="mt-1"
              placeholder="https://yourorg.sharepoint.com/sites/NewboldConnect"
              value={sp.siteUrl}
              onChange={e => updateSP({ siteUrl: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Azure Tenant ID</label>
              <Input
                className="mt-1"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sp.tenantId}
                onChange={e => updateSP({ tenantId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Azure Client ID</label>
              <Input
                className="mt-1"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sp.clientId}
                onChange={e => updateSP({ clientId: e.target.value })}
              />
            </div>
          </div>

          {/* List Mappings */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">SharePoint List Mappings</h4>
            <p className="text-[10px] text-muted-foreground">Enter the SharePoint list name for each module. Leave blank to keep using localStorage.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
                  <Input
                    className="mt-0.5 h-8 text-xs"
                    placeholder={`e.g. NC_${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    value={sp.listMappings[key] || ''}
                    onChange={e => updateListMapping(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {sp.enabled && sp.siteUrl && sp.tenantId && sp.clientId && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-accent/10">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs font-medium text-accent">Configuration saved — ready for IT to connect the Graph API proxy.</span>
            </div>
          )}
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
        <div className="bg-card rounded-lg p-4 sm:p-5 nc-shadow-card space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportAllData}>
              <Download className="w-4 h-4 mr-2" /> Export All Data (JSON)
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" /> Import Data
            </Button>
          </div>
          <div className="pt-3 border-t">
            <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1">This permanently deletes all dashboard data from this browser.</p>
          </div>
        </div>
      </section>

      {/* Clear confirmation */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Clear All Data</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This will permanently delete all data from every module. This cannot be undone.</p>
            <p className="text-sm text-foreground font-medium">Type <code className="bg-muted px-1.5 py-0.5 rounded text-xs">DELETE ALL DATA</code> to confirm:</p>
            <Input value={clearPhrase} onChange={e => setClearPhrase(e.target.value)} placeholder="Type the phrase above" />
            <Button variant="destructive" className="w-full" disabled={clearPhrase !== 'DELETE ALL DATA'} onClick={handleClearAll}>
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
