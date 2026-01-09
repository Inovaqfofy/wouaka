import { PublicLayout } from '@/components/layout/PublicLayout';
import { KycWizard } from '@/components/kyc/KycWizard';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { Shield, CheckCircle, Clock, FileText } from 'lucide-react';

export default function Kyc() {
  return (
    <PublicLayout>
      <SEOHead
        title="Vérification KYC - Identity Check"
        description="Vérification d'identité KYC sécurisée et rapide. Documents chiffrés, validation sous 24h. Conformité BCEAO pour l'Afrique de l'Ouest."
        keywords="KYC Afrique, vérification identité, conformité BCEAO, identity check fintech"
        canonical="/kyc"
      />
      
      <PageHero
        badge={{ icon: Shield, text: "Vérification d'identité" }}
        title="Vérification KYC"
        titleHighlight="sécurisée et rapide"
        description="Complétez votre vérification d'identité pour accéder à toutes les fonctionnalités de la plateforme."
      />
      
      <main className="container mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Sécurisé</p>
              <p className="text-sm text-muted-foreground">
                Vos documents sont chiffrés
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Rapide</p>
              <p className="text-sm text-muted-foreground">
                Validation sous 24h
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <FileText className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="font-medium">Simple</p>
              <p className="text-sm text-muted-foreground">
                3 documents requis
              </p>
            </div>
          </div>
        </div>

        {/* KYC Wizard */}
        <KycWizard />
      </main>
    </PublicLayout>
  );
}
