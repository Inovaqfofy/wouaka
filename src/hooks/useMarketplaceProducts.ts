import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MarketplaceProduct {
  id: string;
  provider_id: string | null;
  name: string;
  provider_name: string;
  description: string | null;
  category: 'credit' | 'microfinance' | 'leasing' | 'trade' | 'insurance' | 'savings';
  interest_rate: number | null;
  min_amount: number | null;
  max_amount: number | null;
  currency: string;
  duration_min_months: number | null;
  duration_max_months: number | null;
  min_score_required: number;
  countries: string[];
  features: string[] | null;
  requirements: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface UseMarketplaceProductsParams {
  category?: string;
  search?: string;
  minScore?: number;
}

export function useMarketplaceProducts(params: UseMarketplaceProductsParams = {}) {
  const { user } = useAuth();
  const { category = "all", search = "", minScore } = params;

  return useQuery({
    queryKey: ['marketplace-products', category, search, minScore],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply category filter
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,provider_name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let products = (data || []) as MarketplaceProduct[];

      // Filter by min score if provided (client-side for flexibility)
      if (minScore !== undefined) {
        products = products.filter(p => p.min_score_required <= minScore);
      }

      return products;
    },
    enabled: !!user?.id
  });
}

export function useFeaturedProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketplace-featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(5);

      if (error) throw error;
      return (data || []) as MarketplaceProduct[];
    },
    enabled: !!user?.id
  });
}

// Helper to format amount
export function formatAmount(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// Helper to format duration
export function formatDuration(minMonths: number | null, maxMonths: number | null): string {
  if (minMonths === null && maxMonths === null) return '-';
  if (minMonths === maxMonths) return `${minMonths} mois`;
  return `${minMonths || 0}-${maxMonths || 0} mois`;
}

// Categories for the marketplace
export const MARKETPLACE_CATEGORIES = [
  { value: "all", label: "Toutes catégories" },
  { value: "credit", label: "Crédits" },
  { value: "microfinance", label: "Microfinance" },
  { value: "leasing", label: "Leasing" },
  { value: "trade", label: "Import/Export" },
  { value: "insurance", label: "Assurance" },
  { value: "savings", label: "Épargne" },
];
