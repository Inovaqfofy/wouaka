import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BorrowerScore {
  id: string;
  score: number;
  grade: string;
  riskCategory: string;
  confidence: number;
  updated_at: string;
  factors: Array<{
    name: string;
    impact: 'positif' | 'négatif' | 'neutre';
    score: number;
    description: string;
  }>;
  history: Array<{
    period: string;
    score: number;
    change: number;
  }>;
}

export interface BorrowerDocument {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  created_at: string;
  file_url: string;
  ocr_confidence?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ocr_data?: any;
}

export interface BorrowerApplication {
  id: string;
  product_name: string;
  provider_name: string;
  amount?: number;
  status: string;
  created_at: string;
  score?: number;
  score_grade?: string;
}

// Hook to get borrower's credit score
export const useBorrowerScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['borrower-score', user?.id],
    queryFn: async (): Promise<BorrowerScore | null> => {
      if (!user?.id) return null;

      // Get the latest scoring request for this user
      const { data: scoringRequest, error } = await supabase
        .from('scoring_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !scoringRequest) {
        return null;
      }

      // Get score history
      const { data: history } = await supabase
        .from('scoring_requests')
        .select('created_at, score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Build factors from available score data
      const score = scoringRequest.score || 0;
      const confidence = scoringRequest.confidence || 50;
      const engagementScore = scoringRequest.engagement_capacity_score || 50;
      
      const factors: BorrowerScore['factors'] = [
        { 
          name: "Score global", 
          impact: score >= 70 ? "positif" : score < 40 ? "négatif" : "neutre", 
          score: Math.min(100, score), 
          description: score >= 70 ? "Bon score" : score < 40 ? "Score à améliorer" : "Score moyen" 
        },
        { 
          name: "Confiance des données", 
          impact: confidence >= 60 ? "positif" : "neutre", 
          score: confidence, 
          description: confidence >= 60 ? "Données fiables" : "Données partielles" 
        },
        { 
          name: "Capacité d'engagement", 
          impact: engagementScore >= 60 ? "positif" : "neutre", 
          score: engagementScore, 
          description: engagementScore >= 60 ? "Bonne capacité" : "Capacité moyenne" 
        },
      ];

      // Build history with change calculation
      const historyData = (history || []).map((h, index, arr) => {
        const prevScore = arr[index + 1]?.score || h.score;
        const date = new Date(h.created_at);
        const now = new Date();
        const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
        
        let period = 'Ce mois';
        if (diffMonths === 1) period = 'Mois dernier';
        else if (diffMonths === 2) period = 'Il y a 2 mois';
        else if (diffMonths >= 3) period = `Il y a ${diffMonths} mois`;

        return {
          period,
          score: h.score || 0,
          change: (h.score || 0) - (prevScore || 0),
        };
      });

      return {
        id: scoringRequest.id,
        score: scoringRequest.score || 0,
        grade: scoringRequest.grade || 'N/A',
        riskCategory: scoringRequest.risk_category || 'unknown',
        confidence: scoringRequest.confidence || 0,
        updated_at: scoringRequest.created_at,
        factors,
        history: historyData.slice(0, 3),
      };
    },
    enabled: !!user?.id,
  });
};

// Hook to get borrower's documents
export const useBorrowerDocuments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['borrower-documents', user?.id],
    queryFn: async (): Promise<BorrowerDocument[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Hook to get borrower's loan applications
export const useBorrowerApplications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['borrower-applications', user?.id],
    queryFn: async (): Promise<BorrowerApplication[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          status,
          created_at,
          score,
          score_grade,
          marketplace_products (
            name,
            provider_name,
            min_amount,
            max_amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return [];
      }

      return (data || []).map(app => ({
        id: app.id,
        product_name: (app.marketplace_products as Record<string, unknown>)?.name as string || 'Produit inconnu',
        provider_name: (app.marketplace_products as Record<string, unknown>)?.provider_name as string || 'Inconnu',
        amount: (app.marketplace_products as Record<string, unknown>)?.max_amount as number,
        status: app.status || 'pending',
        created_at: app.created_at || new Date().toISOString(),
        score: app.score || undefined,
        score_grade: app.score_grade || undefined,
      }));
    },
    enabled: !!user?.id,
  });
};

// Hook to count available offers for borrower
export const useBorrowerOffersCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['borrower-offers-count', user?.id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching offers count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });
};
