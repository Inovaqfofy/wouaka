import { create } from 'zustand';

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  row_count: number;
  column_count: number;
  columns?: { name: string; type: string }[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  processing_progress: number;
  error_message?: string;
  scores_calculated: number;
  created_at: string;
  updated_at: string;
}

export interface DatasetRow {
  id: string;
  dataset_id: string;
  row_number: number;
  data: Record<string, unknown>;
  score?: number;
  risk_category?: string;
  confidence?: number;
  processed_at?: string;
  error_message?: string;
  created_at: string;
}

interface DatasetState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  currentRows: DatasetRow[];
  isUploading: boolean;
  uploadProgress: number;
  isProcessing: boolean;
  processingProgress: number;
  
  // Actions
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  removeDataset: (id: string) => void;
  setCurrentDataset: (dataset: Dataset | null) => void;
  setCurrentRows: (rows: DatasetRow[]) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setProcessing: (processing: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  reset: () => void;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  currentDataset: null,
  currentRows: [],
  isUploading: false,
  uploadProgress: 0,
  isProcessing: false,
  processingProgress: 0,
  
  setDatasets: (datasets) => set({ datasets }),
  
  addDataset: (dataset) => {
    const { datasets } = get();
    set({ datasets: [dataset, ...datasets] });
  },
  
  updateDataset: (id, updates) => {
    const { datasets, currentDataset } = get();
    set({
      datasets: datasets.map(d => d.id === id ? { ...d, ...updates } : d),
      currentDataset: currentDataset?.id === id 
        ? { ...currentDataset, ...updates } 
        : currentDataset
    });
  },
  
  removeDataset: (id) => {
    const { datasets, currentDataset } = get();
    set({
      datasets: datasets.filter(d => d.id !== id),
      currentDataset: currentDataset?.id === id ? null : currentDataset
    });
  },
  
  setCurrentDataset: (currentDataset) => set({ currentDataset }),
  
  setCurrentRows: (currentRows) => set({ currentRows }),
  
  setUploading: (isUploading) => set({ isUploading }),
  
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  setProcessingProgress: (processingProgress) => set({ processingProgress }),
  
  reset: () => set({
    currentDataset: null,
    currentRows: [],
    isUploading: false,
    uploadProgress: 0,
    isProcessing: false,
    processingProgress: 0
  }),
}));
