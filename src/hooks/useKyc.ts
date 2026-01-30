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
      setUploadProgress(80);

      addDocument(doc as unknown as KycDocument);

      // Auto-validate document via local OCR + edge function analysis
      try {
        // Import OCR service dynamically
        const { extractTextFromImage } = await import('@/lib/ocr-service');
        
        // Only process images (not PDFs)
        const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        
        if (isImage) {
          console.log('[KYC] Starting local OCR for document:', doc.id);
          
          // Run local OCR first
          let ocrResult;
          try {
            ocrResult = await extractTextFromImage(file);
            console.log('[KYC] OCR completed:', { 
              textLength: ocrResult.text?.length || 0, 
              confidence: ocrResult.confidence,
              wordsCount: ocrResult.words?.length || 0
            });
          } catch (tesseractErr) {
            console.error('[KYC] Tesseract OCR failed:', tesseractErr);
            toast.success('Document téléchargé - OCR indisponible');
            return doc as unknown as KycDocument;
          }
          
          const extractedText = (ocrResult.text ?? '').trim();
          
          // LOWERED threshold from 10 to 5 characters for more tolerance
          if (extractedText.length >= 5) {
            console.log('[KYC] Text extracted, calling document-analyze edge function...');
            
            // Map document type to edge function format
            const docTypeMap: Record<string, string> = {
              'national_id': 'cni',
              'identity': 'cni',
              'passport': 'passport',
              'proof_of_address': 'justificatif_domicile',
              'address': 'justificatif_domicile',
              'income_proof': 'releve_bancaire',
              'income': 'releve_bancaire',
              'bank_statement': 'releve_bancaire',
            };
            
            try {
              // Call edge function with OCR text for AI analysis + document_id for backend update
              const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('document-analyze', {
                body: { 
                  ocr_text: extractedText,
                  document_type: docTypeMap[documentType] || 'unknown',
                  ocr_confidence: ocrResult.confidence,
                  document_id: doc.id
                }
              });

              console.log('[KYC] document-analyze response:', { 
                analysisResult, 
                analysisError,
                statusApplied: analysisResult?.status_applied,
                overallConfidence: analysisResult?.overall_confidence
              });

              if (analysisError) {
                console.warn('[KYC] Edge function returned error:', analysisError);
                // Store local OCR result anyway
                await supabase
                  .from('kyc_documents')
                  .update({
                    ocr_data: { raw_text: extractedText, local_ocr: true },
                    ocr_confidence: ocrResult.confidence
                  })
                  .eq('id', doc.id);
                toast.success('Document téléchargé - en attente de vérification manuelle');
              } else {
                // Edge function succeeded - it updates kyc_documents via service role
                const statusApplied = analysisResult?.status_applied;
                if (statusApplied === 'verified') {
                  toast.success('Document vérifié automatiquement !');
                } else if (statusApplied === 'pending') {
                  toast.success('Document analysé - vérification en cours');
                } else {
                  toast.success('Document téléchargé - en attente de vérification');
                }
              }
            } catch (edgeFunctionErr) {
              // Edge function call failed completely - store local OCR data
              console.error('[KYC] Edge function call failed:', edgeFunctionErr);
              await supabase
                .from('kyc_documents')
                .update({
                  ocr_data: { raw_text: extractedText, local_ocr: true, error: 'edge_function_failed' },
                  ocr_confidence: ocrResult.confidence
                })
                .eq('id', doc.id);
              toast.success('Document téléchargé - analyse automatique indisponible');
            }
          } else {
            // Not enough text extracted - save OCR result with failure reason
            console.warn('[KYC] Not enough text extracted:', extractedText.length, 'chars. This usually means the image is not a real document (logo, screenshot, etc.)');
            
            // Always save the OCR attempt result for tracking
            await supabase
              .from('kyc_documents')
              .update({
                ocr_data: { 
                  raw_text: extractedText, 
                  insufficient_text: true,
                  chars_extracted: extractedText.length,
                  reason: 'ocr_no_text',
                  analyzed_at: new Date().toISOString()
                },
                ocr_confidence: Math.max(ocrResult.confidence, 1) // Minimum 1 to show it was processed
              })
              .eq('id', doc.id);
            
            toast.warning('⚠️ Aucun texte détecté. Uploadez une vraie pièce d\'identité avec texte lisible (CNI, passeport).', {
              duration: 6000
            });
          }
        } else {
          // PDF - save minimal data and warn about manual verification
          await supabase
            .from('kyc_documents')
            .update({
              ocr_data: { 
                type: 'pdf',
                reason: 'pdf_not_ocr_supported',
                analyzed_at: new Date().toISOString()
              },
              ocr_confidence: 0
            })
            .eq('id', doc.id);
          
          toast.info('📄 PDF téléchargé. Les PDF nécessitent une vérification manuelle. Préférez les images pour une analyse automatique.', {
            duration: 5000
          });
        }
      } catch (ocrErr) {
        console.error('[KYC] OCR processing error:', ocrErr);
        toast.success('Document téléchargé avec succès');
      }

      setUploadProgress(100);
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
