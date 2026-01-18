import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportTickets, useTicketStats } from "@/hooks/useSupportTickets";
import { useCSATStats } from "@/hooks/useTicketEnhanced";
import { TicketList } from "@/components/support/TicketList";
import { TicketKanban } from "@/components/support/TicketKanban";
import { 
  Headphones, 
  TicketPlus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Star,
  LayoutGrid,
  List,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSupport() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { data: tickets, isLoading, refetch } = useSupportTickets();
  const { data: stats } = useTicketStats();
  const { data: csatStats } = useCSATStats();

  const handleCheckEscalations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('support-ai?action=check-escalation');
      if (error) throw error;
      
      if (data.escalated > 0) {
        toast.success(`${data.escalated} ticket(s) escaladé(s) automatiquement`);
        refetch();
      } else {
        toast.info("Aucun ticket à escalader");
      }
    } catch (error) {
      toast.error("Erreur lors de la vérification des escalades");
    }
  };

  return (
    <DashboardLayout role="admin" title="Centre de Support">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              Command Center
            </h1>
            <p className="text-muted-foreground">Gestion avancée des tickets de support</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCheckEscalations}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Vérifier escalades
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TicketPlus className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.open || 0}</p>
                  <p className="text-sm text-muted-foreground">Tickets ouverts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.byPriority?.urgent || 0}</p>
                  <p className="text-sm text-muted-foreground">Urgents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.avgResponseMinutes || 0}min</p>
                  <p className="text-sm text-muted-foreground">Temps moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.byStatus?.resolved || 0}</p>
                  <p className="text-sm text-muted-foreground">Résolus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">{csatStats?.averageRating || '-'}/5</p>
                  <p className="text-sm text-muted-foreground">CSAT ({csatStats?.count || 0})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Mode Toggle & Content */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tous les tickets</CardTitle>
                <CardDescription>
                  {tickets?.length || 0} tickets au total
                </CardDescription>
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="kanban">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="w-4 h-4 mr-2" />
                    Liste
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'kanban' ? (
              <TicketKanban />
            ) : (
              <TicketList 
                tickets={tickets} 
                isLoading={isLoading} 
                basePath="/dashboard/admin/support" 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
