import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-muted",
    iconColor: "text-foreground",
  },
  primary: {
    bg: "bg-primary",
    iconBg: "bg-primary-foreground/20",
    iconColor: "text-primary-foreground",
  },
  secondary: {
    bg: "bg-secondary",
    iconBg: "bg-secondary-foreground/20",
    iconColor: "text-secondary-foreground",
  },
  success: {
    bg: "bg-success",
    iconBg: "bg-success-foreground/20",
    iconColor: "text-success-foreground",
  },
  warning: {
    bg: "bg-warning",
    iconBg: "bg-warning-foreground/20",
    iconColor: "text-warning-foreground",
  },
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) => {
  const styles = variantStyles[variant];
  const isPrimary = variant !== "default";

  return (
    <div
      className={cn(
        "stat-card flex items-start justify-between",
        styles.bg,
        isPrimary && "text-primary-foreground border-transparent",
        className
      )}
    >
      <div className="flex-1">
        <p className={cn("text-sm font-medium mb-1", isPrimary ? "opacity-80" : "text-muted-foreground")}>
          {title}
        </p>
        <p className="text-2xl font-display font-bold">{value}</p>
        {trend && (
          <p
            className={cn(
              "text-xs mt-1 flex items-center gap-1",
              isPrimary ? "opacity-80" : trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className={isPrimary ? "" : "text-muted-foreground"}>{subtitle}</span>
          </p>
        )}
        {!trend && subtitle && (
          <p className={cn("text-xs mt-1", isPrimary ? "opacity-70" : "text-muted-foreground")}>{subtitle}</p>
        )}
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", styles.iconBg)}>
        <Icon className={cn("w-6 h-6", styles.iconColor)} />
      </div>
    </div>
  );
};
