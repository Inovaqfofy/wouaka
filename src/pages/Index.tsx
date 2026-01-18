import React from "react";
import {
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Building2,
  Zap,
  ArrowRight,
  Check,
  Star,
  Banknote,
  Smartphone,
  Target,
  Wallet,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  Lock,
  Eye,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import heroConsultant from "@/assets/hero-consultant.png";
import heroUser from "@/assets/hero-user.png";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wouaka - Prouvez votre valeur. Obtenez le crédit que vous méritez."
        description="Emprunteurs : certifiez votre solvabilité en toute souveraineté. Institutions : recevez des dossiers de preuves vérifiables avec coefficient de certitude."
        keywords="crédit Afrique, financement UEMOA, scoring souverain, preuve solvabilité, Mobile Money, fintech Afrique, données souveraines"
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wouaka",
          description: "Plateforme de certification de solvabilité souveraine pour l'Afrique de l'Ouest",
          url: "https://www.wouaka-creditscore.com",
          logo: "https://www.wouaka-creditscore.com/logo.png",
          areaServed: "UEMOA",
          sameAs: [
            "https://facebook.com/wouaka",
            "https://linkedin.com/company/wouaka",
            "https://instagram.com/wouaka",
            "https://x.com/wouaka"
          ],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+225-07-01-23-89-74",
            contactType: "customer service",
            areaServed: "CI",
            availableLanguage: ["French"]
          }
        }}
      />
      <Navbar />

      {/* Hero Section - 2 Personas */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-primary via-primary to-primary/95 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/4" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20 lg:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5 mb-8"
            >
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">
                Souveraineté par la Preuve
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
            >
              Prouvez votre <span className="text-secondary">valeur</span>.
              <br />
              Obtenez le crédit que vous méritez.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Vous êtes emprunteur ? Certifiez votre solvabilité, contrôlez vos données.
              <br className="hidden md:block" />
              Vous êtes une institution ? Recevez des dossiers de preuves, pas des scores opaques.
            </motion.p>

            {/* Dual CTA - 2 Personas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 text-lg px-8 py-6 font-semibold rounded-full shadow-2xl shadow-secondary/30 hover:shadow-secondary/40 transition-all hover:scale-105"
                asChild
              >
                <Link to="/auth?mode=signup&role=EMPRUNTEUR">
                  <Award className="w-5 h-5" />
                  Je certifie ma solvabilité
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 gap-2 rounded-full px-8 py-6 transition-all"
                asChild
              >
                <Link to="/partenaires">
                  <FileCheck className="w-5 h-5" />
                  Recevoir des dossiers de preuves
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 mt-8 border-t border-white/10"
            >
              {[
                { value: "100%", label: "Analyse locale sur votre téléphone" },
                { value: "0", label: "Données brutes transmises" },
                { value: "95%", label: "Coefficient de certitude max" },
                { value: "8 pays", label: "Zone UEMOA couverte" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-secondary font-display text-2xl md:text-3xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-white/50 text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Section WOUAKA EMPRUNTEUR */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">
                <Award className="w-3 h-3 mr-1" />
                WOUAKA EMPRUNTEUR
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Certifiez votre <span className="text-primary">solvabilité</span> en 4 étapes
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Pas de compte bancaire ? Pas de problème. Vos preuves Mobile Money, 
                vos SMS, votre capital social — tout est valorisé. 
                Et vos données restent sur votre téléphone.
              </p>

              <div className="space-y-6 mb-8">
                {[
                  {
                    step: "1",
                    icon: Smartphone,
                    title: "Certifiez votre numéro",
                    desc: "OTP + Capture de votre profil Mobile Money (USSD)",
                  },
                  {
                    step: "2",
                    icon: MessageSquare,
                    title: "Analysez vos SMS financiers",
                    desc: "100% local sur votre appareil — jamais transmis",
                  },
                  {
                    step: "3",
                    icon: Target,
                    title: "Obtenez votre certificat",
                    desc: "Score avec coefficient de certitude transparent",
                  },
                  {
                    step: "4",
                    icon: Wallet,
                    title: "Partagez avec les institutions",
                    desc: "Vous décidez qui peut voir votre dossier",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="lg" className="gap-2" asChild>
                <Link to="/auth?mode=signup&role=EMPRUNTEUR">
                  Certifier ma solvabilité
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                {
                  icon: Lock,
                  title: "Souveraineté totale",
                  desc: "Vos données restent sur votre appareil",
                  color: "bg-primary/10 text-primary",
                },
                {
                  icon: Target,
                  title: "Coefficient de certitude",
                  desc: "Transparence sur la fiabilité du score",
                  color: "bg-secondary/20 text-secondary",
                },
                {
                  icon: FileCheck,
                  title: "Preuves vérifiables",
                  desc: "Pas de déclaratif, que du tangible",
                  color: "bg-blue-500/20 text-blue-600",
                },
                {
                  icon: Users,
                  title: "Capital social valorisé",
                  desc: "Tontines, garants, coopératives comptent",
                  color: "bg-green-500/20 text-green-600",
                },
              ].map((item, i) => (
                <Card key={i} className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section WOUAKA PARTENAIRE */}
      <section className="pt-20 pb-0 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                <img
                  src={heroConsultant}
                  alt="Partenaire financier"
                  className="w-full max-w-md mx-auto"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-0 bg-card border rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Certitude</p>
                      <p className="font-bold">92%</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-20 left-0 bg-card border rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Preuves</p>
                      <p className="font-bold">5 sources</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Building2 className="w-3 h-3 mr-1" />
                WOUAKA PARTENAIRE
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Des dossiers de <span className="text-primary">preuves</span>, pas des scores opaques
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Une API unique pour recevoir des évaluations certifiées.
                Chaque composante est traçable, chaque preuve est vérifiable.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    title: "Coefficient de certitude",
                    desc: "Chaque dossier indique la fiabilité des données",
                    icon: Target,
                  },
                  {
                    title: "Preuves vérifiables",
                    desc: "OTP, USSD, SMS analysés, documents OCR",
                    icon: FileCheck,
                  },
                  {
                    title: "Screening AML/PEP",
                    desc: "Conformité réglementaire intégrée",
                    icon: Shield,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-card border rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold">{item.title}</span>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/partenaires">
                    Découvrir l'API
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to="/pricing">
                    Voir les tarifs
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 border-y bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Souveraineté totale de vos données</h2>
            <p className="text-muted-foreground">Conforme aux réglementations BCEAO et UEMOA</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Shield, label: "Conforme BCEAO" },
              { icon: Smartphone, label: "Analyse locale embarquée" },
              { icon: Lock, label: "0 données brutes stockées" },
              { icon: Eye, label: "Consentement explicite" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground">
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - 2 Personas */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à prouver votre valeur ?
            </h2>
            <p className="text-xl opacity-90 mb-10">
              Que vous cherchiez un financement ou que vous évaluiez des clients,
              Wouaka vous donne les preuves.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="p-6 bg-white/10 border-white/20 text-left">
                <Award className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-xl font-bold mb-2">WOUAKA EMPRUNTEUR</h3>
                <p className="text-white/70 mb-4 text-sm">
                  Certifiez votre solvabilité et accédez aux meilleures offres de financement.
                </p>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2" asChild>
                  <Link to="/auth?mode=signup&role=EMPRUNTEUR">
                    Je certifie mon profil
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 bg-white/10 border-white/20 text-left">
                <Building2 className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-xl font-bold mb-2">WOUAKA PARTENAIRE</h3>
                <p className="text-white/70 mb-4 text-sm">
                  Recevez des dossiers de preuves certifiées pour vos décisions de crédit.
                </p>
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white gap-2" asChild>
                  <Link to="/partenaires">
                    Voir l'API
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
