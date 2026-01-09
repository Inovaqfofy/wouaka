import { create } from 'zustand';

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  ocr_data?: Record<string, unknown>;
  ocr_confidence?: number;
  status: 'pending' | 'processing' | 'verified' | 'rejected';
  rejection_reason?: string;
  validated_by?: string;
  validated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KycValidation {
  id: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_review';
  overall_score?: number;
  identity_verified: boolean;
  address_verified: boolean;
  income_verified: boolean;
  documents_complete: boolean;
  risk_flags?: string[];
  notes?: string;
  assigned_analyst?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface KycState {
  documents: KycDocument[];
  validation: KycValidation | null;
  currentStep: number;
  isUploading: boolean;
  uploadProgress: number;
  
  // Actions
  setDocuments: (documents: KycDocument[]) => void;
  addDocument: (document: KycDocument) => void;
  updateDocument: (id: string, updates: Partial<KycDocument>) => void;
  removeDocument: (id: string) => void;
  setValidation: (validation: KycValidation | null) => void;
  setCurrentStep: (step: number) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  reset: () => void;
}

export const useKycStore = create<KycState>((set, get) => ({
  documents: [],
  validation: null,
  currentStep: 0,
  isUploading: false,
  uploadProgress: 0,
  
  setDocuments: (documents) => set({ documents }),
  
  addDocument: (document) => {
    const { documents } = get();
    set({ documents: [...documents, document] });
  },
  
  updateDocument: (id, updates) => {
    const { documents } = get();
    set({
      documents: documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      )
    });
  },
  
  removeDocument: (id) => {
    const { documents } = get();
    set({ documents: documents.filter(doc => doc.id !== id) });
  },
  
  setValidation: (validation) => set({ validation }),
  
  setCurrentStep: (currentStep) => set({ currentStep }),
  
  setUploading: (isUploading) => set({ isUploading }),
  
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  
  reset: () => set({
    documents: [],
    validation: null,
    currentStep: 0,
    isUploading: false,
    uploadProgress: 0
  }),
}));
