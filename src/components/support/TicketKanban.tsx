import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useSupportTickets, 
  useUpdateTicket,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type SupportTicket,
  type TicketStatus
} from "@/hooks/useSupportTickets";
import { 
  Clock, 
  User, 
  AlertTriangle, 
  Grip,
  Eye,
  ArrowUpCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const KANBAN_COLUMNS: { status: TicketStatus; title: string; color: string }[] = [
  { status: 'new', title: 'Nouveaux', color: 'bg-blue-500' },
  { status: 'in_progress', title: 'En cours', color: 'bg-yellow-500' },
  { status: 'waiting_user', title: 'En attente', color: 'bg-orange-500' },
  { status: 'resolved', title: 'Résolus', color: 'bg-green-500' },
  { status: 'closed', title: 'Fermés', color: 'bg-muted' }
];

interface TicketCardProps {
  ticket: SupportTicket;
  onDragStart: (e: React.DragEvent, ticket: SupportTicket) => void;
}

const TicketCard = ({ ticket, onDragStart }: TicketCardProps) => {
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];

  return (
    <Card 
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-mono">
              {ticket.ticket_number}
            </p>
            <p className="text-sm font-medium truncate">{ticket.subject}</p>
          </div>
          <Grip className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`${priorityConfig.color} text-xs`}
          >
            <ArrowUpCircle className="w-3 h-3 mr-1" />
            {priorityConfig.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(ticket.created_at), { 
              addSuffix: true, 
              locale: fr 
            })}
          </div>
          
          {ticket.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Assigné
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard/admin/support/${ticket.id}`}>
              <Eye className="w-3 h-3 mr-1" />
              Voir
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface KanbanColumnProps {
  status: TicketStatus;
  title: string;
  color: string;
  tickets: SupportTicket[];
  onDrop: (e: React.DragEvent, status: TicketStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, ticket: SupportTicket) => void;
  isDragOver: boolean;
}

const KanbanColumn = ({ 
  status, 
  title, 
  color, 
  tickets, 
  onDrop, 
  onDragOver,
  onDragStart,
  isDragOver
}: KanbanColumnProps) => {
  return (
    <div 
      className={`flex flex-col min-w-[280px] max-w-[320px] rounded-lg border bg-card transition-colors ${
        isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div className="p-3 border-b flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {tickets.length}
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun ticket
            </div>
          ) : (
            tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export function TicketKanban() {
  const { data: tickets, isLoading } = useSupportTickets();
  const updateTicket = useUpdateTicket();
  const [draggedTicket, setDraggedTicket] = useState<SupportTicket | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, SupportTicket[]> = {
      new: [],
      in_progress: [],
      waiting_user: [],
      resolved: [],
      closed: []
    };

    (tickets || []).forEach(ticket => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });

    // Sort by priority within each column
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    Object.keys(grouped).forEach(status => {
      grouped[status as TicketStatus].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    });

    return grouped;
  }, [tickets]);

  const handleDragStart = (e: React.DragEvent, ticket: SupportTicket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTicket || draggedTicket.status === newStatus) {
      setDraggedTicket(null);
      return;
    }

    try {
      await updateTicket.mutateAsync({
        ticket_id: draggedTicket.id,
        status: newStatus
      });
      toast.success(`Ticket déplacé vers "${TICKET_STATUS_CONFIG[newStatus].label}"`);
    } catch (error) {
      toast.error("Erreur lors du déplacement du ticket");
    }

    setDraggedTicket(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <div key={col.status} className="min-w-[280px] space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          title={col.title}
          color={col.color}
          tickets={ticketsByStatus[col.status]}
          onDrop={handleDrop}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverColumn(col.status);
          }}
          onDragStart={handleDragStart}
          isDragOver={dragOverColumn === col.status}
        />
      ))}
    </div>
  );
}
