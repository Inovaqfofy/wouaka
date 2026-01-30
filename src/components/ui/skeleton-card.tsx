/**
 * Skeleton Card Components
 * Elegant loading states for WOUAKA data fetching
 */

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonCardProps {
  className?: string;
  variant?: 'default' | 'score' | 'kyc' | 'stats' | 'list';
  lines?: number;
}

/**
 * Default skeleton card with customizable lines
 */
export function SkeletonCard({ className, variant = 'default', lines = 3 }: SkeletonCardProps) {
  if (variant === 'score') {
    return <ScoreSkeletonCard className={className} />;
  }

  if (variant === 'kyc') {
    return <KycSkeletonCard className={className} />;
  }

  if (variant === 'stats') {
    return <StatsSkeletonCard className={className} />;
  }

  if (variant === 'list') {
    return <ListSkeletonCard className={className} lines={lines} />;
  }

  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${100 - i * 10}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Score result skeleton with gauge animation
 */
export function ScoreSkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score gauge skeleton */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-24">
            <Skeleton className="absolute inset-0 rounded-t-full animate-pulse" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Sub-scores skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Factors skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * KYC verification skeleton
 */
export function KycSkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity info skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>

        {/* Verification checks skeleton */}
        <div className="border-t pt-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Stats/metrics skeleton grid
 */
export function StatsSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * List items skeleton
 */
export function ListSkeletonCard({ className, lines = 5 }: { className?: string; lines?: number }) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Inline loading indicator for smaller contexts
 */
export function InlineLoader({ className, text = "Chargement..." }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoader({ title = "Chargement en cours..." }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-muted-foreground font-medium">{title}</p>
    </div>
  );
}
