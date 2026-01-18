import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Users, 
  FileCheck, 
  Server, 
  Clock, 
  Share2, 
  ShieldCheck,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <PublicLayout>
      <SEOHead
        title="Politique de Confidentialité"
        description="Politique de confidentialité Wouaka. Protection des données personnelles conforme BCEAO et loi ivoirienne. Droits des utilisateurs et sécurité des données."
        keywords="politique confidentialité Wouaka, protection données BCEAO, RGPD Afrique, vie privée fintech"
        canonical="/privacy"
      />
      
      <PageHero
        badge={{ icon: Shield, text: "Protection des Données" }}
        title="Politique de"
        titleHighlight="Confidentialité"
        description="Comment Wouaka collecte, utilise et protège vos données personnelles, en conformité avec la réglementation BCEAO et la loi ivoirienne n°2013-450."
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Responsable du traitement */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Responsable du Traitement</h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dénomination sociale</p>
                      <p className="font-semibold text-foreground">Inopay Group SARL</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">RCCM</p>
                      <p className="font-mono text-foreground">CI-ABJ-03-2023-B13-03481</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>27 BP 148 Abidjan 27, Côte d'Ivoire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href="tel:+2250701238974" className="text-primary hover:underline">+225 07 01 23 89 74</a>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>DPO : <a href="mailto:privacy@wouaka-creditscore.com" className="text-primary hover:underline">privacy@wouaka-creditscore.com</a></span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-auto">
            <div className="space-y-10 text-muted-foreground">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
                <p className="mb-4">
                  La présente Politique de Confidentialité décrit les pratiques de <strong className="text-foreground">Inopay Group SARL</strong> 
                  (ci-après « Wouaka », « nous », « notre ») concernant la collecte, l'utilisation, le stockage et la protection 
                  des données à caractère personnel des utilisateurs de la plateforme Wouaka.
                </p>
                <p className="mb-4">
                  Cette politique est établie en conformité avec :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La <strong className="text-foreground">loi ivoirienne n°2013-450</strong> du 19 juin 2013 relative à la protection des données à caractère personnel</li>
                  <li>Les <strong className="text-foreground">instructions et directives de la BCEAO</strong> relatives au traitement des données financières</li>
                  <li>Le <strong className="text-foreground">droit communautaire UEMOA</strong> applicable en matière de protection des données</li>
                  <li>Les <strong className="text-foreground">bonnes pratiques internationales</strong> inspirées du Règlement Général sur la Protection des Données (RGPD)</li>
                </ul>
                <p className="mt-4">
                  En utilisant nos services, vous reconnaissez avoir pris connaissance de la présente politique et consentez 
                  au traitement de vos données tel que décrit ci-après.
                </p>
              </section>

              {/* Section 1: Données collectées */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">1. Données Collectées</h2>
                </div>
                
                <p className="mb-6">
                  Dans le cadre de la fourniture de nos services de scoring crédit et d'analyse de solvabilité, 
                  Wouaka est amenée à collecter et traiter les catégories de données suivantes :
                </p>

                {/* 1.1 Données d'identification */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">1.1. Données d'Identification Personnelle</h3>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="grid md:grid-cols-2 gap-2 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Nom et prénoms</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Date et lieu de naissance</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Nationalité</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Numéro de pièce d'identité (CNI, passeport)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Adresse de résidence</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Numéro de téléphone</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Adresse email</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Photographie (pour vérification KYC)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* 1.2 Données financières publiques */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">1.2. Données Financières Publiques (PISPI/BCEAO)</h3>
                  <p className="mb-3 text-sm">
                    Conformément aux dispositions réglementaires, Wouaka peut accéder aux données disponibles 
                    via les systèmes centralisés de la BCEAO :
                  </p>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Informations du Fichier Central des Incidents de Paiement</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Données du Bureau d'Information sur le Crédit (BIC)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Historique de crédit disponible via les Systèmes de Partage d'Information (PISPI)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Registre des entreprises (RCCM) pour les professionnels</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* 1.3 Données alternatives */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">1.3. Données Alternatives</h3>
                  <p className="mb-3 text-sm">
                    Avec votre <strong className="text-foreground">consentement explicite</strong>, nous pouvons collecter des données alternatives 
                    pour enrichir l'analyse de solvabilité :
                  </p>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Données Mobile Money</h4>
                          <ul className="text-sm space-y-1 pl-4">
                            <li>• Historique et volume de transactions</li>
                            <li>• Fréquence des opérations (dépôts, retraits, transferts)</li>
                            <li>• Solde moyen et comportement d'épargne</li>
                            <li>• Ancienneté du compte</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Données E-commerce (avec autorisation)</h4>
                          <ul className="text-sm space-y-1 pl-4">
                            <li>• Historique d'achats sur plateformes partenaires</li>
                            <li>• Comportement de paiement en ligne</li>
                            <li>• Ancienneté et réputation acheteur</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Données de Réseaux Sociaux (avec autorisation explicite)</h4>
                          <ul className="text-sm space-y-1 pl-4">
                            <li>• Informations de profil public professionnel (LinkedIn)</li>
                            <li>• Données de vérification d'identité sociale</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Données de Facturation</h4>
                          <ul className="text-sm space-y-1 pl-4">
                            <li>• Historique de paiement des factures (eau, électricité, téléphone)</li>
                            <li>• Régularité des paiements</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 1.4 Données comportementales */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">1.4. Données Comportementales et Analytiques</h3>
                  <p className="mb-3 text-sm">
                    Notre système d'intelligence artificielle génère des indicateurs comportementaux à partir des données collectées :
                  </p>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Score de solvabilité calculé par algorithmes IA explicables</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Indicateurs de stabilité financière</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Profil de risque catégorisé</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Facteurs d'influence du score (transparence algorithmique)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* 1.5 Données techniques */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">1.5. Données Techniques</h3>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="grid md:grid-cols-2 gap-2 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Adresse IP</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Type et version du navigateur</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Système d'exploitation</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Logs de connexion et d'utilisation</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Identifiants d'appareil (anonymisés)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Cookies et traceurs (voir Politique Cookies)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Section 2: Finalités du traitement */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">2. Finalités du Traitement</h2>
                </div>

                <p className="mb-4">
                  Les données personnelles collectées sont traitées pour les finalités suivantes :
                </p>

                <div className="space-y-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2.1. Fourniture des Services de Scoring</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Calcul du score de crédit personnalisé</li>
                        <li>• Analyse de la solvabilité et du profil de risque</li>
                        <li>• Génération de rapports et recommandations</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2.2. Vérification d'Identité (KYC)</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Vérification de l'authenticité des documents</li>
                        <li>• Prévention de la fraude et de l'usurpation d'identité</li>
                        <li>• Conformité aux obligations légales de vigilance</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2.3. Obligations Légales et Réglementaires</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Respect des obligations de reporting BCEAO</li>
                        <li>• Lutte contre le blanchiment de capitaux (LCB-FT)</li>
                        <li>• Réponse aux réquisitions des autorités compétentes</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2.4. Amélioration des Services</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Amélioration continue des algorithmes de scoring</li>
                        <li>• Développement de nouvelles fonctionnalités</li>
                        <li>• Analyses statistiques anonymisées</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2.5. Gestion de la Relation Client</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Support technique et assistance</li>
                        <li>• Communications de service</li>
                        <li>• Facturation et gestion des abonnements</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Section 3: Droits des utilisateurs */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">3. Droits des Utilisateurs</h2>
                </div>

                <p className="mb-4">
                  Conformément à la loi ivoirienne n°2013-450 et aux bonnes pratiques internationales, 
                  vous disposez des droits suivants concernant vos données personnelles :
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit d'Accès
                      </h3>
                      <p className="text-sm">
                        Obtenir confirmation du traitement de vos données et accéder à l'ensemble 
                        des informations vous concernant détenues par Wouaka.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit de Rectification
                      </h3>
                      <p className="text-sm">
                        Demander la correction de données inexactes ou incomplètes vous concernant.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit à l'Effacement
                      </h3>
                      <p className="text-sm">
                        Demander la suppression de vos données, sous réserve des obligations légales 
                        de conservation qui s'imposent à Wouaka.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit à la Limitation
                      </h3>
                      <p className="text-sm">
                        Demander la limitation du traitement dans certaines circonstances 
                        (contestation de l'exactitude, opposition en cours d'examen).
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit à la Portabilité
                      </h3>
                      <p className="text-sm">
                        Recevoir vos données dans un format structuré, couramment utilisé 
                        et lisible par machine.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit d'Opposition
                      </h3>
                      <p className="text-sm">
                        Vous opposer au traitement de vos données pour des motifs légitimes 
                        ou à des fins de prospection.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit de Retirer le Consentement
                      </h3>
                      <p className="text-sm">
                        Retirer votre consentement à tout moment pour les traitements 
                        fondés sur celui-ci.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Droit à l'Explication Algorithmique
                      </h3>
                      <p className="text-sm">
                        Obtenir des explications claires sur les facteurs ayant influencé 
                        votre score de crédit (transparence IA).
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6 bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-2">Comment exercer vos droits ?</h4>
                    <p className="text-sm mb-3">
                      Pour exercer l'un de vos droits, contactez notre Délégué à la Protection des Données :
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href="mailto:privacy@wouaka-creditscore.com" className="text-primary hover:underline">privacy@wouaka-creditscore.com</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>Inopay Group SARL - DPO, 27 BP 148 Abidjan 27</span>
                      </div>
                    </div>
                    <p className="text-sm mt-3">
                      Nous nous engageons à répondre à votre demande dans un délai de <strong className="text-foreground">30 jours</strong>.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Section 4: Consentement */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">4. Consentement Explicite</h2>
                </div>

                <p className="mb-4">
                  Wouaka s'engage à recueillir votre <strong className="text-foreground">consentement libre, spécifique, éclairé et univoque</strong> 
                  avant tout traitement de vos données personnelles nécessitant celui-ci.
                </p>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">4.1. Modalités de Recueil du Consentement</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Inscription :</strong> Acceptation des CGU et de la Politique de Confidentialité lors de la création de compte</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Données alternatives :</strong> Consentement spécifique et séparé pour chaque source de données (Mobile Money, réseaux sociaux, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Partage avec tiers :</strong> Consentement explicite avant toute transmission à un partenaire financier</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">4.2. Retrait du Consentement</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Vous pouvez retirer votre consentement à tout moment via les paramètres de votre compte 
                      ou en contactant notre DPO. Le retrait du consentement ne compromet pas la licéité 
                      du traitement effectué avant ce retrait.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Section 5: Mesures de sécurité */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">5. Mesures de Sécurité</h2>
                </div>

                <p className="mb-4">
                  Wouaka met en œuvre des mesures techniques et organisationnelles robustes pour garantir 
                  la sécurité, la confidentialité et l'intégrité de vos données personnelles :
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        Chiffrement
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>En transit :</strong> TLS 1.3 pour toutes les communications</li>
                        <li>• <strong>Au repos :</strong> AES-256 pour les données stockées</li>
                        <li>• <strong>Clés :</strong> Gestion sécurisée via HSM</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        Hachage (Hashing)
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• Mots de passe hachés avec bcrypt (salt unique)</li>
                        <li>• Clés API hachées SHA-256</li>
                        <li>• Aucun stockage de données sensibles en clair</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        Anonymisation & Pseudonymisation
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• Données anonymisées pour les analyses statistiques</li>
                        <li>• Pseudonymisation pour les traitements internes</li>
                        <li>• Séparation des identifiants et des données</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Contrôle d'Accès
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• Authentification multi-facteurs (MFA)</li>
                        <li>• Principe du moindre privilège</li>
                        <li>• Journalisation de tous les accès</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">Mesures Organisationnelles</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Formation régulière du personnel à la protection des données</li>
                      <li>• Audits de sécurité et tests de pénétration périodiques</li>
                      <li>• Plan de réponse aux incidents et notification des violations</li>
                      <li>• Politique de sécurité de l'information documentée</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Section 6: Stockage des données */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">6. Stockage et Hébergement des Données</h2>
                </div>

                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-3">6.1. Infrastructure d'Hébergement</h3>
                    <p className="mb-4">
                      Les données personnelles collectées par Wouaka sont stockées sur des 
                      <strong className="text-foreground"> serveurs sécurisés hébergés par IONOS SE</strong> (Allemagne), 
                      un hébergeur européen certifié conforme au RGPD et aux normes ISO 27001.
                    </p>
                    
                    <h3 className="font-semibold text-foreground mb-3">6.2. Garanties de Sécurité</h3>
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Datacenters conformes aux normes internationales (Tier III minimum)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Redondance géographique pour la continuité de service
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Sauvegardes chiffrées quotidiennes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Surveillance 24/7 et détection d'intrusion
                      </li>
                    </ul>

                    <div className="p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">6.3. Transferts Internationaux</h4>
                      <p className="text-sm">
                        En cas de nécessité de transfert de données hors de l'espace UEMOA (par exemple, 
                        vers un sous-traitant technique), des garanties appropriées sont mises en place 
                        (clauses contractuelles types, certifications) conformément à la réglementation applicable.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Section 7: Durée de conservation */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">7. Durée de Conservation</h2>
                </div>

                <p className="mb-4">
                  Les données personnelles sont conservées pendant une durée limitée, proportionnée 
                  aux finalités pour lesquelles elles ont été collectées :
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-semibold">Catégorie de données</th>
                        <th className="p-3 text-left font-semibold">Durée de conservation</th>
                        <th className="p-3 text-left font-semibold">Fondement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3">Données de compte utilisateur</td>
                        <td className="p-3">Durée de la relation + 5 ans</td>
                        <td className="p-3">Obligation légale</td>
                      </tr>
                      <tr className="border-t border-border bg-muted/50">
                        <td className="p-3">Documents KYC</td>
                        <td className="p-3">5 ans après fin de relation</td>
                        <td className="p-3">Réglementation LCB-FT / BCEAO</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3">Scores et rapports de solvabilité</td>
                        <td className="p-3">3 ans</td>
                        <td className="p-3">Délai de contestation</td>
                      </tr>
                      <tr className="border-t border-border bg-muted/50">
                        <td className="p-3">Données de transaction Mobile Money</td>
                        <td className="p-3">24 mois</td>
                        <td className="p-3">Pertinence pour le scoring</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3">Logs techniques / connexion</td>
                        <td className="p-3">12 mois</td>
                        <td className="p-3">Sécurité</td>
                      </tr>
                      <tr className="border-t border-border bg-muted/50">
                        <td className="p-3">Données de facturation</td>
                        <td className="p-3">10 ans</td>
                        <td className="p-3">Obligations comptables</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-sm">
                  À l'expiration de ces délais, les données sont supprimées de manière sécurisée 
                  ou anonymisées de façon irréversible pour les besoins statistiques.
                </p>
              </section>

              {/* Section 8: Transmission à tiers */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">8. Transmission à des Tiers</h2>
                </div>

                <Card className="mb-4 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      8.1. Partenaires Autorisés
                    </h3>
                    <p className="text-sm mb-3">
                      Avec votre <strong>consentement explicite</strong>, vos données et scores peuvent être transmis à :
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Banques et établissements de crédit</strong> partenaires de Wouaka</li>
                      <li>• <strong>Institutions de microfinance (IMF)</strong> agréées</li>
                      <li>• <strong>Fintech partenaires</strong> pour les demandes de financement</li>
                      <li>• <strong>Assureurs</strong> pour l'évaluation des risques (avec consentement spécifique)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">8.2. Sous-traitants Techniques</h3>
                    <p className="text-sm mb-3">
                      Certaines données peuvent être traitées par des sous-traitants techniques liés par 
                      des accords de confidentialité stricts :
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Prestataires d'hébergement et d'infrastructure cloud</li>
                      <li>• Fournisseurs de solutions de sécurité</li>
                      <li>• Opérateurs de télécommunications (pour vérifications)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">8.3. Autorités Compétentes</h3>
                    <p className="text-sm">
                      Wouaka peut être amenée à communiquer des données aux autorités judiciaires, 
                      administratives ou de régulation (BCEAO, ARTCI) dans le cadre de ses obligations légales 
                      ou sur réquisition.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                  <CardContent className="p-4 flex gap-3">
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        8.4. Absence Totale de Partage Public
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Wouaka ne vend, ne loue et ne partage jamais vos données personnelles 
                        avec des tiers à des fins commerciales ou publicitaires.</strong> Vos données 
                        ne sont jamais rendues publiques et ne sont accessibles qu'aux destinataires 
                        expressément autorisés dans les conditions décrites ci-dessus.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Section 9: Conformité réglementaire */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">9. Conformité Réglementaire UEMOA / BCEAO</h2>
                </div>

                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <p className="mb-4">
                      Wouaka opère en stricte conformité avec le cadre réglementaire de l'Union Économique 
                      et Monétaire Ouest Africaine (UEMOA) et les directives de la Banque Centrale des États 
                      de l'Afrique de l'Ouest (BCEAO) :
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Loi ivoirienne n°2013-450</h4>
                          <p className="text-sm">
                            Respect intégral de la loi du 19 juin 2013 relative à la protection des données 
                            à caractère personnel en Côte d'Ivoire.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Instructions BCEAO</h4>
                          <p className="text-sm">
                            Conformité aux instructions relatives aux services financiers numériques, 
                            au partage d'information sur le crédit (PISPI) et à la protection des utilisateurs.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Réglementation LCB-FT</h4>
                          <p className="text-sm">
                            Application des obligations de vigilance en matière de lutte contre le blanchiment 
                            de capitaux et le financement du terrorisme.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Droit communautaire UEMOA</h4>
                          <p className="text-sm">
                            Respect des règlements et directives communautaires applicables aux prestataires 
                            de services technologiques financiers.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Bonnes pratiques RGPD</h4>
                          <p className="text-sm">
                            Adoption volontaire des standards européens de protection des données 
                            comme référence de bonnes pratiques internationales.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Section 10: Réclamations */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">10. Réclamations</h2>
                </div>

                <p className="mb-4">
                  Si vous estimez que vos droits en matière de protection des données n'ont pas été respectés, 
                  vous pouvez :
                </p>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">1. Contacter notre DPO</h3>
                      <p className="text-sm mb-2">
                        En première intention, adressez votre réclamation à notre Délégué à la Protection des Données :
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href="mailto:privacy@wouaka-creditscore.com" className="text-primary hover:underline">privacy@wouaka-creditscore.com</a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">2. Saisir l'Autorité de Contrôle</h3>
                      <p className="text-sm">
                        Vous pouvez introduire une réclamation auprès de l'<strong>ARTCI</strong> (Autorité de Régulation 
                        des Télécommunications/TIC de Côte d'Ivoire), autorité compétente en matière de protection 
                        des données personnelles.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Section 11: Modifications */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">11. Modifications de la Politique</h2>
                <p className="mb-4">
                  Wouaka se réserve le droit de modifier la présente Politique de Confidentialité à tout moment 
                  pour refléter les évolutions réglementaires, technologiques ou de nos pratiques.
                </p>
                <p className="mb-4">
                  En cas de modification substantielle, vous serez informé par :
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Email à l'adresse associée à votre compte</li>
                  <li>Notification in-app lors de votre prochaine connexion</li>
                  <li>Mise à jour de la date de « dernière mise à jour » en haut de ce document</li>
                </ul>
                <p>
                  Nous vous invitons à consulter régulièrement cette page pour rester informé de nos pratiques.
                </p>
              </section>

              {/* Contact final */}
              <section className="pt-8 border-t border-border">
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Contact</h2>
                    <p className="mb-4">
                      Pour toute question relative à la présente Politique de Confidentialité ou à la protection 
                      de vos données personnelles :
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Délégué à la Protection des Données</p>
                          <a href="mailto:privacy@wouaka-creditscore.com" className="text-primary hover:underline">privacy@wouaka-creditscore.com</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Téléphone</p>
                          <a href="tel:+2250701238974" className="text-primary hover:underline">+225 07 01 23 89 74</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Adresse postale</p>
                          <p>Inopay Group SARL - DPO<br />27 BP 148 Abidjan 27<br />Côte d'Ivoire</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Liens connexes */}
              <section className="pt-4">
                <p className="text-sm text-center">
                  Voir aussi : <Link to="/legal" className="text-primary hover:underline">Mentions Légales</Link> | 
                  <Link to="/legal" className="text-primary hover:underline ml-1">CGU</Link> | 
                  <Link to="/legal" className="text-primary hover:underline ml-1">Politique de Cookies</Link>
                </p>
              </section>

            </div>
          </ScrollArea>
        </div>
      </main>
    </PublicLayout>
  );
}
