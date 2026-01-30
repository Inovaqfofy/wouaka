import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { Scale, Building2, Phone, Mail, MapPin, AlertTriangle, Gavel } from 'lucide-react';

export default function Legal() {
  return (
    <PublicLayout>
      <SEOHead
        title="Mentions Légales"
        description="Mentions légales de la plateforme Wouaka. Informations sur Inopay Group SARL, éditeur du site. Propriété intellectuelle et responsabilités."
        keywords="mentions légales Wouaka, Inopay Group, éditeur site crédit Afrique"
        canonical="/legal"
      />
      
      <PageHero
        badge={{ icon: Scale, text: "Informations légales" }}
        title="Mentions Légales"
        titleHighlight="Wouaka"
        description="Informations légales et réglementaires de la plateforme Wouaka - Inopay Group SARL."
      />
      
      <main className="container mx-auto px-4 py-12">

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Mentions Légales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8 text-sm text-muted-foreground">
                {/* Section 1: Identification */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    1. Identification de l'Éditeur
                  </h3>
                  <div className="p-5 bg-muted/50 rounded-xl border border-border space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Nom commercial</p>
                        <p className="font-semibold text-foreground text-lg">Wouaka</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Dénomination sociale</p>
                        <p className="font-semibold text-foreground">Inopay Group SARL</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3 space-y-2">
                      <p><strong>Forme juridique :</strong> Société À Responsabilité Limitée (SARL)</p>
                      <p><strong>RCCM :</strong> <span className="font-mono">CI-ABJ-03-2023-B13-03481</span></p>
                      <p><strong>Siège social :</strong> 27 BP 148 Abidjan 27, Côte d'Ivoire</p>
                    </div>
                    <div className="border-t border-border pt-3 grid md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href="tel:+2250701238974" className="text-primary hover:underline">+225 07 01 23 89 74</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href="mailto:contact@wouaka-creditscore.com" className="text-primary hover:underline">contact@wouaka-creditscore.com</a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Directeur de publication */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">2. Directeur de Publication</h3>
                  <p>Le directeur de la publication du site www.wouaka-creditscore.com est <strong className="text-foreground">Monsieur Youssouf Fofana</strong>, en sa qualité de représentant légal de Inopay Group SARL.</p>
                </section>

                {/* Section 3: Hébergement */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">3. Hébergement</h3>
                  <div className="p-4 bg-muted rounded-lg border">
                    <p className="mb-3">Le site www.wouaka-creditscore.com est hébergé par :</p>
                    <div className="text-sm space-y-1">
                      <p><strong>IONOS SE</strong></p>
                      <p>Elgendorfer Str. 57, 56410 Montabaur, Allemagne</p>
                      <p>Téléphone : +49 2602 96 91</p>
                      <p>Site web : <a href="https://www.ionos.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.ionos.fr</a></p>
                    </div>
                  </div>
                </section>

                {/* Section 4: Activité */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">4. Nature de l'Activité</h3>
                  <p className="mb-3">
                    Wouaka est une plateforme technologique spécialisée dans :
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>Le scoring financier et l'analyse de solvabilité</li>
                    <li>L'exploitation de données alternatives pour l'évaluation du risque crédit</li>
                    <li>L'agrégation de données financières</li>
                    <li>La pré-approbation et simulation de crédit</li>
                    <li>Les services de vérification d'identité (KYC)</li>
                  </ul>
                  
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Avertissement Important</p>
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        Wouaka <strong>n'est pas un établissement financier</strong>. La société ne réalise aucun acte bancaire, 
                        ne collecte aucun fonds du public, n'octroie aucun crédit et n'effectue aucune opération d'intermédiation financière. 
                        Wouaka fournit exclusivement des services technologiques d'analyse et de scoring.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5: Conditions d'utilisation */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">5. Conditions d'Utilisation du Site</h3>
                  <p className="mb-3">
                    L'accès et l'utilisation du site www.wouaka-creditscore.com sont soumis aux présentes mentions légales 
                    ainsi qu'aux lois et réglementations applicables. En accédant au site, l'utilisateur reconnaît 
                    avoir pris connaissance des présentes conditions et les accepte sans réserve.
                  </p>
                  <p>
                    L'utilisateur s'engage à utiliser le site de manière conforme à sa destination, 
                    dans le respect des lois en vigueur et des droits des tiers.
                  </p>
                </section>

                {/* Section 6: Responsabilité */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">6. Limitation de Responsabilité</h3>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-foreground">6.1.</strong> Les informations et scores fournis par Wouaka sont délivrés à titre indicatif 
                      et ne constituent en aucun cas une recommandation, un conseil financier ou une garantie d'octroi de crédit.
                    </p>
                    <p>
                      <strong className="text-foreground">6.2.</strong> Wouaka décline toute responsabilité quant aux décisions prises par les utilisateurs 
                      ou les institutions partenaires sur la base des scores et analyses fournis.
                    </p>
                    <p>
                      <strong className="text-foreground">6.3.</strong> Wouaka ne garantit pas l'exactitude absolue des informations traitées, 
                      celles-ci dépendant de sources tierces et de données déclaratives.
                    </p>
                    <p>
                      <strong className="text-foreground">6.4.</strong> En aucun cas Wouaka ne pourra être tenue responsable de dommages indirects, 
                      pertes de profits ou préjudices consécutifs résultant de l'utilisation de ses services.
                    </p>
                  </div>
                </section>

                {/* Section 7: Propriété intellectuelle */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">7. Propriété Intellectuelle</h3>
                  <p className="mb-3">
                    L'ensemble des éléments constituant le site et la plateforme Wouaka, notamment mais non limitativement :
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mb-3">
                    <li>Les marques, logos et dénominations</li>
                    <li>Les textes, graphismes, images et photographies</li>
                    <li>Les algorithmes, modèles et logiciels</li>
                    <li>Les bases de données et leur structure</li>
                    <li>L'architecture technique et les interfaces</li>
                  </ul>
                  <p>
                    sont la propriété exclusive de <strong className="text-foreground">Inopay Group SARL</strong> ou font l'objet d'une autorisation d'exploitation. 
                    Toute reproduction, représentation, modification, publication, adaptation ou exploitation non autorisée 
                    est interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle 
                    et les conventions internationales applicables.
                  </p>
                </section>

                {/* Section 8: Données personnelles */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">8. Protection des Données Personnelles</h3>
                  <p className="mb-3">
                    Le traitement des données personnelles effectué par Wouaka est réalisé dans le strict respect :
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mb-3">
                    <li>Des instructions de la BCEAO relatives au traitement des données financières à caractère personnel</li>
                    <li>De la réglementation UEMOA en matière de protection des données</li>
                    <li>De la loi ivoirienne n°2013-450 relative à la protection des données à caractère personnel</li>
                  </ul>
                  <p>
                    Pour plus de détails sur la collecte, le traitement et la conservation de vos données, 
                    veuillez consulter notre <a href="/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>.
                  </p>
                </section>

                {/* Section 9: Cookies */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">9. Cookies et Traceurs</h3>
                  <p>
                    Le site Wouaka utilise des cookies pour améliorer l'expérience utilisateur, analyser le trafic 
                    et personnaliser les contenus. L'utilisateur peut gérer ses préférences en matière de cookies 
                    via les paramètres de son navigateur.
                  </p>
                </section>

                {/* Section 10: Contact */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">10. Contact</h3>
                  <p className="mb-3">
                    Pour toute question relative aux présentes mentions légales ou à l'utilisation de la plateforme Wouaka :
                  </p>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                          <a href="mailto:contact@wouaka-creditscore.com" className="text-primary hover:underline">contact@wouaka-creditscore.com</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Téléphone</p>
                          <a href="tel:+2250701238974" className="text-primary hover:underline">+225 07 01 23 89 74</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Adresse</p>
                          <p className="text-foreground">27 BP 148 Abidjan 27, Côte d'Ivoire</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 11: Juridiction */}
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-3">11. Loi Applicable et Juridiction Compétente</h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="mb-3">
                      Les présentes mentions légales sont régies par le <strong className="text-foreground">droit ivoirien</strong> et le 
                      <strong className="text-foreground"> droit communautaire UEMOA</strong>.
                    </p>
                    <p className="mb-3">
                      Wouaka opère en conformité avec les directives et instructions de la 
                      <strong className="text-foreground"> Banque Centrale des États de l'Afrique de l'Ouest (BCEAO)</strong> applicables 
                      aux prestataires de services technologiques financiers.
                    </p>
                    <p>
                      En cas de litige relatif à l'interprétation ou l'exécution des présentes, et à défaut de résolution amiable, 
                      les tribunaux compétents d'<strong className="text-foreground">Abidjan, République de Côte d'Ivoire</strong> seront seuls compétents.
                    </p>
                  </div>
                </section>

                {/* Mise à jour */}
                <section className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Dernière mise à jour des mentions légales : Janvier 2025
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </PublicLayout>
  );
}