import { useState, useCallback } from 'react';
import { generateComplianceCertificate, verifyCertificateSignature, type ComplianceCertificate } from '@/lib/compliance-certificate';
import { useToast } from '@/hooks/use-toast';

export function useComplianceCertificate() {
  const [certificate, setCertificate] = useState<ComplianceCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const { toast } = useToast();

  const generateCertificate = useCallback(async (partnerId?: string, partnerName?: string) => {
    setIsLoading(true);
    try {
      const cert = await generateComplianceCertificate(partnerId, partnerName);
      setCertificate(cert);
      
      // Verify signature immediately
      const verified = await verifyCertificateSignature(cert);
      setIsVerified(verified);
      
      toast({
        title: 'Certificat généré',
        description: `Grade: ${cert.compliance_grade} (${cert.overall_compliance_score}%)`,
      });
      
      return cert;
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le certificat',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const verifyCertificate = useCallback(async (cert: ComplianceCertificate) => {
    try {
      const verified = await verifyCertificateSignature(cert);
      setIsVerified(verified);
      return verified;
    } catch {
      setIsVerified(false);
      return false;
    }
  }, []);

  return {
    certificate,
    isLoading,
    isVerified,
    generateCertificate,
    verifyCertificate,
  };
}
