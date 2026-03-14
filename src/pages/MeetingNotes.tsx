import { useState, useEffect, useMemo } from 'react';
import { generateId, getSettings } from '@/lib/storage';
import { logActivity } from '@/lib/activityLog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Search, Pencil, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  attendees: string;
  content: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// CRUD for meeting notes
const STORAGE_KEY = 'nc_meeting_notes';
function getAll(): MeetingNote[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveAll(items: MeetingNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('nc-data-change'));
}

export default function MeetingNotes() {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [viewItem, setViewItem] = useState<MeetingNote | null>(null);
  const [editItem, setEditItem] = useState<MeetingNote | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    const refresh = () => setNotes(getAll());
    refresh();
    window.addEventListener('nc-data-change', refresh);
    return () => window.removeEventListener('nc-data-change', refresh);
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const handleSave = (item: MeetingNote) => {
    const now = new Date().toISOString();
    const user = getSettings().userName;
    const all = getAll();
    if (editItem) {
      const updated = all.map(n => n.id === item.id ? { ...item, updatedAt: now } : n);
      saveAll(updated);
      logActivity('updated', 'Meeting Notes', item.title, user);
    } else {
      const newItem = { ...item, id: generateId(), createdBy: user, createdAt: now, updatedAt: now };
      saveAll([newItem, ...all]);
      logActivity('created', 'Meeting Notes', item.title, user);
    }
    setNotes(getAll());
    setEditItem(null); setNewOpen(false); setViewItem(null);
  };

  const handleDelete = (id: string) => {
    const all = getAll();
    const item = all.find(n => n.id === id);
    saveAll(all.filter(n => n.id !== id));
    if (item) logActivity('deleted', 'Meeting Notes', item.title, getSettings().userName);
    setNotes(getAll()); setEditItem(null); setViewItem(null);
  };

  const filtered = useMemo(() => {
    let result = notes;
    if (filterTag) result = result.filter(n => n.tags.includes(filterTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.attendees.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [notes, search, filterTag]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search notes, attendees, tags..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        {filterTag && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFilterTag('')}>
            <Tag className="w-3 h-3 mr-1" />{filterTag} <X className="w-3 h-3 ml-1" />
          </Button>
        )}
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Note
        </Button>
      </div>

      {/* Tags bar */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map(tag => (
            <Badge key={tag} variant={filterTag === tag ? 'default' : 'outline'}
              className={cn('cursor-pointer text-[10px]', filterTag === tag && 'bg-accent text-accent-foreground')}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes list */}
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No meeting notes" description={search || filterTag ? 'No notes match your search.' : 'Record your first meeting notes here.'} action={!search && !filterTag ? <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Note</Button> : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <div key={note.id} onClick={() => setViewItem(note)} className="bg-card rounded-lg p-4 nc-shadow-card cursor-pointer hover:nc-shadow-elevated transition-shadow border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <h4 className="text-sm font-semibold text-foreground truncate">{note.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(note.date).toLocaleDateString()}</span>
                  </div>
                  {note.attendees && <p className="text-[11px] text-muted-foreground mb-1">Attendees: {note.attendees}</p>}
                  <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                </div>
              </div>
              {note.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.tags.map(t => (
                    <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewItem && !editItem} onOpenChange={o => { if (!o) setViewItem(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-accent" />{viewItem?.title}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(viewItem.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>·</span>
                <span>by {viewItem.createdBy}</span>
              </div>
              {viewItem.attendees && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Attendees</h5>
                  <p className="text-sm text-foreground">{viewItem.attendees}</p>
                </div>
              )}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">Notes</h5>
                <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 min-h-[100px]">{viewItem.content}</div>
              </div>
              {viewItem.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {viewItem.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setEditItem(viewItem)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(viewItem.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit / New Dialog */}
      <NoteDialog item={editItem} open={!!editItem || newOpen} onOpenChange={o => { if (!o) { setEditItem(null); setNewOpen(false); } }} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

function NoteDialog({ item, open, onOpenChange, onSave, onDelete }: {
  item: MeetingNote | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (n: MeetingNote) => void; onDelete: (id: string) => void;
}) {
  const blank: MeetingNote = { id: '', title: '', date: new Date().toISOString().split('T')[0], attendees: '', content: '', tags: [], createdBy: '', createdAt: '', updatedAt: '' };
  const [form, setForm] = useState<MeetingNote>(blank);
  const [tagInput, setTagInput] = useState('');
  useEffect(() => { setForm(item || blank); setTagInput(''); }, [item, open]);
  const u = (p: Partial<MeetingNote>) => setForm(f => ({ ...f, ...p }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      u({ tags: [...form.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => u({ tags: form.tags.filter(t => t !== tag) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Meeting Note' : 'New Meeting Note'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Meeting title" value={form.title} onChange={e => u({ title: e.target.value })} autoFocus />
          <Input type="date" value={form.date} onChange={e => u({ date: e.target.value })} />
          <Input placeholder="Attendees (comma-separated)" value={form.attendees} onChange={e => u({ attendees: e.target.value })} />
          <Textarea placeholder="Meeting notes..." value={form.content} onChange={e => u({ content: e.target.value })} rows={8} />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {form.tags.map(t => (
                <Badge key={t} variant="secondary" className="text-xs gap-1">
                  {t} <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(t)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} className="h-8 text-xs"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-8 text-xs">Add</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { if (form.title.trim() && form.content.trim()) onSave(form); }} disabled={!form.title.trim() || !form.content.trim()}>{item ? 'Save' : 'Create'}</Button>
            {item && <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
