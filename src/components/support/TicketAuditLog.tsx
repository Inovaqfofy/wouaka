import { useTicketLogs } from "@/hooks/useTicketEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  PlusCircle, 
  Edit, 
  UserCheck, 
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Bot,
  ArrowUp
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketAuditLogProps {
  ticketId: string;
}

const ACTION_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  created: { icon: PlusCircle, label: 'Créé', color: 'text-green-500' },
  status_changed: { icon: Edit, label: 'Statut modifié', color: 'text-blue-500' },
  priority_changed: { icon: ArrowUp, label: 'Priorité modifiée', color: 'text-orange-500' },
  assigned: { icon: UserCheck, label: 'Assigné', color: 'text-purple-500' },
  escalated: { icon: AlertTriangle, label: 'Escaladé', color: 'text-red-500' },
  message_added: { icon: MessageSquare, label: 'Message ajouté', color: 'text-cyan-500' },
  resolved: { icon: CheckCircle, label: 'Résolu', color: 'text-green-600' },
  ai_analyzed: { icon: Bot, label: 'Analyse IA', color: 'text-violet-500' },
};

export function TicketAuditLog({ ticketId }: TicketAuditLogProps) {
  const { data: logs, isLoading } = useTicketLogs(ticketId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          Journal d'audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

            {(logs || []).map((log, index) => {
              const config = ACTION_CONFIG[log.action] || {
                icon: Edit,
                label: log.action,
                color: 'text-muted-foreground'
              };
              const Icon = config.icon;

              return (
                <div key={log.id} className="relative pl-8 pb-4">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center ${config.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>

                    {/* Show change details */}
                    {log.action === 'status_changed' && log.old_value && log.new_value && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">{log.old_value.status}</Badge>
                        <span>→</span>
                        <Badge variant="default">{log.new_value.status}</Badge>
                      </div>
                    )}

                    {log.action === 'priority_changed' && log.old_value && log.new_value && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">{log.old_value.priority}</Badge>
                        <span>→</span>
                        <Badge variant="destructive">{log.new_value.priority}</Badge>
                      </div>
                    )}

                    {log.action === 'escalated' && log.new_value && (
                      <p className="text-xs text-muted-foreground">
                        Raison: {log.new_value.reason}
                      </p>
                    )}

                    {log.action === 'ai_analyzed' && log.new_value && (
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          Frustration: {Math.round((log.new_value.frustrationScore || 0) * 100)}%
                        </p>
                        {log.new_value.tags?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {log.new_value.tags.map((t: any) => (
                              <Badge key={t.name} variant="secondary" className="text-xs">
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}

            {(!logs || logs.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun historique disponible
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
