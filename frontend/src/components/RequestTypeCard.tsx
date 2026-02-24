import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export default function RequestTypeCard({ icon, title, description, selected, onClick }: RequestTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 hover:shadow-card-md",
        selected
          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20"
          : "border-border bg-card hover:border-teal-300"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
        selected ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <p className={cn(
        "font-semibold text-sm",
        selected ? "text-teal-700 dark:text-teal-400" : "text-foreground"
      )}>
        {title}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </button>
  );
}
