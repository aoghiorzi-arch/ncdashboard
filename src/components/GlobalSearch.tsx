import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  CheckSquare, Film, Users, FolderOpen, Lightbulb, PartyPopper,
  Handshake, PiggyBank, Shield, UserCog, CalendarDays,
} from 'lucide-react';
import {
  getTasks, calendarCRUD, classCRUD, instructorCRUD, documentCRUD,
  ideaCRUD, eventCRUD, partnershipCRUD, expenseCRUD, complianceCRUD, teamCRUD,
} from '@/lib/storage';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  module: string;
  path: string;
  icon: React.ElementType;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const search = useCallback((query: string) => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    getTasks().forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        out.push({ id: t.id, title: t.title, subtitle: `${t.status} · ${t.priority}`, module: 'Tasks', path: '/tasks', icon: CheckSquare });
    });
    calendarCRUD.getAll().forEach(e => {
      if (e.title.toLowerCase().includes(q))
        out.push({ id: e.id, title: e.title, subtitle: `${e.type} · ${e.date}`, module: 'Calendar', path: '/calendar', icon: CalendarDays });
    });
    classCRUD.getAll().forEach(c => {
      if (c.title.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q))
        out.push({ id: c.id, title: c.title, subtitle: `${c.pipelineStage} · ${c.instructorName}`, module: 'Classes', path: '/classes', icon: Film });
    });
    instructorCRUD.getAll().forEach(i => {
      if (i.fullName.toLowerCase().includes(q) || i.specialism.toLowerCase().includes(q))
        out.push({ id: i.id, title: i.fullName, subtitle: `${i.status} · ${i.specialism}`, module: 'Instructors', path: '/instructors', icon: Users });
    });
    documentCRUD.getAll().forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.folder.toLowerCase().includes(q))
        out.push({ id: d.id, title: d.title, subtitle: `${d.status} · ${d.folder}`, module: 'Documents', path: '/documents', icon: FolderOpen });
    });
    ideaCRUD.getAll().forEach(i => {
      if (i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
        out.push({ id: i.id, title: i.title, subtitle: `${i.status} · ${i.category}`, module: 'Ideas', path: '/ideas', icon: Lightbulb });
    });
    eventCRUD.getAll().forEach(e => {
      if (e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
        out.push({ id: e.id, title: e.title, subtitle: `${e.status} · ${e.venue}`, module: 'Events', path: '/events', icon: PartyPopper });
    });
    partnershipCRUD.getAll().forEach(p => {
      if (p.organisationName.toLowerCase().includes(q))
        out.push({ id: p.id, title: p.organisationName, subtitle: `${p.status} · ${p.type}`, module: 'Partnerships', path: '/partnerships', icon: Handshake });
    });
    expenseCRUD.getAll().forEach(e => {
      if (e.description.toLowerCase().includes(q) || e.supplier.toLowerCase().includes(q))
        out.push({ id: e.id, title: e.description, subtitle: `£${e.amount} · ${e.status}`, module: 'Budget', path: '/budget', icon: PiggyBank });
    });
    complianceCRUD.getAll().forEach(c => {
      if (c.title.toLowerCase().includes(q))
        out.push({ id: c.id, title: c.title, subtitle: `${c.status} · ${c.category}`, module: 'Legal', path: '/legal', icon: Shield });
    });
    teamCRUD.getAll().forEach(t => {
      if (t.name.toLowerCase().includes(q) || t.roleTitle.toLowerCase().includes(q))
        out.push({ id: t.id, title: t.name, subtitle: `${t.roleTitle} · ${t.employmentType}`, module: 'Team', path: '/team', icon: UserCog });
    });

    setResults(out.slice(0, 20));
  }, []);

  const select = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  // Group results by module
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.module] ??= []).push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search across all modules… (⌘K)" onValueChange={search} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(grouped).map(([module, items]) => (
          <CommandGroup key={module} heading={module}>
            {items.map(item => (
              <CommandItem key={item.id} onSelect={() => select(item)} className="gap-3">
                <item.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
