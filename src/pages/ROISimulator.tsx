import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Users,
  BadgeCheck,
  ArrowRight,
  Building2,
  Percent,
  DollarSign,
  Target,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function ROISimulator() {
  // Inputs
  const [monthlyApplications, setMonthlyApplications] = useState([500]);
  const [currentApprovalRate, setCurrentApprovalRate] = useState([35]);
  const [currentNPL, setCurrentNPL] = useState([12]);
  const [avgLoanAmount, setAvgLoanAmount] = useState([2000000]);
  const [currentCAC, setCurrentCAC] = useState([25000]);

  // WOUAKA Impact (conservative estimates)
  const approvalRateBoost = 1.25; // +25% approval rate
  const nplReduction = 0.65; // -35% NPL
  const cacReduction = 0.80; // -20% CAC

  // Calculations
  const currentMonthlyApprovals = monthlyApplications[0] * (currentApprovalRate[0] / 100);
  const newApprovalRate = Math.min(currentApprovalRate[0] * approvalRateBoost, 85);
  const newMonthlyApprovals = monthlyApplications[0] * (newApprovalRate / 100);
  const additionalApprovals = newMonthlyApprovals - currentMonthlyApprovals;

  const currentNPLCost = currentMonthlyApprovals * avgLoanAmount[0] * (currentNPL[0] / 100);
  const newNPL = currentNPL[0] * nplReduction;
  const newNPLCost = newMonthlyApprovals * avgLoanAmount[0] * (newNPL / 100);
  const nplSavings = currentNPLCost - newNPLCost;

  const currentTotalCAC = currentMonthlyApprovals * currentCAC[0];
  const newCAC = currentCAC[0] * cacReduction;
  const newTotalCAC = newMonthlyApprovals * newCAC;
  const cacSavings = currentTotalCAC - newTotalCAC + (additionalApprovals * newCAC);

  const additionalRevenue = additionalApprovals * avgLoanAmount[0] * 0.12; // 12% interest margin
  const totalMonthlyBenefit = additionalRevenue + nplSavings + cacSavings;
  const annualBenefit = totalMonthlyBenefit * 12;

  // WOUAKA cost estimate
  const wouakaMonthlyCost = Math.max(49000, newMonthlyApprovals * 200); // 200 FCFA per dossier
  const annualCost = wouakaMonthlyCost * 12;
  const roi = ((annualBenefit - annualCost) / annualCost) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Simulateur ROI - Calculez votre Rentabilité avec WOUAKA"
        description="Simulez l'impact de WOUAKA sur votre taux d'approbation, vos NPL et votre coût d'acquisition client."
        canonical="/simulateur-roi"
      />
      <Navbar />

      {/* Hero */}
      <section className="py-16 hero-enterprise">
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-4 bg-white/10 text-white border-white/15">
            <Calculator className="w-3 h-3 mr-1" />
            SIMULATEUR DE RENTABILITÉ
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Calculez votre ROI avec WOUAKA
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Ajustez les paramètres selon votre activité et visualisez l'impact sur votre rentabilité.
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Inputs */}
            <Card className="p-6 card-enterprise">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Vos paramètres actuels
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Demandes de crédit / mois</Label>
                    <span className="font-semibold">{monthlyApplications[0]}</span>
                  </div>
                  <Slider value={monthlyApplications} onValueChange={setMonthlyApplications} min={100} max={5000} step={50} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Taux d'approbation actuel</Label>
                    <span className="font-semibold">{currentApprovalRate[0]}%</span>
                  </div>
                  <Slider value={currentApprovalRate} onValueChange={setCurrentApprovalRate} min={10} max={70} step={1} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Taux NPL actuel (impayés)</Label>
                    <span className="font-semibold">{currentNPL[0]}%</span>
                  </div>
                  <Slider value={currentNPL} onValueChange={setCurrentNPL} min={3} max={25} step={0.5} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Montant moyen du prêt</Label>
                    <span className="font-semibold">{formatCurrency(avgLoanAmount[0])}</span>
                  </div>
                  <Slider value={avgLoanAmount} onValueChange={setAvgLoanAmount} min={100000} max={10000000} step={100000} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Coût d'acquisition client (CAC)</Label>
                    <span className="font-semibold">{formatCurrency(currentCAC[0])}</span>
                  </div>
                  <Slider value={currentCAC} onValueChange={setCurrentCAC} min={5000} max={100000} step={1000} />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              <Card className="p-6 card-enterprise border-secondary/30">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <TrendingUp className="w-5 h-5" />
                    Impact WOUAKA (estimations conservatrices)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Nouveau taux d'approbation</p>
                      <p className="text-2xl font-bold text-success">{formatPercent(newApprovalRate)}</p>
                      <p className="text-xs text-success">+{formatPercent(newApprovalRate - currentApprovalRate[0])}</p>
                    </div>
                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Nouveau taux NPL</p>
                      <p className="text-2xl font-bold text-success">{formatPercent(newNPL)}</p>
                      <p className="text-xs text-success">-{formatPercent(currentNPL[0] - newNPL)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crédits additionnels / mois</span>
                      <span className="font-semibold text-success">+{Math.round(additionalApprovals)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenus additionnels / mois</span>
                      <span className="font-semibold text-success">+{formatCurrency(additionalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Économies NPL / mois</span>
                      <span className="font-semibold text-success">+{formatCurrency(nplSavings)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                <div className="text-center">
                  <p className="text-sm opacity-80 mb-2">Bénéfice net annuel estimé</p>
                  <p className="text-4xl font-bold mb-2">{formatCurrency(annualBenefit - annualCost)}</p>
                  <Badge className="bg-secondary text-secondary-foreground">
                    ROI: {roi > 0 ? '+' : ''}{formatPercent(roi)}
                  </Badge>
                </div>
              </Card>

              <Button size="lg" className="w-full gap-2" asChild>
                <Link to="/contact">
                  <Building2 className="w-5 h-5" />
                  Discuter avec un expert
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
