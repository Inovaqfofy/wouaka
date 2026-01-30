import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageHero } from "@/components/layout/PageHero";
import { FileText, Scale, Users, Shield, CreditCard, AlertTriangle, Lock, UserX, Gavel, Building2 } from "lucide-react";

const Terms = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="Conditions Générales d'Utilisation"
        description="CGU de la plateforme Wouaka. Cadre contractuel pour l'utilisation des services de scoring crédit et d'analyse de solvabilité en Afrique de l'Ouest."
        keywords="CGU Wouaka, conditions utilisation scoring, contrat plateforme crédit"
        canonical="/terms"
      />
      
      <PageHero
        badge={{ icon: FileText, text: "Document Juridique" }}
        title="Conditions Générales"
        titleHighlight="d'Utilisation"
        description="Cadre contractuel régissant l'utilisation de la plateforme Wouaka - Dernière mise à jour : Janvier 2025."
      />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Préambule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Préambule
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») définissent les modalités 
              et conditions dans lesquelles Inopay Group SARL met à disposition la plateforme Wouaka 
              et ses services associés. En accédant ou en utilisant la plateforme Wouaka, l'Utilisateur 
              reconnaît avoir pris connaissance des présentes CGU et les accepte sans réserve.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">Éditeur de la plateforme :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Dénomination sociale :</strong> Inopay Group SARL</li>
                <li><strong>RCCM :</strong> CI-ABJ-03-2023-B13-03481</li>
                <li><strong>Siège social :</strong> 27 BP 148 Abidjan 27, Côte d'Ivoire</li>
                <li><strong>Téléphone :</strong> +225 07 01 23 89 74</li>
                <li><strong>Email :</strong> legal@wouaka-creditscore.com</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="h-auto">
          <div className="space-y-8">
            {/* Article 1 - Objet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Article 1 — Objet du Service
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les présentes CGU ont pour objet de définir les conditions d'accès et d'utilisation 
                  de la plateforme Wouaka, un service de scoring financier et d'analyse de solvabilité 
                  proposé par Inopay Group SARL.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La plateforme Wouaka permet notamment :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>L'analyse de solvabilité et le scoring financier basés sur des données publiques et alternatives</li>
                  <li>La consultation des données financières publiques issues des bases BCEAO/PISPI</li>
                  <li>L'agrégation et l'analyse de données alternatives (mobile money, comportement financier)</li>
                  <li>La génération de rapports de pré-approbation de crédit</li>
                  <li>L'accès à une API pour l'intégration dans les systèmes tiers</li>
                  <li>La vérification d'identité numérique (KYC)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Article 2 - Définitions */}
            <Card>
              <CardHeader>
                <CardTitle>Article 2 — Définitions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Dans le cadre des présentes CGU, les termes suivants ont la signification indiquée ci-dessous :
                </p>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« Plateforme » ou « Wouaka »</p>
                    <p className="text-sm text-muted-foreground">
                      Désigne l'ensemble des services, applications web, API et outils mis à disposition 
                      par Inopay Group SARL sous la marque Wouaka, accessibles via www.wouaka-creditscore.com.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« Utilisateur »</p>
                    <p className="text-sm text-muted-foreground">
                      Toute personne physique ou morale accédant à la Plateforme, qu'elle dispose 
                      d'un compte ou non, incluant les visiteurs, les clients et les partenaires.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« Client »</p>
                    <p className="text-sm text-muted-foreground">
                      Utilisateur ayant créé un compte et souscrit à un abonnement payant ou gratuit 
                      pour accéder aux services de la Plateforme.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« Score » ou « Scoring »</p>
                    <p className="text-sm text-muted-foreground">
                      Indicateur numérique généré par les algorithmes de Wouaka, évaluant la solvabilité 
                      ou le profil de risque d'un individu ou d'une entreprise, sur une échelle de 0 à 1000.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« Données Alternatives »</p>
                    <p className="text-sm text-muted-foreground">
                      Données non-bancaires utilisées pour l'analyse, incluant les transactions mobile money, 
                      l'historique de paiements de factures, les données comportementales numériques, 
                      collectées avec le consentement explicite de la personne concernée.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« API »</p>
                    <p className="text-sm text-muted-foreground">
                      Interface de programmation applicative permettant l'intégration des services Wouaka 
                      dans les systèmes informatiques des Clients partenaires.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« BCEAO »</p>
                    <p className="text-sm text-muted-foreground">
                      Banque Centrale des États de l'Afrique de l'Ouest, institution régulatrice du système 
                      financier dans l'espace UEMOA.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">« PISPI »</p>
                    <p className="text-sm text-muted-foreground">
                      Plateforme d'Information et de Supervision des Prestataires et des Incidents, 
                      base de données publique de la BCEAO répertoriant les incidents de paiement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article 3 - Fonctionnement */}
            <Card>
              <CardHeader>
                <CardTitle>Article 3 — Fonctionnement Général de la Plateforme</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">3.1 Principe de fonctionnement</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wouaka est une plateforme technologique d'analyse financière qui agrège, traite et 
                  analyse des données provenant de sources multiples pour générer des indicateurs de 
                  solvabilité et des recommandations de crédit.
                </p>

                <h4 className="font-semibold mb-2">3.2 Sources de données</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La Plateforme utilise trois catégories de données :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Données publiques BCEAO :</strong> informations issues des registres officiels PISPI et des bases réglementaires</li>
                  <li><strong>Données alternatives :</strong> données mobile money, historique de paiements, données comportementales (avec consentement)</li>
                  <li><strong>Données déclaratives :</strong> informations fournies directement par l'Utilisateur lors de l'inscription ou des demandes</li>
                </ul>

                <h4 className="font-semibold mb-2">3.3 Algorithmes et Intelligence Artificielle</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les scores sont générés par des modèles d'intelligence artificielle open source, 
                  entraînés sur des jeux de données représentatifs du contexte financier africain. 
                  Ces modèles sont régulièrement audités et mis à jour pour garantir leur pertinence et leur équité.
                </p>

                <h4 className="font-semibold mb-2">3.4 Accès à la Plateforme</h4>
                <p className="text-muted-foreground leading-relaxed">
                  L'accès aux services de Wouaka nécessite une connexion internet et un navigateur web 
                  compatible. Certains services requièrent la création d'un compte et/ou la souscription 
                  à un abonnement.
                </p>
              </CardContent>
            </Card>

            {/* Article 4 - Types d'utilisateurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Article 4 — Types d'Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La Plateforme Wouaka s'adresse à différentes catégories d'Utilisateurs :
                </p>

                <div className="grid gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">4.1 Établissements Bancaires</h4>
                    <p className="text-sm text-muted-foreground">
                      Banques commerciales, banques de développement, établissements de crédit agréés 
                      par la BCEAO. Accès aux services d'analyse avancée, API en masse, rapports détaillés.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">4.2 Institutions de Microfinance (IMF)</h4>
                    <p className="text-sm text-muted-foreground">
                      Systèmes Financiers Décentralisés (SFD) agréés, coopératives d'épargne et de crédit. 
                      Accès aux outils de scoring adaptés aux micro-crédits et prêts de groupe.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">4.3 Fintech et Agrégateurs</h4>
                    <p className="text-sm text-muted-foreground">
                      Startups fintech, plateformes de paiement, émetteurs de monnaie électronique. 
                      Accès à l'API pour intégration dans leurs propres solutions.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">4.4 Entreprises et Commerçants</h4>
                    <p className="text-sm text-muted-foreground">
                      PME, grandes entreprises, commerçants B2B. Utilisation pour l'évaluation 
                      de la solvabilité des clients et partenaires commerciaux.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">4.5 Particuliers</h4>
                    <p className="text-sm text-muted-foreground">
                      Personnes physiques souhaitant consulter leur propre score de solvabilité, 
                      comprendre leur profil financier et améliorer leur éligibilité au crédit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article 5 - Droits et obligations utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle>Article 5 — Droits et Obligations de l'Utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">5.1 Droits de l'Utilisateur</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">L'Utilisateur dispose des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Accéder aux services de la Plateforme conformément à son niveau d'abonnement</li>
                  <li>Consulter son propre score et les données le concernant</li>
                  <li>Demander la rectification ou la suppression de ses données personnelles</li>
                  <li>Recevoir une assistance technique dans les délais prévus par son contrat</li>
                  <li>Être informé de toute modification substantielle des CGU ou des services</li>
                  <li>Résilier son abonnement conformément aux conditions prévues</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold mb-2">5.2 Obligations de l'Utilisateur</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">L'Utilisateur s'engage à :</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Fournir des informations exactes, complètes et à jour lors de son inscription</li>
                  <li>Maintenir la confidentialité de ses identifiants de connexion et clés API</li>
                  <li>Ne pas partager son accès avec des tiers non autorisés</li>
                  <li>Utiliser la Plateforme conformément à sa destination et aux présentes CGU</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité de la Plateforme</li>
                  <li>Respecter les limites d'utilisation définies par son abonnement</li>
                  <li>Signaler immédiatement toute utilisation frauduleuse de son compte</li>
                  <li>Obtenir le consentement des personnes concernées avant toute demande de scoring</li>
                </ul>

                <h4 className="font-semibold mb-2">5.3 Utilisations interdites</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">Il est strictement interdit de :</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Utiliser la Plateforme à des fins illégales ou contraires à l'ordre public</li>
                  <li>Revendre ou redistribuer les données ou scores sans autorisation écrite</li>
                  <li>Effectuer du reverse engineering sur les algorithmes de la Plateforme</li>
                  <li>Surcharger volontairement les serveurs ou l'API</li>
                  <li>Utiliser des données obtenues à des fins discriminatoires</li>
                  <li>Collecter des données sur d'autres utilisateurs sans leur consentement</li>
                </ul>
              </CardContent>
            </Card>

            {/* Article 6 - Droits et obligations Wouaka */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Article 6 — Droits et Obligations de Wouaka
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">6.1 Engagements de Wouaka</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">Wouaka s'engage à :</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Fournir un service conforme à la description des offres souscrites</li>
                  <li>Assurer la disponibilité de la Plateforme (objectif de 99,5% de disponibilité annuelle)</li>
                  <li>Protéger les données des Utilisateurs conformément à la réglementation en vigueur</li>
                  <li>Maintenir à jour les algorithmes de scoring et les sources de données</li>
                  <li>Informer les Utilisateurs de toute maintenance programmée</li>
                  <li>Fournir un support technique selon les modalités de l'abonnement</li>
                  <li>Respecter la confidentialité des informations commerciales des Clients</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold mb-2">6.2 Droits de Wouaka</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">Wouaka se réserve le droit de :</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Modifier les présentes CGU avec un préavis de 30 jours</li>
                  <li>Faire évoluer les fonctionnalités et services de la Plateforme</li>
                  <li>Suspendre temporairement l'accès pour maintenance ou mise à jour</li>
                  <li>Suspendre ou résilier un compte en cas de violation des CGU</li>
                  <li>Refuser l'inscription d'un Utilisateur sans avoir à motiver sa décision</li>
                  <li>Modifier les tarifs avec un préavis de 60 jours</li>
                </ul>

                <h4 className="font-semibold mb-2">6.3 Limites de responsabilité</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Wouaka met en œuvre tous les moyens raisonnables pour assurer la qualité de ses services, 
                  mais ne peut garantir l'absence totale d'interruptions ou d'erreurs. La responsabilité 
                  de Wouaka est limitée au montant des sommes effectivement perçues au titre de l'abonnement 
                  au cours des 12 derniers mois.
                </p>
              </CardContent>
            </Card>

            {/* Article 7 - Scoring et disclaimer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Article 7 — Accès au Scoring et Avertissement Légal
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">7.1 Nature du Score</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Le Score Wouaka est un indicateur statistique et probabiliste, généré par des algorithmes 
                  d'intelligence artificielle. Il constitue une aide à la décision et non une garantie 
                  de solvabilité ou de comportement futur.
                </p>

                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-destructive mb-2">⚠️ AVERTISSEMENT IMPORTANT</h4>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>Wouaka n'est pas un établissement financier</strong> et n'est pas agréé par la BCEAO en tant que tel.</li>
                    <li><strong>Wouaka ne collecte pas d'argent</strong>, ne reçoit pas de dépôts et ne gère aucun fonds.</li>
                    <li><strong>Wouaka n'octroie pas de crédit</strong> et ne garantit pas l'obtention d'un financement.</li>
                    <li>Le Score Wouaka est <strong>purement indicatif</strong> et ne constitue pas une offre de prêt.</li>
                    <li>La décision finale d'octroi de crédit appartient <strong>exclusivement aux établissements financiers agréés</strong>.</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">7.2 Limites du Scoring</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  L'Utilisateur reconnaît et accepte que :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Le Score peut varier en fonction de la qualité et de la disponibilité des données sources</li>
                  <li>Un score élevé ne garantit pas l'octroi d'un crédit par un établissement financier</li>
                  <li>Un score faible ne signifie pas nécessairement l'incapacité à obtenir un crédit</li>
                  <li>Les algorithmes peuvent contenir des biais malgré les efforts de correction</li>
                  <li>Les données historiques ne préjugent pas des comportements futurs</li>
                </ul>

                <h4 className="font-semibold mb-2">7.3 Responsabilité de l'Utilisateur</h4>
                <p className="text-muted-foreground leading-relaxed">
                  L'Utilisateur utilise le Score à ses propres risques et assume l'entière responsabilité 
                  des décisions prises sur la base de cet indicateur. Wouaka ne pourra en aucun cas être 
                  tenu responsable des conséquences d'une décision de crédit basée sur le Score.
                </p>
              </CardContent>
            </Card>

            {/* Article 8 - Tarification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Article 8 — Tarification et Abonnements
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">8.1 Offres disponibles</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wouaka propose différentes formules d'abonnement adaptées aux besoins des Utilisateurs :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Offre Découverte :</strong> accès limité pour tester les services</li>
                  <li><strong>Offre Professionnelle :</strong> accès complet pour PME et indépendants</li>
                  <li><strong>Offre Entreprise :</strong> accès illimité avec API et support dédié</li>
                  <li><strong>Offre Sur-mesure :</strong> solution personnalisée pour grands comptes</li>
                </ul>

                <h4 className="font-semibold mb-2">8.2 Modalités de paiement</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les abonnements sont payables selon les modalités définies lors de la souscription 
                  (mensuel, annuel, à la consommation). Les moyens de paiement acceptés incluent 
                  le virement bancaire, le mobile money et les cartes de paiement internationales.
                </p>

                <h4 className="font-semibold mb-2">8.3 Facturation</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les factures sont émises mensuellement ou annuellement selon le mode de facturation choisi. 
                  Elles sont disponibles dans l'espace client et envoyées par email. Les montants sont 
                  exprimés en Francs CFA (XOF) et incluent les taxes applicables.
                </p>

                <h4 className="font-semibold mb-2">8.4 Retard de paiement</h4>
                <p className="text-muted-foreground leading-relaxed">
                  En cas de retard de paiement supérieur à 15 jours, Wouaka se réserve le droit de 
                  suspendre l'accès aux services jusqu'à régularisation. Des pénalités de retard 
                  pourront être appliquées conformément à la législation en vigueur.
                </p>
              </CardContent>
            </Card>

            {/* Article 9 - Engagement non-collecte */}
            <Card>
              <CardHeader>
                <CardTitle>Article 9 — Engagement de Non-Collecte de Fonds</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
                  <p className="font-semibold mb-2">Déclaration solennelle</p>
                  <p className="text-muted-foreground">
                    Inopay Group SARL, éditeur de la plateforme Wouaka, déclare formellement et 
                    irrévocablement que :
                  </p>
                </div>

                <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                  <li>
                    <strong>Wouaka n'est pas une banque</strong> et ne possède aucun agrément d'établissement 
                    de crédit délivré par la BCEAO ou toute autre autorité monétaire.
                  </li>
                  <li>
                    <strong>Wouaka ne collecte pas d'épargne</strong> et ne reçoit aucun dépôt de fonds 
                    de la part du public ou de ses Utilisateurs.
                  </li>
                  <li>
                    <strong>Wouaka n'octroie pas de crédit</strong> et ne réalise aucune opération de prêt, 
                    de financement ou de crédit-bail.
                  </li>
                  <li>
                    <strong>Wouaka n'effectue aucune opération de paiement</strong> pour le compte de tiers 
                    et ne détient aucune licence d'émetteur de monnaie électronique.
                  </li>
                  <li>
                    L'activité exclusive de Wouaka est <strong>l'analyse de données</strong> et la 
                    <strong>fourniture de services technologiques</strong> d'aide à la décision financière.
                  </li>
                </ul>

                <p className="text-muted-foreground mt-4">
                  Toute sollicitation de fonds par un tiers se prévalant du nom de Wouaka doit être 
                  signalée immédiatement à legal@wouaka-creditscore.com et constitue une fraude.
                </p>
              </CardContent>
            </Card>

            {/* Article 10 - Sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Article 10 — Sécurité et Confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">10.1 Mesures de sécurité</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wouaka met en œuvre des mesures de sécurité conformes aux standards internationaux :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)</li>
                  <li>Authentification forte et gestion sécurisée des accès</li>
                  <li>Surveillance continue des systèmes et détection d'intrusion</li>
                  <li>Sauvegardes régulières et plan de reprise d'activité</li>
                  <li>Audits de sécurité périodiques par des tiers indépendants</li>
                </ul>

                <h4 className="font-semibold mb-2">10.2 Protection des données personnelles</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Le traitement des données personnelles est régi par la Politique de Confidentialité 
                  de Wouaka, accessible sur le site. Wouaka respecte la loi ivoirienne n°2013-450 
                  relative à la protection des données à caractère personnel et les directives BCEAO 
                  en matière de données financières.
                </p>

                <h4 className="font-semibold mb-2">10.3 Confidentialité commerciale</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Wouaka s'engage à maintenir la confidentialité des informations commerciales de ses 
                  Clients et à ne pas les divulguer à des tiers, sauf obligation légale ou demande 
                  des autorités compétentes.
                </p>
              </CardContent>
            </Card>

            {/* Article 11 - Fermeture de compte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-primary" />
                  Article 11 — Fermeture de Compte
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">11.1 Résiliation par l'Utilisateur</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  L'Utilisateur peut demander la fermeture de son compte à tout moment en adressant 
                  une demande écrite à support@wouaka-creditscore.com. La fermeture prend effet :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Immédiatement pour les comptes gratuits</li>
                  <li>À la fin de la période d'abonnement en cours pour les comptes payants</li>
                  <li>Sous 72 heures en cas de demande de suppression des données (RGPD)</li>
                </ul>

                <h4 className="font-semibold mb-2">11.2 Conséquences de la fermeture</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  À la fermeture du compte :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>L'accès à la Plateforme est immédiatement révoqué</li>
                  <li>Les clés API sont désactivées</li>
                  <li>Les données personnelles sont supprimées sous 30 jours (sauf obligation légale de conservation)</li>
                  <li>L'historique des transactions est archivé conformément aux durées légales</li>
                </ul>

                <h4 className="font-semibold mb-2">11.3 Récupération des données</h4>
                <p className="text-muted-foreground leading-relaxed">
                  L'Utilisateur peut demander l'export de ses données avant la fermeture de son compte. 
                  Cette demande doit être effectuée dans les 30 jours précédant la fermeture.
                </p>
              </CardContent>
            </Card>

            {/* Article 12 - Responsabilités */}
            <Card>
              <CardHeader>
                <CardTitle>Article 12 — Responsabilités</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">12.1 Limitation de responsabilité</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La responsabilité de Wouaka ne peut être engagée que pour les dommages directs et 
                  prévisibles résultant d'un manquement prouvé à ses obligations. En aucun cas, 
                  Wouaka ne pourra être tenu responsable :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Des dommages indirects (perte de chiffre d'affaires, perte de clientèle, atteinte à l'image)</li>
                  <li>Des décisions de crédit prises par des établissements financiers sur la base du Score</li>
                  <li>De l'inexactitude des données provenant de sources tierces</li>
                  <li>Des interruptions dues à des cas de force majeure</li>
                  <li>Des actes malveillants de tiers (piratage, cyberattaques)</li>
                </ul>

                <h4 className="font-semibold mb-2">12.2 Plafond d'indemnisation</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La responsabilité totale de Wouaka est plafonnée au montant des sommes effectivement 
                  versées par l'Utilisateur au cours des douze (12) mois précédant le fait générateur 
                  du dommage.
                </p>

                <h4 className="font-semibold mb-2">12.3 Force majeure</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Aucune des parties ne sera responsable de l'inexécution de ses obligations en cas 
                  de force majeure, incluant notamment : catastrophes naturelles, guerres, émeutes, 
                  pandémies, décisions gouvernementales, pannes de réseaux de télécommunications, 
                  cyberattaques massives.
                </p>
              </CardContent>
            </Card>

            {/* Article 13 - Suspension/Résiliation */}
            <Card>
              <CardHeader>
                <CardTitle>Article 13 — Suspension et Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">13.1 Suspension par Wouaka</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wouaka peut suspendre temporairement l'accès d'un Utilisateur dans les cas suivants :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Suspicion d'utilisation frauduleuse ou non conforme</li>
                  <li>Retard de paiement supérieur à 15 jours</li>
                  <li>Violation des présentes CGU</li>
                  <li>Demande des autorités compétentes</li>
                  <li>Maintenance technique urgente</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  L'Utilisateur sera informé de la suspension et des motifs dans les plus brefs délais, 
                  sauf empêchement légal.
                </p>

                <h4 className="font-semibold mb-2">13.2 Résiliation par Wouaka</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wouaka peut résilier le compte d'un Utilisateur avec effet immédiat en cas de :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Violation grave ou répétée des CGU</li>
                  <li>Utilisation à des fins illégales ou frauduleuses</li>
                  <li>Non-paiement persistant (plus de 60 jours)</li>
                  <li>Fourniture d'informations fausses lors de l'inscription</li>
                  <li>Atteinte à la réputation ou aux intérêts de Wouaka</li>
                </ul>

                <h4 className="font-semibold mb-2">13.3 Effets de la résiliation</h4>
                <p className="text-muted-foreground leading-relaxed">
                  En cas de résiliation pour faute de l'Utilisateur, aucun remboursement ne sera effectué. 
                  L'Utilisateur reste redevable des sommes dues jusqu'à la date de résiliation.
                </p>
              </CardContent>
            </Card>

            {/* Article 14 - Loi applicable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-primary" />
                  Article 14 — Droit Applicable
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">14.1 Législation applicable</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les présentes CGU sont régies par et interprétées conformément au droit de la 
                  République de Côte d'Ivoire et, le cas échéant, au droit communautaire de l'UEMOA.
                </p>

                <h4 className="font-semibold mb-2">14.2 Textes de référence</h4>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Les principales références juridiques applicables incluent :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Loi n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel</li>
                  <li>Loi n°2013-451 du 19 juin 2013 relative à la lutte contre la cybercriminalité</li>
                  <li>Règlement n°15/2002/CM/UEMOA relatif aux systèmes de paiement dans l'UEMOA</li>
                  <li>Instructions de la BCEAO relatives aux services financiers numériques</li>
                  <li>Acte Uniforme OHADA relatif au droit commercial général</li>
                </ul>

                <h4 className="font-semibold mb-2">14.3 Conformité réglementaire</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Wouaka s'engage à respecter l'ensemble des réglementations applicables en matière 
                  de traitement des données financières, de protection de la vie privée et de 
                  services numériques dans l'espace UEMOA.
                </p>
              </CardContent>
            </Card>

            {/* Article 15 - Tribunal compétent */}
            <Card>
              <CardHeader>
                <CardTitle>Article 15 — Juridiction Compétente</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">15.1 Règlement amiable</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, 
                  les parties s'engagent à rechercher une solution amiable dans un délai de 30 jours 
                  à compter de la notification du différend.
                </p>

                <h4 className="font-semibold mb-2">15.2 Médiation</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  À défaut de règlement amiable, les parties pourront recourir à une médiation auprès 
                  d'un médiateur agréé. Les frais de médiation seront partagés à parts égales entre 
                  les parties.
                </p>

                <h4 className="font-semibold mb-2">15.3 Tribunal compétent</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    En cas d'échec de la médiation ou de refus d'y participer, tout litige sera soumis 
                    à la compétence exclusive des <strong>Tribunaux d'Abidjan-Plateau</strong>, 
                    République de Côte d'Ivoire, nonobstant pluralité de défendeurs ou appel en garantie.
                  </p>
                </div>

                <p className="text-muted-foreground mt-4">
                  Cette clause attributive de compétence s'applique même en cas de procédure d'urgence 
                  ou de demande de mesures conservatoires.
                </p>
              </CardContent>
            </Card>

            {/* Dispositions finales */}
            <Card>
              <CardHeader>
                <CardTitle>Article 16 — Dispositions Finales</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">16.1 Intégralité</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Les présentes CGU, complétées par la Politique de Confidentialité et les conditions 
                  particulières éventuelles, constituent l'intégralité de l'accord entre Wouaka et 
                  l'Utilisateur concernant l'utilisation de la Plateforme.
                </p>

                <h4 className="font-semibold mb-2">16.2 Nullité partielle</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Si une clause des présentes CGU était déclarée nulle ou inapplicable, les autres 
                  clauses resteraient en vigueur et la clause litigieuse serait remplacée par une 
                  clause valide de portée équivalente.
                </p>

                <h4 className="font-semibold mb-2">16.3 Non-renonciation</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Le fait pour Wouaka de ne pas exercer un droit prévu aux présentes CGU ne constitue 
                  pas une renonciation à ce droit pour l'avenir.
                </p>

                <h4 className="font-semibold mb-2">16.4 Modifications</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Wouaka se réserve le droit de modifier les présentes CGU à tout moment. Les modifications 
                  seront notifiées aux Utilisateurs par email et/ou affichage sur la Plateforme au moins 
                  30 jours avant leur entrée en vigueur. L'utilisation continue de la Plateforme après 
                  l'entrée en vigueur des modifications vaut acceptation des nouvelles CGU.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Pour toute question relative aux présentes Conditions Générales d'Utilisation :
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Inopay Group SARL</p>
                    <p className="text-sm text-muted-foreground">Éditeur de la plateforme Wouaka</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><strong>RCCM :</strong> CI-ABJ-03-2023-B13-03481</p>
                    <p><strong>Adresse :</strong> 27 BP 148 Abidjan 27, Côte d'Ivoire</p>
                    <p><strong>Téléphone :</strong> +225 07 01 23 89 74</p>
                    <p><strong>Email :</strong> legal@wouaka-creditscore.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground py-4">
              © 2025 Inopay Group SARL. Tous droits réservés. | Version des CGU : 1.0 — Janvier 2025
            </p>
          </div>
        </ScrollArea>
      </div>
    </PublicLayout>
  );
};

export default Terms;
