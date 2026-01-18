import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useKycStore, type KycDocument, type KycValidation } from '@/stores/useKycStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  { id: 'national_id', label: 'Carte d\'identité nationale', required: true },
  { id: 'passport', label: 'Passeport', required: false },
  { id: 'proof_of_address', label: 'Justificatif de domicile', required: true },
  { id: 'income_proof', label: 'Justificatif de revenus', required: true },
  { id: 'rccm', label: 'Registre RCCM', required: false },
  { id: 'bank_statement', label: 'Relevé bancaire', required: false },
];

export function useKyc() {
  const { user, session } = useAuth();
  const {
    documents,
    validation,
    currentStep,
    isUploading,
    uploadProgress,
    setDocuments,
    addDocument,
    updateDocument,
    removeDocument,
    setValidation,
    setCurrentStep,
    setUploading,
    setUploadProgress,
  } = useKycStore();

  const [error, setError] = useState<string | null>(null);

  // Fetch user's KYC documents and validation
  const fetchKycData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch documents
      const { data: docs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments((docs as unknown as KycDocument[]) || []);

      // Fetch validation status
      const { data: validationData, error: valError } = await supabase
        .from('kyc_validations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (valError && valError.code !== 'PGRST116') throw valError;
      setValidation((validationData as unknown as KycValidation) || null);
    } catch (err) {
      console.error('Error fetching KYC data:', err);
    }
  }, [user, setDocuments, setValidation]);

  // Upload KYC document
  const uploadDocument = useCallback(async (
    file: File, 
    documentType: string,
    ocrData?: { ocr_data: Record<string, any>; ocr_confidence: number }
  ) => {
    if (!user || !session) {
      setError('Vous devez être connecté');
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou PDF.');
      toast.error('Type de fichier non autorisé');
      return null;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 10MB)');
      toast.error('Fichier trop volumineux');
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload to storage
      const filePath = `${user.id}/${documentType}_${Date.now()}_${file.name}`;
      setUploadProgress(20);

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(filePath);

      // Create document record with OCR data if available
      const { data: doc, error: insertError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          ocr_data: ocrData?.ocr_data || null,
          ocr_confidence: ocrData?.ocr_confidence || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setUploadProgress(100);

      addDocument(doc as unknown as KycDocument);
      toast.success('Document téléchargé avec succès');

      return doc as unknown as KycDocument;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, session, setUploading, setUploadProgress, addDocument]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('kyc_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      removeDocument(documentId);
      toast.success('Document supprimé');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(message);
      return false;
    }
  }, [removeDocument]);

  // Start KYC validation process
  const startValidation = useCallback(async () => {
    if (!user) return null;

    try {
      // Check if all required documents are uploaded
      const requiredTypes = DOCUMENT_TYPES.filter(t => t.required).map(t => t.id);
      const uploadedTypes = documents.map(d => d.document_type);
      const missingTypes = requiredTypes.filter(t => !uploadedTypes.includes(t));

      if (missingTypes.length > 0) {
        const missingLabels = DOCUMENT_TYPES
          .filter(t => missingTypes.includes(t.id))
          .map(t => t.label);
        toast.error(`Documents manquants: ${missingLabels.join(', ')}`);
        return null;
      }

      // Create or update validation record
      const { data: existingValidation } = await supabase
        .from('kyc_validations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let validationRecord;
      if (existingValidation) {
        const { data, error } = await supabase
          .from('kyc_validations')
          .update({
            status: 'pending',
            documents_complete: true,
            started_at: new Date().toISOString(),
          })
          .eq('id', existingValidation.id)
          .select()
          .single();

        if (error) throw error;
        validationRecord = data;
      } else {
        const { data, error } = await supabase
          .from('kyc_validations')
          .insert({
            user_id: user.id,
            status: 'pending',
            documents_complete: true,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        validationRecord = data;
      }

      setValidation(validationRecord as unknown as KycValidation);
      toast.success('Validation KYC soumise pour examen');

      return validationRecord as unknown as KycValidation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      toast.error(message);
      return null;
    }
  }, [user, documents, setValidation]);

  // Get KYC status summary
  const getKycStatus = useCallback(() => {
    const requiredTypes = DOCUMENT_TYPES.filter(t => t.required);
    const uploadedDocs = documents.filter(d => 
      requiredTypes.some(t => t.id === d.document_type)
    );
    const verifiedDocs = uploadedDocs.filter(d => d.status === 'verified');
    
    return {
      documentsRequired: requiredTypes.length,
      documentsUploaded: uploadedDocs.length,
      documentsVerified: verifiedDocs.length,
      isComplete: uploadedDocs.length >= requiredTypes.length,
      isVerified: validation?.status === 'approved',
      status: validation?.status || 'not_started',
    };
  }, [documents, validation]);

  return {
    documents,
    validation,
    currentStep,
    isUploading,
    uploadProgress,
    error,
    documentTypes: DOCUMENT_TYPES,
    fetchKycData,
    uploadDocument,
    deleteDocument,
    startValidation,
    getKycStatus,
    setCurrentStep,
  };
}
