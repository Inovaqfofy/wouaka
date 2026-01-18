import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;
  uptime: number;
}

const services: ServiceStatus[] = [
  { name: "API Scoring", status: 'operational', latency: 145, uptime: 99.99 },
  { name: "API KYC", status: 'operational', latency: 230, uptime: 99.98 },
  { name: "Webhooks", status: 'operational', latency: 89, uptime: 99.95 },
  { name: "Sandbox", status: 'operational', latency: 120, uptime: 100 },
];

export const ApiStatusWidget = ({ compact = false }: { compact?: boolean }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'outage':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'outage':
        return 'bg-red-500';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full animate-pulse", allOperational ? "bg-emerald-500" : "bg-amber-500")} />
        <span className="text-sm text-muted-foreground">
          {allOperational ? "Tous les services opérationnels" : "Dégradation partielle"}
        </span>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-semibold">Statut des Services</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={allOperational ? "default" : "secondary"} className={allOperational ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}>
              {allOperational ? "Opérationnel" : "Dégradé"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{service.latency}ms</span>
                <span className="text-xs text-emerald-600 font-mono">{service.uptime}%</span>
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(service.status))} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}</span>
          <span className="text-primary">Statut en temps réel</span>
        </div>
      </CardContent>
    </Card>
  );
};
