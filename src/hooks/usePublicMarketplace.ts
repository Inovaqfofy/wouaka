import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProduct {
  id: string;
  provider_id: string | null;
  name: string;
  provider_name: string;
  description: string | null;
  category: string;
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
  is_featured: boolean;
  created_at: string;
}

interface UsePublicMarketplaceParams {
  category?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Hook for public marketplace - no auth required
export function usePublicMarketplace(params: UsePublicMarketplaceParams = {}) {
  const { category = "all", search = "", minAmount, maxAmount } = params;

  return useQuery({
    queryKey: ['public-marketplace', category, search, minAmount, maxAmount],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply category filter
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,provider_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply amount filters
      if (minAmount !== undefined) {
        query = query.gte('max_amount', minAmount);
      }
      if (maxAmount !== undefined) {
        query = query.lte('min_amount', maxAmount);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PublicProduct[];
    },
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });
}

// Fetch single product details
export function usePublicProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['public-product', productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID required");

      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('id', productId)
        .eq('status', 'published')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as PublicProduct;
    },
    enabled: !!productId
  });
}

// Categories for the public marketplace
export const MARKETPLACE_CATEGORIES = [
  { value: "all", label: "Toutes catégories", icon: "🏦" },
  { value: "credit", label: "Crédits", icon: "💳" },
  { value: "microfinance", label: "Microfinance", icon: "🌱" },
  { value: "leasing", label: "Leasing", icon: "🚗" },
  { value: "trade", label: "Import/Export", icon: "🚢" },
  { value: "insurance", label: "Assurance", icon: "🛡️" },
  { value: "savings", label: "Épargne", icon: "💰" },
];

// Helper to format amount
export function formatAmount(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// Helper to format duration
export function formatDuration(minMonths: number | null, maxMonths: number | null): string {
  if (minMonths === null && maxMonths === null) return 'Flexible';
  if (minMonths === maxMonths) return `${minMonths} mois`;
  if (minMonths === null) return `Jusqu'à ${maxMonths} mois`;
  if (maxMonths === null) return `À partir de ${minMonths} mois`;
  return `${minMonths} - ${maxMonths} mois`;
}
