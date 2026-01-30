import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useSLADeadlines } from "@/hooks/useTicketEnhanced";
import { differenceInMinutes, differenceInSeconds, format, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface SLACountdownProps {
  ticketId: string;
  ticketStatus: string;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export function SLACountdown({ 
  ticketId, 
  ticketStatus, 
  firstResponseAt,
  resolvedAt,
  createdAt
}: SLACountdownProps) {
  const { data: sla, isLoading } = useSLADeadlines(ticketId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !sla) {
    return (
      <div className="animate-pulse h-20 bg-muted rounded-lg" />
    );
  }

  const firstResponseDeadline = new Date(sla.first_response_deadline);
  const resolutionDeadline = new Date(sla.resolution_deadline);
  const ticketCreatedAt = new Date(createdAt);

  // Calculate if SLA is met
  const firstResponseMet = firstResponseAt 
    ? new Date(firstResponseAt) <= firstResponseDeadline 
    : !isPast(firstResponseDeadline);
  
  const resolutionMet = resolvedAt 
    ? new Date(resolvedAt) <= resolutionDeadline 
    : !isPast(resolutionDeadline);

  // Calculate remaining time
  const getTimeRemaining = (deadline: Date) => {
    if (isPast(deadline)) {
      const overdue = differenceInMinutes(now, deadline);
      if (overdue >= 60) {
        return `Dépassé de ${Math.floor(overdue / 60)}h ${overdue % 60}min`;
      }
      return `Dépassé de ${overdue}min`;
    }
    
    const remaining = differenceInMinutes(deadline, now);
    if (remaining >= 60) {
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      return `${hours}h ${mins}min restantes`;
    }
    return `${remaining}min restantes`;
  };

  // Calculate progress percentage
  const getProgress = (deadline: Date) => {
    const totalMinutes = differenceInMinutes(deadline, ticketCreatedAt);
    const elapsedMinutes = differenceInMinutes(now, ticketCreatedAt);
    const progress = Math.min(100, (elapsedMinutes / totalMinutes) * 100);
    return Math.max(0, progress);
  };

  const firstResponseProgress = getProgress(firstResponseDeadline);
  const resolutionProgress = getProgress(resolutionDeadline);

  // Determine color based on progress
  const getProgressColor = (progress: number, isMet: boolean) => {
    if (!isMet || progress >= 100) return 'bg-red-500';
    if (progress >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isResolved = ticketStatus === 'resolved' || ticketStatus === 'closed';

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">SLA: {sla.sla_name || 'Standard'}</span>
        </div>
        {isResolved && (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ticket résolu
          </Badge>
        )}
      </div>

      {/* First Response SLA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Première réponse</span>
          <div className="flex items-center gap-2">
            {firstResponseAt ? (
              <Badge variant={firstResponseMet ? "default" : "destructive"} className="text-xs">
                {firstResponseMet ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Respecté</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Dépassé</>
                )}
              </Badge>
            ) : (
              <span className={`text-xs font-mono ${isPast(firstResponseDeadline) ? 'text-red-500' : ''}`}>
                {getTimeRemaining(firstResponseDeadline)}
              </span>
            )}
          </div>
        </div>
        {!firstResponseAt && (
          <Progress 
            value={firstResponseProgress} 
            className={`h-2 ${getProgressColor(firstResponseProgress, firstResponseMet)}`}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Délai: {sla.first_response_minutes}min • Échéance: {format(firstResponseDeadline, "dd/MM HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Resolution SLA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Résolution</span>
          <div className="flex items-center gap-2">
            {resolvedAt ? (
              <Badge variant={resolutionMet ? "default" : "destructive"} className="text-xs">
                {resolutionMet ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Respecté</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Dépassé</>
                )}
              </Badge>
            ) : (
              <span className={`text-xs font-mono ${isPast(resolutionDeadline) ? 'text-red-500' : ''}`}>
                {getTimeRemaining(resolutionDeadline)}
              </span>
            )}
          </div>
        </div>
        {!resolvedAt && (
          <Progress 
            value={resolutionProgress} 
            className={`h-2 ${getProgressColor(resolutionProgress, resolutionMet)}`}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Délai: {sla.resolution_minutes}min • Échéance: {format(resolutionDeadline, "dd/MM HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Warning if close to SLA breach */}
      {!isResolved && (resolutionProgress >= 80 || firstResponseProgress >= 80) && (
        <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">
            Attention: SLA bientôt dépassé!
          </span>
        </div>
      )}
    </div>
  );
}
