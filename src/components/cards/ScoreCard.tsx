import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreCardProps {
  score: number;
  grade: string;
  reliability: number;
  sourcesCount: number;
  trend?: "up" | "down" | "stable";
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Score scale: 0-100
const getScoreColor = (score: number) => {
  if (score >= 80) return { label: "Excellent", variant: "success" as const, color: "text-success" };
  if (score >= 70) return { label: "Très bon", variant: "success" as const, color: "text-success" };
  if (score >= 50) return { label: "Correct", variant: "secondary" as const, color: "text-secondary" };
  if (score >= 30) return { label: "Faible", variant: "warning" as const, color: "text-warning" };
  return { label: "Très faible", variant: "destructive" as const, color: "text-destructive" };
};

const sizeStyles = {
  sm: {
    container: "p-4",
    circle: "w-24 h-24",
    score: "text-2xl",
    subtitle: "text-xs",
  },
  md: {
    container: "p-6",
    circle: "w-32 h-32",
    score: "text-4xl",
    subtitle: "text-sm",
  },
  lg: {
    container: "p-8",
    circle: "w-40 h-40",
    score: "text-5xl",
    subtitle: "text-base",
  },
};

export const ScoreCard = ({
  score,
  grade,
  reliability,
  sourcesCount,
  trend = "stable",
  className,
  size = "md",
}: ScoreCardProps) => {
  const scoreInfo = getScoreColor(score);
  const styles = sizeStyles[size];

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={cn("bg-hero rounded-2xl text-primary-foreground", styles.container, className)}>
      <div className="text-center">
        <p className={cn("opacity-80 mb-3", styles.subtitle)}>Score de crédit Wouaka</p>
        
        {/* Score Circle */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "rounded-full border-4 border-secondary/30 flex items-center justify-center relative",
              styles.circle
            )}
          >
            <span className={cn("font-display font-bold", styles.score)}>{score}</span>
            
            {/* Trend Indicator */}
            <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-card flex items-center justify-center">
              <TrendIcon className={cn("w-4 h-4", trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground")} />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={scoreInfo.variant} className="mb-4">
          {scoreInfo.label}
        </Badge>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className={cn("font-bold", size === "lg" ? "text-xl" : "text-lg")}>{reliability}%</p>
            <p className="text-xs opacity-70">Fiabilité</p>
          </div>
          <div>
            <p className={cn("font-bold", size === "lg" ? "text-xl" : "text-lg")}>{grade}</p>
            <p className="text-xs opacity-70">Grade</p>
          </div>
          <div>
            <p className={cn("font-bold", size === "lg" ? "text-xl" : "text-lg")}>{sourcesCount}</p>
            <p className="text-xs opacity-70">Sources</p>
          </div>
        </div>
      </div>
    </div>
  );
};
