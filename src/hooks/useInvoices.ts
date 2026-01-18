import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  issued_at: string;
  paid_at: string | null;
  pdf_url: string | null;
  metadata: {
    plan_name?: string;
    customer_name?: string;
    customer_email?: string;
    transaction_id?: string;
    payment_method?: string;
  } | null;
  created_at: string;
}

export const useInvoices = () => {
  const { user } = useAuth();

  // Fetch user's invoices
  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(invoice => ({
        ...invoice,
        metadata: invoice.metadata as Invoice['metadata']
      })) as Invoice[];
    },
    enabled: !!user?.id,
  });

  // Download invoice PDF
  const downloadMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Session expirée');
      }

      // First, generate/get the PDF
      const response = await supabase.functions.invoke('generate-invoice', {
        body: { invoice_id: invoiceId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { pdf_url, invoice_number } = response.data;

      if (!pdf_url) {
        throw new Error('URL du PDF non disponible');
      }

      // Download the file
      const pdfResponse = await fetch(pdf_url);
      if (!pdfResponse.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await pdfResponse.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { invoice_number };
    },
    onSuccess: ({ invoice_number }) => {
      toast.success(`Facture ${invoice_number} téléchargée`);
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement de la facture');
    },
  });

  return {
    invoices,
    isLoading,
    refetch,
    downloadInvoice: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,
  };
};
