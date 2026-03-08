import { useState, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface KanbanCard {
  id: string;
  column: string;
  [key: string]: unknown;
}

interface KanbanBoardProps<T extends KanbanCard> {
  columns: string[];
  columnColors: Record<string, string>;
  items: T[];
  onMove: (itemId: string, newColumn: string) => void;
  onCardClick: (item: T) => void;
  renderCard: (item: T) => ReactNode;
  searchFields?: (keyof T)[];
  searchPlaceholder?: string;
}

export function KanbanBoard<T extends KanbanCard>({
  columns,
  columnColors,
  items,
  onMove,
  onCardClick,
  renderCard,
  searchFields = [],
  searchPlaceholder = 'Search cards…',
}: KanbanBoardProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const dragCounter = useRef<Record<string, number>>({});

  const filteredItems = search.trim()
    ? items.filter(item => {
        const q = search.toLowerCase();
        if (searchFields.length === 0) {
          return Object.values(item).some(v => String(v).toLowerCase().includes(q));
        }
        return searchFields.some(f => String(item[f]).toLowerCase().includes(q));
      })
    : items;

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedId(null);
    setDropTarget(null);
    dragCounter.current = {};
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, column: string) => {
    e.preventDefault();
    dragCounter.current[column] = (dragCounter.current[column] || 0) + 1;
    setDropTarget(column);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, column: string) => {
    e.preventDefault();
    dragCounter.current[column] = (dragCounter.current[column] || 0) - 1;
    if (dragCounter.current[column] <= 0) {
      dragCounter.current[column] = 0;
      if (dropTarget === column) setDropTarget(null);
    }
  }, [dropTarget]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, column: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      const item = items.find(i => i.id === id);
      if (item && item.column !== column) {
        onMove(id, column);
      }
    }
    setDraggedId(null);
    setDropTarget(null);
    dragCounter.current = {};
  }, [items, onMove]);

  // Summary bar
  const totalFiltered = filteredItems.length;
  const totalAll = items.length;

  return (
    <div className="space-y-3">
      {/* Search & Summary Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-[11px] text-muted-foreground">
            {totalFiltered} of {totalAll} cards
          </span>
        )}
        <div className="hidden sm:flex items-center gap-1.5 ml-auto">
          {columns.map(col => {
            const count = filteredItems.filter(i => i.column === col).length;
            if (count === 0) return null;
            return (
              <span key={col} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {col.split(' ')[0]}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(column => {
          const col = filteredItems.filter(i => i.column === column);
          const isOver = dropTarget === column && draggedId !== null;
          const draggedItem = items.find(i => i.id === draggedId);
          const isDragSource = draggedItem?.column === column;

          return (
            <div
              key={column}
              className={cn(
                'rounded-lg p-3 min-w-[210px] min-h-[200px] border flex-shrink-0 transition-all duration-200',
                columnColors[column],
                isOver && !isDragSource && 'ring-2 ring-accent/50 scale-[1.01]',
                isOver && isDragSource && 'opacity-80',
              )}
              onDragEnter={e => handleDragEnter(e, column)}
              onDragLeave={e => handleDragLeave(e, column)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, column)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-foreground">{column}</h4>
                <span className={cn(
                  'text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors',
                  isOver && !isDragSource
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground bg-background'
                )}>
                  {col.length}
                </span>
              </div>

              {col.length === 0 && isOver && (
                <div className="border-2 border-dashed border-accent/40 rounded-md p-4 text-center animate-in fade-in duration-200">
                  <p className="text-[11px] text-accent font-medium">Drop here</p>
                </div>
              )}

              <div className="space-y-2">
                {col.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onCardClick(item)}
                    className={cn(
                      'bg-card rounded-md p-3 nc-shadow-card cursor-grab hover:nc-shadow-elevated transition-all duration-150',
                      'active:cursor-grabbing active:scale-[0.98]',
                      draggedId === item.id && 'opacity-40 ring-2 ring-accent/30'
                    )}
                  >
                    {renderCard(item)}
                  </div>
                ))}
              </div>

              {isOver && col.length > 0 && !isDragSource && (
                <div className="mt-2 border-2 border-dashed border-accent/30 rounded-md p-2 text-center animate-in fade-in duration-200">
                  <p className="text-[10px] text-accent/70">Drop here</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
