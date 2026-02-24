import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: string;
  className?: string;
}

export default function KPICard({ label, value, icon, trend, accent = 'teal', className }: KPICardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl p-5 shadow-card border border-border flex items-start justify-between",
      className
    )}>
      <div>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {trend && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            trend.positive ? "text-green-600" : "text-red-500"
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        accent === 'teal' && "bg-teal-100 text-teal-600",
        accent === 'blue' && "bg-blue-100 text-blue-600",
        accent === 'green' && "bg-green-100 text-green-600",
        accent === 'red' && "bg-red-100 text-red-600",
        accent === 'orange' && "bg-orange-100 text-orange-600",
      )}>
        {icon}
      </div>
    </div>
  );
}
