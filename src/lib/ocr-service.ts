import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
  }>;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

/**
 * Extract text from an image file using Tesseract.js OCR
 * Runs entirely in the browser - no server required
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const worker = await Tesseract.createWorker('fra+eng', 1, {
    logger: (m) => {
      if (onProgress && m.status && typeof m.progress === 'number') {
        onProgress({
          status: m.status,
          progress: Math.round(m.progress * 100),
        });
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map((w) => ({
        text: w.text,
        confidence: w.confidence,
      })),
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from multiple images
 */
export async function extractTextFromImages(
  files: File[],
  onProgress?: (fileIndex: number, progress: OCRProgress) => void
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await extractTextFromImage(files[i], (progress) => {
      onProgress?.(i, progress);
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Quick validation to check if file is suitable for OCR
 */
export function validateImageForOCR(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Fichier trop volumineux. Maximum 10MB.' };
  }
  
  return { valid: true };
}
