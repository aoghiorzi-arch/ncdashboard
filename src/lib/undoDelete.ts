import { toast } from 'sonner';

/**
 * Delete with undo — shows a toast with an "Undo" button for 5 seconds.
 * If not undone, the item stays deleted.
 */
export function deleteWithUndo<T extends { id: string }>(
  label: string,
  item: T,
  performDelete: () => void,
  restoreItem: (item: T) => void
) {
  performDelete();

  toast(`Deleted "${label}"`, {
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: () => restoreItem(item),
    },
  });
}
