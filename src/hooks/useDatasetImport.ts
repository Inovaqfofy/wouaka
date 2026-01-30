import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { useDatasetStore, type Dataset } from '@/stores/useDatasetStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useDatasetImport() {
  const { user, session } = useAuth();
  const {
    datasets,
    currentDataset,
    isUploading,
    uploadProgress,
    isProcessing,
    processingProgress,
    setDatasets,
    addDataset,
    updateDataset,
    setCurrentDataset,
    setUploading,
    setUploadProgress,
    setProcessing,
    setProcessingProgress,
  } = useDatasetStore();

  const [error, setError] = useState<string | null>(null);

  // Fetch user's datasets
  const fetchDatasets = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDatasets((data as unknown as Dataset[]) || []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  }, [user, setDatasets]);

  // Parse CSV file
  const parseCSV = useCallback((file: File): Promise<{ data: Record<string, unknown>[]; columns: { name: string; type: string }[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const columns = results.meta.fields?.map(name => ({
            name,
            type: 'string', // Could be enhanced to detect types
          })) || [];
          resolve({ data: results.data as Record<string, unknown>[], columns });
        },
        error: (err) => reject(err),
      });
    });
  }, []);

  // Upload and create dataset
  const uploadDataset = useCallback(async (file: File, name: string, description?: string) => {
    if (!user || !session) {
      setError('You must be logged in');
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Parse CSV
      setUploadProgress(10);
      const { data: rows, columns } = await parseCSV(file);
      setUploadProgress(30);

      if (rows.length === 0) {
        throw new Error('Le fichier CSV est vide');
      }

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('datasets')
        .getPublicUrl(filePath);

      // Create dataset record
      const { data: dataset, error: createError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name,
          description,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          row_count: rows.length,
          column_count: columns.length,
          columns,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) throw createError;
      setUploadProgress(70);

      // Import rows into dataset
      const { error: invokeError } = await supabase.functions.invoke('process-dataset', {
        body: {
          action: 'import',
          dataset_id: dataset.id,
          rows,
        },
      });

      if (invokeError) throw invokeError;
      setUploadProgress(100);

      addDataset(dataset as unknown as Dataset);
      toast.success(`Dataset "${name}" importé avec succès (${rows.length} lignes)`);
      
      return dataset as unknown as Dataset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'import';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, session, parseCSV, setUploading, setUploadProgress, addDataset]);

  // Process dataset (calculate scores)
  const processDataset = useCallback(async (datasetId: string) => {
    if (!session) {
      setError('You must be logged in');
      return false;
    }

    setProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      let hasMore = true;
      let totalProcessed = 0;

      while (hasMore) {
        const { data, error: invokeError } = await supabase.functions.invoke('process-dataset', {
          body: {
            action: 'process',
            dataset_id: datasetId,
          },
        });

        if (invokeError) throw invokeError;

        totalProcessed += data.processed;
        hasMore = data.has_more;

        // Update progress from dataset
        const { data: datasetData } = await supabase
          .from('datasets')
          .select('processing_progress, status')
          .eq('id', datasetId)
          .single();

        if (datasetData) {
          setProcessingProgress(datasetData.processing_progress);
          updateDataset(datasetId, {
            processing_progress: datasetData.processing_progress,
            status: datasetData.status as Dataset['status'],
          });
        }

        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      toast.success(`${totalProcessed} scores calculés avec succès`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du traitement';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [session, setProcessing, setProcessingProgress, updateDataset]);

  // Get dataset results
  const getDatasetResults = useCallback(async (datasetId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dataset_rows')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('row_number');

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching dataset results:', err);
      return [];
    }
  }, []);

  // Delete dataset
  const deleteDataset = useCallback(async (datasetId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId);

      if (deleteError) throw deleteError;
      
      useDatasetStore.getState().removeDataset(datasetId);
      toast.success('Dataset supprimé');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(message);
      return false;
    }
  }, []);

  return {
    datasets,
    currentDataset,
    isUploading,
    uploadProgress,
    isProcessing,
    processingProgress,
    error,
    fetchDatasets,
    uploadDataset,
    processDataset,
    getDatasetResults,
    deleteDataset,
    setCurrentDataset,
  };
}
