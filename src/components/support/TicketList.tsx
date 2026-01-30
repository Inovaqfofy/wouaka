import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SupportTicket,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
} from "@/hooks/useSupportTickets";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Clock, AlertCircle } from "lucide-react";

interface TicketListProps {
  tickets: SupportTicket[] | undefined;
  isLoading: boolean;
  basePath: string;
}

export function TicketList({ tickets, isLoading, basePath }: TicketListProps) {
  const { role } = useAuth();
  const isAdmin = role === "SUPER_ADMIN";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun ticket trouvé</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Sujet</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Priorité</TableHead>
            {isAdmin && <TableHead>Utilisateur</TableHead>}
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono text-sm">
                {ticket.ticket_number}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={ticket.subject}>
                  {ticket.subject}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {TICKET_CATEGORY_CONFIG[ticket.category].icon}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={TICKET_STATUS_CONFIG[ticket.status].color}>
                  {TICKET_STATUS_CONFIG[ticket.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${TICKET_PRIORITY_CONFIG[ticket.priority].color} text-white`}
                >
                  {TICKET_PRIORITY_CONFIG[ticket.priority].label}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <span className="text-sm">{ticket.user?.full_name || "-"}</span>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(ticket.created_at), "d MMM", { locale: fr })}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="ghost">
                  <Link to={`${basePath}/${ticket.id}`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
