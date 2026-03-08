import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warn' | 'alert';
}

const variantStyles = {
  default: 'border-l-accent',
  success: 'border-l-nc-success',
  warn: 'border-l-nc-warn',
  alert: 'border-l-nc-alert',
};

export function KPICard({ label, value, subtitle, icon: Icon, variant = 'default' }: KPICardProps) {
  return (
    <div className={cn(
      'bg-card rounded-lg p-5 nc-shadow-card border-l-4 flex items-start gap-4',
      variantStyles[variant]
    )}>
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
