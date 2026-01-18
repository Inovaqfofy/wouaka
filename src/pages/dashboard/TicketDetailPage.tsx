import { useParams, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupportTicket } from "@/hooks/useSupportTickets";
import { useAnalyzeTicket, useTicketRealtime } from "@/hooks/useTicketEnhanced";
import { TicketChat } from "@/components/support/TicketChat";
import { TicketDetails } from "@/components/support/TicketDetails";
import { SLACountdown } from "@/components/support/SLACountdown";
import { TicketAuditLog } from "@/components/support/TicketAuditLog";
import { TicketTagsEditor } from "@/components/support/TicketTagsEditor";
import { CSATSurvey } from "@/components/support/CSATSurvey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [searchParams] = useSearchParams();
  const showCSAT = searchParams.get('csat') === 'true';
  const { data: ticket, isLoading, refetch } = useSupportTicket(ticketId!);
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const analyzeTicket = useAnalyzeTicket();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isAdmin = role === "SUPER_ADMIN";
  const isPartner = role === "PARTENAIRE";
  const backPath = isAdmin ? "/dashboard/admin/support" : "/dashboard/borrower/support";

  // Real-time updates
  const handleRealtimeUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['ticket-logs', ticketId] });
  }, [queryClient, ticketId]);

  useTicketRealtime(ticketId!, handleRealtimeUpdate);

  // Auto-analyze new tickets
  useEffect(() => {
    if (ticket && !ticket.ai_priority_reason && isAdmin && !isAnalyzing) {
      handleAnalyze();
    }
  }, [ticket?.id]);

  const handleAnalyze = async () => {
    if (!ticket) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeTicket.mutateAsync({
        ticketId: ticket.id,
        subject: ticket.subject,
        description: ticket.description || '',
        category: ticket.category
      });
      toast.success("Analyse IA terminée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role={isAdmin ? "admin" : "borrower"} title="Ticket">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout role={isAdmin ? "admin" : "borrower"} title="Ticket">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket non trouvé</p>
          <Button asChild className="mt-4">
            <Link to={backPath}>Retour</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const showAdvancedFeatures = isAdmin || isPartner;

  return (
    <DashboardLayout role={isAdmin ? "admin" : "borrower"} title={`Ticket ${ticket.ticket_number}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button variant="ghost" asChild>
            <Link to={backPath}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux tickets
            </Link>
          </Button>

          {showAdvancedFeatures && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              {ticket.ai_priority_reason ? "Ré-analyser" : "Analyser avec l'IA"}
            </Button>
          )}
        </div>

        {/* CSAT Survey (if requested) */}
        {showCSAT && ticket.status === 'resolved' && (
          <CSATSurvey ticketId={ticket.id} />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat */}
          <div className="lg:col-span-2 space-y-6">
            <TicketChat ticketId={ticket.id} ticketStatus={ticket.status} />
          </div>

          {/* Right: Details & Tools */}
          <div className="space-y-6">
            {/* Ticket Details */}
            <TicketDetails ticket={ticket} />

            {/* SLA Countdown (Admin/Partner only) */}
            {showAdvancedFeatures && (
              <SLACountdown 
                ticketId={ticket.id}
                ticketStatus={ticket.status}
                firstResponseAt={ticket.first_response_at}
                resolvedAt={ticket.resolved_at}
                createdAt={ticket.created_at}
              />
            )}

            {/* Tags Editor (Admin/Partner only) */}
            {showAdvancedFeatures && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tags & Classification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketTagsEditor 
                    ticketId={ticket.id} 
                    readonly={!isAdmin && !isPartner}
                  />

                  {/* AI Analysis Summary */}
                  {ticket.ai_priority_reason && (
                    <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1 mb-1">
                        <Bot className="w-3 h-3" /> Analyse IA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.ai_priority_reason}
                      </p>
                      {ticket.frustration_score !== undefined && ticket.frustration_score !== null && (
                        <p className="text-xs mt-1">
                          Score de frustration: <strong>{Math.round(ticket.frustration_score * 100)}%</strong>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Audit Log (Admin only) */}
            {isAdmin && (
              <TicketAuditLog ticketId={ticket.id} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
