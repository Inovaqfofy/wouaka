import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Eye,
  Download,
  Filter,
  Search,
  User,
  Shield,
  Database,
  Settings,
  AlertTriangle,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: "auth" | "data" | "config" | "security" | "scoring" | "kyc";
  actor: {
    id: string;
    email: string;
    role: string;
    ip_address?: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  changes?: {
    field: string;
    old_value?: string;
    new_value?: string;
  }[];
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
  success: boolean;
}

interface EnhancedAuditTrailProps {
  logs: AuditLogEntry[];
  isLoading?: boolean;
  onExport?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const categoryConfig = {
  auth: { icon: User, label: "Authentification", color: "bg-blue-500/10 text-blue-600" },
  data: { icon: Database, label: "Données", color: "bg-green-500/10 text-green-600" },
  config: { icon: Settings, label: "Configuration", color: "bg-purple-500/10 text-purple-600" },
  security: { icon: Shield, label: "Sécurité", color: "bg-red-500/10 text-red-600" },
  scoring: { icon: FileText, label: "Scoring", color: "bg-orange-500/10 text-orange-600" },
  kyc: { icon: Eye, label: "KYC", color: "bg-teal-500/10 text-teal-600" },
};

const severityConfig = {
  info: { color: "bg-muted text-muted-foreground", label: "Info" },
  warning: { color: "bg-warning/10 text-warning", label: "Avertissement" },
  critical: { color: "bg-destructive/10 text-destructive", label: "Critique" },
};

function AuditLogItem({ log }: { log: AuditLogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const category = categoryConfig[log.category];
  const severity = severityConfig[log.severity];
  const CategoryIcon = category.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={`audit-trail-item ${log.severity}`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start gap-4 text-left hover:bg-muted/30 p-3 -m-3 rounded-lg transition-colors">
            <div className={`w-9 h-9 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{log.action}</span>
                {!log.success && (
                  <Badge variant="destructive" className="text-xs">Échec</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{log.actor.email}</span>
                {log.actor.ip_address && (
                  <>
                    <span>•</span>
                    <span>{log.actor.ip_address}</span>
                  </>
                )}
                {log.target && (
                  <>
                    <span>•</span>
                    <span>{log.target.type}: {log.target.name || log.target.id}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge className={`${severity.color} text-xs`}>
                {severity.label}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(log.timestamp), "dd MMM HH:mm:ss", { locale: fr })}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 pl-13 space-y-4">
            {/* Changes */}
            {log.changes && log.changes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Modifications</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {log.changes.map((change, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{change.field}</span>
                      {change.old_value && (
                        <span className="text-destructive line-through">{change.old_value}</span>
                      )}
                      {change.old_value && change.new_value && <span>→</span>}
                      {change.new_value && (
                        <span className="text-success">{change.new_value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Métadonnées</p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actor Details */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Rôle: {log.actor.role}</span>
              <span>ID: {log.actor.id.slice(0, 8)}...</span>
              <span>Log ID: {log.id.slice(0, 8)}...</span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function EnhancedAuditTrail({
  logs,
  isLoading = false,
  onExport,
  onLoadMore,
  hasMore = false,
}: EnhancedAuditTrailProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Stats
  const stats = {
    total: logs.length,
    critical: logs.filter((l) => l.severity === "critical").length,
    failed: logs.filter((l) => !l.success).length,
    today: logs.filter((l) => {
      const today = new Date();
      const logDate = new Date(l.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <Card className="card-enterprise">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Journalisation immuable de toutes les actions
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </div>
          <div className="p-3 bg-destructive/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
            <p className="text-xs text-muted-foreground">Critiques</p>
          </div>
          <div className="p-3 bg-warning/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-warning">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Échecs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(severityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun log correspondant</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))}
              {hasMore && (
                <Button variant="ghost" className="w-full" onClick={onLoadMore}>
                  Charger plus
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
