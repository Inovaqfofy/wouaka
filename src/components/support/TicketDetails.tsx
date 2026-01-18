import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  SupportTicket,
  useUpdateTicket,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
  TicketStatus,
  TicketPriority,
} from "@/hooks/useSupportTickets";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  User,
  Calendar,
  Brain,
  Tag,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

interface TicketDetailsProps {
  ticket: SupportTicket;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  const { role } = useAuth();
  const updateTicket = useUpdateTicket();
  const [internalNotes, setInternalNotes] = useState(ticket.internal_notes || "");

  const isAdmin = role === "SUPER_ADMIN";
  const canEdit = isAdmin;

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket.mutate({ ticket_id: ticket.id, status });
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket.mutate({ ticket_id: ticket.id, priority });
  };

  const handleSaveNotes = () => {
    updateTicket.mutate({ ticket_id: ticket.id, internal_notes: internalNotes });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Détails du ticket</CardTitle>
          <Badge className={TICKET_STATUS_CONFIG[ticket.status].color}>
            {TICKET_STATUS_CONFIG[ticket.status].label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ticket number & category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="font-mono">{ticket.ticket_number}</span>
          </div>
          <Badge variant="outline">
            {TICKET_CATEGORY_CONFIG[ticket.category].icon}{" "}
            {TICKET_CATEGORY_CONFIG[ticket.category].label}
          </Badge>
        </div>

        <Separator />

        {/* Subject */}
        <div>
          <h3 className="font-semibold">{ticket.subject}</h3>
          <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{ticket.user?.full_name || "Utilisateur"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(new Date(ticket.created_at), "d MMM yyyy", { locale: fr })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              {ticket.first_response_at
                ? `Répondu en ${Math.round(
                    (new Date(ticket.first_response_at).getTime() -
                      new Date(ticket.created_at).getTime()) /
                      (1000 * 60)
                  )} min`
                : "En attente de réponse"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <Badge
              variant="outline"
              className={TICKET_PRIORITY_CONFIG[ticket.priority].color + " text-white"}
            >
              {TICKET_PRIORITY_CONFIG[ticket.priority].label}
            </Badge>
          </div>
        </div>

        {/* AI Analysis */}
        {ticket.ai_priority_reason && (
          <>
            <Separator />
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Brain className="w-4 h-4 text-purple-500" />
                Analyse IA
              </div>
              <p className="text-sm text-muted-foreground">{ticket.ai_priority_reason}</p>
              {ticket.ai_sentiment_score && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Sentiment:</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{ width: `${ticket.ai_sentiment_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">
                    {Math.round(ticket.ai_sentiment_score * 100)}%
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Admin controls */}
        {canEdit && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>Statut</Label>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TICKET_STATUS_CONFIG) as TicketStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {TICKET_STATUS_CONFIG[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Priorité</Label>
              <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TICKET_PRIORITY_CONFIG) as TicketPriority[]).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {TICKET_PRIORITY_CONFIG[priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Notes internes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notes internes visibles uniquement par les agents..."
                className="min-h-[80px]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={updateTicket.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
