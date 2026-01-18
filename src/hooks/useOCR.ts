import { useState, useCallback } from 'react';
import { extractTextFromImage, validateImageForOCR, OCRResult, OCRProgress } from '@/lib/ocr-service';

interface UseOCRState {
  isProcessing: boolean;
  progress: OCRProgress | null;
  result: OCRResult | null;
  error: string | null;
}

export function useOCR() {
  const [state, setState] = useState<UseOCRState>({
    isProcessing: false,
    progress: null,
    result: null,
    error: null,
  });

  const processImage = useCallback(async (file: File): Promise<OCRResult | null> => {
    // Validate file first
    const validation = validateImageForOCR(file);
    if (!validation.valid) {
      setState((prev) => ({ ...prev, error: validation.error || 'Fichier invalide' }));
      return null;
    }

    setState({
      isProcessing: true,
      progress: { status: 'Initialisation...', progress: 0 },
      result: null,
      error: null,
    });

    try {
      const result = await extractTextFromImage(file, (progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: null,
        result,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur OCR inconnue';
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: null,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: null,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    processImage,
    reset,
  };
}
