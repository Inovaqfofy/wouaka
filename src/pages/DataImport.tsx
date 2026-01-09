import { PublicLayout } from '@/components/layout/PublicLayout';
import { DatasetImporter } from '@/components/dataset/DatasetImporter';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { FileSpreadsheet, Zap, BarChart3, Download } from 'lucide-react';

export default function DataImport() {
  return (
    <PublicLayout>
      <SEOHead
        title="Import CSV - Scoring en masse"
        description="Importez vos fichiers CSV et calculez des centaines de scores de crédit en quelques minutes. Traitement par lots optimisé, export facile des résultats."
        keywords="import CSV scoring, traitement lot crédit, batch scoring API, export résultats"
        canonical="/data-import"
      />
      
      <PageHero
        badge={{ icon: FileSpreadsheet, text: "Import en masse" }}
        title="Import de données CSV"
        titleHighlight="scoring en masse"
        description="Importez vos fichiers CSV et calculez des centaines de scores en quelques minutes avec notre traitement par lots optimisé."
      />
      
      <main className="container mx-auto px-4 py-12">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium">Ultra-rapide</p>
              <p className="text-sm text-muted-foreground">
                Traitement par lots optimisé
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Analyse détaillée</p>
              <p className="text-sm text-muted-foreground">
                Score + catégorie + confiance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <Download className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Export facile</p>
              <p className="text-sm text-muted-foreground">
                Téléchargez les résultats
              </p>
            </div>
          </div>
        </div>

        {/* Dataset Importer */}
        <DatasetImporter />
      </main>
    </PublicLayout>
  );
}
