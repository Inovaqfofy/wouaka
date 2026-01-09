import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHero } from '@/components/layout/PageHero';
import { ScoringWizard } from '@/components/scoring/ScoringWizard';
import { ScoringResult } from '@/components/scoring/ScoringResult';
import { useScoring } from '@/hooks/useScoring';
import { SEOHead } from '@/components/seo/SEOHead';
import { ScoringInputData } from '@/lib/scoring-types';
import { 
  Brain, 
  Shield, 
  Database, 
  BarChart3,
  Phone,
  Lock,
} from 'lucide-react';

export default function Scoring() {
  const { calculateScore, resetResult, loading, result } = useScoring();

  const handleSubmit = async (data: ScoringInputData, enrichmentData?: any) => {
    await calculateScore(data, enrichmentData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Analyse de Profil - Wouaka"
        description="Analysez le profil de crédit de vos clients avec notre outil propriétaire. Résultat rapide et fiable."
        keywords="analyse crédit, scoring, Afrique, UEMOA"
        canonical="/scoring"
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero
          badge={{ icon: Brain, text: "Outil Réservé aux Clients" }}
          title="Analyse de"
          titleHighlight="Profil"
          description="Obtenez une analyse complète de solvabilité pour vos prospects et clients."
          primaryCTA={{ label: "Parler à un expert", href: "/contact", icon: Phone }}
          secondaryCTA={{ label: "Comprendre les scores", href: "/score-education" }}
        >
          {/* Features badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-full border border-primary-foreground/20 text-sm">
              <Lock className="w-4 h-4" />
              <span>Accès sécurisé</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-full border border-primary-foreground/20 text-sm">
              <Database className="w-4 h-4" />
              <span>Données enrichies</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-full border border-primary-foreground/20 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>Analyse complète</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-full border border-primary-foreground/20 text-sm">
              <Shield className="w-4 h-4" />
              <span>Données sécurisées</span>
            </div>
          </div>
        </PageHero>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {result ? (
              <ScoringResult result={result} onReset={resetResult} />
            ) : (
              <ScoringWizard onSubmit={handleSubmit} loading={loading} />
            )}
          </div>
        </section>

        {/* How it works - Simplified */}
        {!result && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-display font-bold text-center mb-8">
                Comment ça fonctionne
              </h2>
              
              <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Saisissez les informations</h3>
                  <p className="text-sm text-muted-foreground">
                    Renseignez les données du profil à analyser
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Connectez les sources</h3>
                  <p className="text-sm text-muted-foreground">
                    Enrichissez le profil avec les données disponibles
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Obtenez votre analyse</h3>
                  <p className="text-sm text-muted-foreground">
                    Score, indicateurs et recommandations personnalisées
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
