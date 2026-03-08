import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SHORTCUTS = [
  { keys: ['N'], desc: 'New item (opens Quick Add)' },
  { keys: ['⌘', 'K'], desc: 'Open global search' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close dialog / panel' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        window.dispatchEvent(new Event('nc-quick-add'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.desc} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 rounded bg-muted text-xs font-mono font-medium text-muted-foreground border border-border">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
