/**
 * LoanHistoryTable - Composant d'affichage de l'historique des prêts
 */

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

// ============================================
// Types
// ============================================

export type LoanStatus = 'pending' | 'approved' | 'rejected';

export interface LoanApplication {
  id: string;
  amount: number;
  date: string;
  status: LoanStatus;
  duration: number;
}

const statusConfig = {
  pending: { 
    label: 'En attente', 
    className: 'text-orange-600 bg-orange-50 border-orange-200', 
    icon: Clock 
  },
  approved: { 
    label: 'Approuvé', 
    className: 'text-green-600 bg-green-50 border-green-200', 
    icon: CheckCircle2 
  },
  rejected: { 
    label: 'Rejeté', 
    className: 'text-red-600 bg-red-50 border-red-200', 
    icon: XCircle 
  },
};

// ============================================
// Composant
// ============================================

export function LoanHistoryTable({ applications }: { applications: LoanApplication[] }) {
  if (applications.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Historique des demandes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="hidden md:table-cell">Durée</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((loan) => {
                const config = statusConfig[loan.status];
                const Icon = config.icon;
                
                return (
                  <TableRow key={loan.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(loan.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-bold">
                      {new Intl.NumberFormat('fr-FR').format(loan.amount)} FCFA
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {loan.duration} mois
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`inline-flex items-center gap-1 font-medium ${config.className}`}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
