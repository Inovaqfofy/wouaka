import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CertificatePreview {
  id: string;
  userId: string;
  borrowerName: string;
  score: number;
  grade: string;
  trustLevel: string;
  validUntil: string;
  validationStatus: 'unvalidated' | 'validated' | 'rejected';
  validatedByPartnerName?: string;
  isExpired: boolean;
  createdAt: string;
}

interface ValidationResult {
  success: boolean;
  validationStatus: 'validated' | 'rejected';
  dossier: {
    certificate: any;
    borrower: any;
    aml_screening: any;
    scoring_details: any;
    phone_verification: any;
    credit_recommendation: any;
  };
}

export const useValidateCertificateWeb = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [preview, setPreview] = useState<CertificatePreview | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const lookupCertificate = async (shareCode: string): Promise<CertificatePreview | null> => {
    setIsSearching(true);
    setPreview(null);
    setValidationResult(null);

    try {
      // Rechercher le certificat par share_code
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select(`
          id,
          user_id,
          score,
          trust_level,
          valid_until,
          validation_status,
          validated_by_partner_id,
          created_at,
          user:profiles!certificates_user_id_fkey(full_name)
        `)
        .eq('share_code', shareCode.toUpperCase().trim())
        .single();

      if (error || !certificate) {
        toast({
          title: "Certificat non trouvé",
          description: "Vérifiez le code de partage et réessayez.",
          variant: "destructive"
        });
        return null;
      }

      // Récupérer le nom du partenaire validateur si existant
      let validatedByPartnerName: string | undefined;
      if (certificate.validated_by_partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('company, full_name')
          .eq('id', certificate.validated_by_partner_id)
          .single();
        validatedByPartnerName = partner?.company || partner?.full_name || undefined;
      }

      // Calculer le grade à partir du score
      const score = certificate.score || 0;
      let grade = 'E';
      if (score >= 750) grade = 'A';
      else if (score >= 650) grade = 'B';
      else if (score >= 550) grade = 'C';
      else if (score >= 450) grade = 'D';

      const previewData: CertificatePreview = {
        id: certificate.id,
        userId: certificate.user_id,
        borrowerName: (certificate.user as any)?.full_name || 'Non renseigné',
        score: certificate.score || 0,
        grade,
        trustLevel: certificate.trust_level || 'basic',
        validUntil: certificate.valid_until,
        validationStatus: (certificate.validation_status as 'unvalidated' | 'validated' | 'rejected') || 'unvalidated',
        validatedByPartnerName,
        isExpired: new Date(certificate.valid_until) < new Date(),
        createdAt: certificate.created_at
      };

      setPreview(previewData);
      return previewData;
    } catch (err) {
      console.error('Lookup error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher ce certificat.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const validateCertificate = async (certificateId: string): Promise<ValidationResult | null> => {
    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-certificate', {
        body: { 
          certificate_id: certificateId,
          mode: 'web'
        }
      });

      if (error) {
        console.error('Validation error:', error);
        toast({
          title: "Erreur de validation",
          description: error.message || "Impossible de valider ce certificat.",
          variant: "destructive"
        });
        return null;
      }

      if (!data.success) {
        toast({
          title: "Validation échouée",
          description: data.error || "Une erreur est survenue.",
          variant: "destructive"
        });
        return null;
      }

      setValidationResult(data as ValidationResult);
      
      toast({
        title: data.validation_status === 'validated' ? "Certificat validé ✓" : "Certificat rejeté",
        description: data.validation_status === 'validated' 
          ? "Le dossier de preuves complet est maintenant disponible."
          : "Le certificat a été rejeté suite au screening AML/PEP.",
        variant: data.validation_status === 'validated' ? "default" : "destructive"
      });

      return data as ValidationResult;
    } catch (err) {
      console.error('Validation error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de valider ce certificat.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setValidationResult(null);
  };

  return {
    isSearching,
    isValidating,
    preview,
    validationResult,
    lookupCertificate,
    validateCertificate,
    reset
  };
};
