import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Calculator,
  Download,
  Sparkles,
  PiggyBank,
  BadgePercent,
  Building2,
  ChartBar,
  Info,
  Loader2
} from 'lucide-react';
import { generateROIReport } from '@/lib/roi-report-generator';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface SimulatorResults {
  savingsNPL: number;
  savingsOPS: number;
  totalROI: number;
  percentageGain: number;
  projectedNPL: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} Mds`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)} M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} K`;
  }
  return value.toLocaleString('fr-FR');
};

const WouakaROISimulator = () => {
  // Input states
  const [volume, setVolume] = useState(500000000);
  const [npl, setNpl] = useState(12);
  const [clients, setClients] = useState(1000);
  const [cac, setCac] = useState(45000);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Results state
  const [results, setResults] = useState<SimulatorResults>({
    savingsNPL: 0,
    savingsOPS: 0,
    totalROI: 0,
    percentageGain: 0,
    projectedNPL: 0
  });
  
  // Animated counter
  const [displayedROI, setDisplayedROI] = useState(0);

  // PDF Generation handler
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateROIReport({
        volume,
        npl,
        clients,
        cac,
        savingsNPL: results.savingsNPL,
        savingsOPS: results.savingsOPS,
        totalROI: results.totalROI,
        percentageGain: results.percentageGain,
        projectedNPL: results.projectedNPL,
      });
      toast.success("Rapport d'impact téléchargé avec succès !");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate results
  useEffect(() => {
    // Économie sur les impayés : Snpl = (V × (N/100)) × 0.25
    const savingsNPL = (volume * (npl / 100)) * 0.25;
    
    // Économie opérationnelle : Sops = (CAC × C) × 0.15
    const savingsOPS = (cac * clients) * 0.15;
    
    // Gain total
    const totalROI = savingsNPL + savingsOPS;
    
    // Pourcentage de gain par rapport au volume
    const percentageGain = (totalROI / volume) * 100;
    
    // NPL projeté après WOUAKA
    const projectedNPL = npl * 0.75;

    setResults({
      savingsNPL: Math.round(savingsNPL),
      savingsOPS: Math.round(savingsOPS),
      totalROI: Math.round(totalROI),
      percentageGain,
      projectedNPL
    });
  }, [volume, npl, clients, cac]);

  // Animate ROI counter
  useEffect(() => {
    const target = results.totalROI;
    const duration = 800;
    const steps = 30;
    const increment = (target - displayedROI) / steps;
    
    if (Math.abs(target - displayedROI) < 1000) {
      setDisplayedROI(target);
      return;
    }
    
    const timer = setInterval(() => {
      setDisplayedROI(prev => {
        const next = prev + increment;
        if ((increment > 0 && next >= target) || (increment < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, duration / steps);

    return () => clearInterval(timer);
  }, [results.totalROI]);

  // Chart data for NPL comparison
  const nplChartData = [
    { name: 'Actuel', value: npl, fill: '#D4A017' },
    { name: 'Avec WOUAKA', value: results.projectedNPL, fill: '#0A3D2C' },
  ];

  // Projection chart data (12 months)
  const projectionData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
    economie: Math.round((results.totalROI / 12) * (i + 1)),
    cumul: Math.round((results.totalROI / 12) * (i + 1))
  }));

  return (
    <section className="py-20 bg-gradient-to-b from-[#0A3D2C] to-[#072A1E] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#D4A017]/20 text-[#D4A017] border-[#D4A017]/30">
            <Calculator className="w-3 h-3 mr-1" />
            Simulateur de Rentabilité
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            WOUAKA <span className="text-[#D4A017]">Insight</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Calculez précisément l'impact financier de WOUAKA sur votre portefeuille de crédit. 
            Démonstration mathématique du gain.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ChartBar className="w-5 h-5 text-[#D4A017]" />
                  Paramètres de votre portefeuille
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Volume de Crédit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80 flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-[#D4A017]" />
                      Volume de Crédit Annuel
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-white/40" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border">
                            <p>Montant total des crédits octroyés sur 12 mois</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <span className="text-[#D4A017] font-mono font-bold text-lg">
                      {formatCurrency(volume)} FCFA
                    </span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(v) => setVolume(v[0])}
                    min={100000000}
                    max={50000000000}
                    step={100000000}
                    className="[&_[role=slider]]:bg-[#D4A017] [&_[role=slider]]:border-[#D4A017]"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>100M</span>
                    <span>50 Mds</span>
                  </div>
                </div>

                {/* Taux NPL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80 flex items-center gap-2">
                      <BadgePercent className="w-4 h-4 text-red-400" />
                      Taux de NPL Actuel
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-white/40" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border">
                            <p>Non-Performing Loans - Prêts non performants</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <span className="text-red-400 font-mono font-bold text-lg">
                      {npl}%
                    </span>
                  </div>
                  <Slider
                    value={[npl]}
                    onValueChange={(v) => setNpl(v[0])}
                    min={1}
                    max={30}
                    step={0.5}
                    className="[&_[role=slider]]:bg-red-400 [&_[role=slider]]:border-red-400"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Nombre de clients */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Nombre de Clients / An
                    </label>
                    <span className="text-blue-400 font-mono font-bold text-lg">
                      {clients.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[clients]}
                    onValueChange={(v) => setClients(v[0])}
                    min={100}
                    max={50000}
                    step={100}
                    className="[&_[role=slider]]:bg-blue-400 [&_[role=slider]]:border-blue-400"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>100</span>
                    <span>50 000</span>
                  </div>
                </div>

                {/* Coût d'acquisition */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      Coût d'Acquisition Client (CAC)
                    </label>
                    <span className="text-purple-400 font-mono font-bold text-lg">
                      {cac.toLocaleString()} FCFA
                    </span>
                  </div>
                  <Slider
                    value={[cac]}
                    onValueChange={(v) => setCac(v[0])}
                    min={5000}
                    max={150000}
                    step={1000}
                    className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>5K</span>
                    <span>150K</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NPL Comparison Chart */}
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                  Réduction du Taux de NPL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="flex-1 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nplChartData} layout="vertical">
                        <XAxis type="number" domain={[0, Math.max(npl, 15)]} hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#fff', fontSize: 12 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {nplChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#D4A017]">
                      -25%
                    </div>
                    <p className="text-xs text-white/60">Réduction des impayés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Main ROI Display */}
            <Card className="bg-gradient-to-br from-[#D4A017]/20 to-[#D4A017]/5 border-[#D4A017]/30 overflow-hidden">
              <CardContent className="p-8 text-center relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017]/10 rounded-full blur-3xl" />
                
                <Sparkles className="w-8 h-8 text-[#D4A017] mx-auto mb-4" />
                
                <p className="text-white/60 text-sm uppercase tracking-wider mb-2">
                  Économie Annuelle Potentielle
                </p>
                
                <motion.div
                  key={results.totalROI}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className="text-4xl md:text-5xl font-black text-[#D4A017] mb-1">
                    {formatCurrency(Math.round(displayedROI))}
                  </div>
                  <div className="text-xl text-[#D4A017]/80">FCFA</div>
                </motion.div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 italic">
                    Soit <span className="text-[#D4A017] font-semibold">{results.percentageGain.toFixed(2)}%</span> du volume de crédit
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Détail des économies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-white/80 text-sm">Réduction NPL</span>
                  </div>
                  <span className="text-green-400 font-mono font-semibold">
                    {formatCurrency(results.savingsNPL)} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#D4A017]" />
                    <span className="text-white/80 text-sm">Gain opérationnel</span>
                  </div>
                  <span className="text-[#D4A017] font-mono font-semibold">
                    {formatCurrency(results.savingsOPS)} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Projection Chart */}
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D4A017]" />
                  Projection sur 12 mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4A017" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#fff', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${formatCurrency(value)} FCFA`, 'Économies cumulées']}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumul"
                        stroke="#D4A017"
                        strokeWidth={2}
                        fill="url(#colorCumul)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button 
              size="lg" 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-[#D4A017] hover:bg-[#D4A017]/90 text-[#0A3D2C] font-bold gap-2 shadow-lg shadow-[#D4A017]/20 disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Obtenir mon Rapport d'Impact PDF
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-white/40">
              Rapport personnalisé incluant les formules de calcul et projections détaillées
            </p>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#D4A017]" />
            Méthodologie de calcul
          </h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-white/70">
            <div>
              <p className="mb-2">
                <strong className="text-white">Économie NPL (S<sub>npl</sub>)</strong> = Volume × (Taux NPL / 100) × 25%
              </p>
              <p className="text-xs text-white/50">
                Basé sur une réduction moyenne de 25% des impayés grâce au W-SCORE
              </p>
            </div>
            <div>
              <p className="mb-2">
                <strong className="text-white">Économie Opérationnelle (S<sub>ops</sub>)</strong> = CAC × Clients × 15%
              </p>
              <p className="text-xs text-white/50">
                Optimisation des coûts d'acquisition via l'automatisation KYC/Scoring
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WouakaROISimulator;
