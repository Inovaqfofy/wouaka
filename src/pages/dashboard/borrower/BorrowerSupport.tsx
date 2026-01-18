import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { TicketList } from "@/components/support/TicketList";
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog";
import { SelfServiceCenter } from "@/components/support/SelfServiceCenter";
import { HelpCircle, Plus, Ticket, Sparkles } from "lucide-react";

export default function BorrowerSupport() {
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'tickets'>('help');
  const { data: tickets, isLoading } = useSupportTickets();

  const openTicketsCount = tickets?.filter(t => 
    t.status !== 'closed' && t.status !== 'resolved'
  ).length || 0;

  return (
    <DashboardLayout role="borrower" title="Centre d'aide">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Centre d'aide
            </h1>
            <p className="text-muted-foreground">
              Besoin d'assistance ? Nous sommes là pour vous aider.
            </p>
          </div>
          {openTicketsCount > 0 && (
            <Button variant="outline" onClick={() => setActiveTab('tickets')}>
              <Ticket className="w-4 h-4 mr-2" />
              {openTicketsCount} ticket(s) en cours
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="help" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Résolution rapide
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="w-4 h-4" />
              Mes tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="mt-6">
            <SelfServiceCenter onCreateTicket={() => setCreateOpen(true)} />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mes tickets</CardTitle>
                    <CardDescription>Historique de vos demandes de support</CardDescription>
                  </div>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TicketList 
                  tickets={tickets} 
                  isLoading={isLoading} 
                  basePath="/dashboard/borrower/support" 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </DashboardLayout>
  );
}
