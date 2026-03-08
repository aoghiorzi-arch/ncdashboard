import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, importAllData, type NCSettings } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* General */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">General</h3>
        <div className="bg-card rounded-lg p-5 nc-shadow-card space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Platform Name</label>
            <Input className="mt-1" value={settings.platformName} onChange={e => update({ platformName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Launch Milestone Date</label>
            <Input type="date" className="mt-1" value={settings.launchDate} onChange={e => update({ launchDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Founders Membership Cap</label>
              <Input type="number" className="mt-1" value={settings.foundersCap} onChange={e => update({ foundersCap: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Your Name</label>
              <Input className="mt-1" value={settings.userName} onChange={e => update({ userName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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

      {/* Data Management */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
        <div className="bg-card rounded-lg p-5 nc-shadow-card space-y-3">
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
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-nc-alert"><AlertTriangle className="w-5 h-5" /> Clear All Data</DialogTitle></DialogHeader>
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
