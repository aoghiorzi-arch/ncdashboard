import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDir = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
  className?: string;
}

export function SortableHeader({ label, active, direction, onClick, className }: SortableHeaderProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
        active && 'text-foreground',
        className
      )}
    >
      {label}
      {active && direction === 'asc' && <ArrowUp className="w-3 h-3" />}
      {active && direction === 'desc' && <ArrowDown className="w-3 h-3" />}
      {!active && <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

export function useSortableData<T>(data: T[], defaultKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey || null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const toggle = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortDir(null); setSortKey(null); }
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return { sorted, sortKey, sortDir, toggle };
}
