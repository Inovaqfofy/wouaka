import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldX, 
  ShieldAlert, 
  Shield, 
  ShieldCheck, 
  Award 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustLevel = "unverified" | "basic" | "verified" | "certified" | "gold";

interface TrustLevelConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  className: string;
  iconClassName: string;
  score: number;
}

const TRUST_LEVELS: Record<TrustLevel, TrustLevelConfig> = {
  unverified: {
    label: "Non vérifié",
    description: "Aucune preuve fournie",
    icon: ShieldX,
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    iconClassName: "text-muted-foreground",
    score: 0,
  },
  basic: {
    label: "Basique",
    description: "OTP vérifié",
    icon: ShieldAlert,
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    iconClassName: "text-amber-600 dark:text-amber-400",
    score: 25,
  },
  verified: {
    label: "Vérifié",
    description: "OTP + Capture USSD",
    icon: Shield,
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
    iconClassName: "text-blue-600 dark:text-blue-400",
    score: 50,
  },
  certified: {
    label: "Certifié",
    description: "OTP + USSD + SMS analysés",
    icon: ShieldCheck,
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    score: 75,
  },
  gold: {
    label: "Gold",
    description: "Certifié + Documents + Garant",
    icon: Award,
    className: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-400 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-300 dark:border-amber-600",
    iconClassName: "text-amber-600 dark:text-amber-400",
    score: 100,
  },
};

interface TrustLevelBadgeProps {
  level: TrustLevel;
  showDescription?: boolean;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TrustLevelBadge: React.FC<TrustLevelBadgeProps> = ({
  level,
  showDescription = false,
  showScore = false,
  size = "md",
  className,
}) => {
  const config = TRUST_LEVELS[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (showDescription) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Badge 
          variant="outline" 
          className={cn(sizeClasses[size], config.className, "border")}
        >
          <Icon className={cn(iconSizes[size], config.iconClassName)} />
          <span>{config.label}</span>
          {showScore && (
            <span className="ml-1 font-bold">{config.score}%</span>
          )}
        </Badge>
        <span className="text-sm text-muted-foreground">{config.description}</span>
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(sizeClasses[size], config.className, "border", className)}
    >
      <Icon className={cn(iconSizes[size], config.iconClassName)} />
      <span>{config.label}</span>
      {showScore && (
        <span className="ml-1 font-bold">{config.score}%</span>
      )}
    </Badge>
  );
};

// Helper to determine trust level from score or proofs
export const getTrustLevelFromProofs = (proofs: {
  otpVerified?: boolean;
  ussdUploaded?: boolean;
  smsAnalyzed?: boolean;
  documentsVerified?: boolean;
  guarantorAdded?: boolean;
}): TrustLevel => {
  const { otpVerified, ussdUploaded, smsAnalyzed, documentsVerified, guarantorAdded } = proofs;

  if (documentsVerified && guarantorAdded && smsAnalyzed && ussdUploaded && otpVerified) {
    return "gold";
  }
  if (smsAnalyzed && ussdUploaded && otpVerified) {
    return "certified";
  }
  if (ussdUploaded && otpVerified) {
    return "verified";
  }
  if (otpVerified) {
    return "basic";
  }
  return "unverified";
};

export const getTrustLevelFromScore = (score: number): TrustLevel => {
  if (score >= 90) return "gold";
  if (score >= 70) return "certified";
  if (score >= 50) return "verified";
  if (score >= 25) return "basic";
  return "unverified";
};

export default TrustLevelBadge;
