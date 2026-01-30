import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, LucideIcon } from "lucide-react";

interface ProofSource {
  name: string;
  source: string;
  weight: number;
  icon: LucideIcon;
  verified: boolean;
}

interface ProofSourcesCardProps {
  proofSources: ProofSource[];
}

export function ProofSourcesCard({ proofSources }: ProofSourcesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Sources de vos preuves
        </CardTitle>
        <CardDescription>
          Les preuves vérifiables qui composent votre score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofSources.map((source, index) => {
            const Icon = source.icon;
            return (
              <div 
                key={index} 
                className={`p-4 border rounded-lg ${
                  source.verified 
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' 
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${source.verified ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">{source.name}</span>
                  </div>
                  {source.verified ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="outline">Non fourni</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{source.source}</span>
                  <span className="text-xs font-semibold text-secondary">
                    Poids: {source.weight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
