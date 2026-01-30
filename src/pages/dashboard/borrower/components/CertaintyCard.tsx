import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Info } from "lucide-react";

interface CertaintyCardProps {
  certaintyCoefficient: number;
}

export function CertaintyCard({ certaintyCoefficient }: CertaintyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-secondary" />
          Coefficient de Certitude
        </CardTitle>
        <CardDescription>Fiabilité de vos preuves</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-4xl font-bold text-secondary">
              {Math.round(certaintyCoefficient * 100)}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Coefficient global
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Preuves vérifiées</span>
              <span className="font-medium">Poids 0.9</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Données déclaratives</span>
              <span className="font-medium">Poids 0.3</span>
            </div>
          </div>
          
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <Info className="w-4 h-4 inline mr-1" />
            Plus vos preuves sont vérifiables, plus le coefficient est élevé.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
