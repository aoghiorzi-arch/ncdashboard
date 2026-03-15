import { memo } from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warn' | 'alert';
  trend?: number[];
  trendColor?: string;
}

const variantStyles: Record<string, string> = {
  default: 'border-l-accent',
  success: 'border-l-nc-success',
  warn: 'border-l-nc-warn',
  alert: 'border-l-nc-alert',
};

const trendColors: Record<string, string> = {
  default: 'hsl(38, 62%, 45%)',
  success: 'hsl(153, 45%, 33%)',
  warn: 'hsl(28, 90%, 37%)',
  alert: 'hsl(0, 67%, 35%)',
};

export const KPICard = memo(function KPICard({
  label, value, subtitle, icon: Icon, variant = 'default', trend, trendColor,
}: KPICardProps) {
  const color = trendColor || trendColors[variant];
  const trendData = trend?.map((v, i) => ({ v, i }));

  return (
    <div className={cn(
      'bg-card rounded-lg p-5 nc-shadow-card border-l-4 flex items-start gap-4 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default group',
      variantStyles[variant]
    )}>
      {/* Sparkline background */}
      {trendData && trendData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 relative z-10 group-hover:bg-accent/10 transition-colors">
        <Icon className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
      </div>
      <div className="min-w-0 relative z-10">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
});
