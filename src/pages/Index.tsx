import React from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Building2,
  Zap,
  ArrowRight,
  Clock,
  Shield,
  Target,
  BarChart3,
  Sparkles,
  PieChart,
  UserCheck,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { motion } from "framer-motion";
import heroUser from "@/assets/hero-user.png";
import heroConsultant from "@/assets/hero-consultant.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="WOUAKA - Prêtez en toute sérénité"
        description="WOUAKA transforme vos données en décisions. Une évaluation de crédit instantanée et fiable pour sécuriser votre croissance."
        keywords="scoring crédit Afrique, inclusion financière, bancarisation informel, KYC alternatif, données alternatives UEMOA"
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "WOUAKA",
          description: "Évaluation de crédit instantanée et fiable pour sécuriser votre croissance",
          url: "https://www.wouaka-creditscore.com",
          logo: "https://www.wouaka-creditscore.com/logo.png",
          areaServed: "UEMOA",
        }}
      />
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[90vh] overflow-hidden" style={{ background: 'linear-gradient(160deg, hsl(var(--wouaka-deep)) 0%, hsl(162 65% 14%) 60%, hsl(var(--wouaka-navy)) 100%)' }}>
        {/* Subtle background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-wouaka-gold/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-20 lg:pt-28 pb-0">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            {/* Left: Human visual - aligned to bottom */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:flex items-end justify-center order-1"
            >
              <div className="relative">
                {/* Main image - consultant - bottom aligned */}
                <img
                  src={heroConsultant}
                  alt="Agent de crédit équipé"
                  className="w-full max-w-lg object-contain object-bottom"
                  style={{ marginBottom: '-1px' }}
                />
                
                {/* Floating Score card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute right-0 top-1/4 bg-white rounded-xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success font-bold text-lg">A</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="font-bold text-lg text-foreground">82/100</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating approval badge */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute right-4 bottom-1/4 bg-success text-white rounded-xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Éligible</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 pb-20 lg:pb-28"
            >
              <Badge className="mb-6 bg-wouaka-gold/15 text-wouaka-gold border-wouaka-gold/30">
                <Zap className="w-3 h-3 mr-1" />
                Accélérez vos décisions de crédit
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                Prêtez en
                <span className="text-wouaka-gold block mt-2">toute sérénité.</span>
              </h1>

              <p className="text-white/80 text-lg md:text-xl mb-8 leading-relaxed max-w-xl">
                WOUAKA transforme vos données en décisions. 
                <strong className="text-white"> Une évaluation de crédit instantanée et fiable </strong> 
                pour sécuriser votre croissance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-wouaka-gold hover:bg-wouaka-gold/90 text-wouaka-deep gap-2 text-base px-8 py-6 font-bold rounded-xl shadow-gold transition-all hover:scale-[1.02]"
                  asChild
                >
                  <Link to="/partenaires">
                    <Building2 className="w-5 h-5" />
                    Découvrir nos solutions
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 gap-2 text-base px-8 py-6 rounded-xl"
                  asChild
                >
                  <Link to="/contact">
                    Parler à un expert
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust indicator */}
              <div className="flex items-center gap-6 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-wouaka-gold" />
                  <span>Conforme BCEAO</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-wouaka-gold" />
                  <span>Sécurité bancaire</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Gradient transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ========== TRIPLE GAIN SECTION ========== */}
      <section className="py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Target className="w-3 h-3 mr-1" />
              LE TRIPLE GAIN
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Prêter plus, mieux et en toute sérénité
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Accédez à une nouvelle classe de clients fiables, jusqu'ici invisibles pour vos systèmes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Gain de Temps",
                stat: "< 30 sec",
                description: "Décision de crédit en quelques secondes. Automatisation complète de l'évaluation initiale.",
                color: "bg-primary text-white",
                iconBg: "bg-primary/10 text-primary",
              },
              {
                icon: Users,
                title: "Gain de Volume",
                stat: "+40%",
                description: "Clients bancarisables potentiels. Transformez le secteur informel en opportunité.",
                color: "bg-wouaka-gold text-wouaka-deep",
                iconBg: "bg-secondary/10 text-secondary",
              },
              {
                icon: Shield,
                title: "Gain de Sécurité",
                stat: "-35%",
                description: "Réduction des impayés. Évaluation basée sur le comportement réel, pas seulement les fiches de paie.",
                color: "bg-success text-white",
                iconBg: "bg-success/10 text-success",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="h-full p-6 border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-5`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${item.color}`}>
                    {item.stat}
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MARKET OPPORTUNITY SECTION ========== */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                <PieChart className="w-3 h-3 mr-1" />
                LE MARCHÉ INEXPLOITÉ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                70% du marché africain 
                <span className="text-primary"> vous attend</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Le secteur informel représente des millions de clients solvables mais "invisibles" 
                pour les systèmes bancaires traditionnels. WOUAKA les rend accessibles.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { label: "Commerçants", value: "Revenus réguliers via Mobile Money", percent: 35 },
                  { label: "Artisans", value: "Activité vérifiable par historique digital", percent: 25 },
                  { label: "Agriculteurs", value: "Flux financiers traçables", percent: 22 },
                  { label: "Transporteurs", value: "Transactions quotidiennes documentées", percent: 18 },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-sm font-bold text-primary">{item.percent}%</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="lg" className="gap-2" asChild>
                <Link to="/partenaires">
                  Accéder à ce marché
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Data visualization instead of image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Main circular chart visualization */}
              <div className="bg-card border rounded-2xl p-8 shadow-lg">
                {/* Donut chart representation */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                    />
                    {/* Informal sector - 70% */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      initial={{ strokeDashoffset: 251.2 }}
                      whileInView={{ strokeDashoffset: 75.36 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                    {/* Formal sector - 30% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--secondary))"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset="175.84"
                      strokeLinecap="round"
                      className="opacity-50"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className="text-5xl font-extrabold text-primary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                    >
                      70%
                    </motion.span>
                    <span className="text-sm text-muted-foreground">Non bancarisé</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm">Secteur informel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary/50" />
                    <span className="text-sm">Bancarisé</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    className="text-center p-4 bg-muted/50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-3xl font-bold text-primary">8</p>
                    <p className="text-sm text-muted-foreground">Pays UEMOA</p>
                  </motion.div>
                  <motion.div
                    className="text-center p-4 bg-muted/50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-3xl font-bold text-secondary">150M+</p>
                    <p className="text-sm text-muted-foreground">Population cible</p>
                  </motion.div>
                  <motion.div
                    className="text-center p-4 bg-muted/50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-3xl font-bold text-success">+40%</p>
                    <p className="text-sm text-muted-foreground">Clients potentiels</p>
                  </motion.div>
                  <motion.div
                    className="text-center p-4 bg-muted/50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-3xl font-bold text-wouaka-gold">99.9%</p>
                    <p className="text-sm text-muted-foreground">Disponibilité</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== INTEGRATION SECTION ========== */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              DÉPLOIEMENT INSTANTANÉ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Boostez vos capacités d'octroi<br className="hidden md:block" />
              <span className="text-muted-foreground font-normal text-2xl md:text-3xl"> sans changer vos logiciels actuels</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Une intégration transparente, opérationnelle immédiatement. 
              WOUAKA s'intègre à vos Core Banking Systems existants.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { step: "1", title: "Connexion API", desc: "Intégration en 48h" },
              { step: "2", title: "Configuration", desc: "Ajustez vos critères" },
              { step: "3", title: "Production", desc: "Prêt à décider" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" className="gap-2" asChild>
              <Link to="/developer">
                Documentation technique
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== DECISION PREVIEW ========== */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-success/10 text-success border-success/20">
                <BarChart3 className="w-3 h-3 mr-1" />
                AIDE À LA DÉCISION
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Votre décision d'octroi : simple, fiable, actionnable
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Prenez des décisions d'octroi plus intelligentes et plus rapides. 
                Un système de feu tricolore pour une lecture instantanée.
              </p>
            </motion.div>

            {/* Score Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 border-2 border-border/50">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    { grade: "A-B", color: "bg-success", label: "Éligible", desc: "Octroi recommandé" },
                    { grade: "C", color: "bg-warning", label: "À vérifier", desc: "Analyse complémentaire" },
                    { grade: "D-E", color: "bg-destructive", label: "Risque élevé", desc: "Refus conseillé" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-muted/50">
                      <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-white font-bold text-xl">{item.grade}</span>
                      </div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="text-center pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Chaque score est accompagné d'un coefficient de certitude et de preuves vérifiables.
                  </p>
                  <Button variant="link" className="gap-1" asChild>
                    <Link to="/partenaires#produits">
                      Voir le détail technique
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== TRUST FOOTER ========== */}
      <section className="py-16 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">Technologie certifiée conforme</p>
              <p className="font-medium">aux normes de sécurité bancaires internationales</p>
            </div>
            <div className="flex items-center gap-6">
              {["BCEAO", "RGPD", "ISO 27001"].map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, hsl(var(--wouaka-deep)) 0%, hsl(var(--wouaka-navy)) 100%)' }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Prêt à ouvrir de nouveaux horizons ?
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Rejoignez les institutions financières qui transforment l'inclusion financière en opportunité de croissance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-wouaka-gold hover:bg-wouaka-gold/90 text-wouaka-deep gap-2 text-base px-8 py-6 font-bold rounded-xl"
                asChild
              >
                <Link to="/contact">
                  <UserCheck className="w-5 h-5" />
                  Demander une démo
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2 text-base px-8 py-6 rounded-xl"
                asChild
              >
                <Link to="/partenaires">
                  Explorer les solutions
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
