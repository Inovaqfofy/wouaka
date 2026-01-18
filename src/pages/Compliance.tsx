import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Server,
  FileCheck,
  BadgeCheck,
  Globe,
  Building2,
  ArrowRight,
  CheckCircle2,
  Scale,
  Fingerprint,
  Database,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

const certifications = [
  { name: "BCEAO", status: "Certifié", icon: Building2 },
  { name: "UEMOA", status: "Certifié", icon: Globe },
  { name: "RGPD", status: "Conforme", icon: Shield },
  { name: "ISO 27001", status: "En cours", icon: Lock },
];

const pillars = [
  {
    icon: Lock,
    title: "Sécurité",
    color: "text-success bg-success/10",
    items: [
      { label: "Chiffrement AES-256", desc: "Données au repos" },
      { label: "TLS 1.3", desc: "Communications" },
      { label: "MFA obligatoire", desc: "Accès partenaires" },
      { label: "Audit Trail", desc: "Rétention 7 ans" },
    ],
  },
  {
    icon: Database,
    title: "Protection",
    color: "text-primary bg-primary/10",
    items: [
      { label: "Hébergement sécurisé", desc: "Infrastructure IONOS" },
      { label: "Données chiffrées", desc: "En transit et au repos" },
      { label: "Analyse locale", desc: "Sur appareil utilisateur" },
      { label: "Indicateurs seuls", desc: "Pas de données brutes stockées" },
    ],
  },
  {
    icon: Scale,
    title: "LCB-FT",
    color: "text-warning bg-warning/10",
    items: [
      { label: "Screening AML", desc: "UEMOA, ONU, UE, OFAC" },
      { label: "Détection PEP", desc: "Scoring de risque" },
      { label: "Monitoring continu", desc: "Alertes en temps réel" },
      { label: "Reporting auto", desc: "Pour régulateurs" },
    ],
  },
  {
    icon: Users,
    title: "Droits",
    color: "text-accent bg-accent/10",
    items: [
      { label: "Consentement", desc: "Granulaire & révocable" },
      { label: "Accès", desc: "Aux données traitées" },
      { label: "Rectification", desc: "Des informations" },
      { label: "Effacement", desc: "Droit à l'oubli" },
    ],
  },
];

export default function Compliance() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Conformité & Sécurité - WOUAKA"
        description="Sécurité niveau bancaire. Conforme BCEAO, UEMOA, RGPD. Chiffrement AES-256, MFA, Audit Trail immuable."
        keywords="conformité BCEAO, sécurité bancaire, RGPD Afrique, AML screening, KYC compliant"
        canonical="/compliance"
      />
      <Navbar />

      {/* Hero compact */}
      <section className="py-16 lg:py-20 hero-enterprise">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-6 bg-white/10 text-white border-white/15">
                <Shield className="w-3 h-3 mr-1" />
                CONFORMITÉ & SÉCURITÉ
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight"
            >
              Sécurité de <span className="text-secondary">classe bancaire</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/75 mb-8 max-w-2xl mx-auto"
            >
              Infrastructure conçue pour les institutions financières, conforme aux réglementations BCEAO et UEMOA.
            </motion.p>

            {/* Certifications inline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {certifications.map((cert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm"
                >
                  <cert.icon className="w-4 h-4" />
                  <span className="font-medium">{cert.name}</span>
                  <Badge
                    variant={cert.status === "Certifié" ? "default" : "secondary"}
                    className="text-xs py-0 h-5"
                  >
                    {cert.status}
                  </Badge>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4 Pillars - Single section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${pillar.color} flex items-center justify-center`}>
                    <pillar.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{pillar.title}</h3>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {pillar.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA compact */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 bg-card border border-border rounded-2xl p-6 lg:p-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">Questions sur notre conformité ?</h2>
              <p className="text-muted-foreground text-sm">Notre équipe répond à vos exigences réglementaires.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/contact">
                  <Building2 className="w-4 h-4 mr-2" />
                  Contacter
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/partenaires">
                  Solutions
                  <ArrowRight className="w-4 h-4 ml-2" />
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
