import React, { useState } from "react";
import {
  Target,
  Settings2,
  AlertTriangle,
  Check,
  Info,
  Save,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface RiskAppetiteConfig {
  // Score thresholds
  minAcceptableScore: number;
  autoApproveThreshold: number;
  manualReviewThreshold: number;
  
  // Loan parameters
  maxLoanMultiplier: number;
  maxTenorMonths: number;
  baseInterestRate: number;
  
  // Risk adjustments
  requireGuarantor: boolean;
  guarantorThreshold: number;
  certaintyCoefficientMin: number;
  
  // Fraud settings
  fraudAlertThreshold: number;
  blockHighRiskAuto: boolean;
  
  // AML settings
  requireAmlClearing: boolean;
  pepExtraReview: boolean;
}

interface RiskAppetiteConfigProps {
  initialConfig?: Partial<RiskAppetiteConfig>;
  onSave?: (config: RiskAppetiteConfig) => void;
  isLoading?: boolean;
}

const defaultConfig: RiskAppetiteConfig = {
  minAcceptableScore: 45,
  autoApproveThreshold: 70,
  manualReviewThreshold: 55,
  maxLoanMultiplier: 3.0,
  maxTenorMonths: 36,
  baseInterestRate: 12.5,
  requireGuarantor: true,
  guarantorThreshold: 60,
  certaintyCoefficientMin: 0.7,
  fraudAlertThreshold: 0.6,
  blockHighRiskAuto: true,
  requireAmlClearing: true,
  pepExtraReview: true,
};

const gradeFromScore = (score: number): { grade: string; color: string } => {
  if (score >= 80) return { grade: "A", color: "text-success" };
  if (score >= 70) return { grade: "B", color: "text-success" };
  if (score >= 60) return { grade: "C", color: "text-warning" };
  if (score >= 50) return { grade: "D", color: "text-warning" };
  return { grade: "E", color: "text-destructive" };
};

export function RiskAppetiteConfig({
  initialConfig = {},
  onSave,
  isLoading = false,
}: RiskAppetiteConfigProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<RiskAppetiteConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = <K extends keyof RiskAppetiteConfig>(
    key: K,
    value: RiskAppetiteConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(config);
    setHasChanges(false);
    toast({
      title: "Configuration sauvegardée",
      description: "Les nouveaux seuils de risque seront appliqués aux prochaines évaluations.",
    });
  };

  const handleReset = () => {
    setConfig({ ...defaultConfig, ...initialConfig });
    setHasChanges(false);
  };

  const autoApproveGrade = gradeFromScore(config.autoApproveThreshold);
  const manualReviewGrade = gradeFromScore(config.manualReviewThreshold);
  const minAcceptableGrade = gradeFromScore(config.minAcceptableScore);

  return (
    <Card className="card-enterprise">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Configuration Risk Appetite</CardTitle>
              <CardDescription>
                Paramétrez les seuils de risque selon votre politique interne
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Score Thresholds */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Seuils de Score WOUAKA</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Approbation automatique
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Score minimum pour approbation sans revue manuelle
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{config.autoApproveThreshold}</span>
                  <Badge className={`${autoApproveGrade.color} bg-transparent border`}>
                    Grade {autoApproveGrade.grade}
                  </Badge>
                </div>
              </div>
              <Slider
                value={[config.autoApproveThreshold]}
                onValueChange={([v]) => updateConfig("autoApproveThreshold", v)}
                min={50}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 (Risqué)</span>
                <span>90 (Conservateur)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Revue manuelle
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Score entre ce seuil et l'auto-approbation nécessite une revue
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{config.manualReviewThreshold}</span>
                  <Badge className={`${manualReviewGrade.color} bg-transparent border`}>
                    Grade {manualReviewGrade.grade}
                  </Badge>
                </div>
              </div>
              <Slider
                value={[config.manualReviewThreshold]}
                onValueChange={([v]) => updateConfig("manualReviewThreshold", v)}
                min={30}
                max={70}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30 (Agressif)</span>
                <span>70 (Prudent)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Score minimum
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      En dessous de ce score, rejet automatique
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{config.minAcceptableScore}</span>
                  <Badge className={`${minAcceptableGrade.color} bg-transparent border`}>
                    Grade {minAcceptableGrade.grade}
                  </Badge>
                </div>
              </div>
              <Slider
                value={[config.minAcceptableScore]}
                onValueChange={([v]) => updateConfig("minAcceptableScore", v)}
                min={20}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20 (Très agressif)</span>
                <span>60 (Conservateur)</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Loan Parameters */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Paramètres de Crédit</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Multiplicateur max prêt</Label>
                <span className="text-lg font-bold">{config.maxLoanMultiplier.toFixed(1)}x</span>
              </div>
              <Slider
                value={[config.maxLoanMultiplier * 10]}
                onValueChange={([v]) => updateConfig("maxLoanMultiplier", v / 10)}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Du revenu mensuel estimé
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Durée max (mois)</Label>
                <span className="text-lg font-bold">{config.maxTenorMonths}</span>
              </div>
              <Slider
                value={[config.maxTenorMonths]}
                onValueChange={([v]) => updateConfig("maxTenorMonths", v)}
                min={6}
                max={72}
                step={6}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Taux de base (%)</Label>
                <span className="text-lg font-bold">{config.baseInterestRate.toFixed(1)}%</span>
              </div>
              <Slider
                value={[config.baseInterestRate * 10]}
                onValueChange={([v]) => updateConfig("baseInterestRate", v / 10)}
                min={50}
                max={250}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Guarantor & Certainty */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Garants & Certitude</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Exiger garant sous le seuil
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Demander un garant si le score est sous ce seuil
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  checked={config.requireGuarantor}
                  onCheckedChange={(v) => updateConfig("requireGuarantor", v)}
                />
              </div>
              {config.requireGuarantor && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between">
                    <Label>Seuil garant</Label>
                    <span className="font-bold">{config.guarantorThreshold}</span>
                  </div>
                  <Slider
                    value={[config.guarantorThreshold]}
                    onValueChange={([v]) => updateConfig("guarantorThreshold", v)}
                    min={40}
                    max={80}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Coefficient de certitude minimum</Label>
                <span className="text-lg font-bold">{(config.certaintyCoefficientMin * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[config.certaintyCoefficientMin * 100]}
                onValueChange={([v]) => updateConfig("certaintyCoefficientMin", v / 100)}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dossiers sous ce seuil nécessitent des preuves additionnelles
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Fraud & AML */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold">Fraude & AML</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Seuil alerte fraude</Label>
                <span className="text-lg font-bold">{(config.fraudAlertThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[config.fraudAlertThreshold * 100]}
                onValueChange={([v]) => updateConfig("fraudAlertThreshold", v / 100)}
                min={30}
                max={80}
                step={5}
                className="w-full"
              />

              <div className="flex items-center justify-between pt-4">
                <Label>Bloquer auto risque élevé</Label>
                <Switch
                  checked={config.blockHighRiskAuto}
                  onCheckedChange={(v) => updateConfig("blockHighRiskAuto", v)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Exiger clearing AML</Label>
                <Switch
                  checked={config.requireAmlClearing}
                  onCheckedChange={(v) => updateConfig("requireAmlClearing", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Revue extra pour PEP</Label>
                <Switch
                  checked={config.pepExtraReview}
                  onCheckedChange={(v) => updateConfig("pepExtraReview", v)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-3">Résumé de votre politique :</p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Auto-approbation: Score ≥ {config.autoApproveThreshold} (Grade {autoApproveGrade.grade}+)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-warning" />
              <span>Revue manuelle: Score {config.manualReviewThreshold}-{config.autoApproveThreshold}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span>Rejet auto: Score &lt; {config.minAcceptableScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Certitude min requise: {(config.certaintyCoefficientMin * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
