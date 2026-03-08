import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  const location = useLocation();
  const name = location.pathname.slice(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Module';

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-accent" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{name}</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        This module is planned for a future sprint. The dashboard is being built incrementally — check back soon.
      </p>
    </div>
  );
}
