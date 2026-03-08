import { useState, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function KanbanBoard<T extends KanbanCard>({
  columns,
  columnColors,
  items,
  onMove,
  onCardClick,
  renderCard,
}: KanbanBoardProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Make the drag ghost semi-transparent
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

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(column => {
        const col = items.filter(i => i.column === column);
        const isOver = dropTarget === column && draggedId !== null;
        const draggedItem = items.find(i => i.id === draggedId);
        const isDragSource = draggedItem?.column === column;

        return (
          <div
            key={column}
            className={cn(
              'rounded-lg p-3 min-w-[210px] min-h-[200px] border flex-shrink-0 transition-all duration-200',
              columnColors[column],
              isOver && !isDragSource && 'ring-2 ring-accent/50 scale-[1.01] bg-accent/5',
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

            {/* Drop zone indicator when column is empty */}
            {col.length === 0 && isOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-dashed border-accent/40 rounded-md p-4 text-center"
              >
                <p className="text-[11px] text-accent font-medium">Drop here</p>
              </motion.div>
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

            {/* Bottom drop indicator */}
            {isOver && col.length > 0 && !isDragSource && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 border-2 border-dashed border-accent/30 rounded-md p-2 text-center"
              >
                <p className="text-[10px] text-accent/70">Drop here</p>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
