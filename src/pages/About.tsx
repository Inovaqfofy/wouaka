import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { 
  Shield, 
  Globe, 
  Users, 
  TrendingUp, 
  Lock, 
  Zap,
  Building2,
  Target,
  Heart,
  Award,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <PublicLayout>
      <SEOHead
        title="À propos de Wouaka"
        description="Wouaka réinvente l'accès au crédit en Afrique de l'Ouest par la donnée. Mission d'inclusion financière, conformité BCEAO, technologie souveraine. 8 pays UEMOA couverts."
        keywords="Wouaka entreprise, inclusion financière Afrique, scoring crédit BCEAO, fintech Afrique de l'Ouest"
        canonical="/about"
      />
      <PageHero
        badge={{ icon: Building2, text: "À propos de Wouaka" }}
        title="Réinventer l'accès au crédit"
        titleHighlight="par la donnée"
        description="Wouaka est une plateforme de scoring financier nouvelle génération, conçue pour l'Afrique de l'Ouest et conforme aux exigences réglementaires UEMOA/BCEAO."
        primaryCTA={{ label: "Demander une démo", href: "/contact" }}
        secondaryCTA={{ label: "Voir les solutions", href: "/solutions" }}
      />

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Notre Mission
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Rendre la souveraineté des données financières aux citoyens africains. Nous croyons que 
                  chaque individu doit pouvoir prouver sa valeur sans dépendre de systèmes opaques.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Avec Wouaka, l'utilisateur est acteur de son évaluation : il fournit des preuves vérifiables 
                  (OTP, captures USSD, SMS analysés localement) et contrôle ce qu'il partage. 
                  Les données brutes restent sur son appareil.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">50M+</div>
                    <div className="text-sm text-muted-foreground">Personnes non-bancarisées ciblées</div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">8</div>
                    <div className="text-sm text-muted-foreground">Pays UEMOA couverts</div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/50 border-secondary">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">100%</div>
                    <div className="text-sm text-muted-foreground">Conforme BCEAO</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">&lt;2s</div>
                    <div className="text-sm text-muted-foreground">Temps de scoring moyen</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Notre Vision
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Devenir le standard de référence en matière de scoring de crédit en Afrique francophone, 
              en combinant les meilleures pratiques internationales avec une compréhension profonde 
              des réalités économiques locales.
            </p>
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-primary/20">
              <blockquote className="text-2xl font-medium text-foreground italic">
                "Un monde où l'accès au crédit est déterminé par le potentiel réel, 
                pas par l'absence de données traditionnelles."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nos Valeurs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Les principes fondamentaux qui guident chacune de nos décisions
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Transparence</h3>
                  <p className="text-muted-foreground">
                    Chaque score est explicable. Nous détaillons les facteurs qui influencent 
                    l'évaluation pour permettre des décisions éclairées.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Sécurité</h3>
                  <p className="text-muted-foreground">
                    Protection des données de bout en bout, chiffrement AES-256, 
                    et conformité stricte aux normes BCEAO.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Souveraineté</h3>
                  <p className="text-muted-foreground">
                    Infrastructure hébergée en zone UEMOA, données traitées localement, 
                    indépendance technologique garantie.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Inclusion</h3>
                  <p className="text-muted-foreground">
                    Donner une voix financière à ceux qui n'ont pas d'historique bancaire 
                    grâce aux données alternatives.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comment Fonctionne Wouaka
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Souveraineté par la Preuve : l'utilisateur prouve, nous certifions
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50"></div>
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-primary/10 mb-4">01</div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Preuves Utilisateur</h3>
                  <p className="text-muted-foreground">
                    L'utilisateur fournit ses preuves : OTP pour certifier son numéro, 
                    capture USSD de son profil Mobile Money, autorisation d'analyse SMS.
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/50"></div>
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-accent/10 mb-4">02</div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Analyse Locale</h3>
                  <p className="text-muted-foreground">
                    IA embarquée (Tesseract.js, NLP) analyse les données localement 
                    sur l'appareil. Aucune donnée brute n'est transmise à nos serveurs.
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-primary/10 mb-4">03</div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Certification</h3>
                  <p className="text-muted-foreground">
                    Score avec coefficient de certitude et dossier de preuves vérifiable. 
                    Chaque composante est explicable et traçable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Qui Servons-Nous ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une solution adaptée à chaque acteur de l'écosystème financier
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Building2, title: 'Banques', desc: 'Optimisation des décisions de crédit et réduction des défauts de paiement' },
                { icon: TrendingUp, title: 'Fintech', desc: 'API rapide pour intégrer le scoring dans vos parcours digitaux' },
                { icon: Users, title: 'Microfinance (MFI)', desc: 'Évaluation des micro-entrepreneurs sans historique bancaire' },
                { icon: Target, title: 'Commerçants', desc: 'Crédit fournisseur et facilités de paiement sécurisées' },
                { icon: Award, title: 'Entreprises', desc: 'Évaluation de la solvabilité des partenaires commerciaux' },
                { icon: Globe, title: 'Assurances', desc: 'Tarification du risque basée sur des données fiables' },
              ].map((item, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Conformité Réglementaire
              </h2>
              <p className="text-lg text-muted-foreground">
                Wouaka opère en stricte conformité avec le cadre réglementaire UEMOA/BCEAO
              </p>
            </div>
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Traitement des données personnelles</h4>
                      <p className="text-muted-foreground">
                        Conformité aux instructions de la BCEAO relatives au traitement des données 
                        financières à caractère personnel dans l'espace UEMOA.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Non-établissement financier</h4>
                      <p className="text-muted-foreground">
                        Wouaka <strong>n'est pas un établissement financier</strong> et ne réalise aucun acte 
                        bancaire, de collecte de fonds ou d'intermédiation financière.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Hébergement sécurisé</h4>
                      <p className="text-muted-foreground">
                        Infrastructure hébergée chez IONOS, certifiée ISO 27001 et conforme au RGPD, 
                        avec chiffrement des données en transit et au repos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Notre Histoire
              </h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <Card>
                <CardContent className="p-8 md:p-12">
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Wouaka est née d'un constat simple : en Afrique de l'Ouest, des millions de personnes 
                    et d'entreprises se voient refuser l'accès au crédit, non pas parce qu'elles ne sont 
                    pas solvables, mais parce qu'elles n'ont pas d'historique bancaire traditionnel.
                  </p>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Pourtant, ces mêmes personnes génèrent quotidiennement des données précieuses : 
                    transactions Mobile Money, paiements de factures, activités commerciales documentées. 
                    Ces données alternatives, combinées aux sources officielles BCEAO et à l'intelligence 
                    artificielle, permettent de dresser un portrait fidèle de la solvabilité réelle.
                  </p>
                  <p className="text-lg text-foreground font-medium">
                    Wouaka a été créée pour transformer cette vision en réalité : un système de scoring 
                    juste, transparent, souverain et adapté aux réalités africaines.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Wouaka Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pourquoi Choisir Wouaka ?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[
                  { title: 'Expertise locale', desc: 'Conçu par des experts qui comprennent les réalités économiques de l\'UEMOA' },
                  { title: 'Technologie de pointe', desc: 'IA explicable, API moderne, intégration en quelques heures' },
                  { title: 'Données enrichies', desc: 'Combinaison unique de sources officielles et alternatives' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[
                  { title: 'Conformité garantie', desc: 'Respect strict des réglementations BCEAO et protection des données' },
                  { title: 'Support dédié', desc: 'Équipe locale disponible pour vous accompagner dans l\'intégration' },
                  { title: 'Tarification flexible', desc: 'Modèles adaptés aux startups comme aux grandes institutions' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Informations Légales
              </h2>
              <p className="text-lg text-muted-foreground">
                Wouaka est une plateforme de Inopay Group SARL
              </p>
            </div>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Entité juridique
                      </h3>
                      <p className="text-lg font-semibold text-foreground">Inopay Group SARL</p>
                      <p className="text-muted-foreground">Société À Responsabilité Limitée</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        RCCM
                      </h3>
                      <p className="text-lg font-mono text-foreground">CI-ABJ-03-2023-B13-03481</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Siège social
                        </h3>
                        <p className="text-foreground">27 BP 148 Abidjan 27</p>
                        <p className="text-foreground">Côte d'Ivoire</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Téléphone
                        </h3>
                        <a href="tel:+2250701238974" className="text-lg text-primary hover:underline">
                          +225 07 01 23 89 74
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Email
                        </h3>
                        <a href="mailto:contact@wouaka-creditscore.com" className="text-lg text-primary hover:underline">
                          contact@wouaka-creditscore.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Zone réglementaire
                        </h3>
                        <p className="text-foreground">UEMOA — BCEAO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Prêt à transformer vos décisions de crédit ?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Rejoignez les institutions financières qui font confiance à Wouaka
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/contact">Demander une démo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/api-docs">Explorer l'API</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
