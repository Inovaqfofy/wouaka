/**
 * SHARED TESSERACT WORKER
 * Mutualizes Tesseract.js worker across all components for performance
 */

import Tesseract, { Worker } from 'tesseract.js';

let sharedWorker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

/**
 * Get or create a shared Tesseract worker
 * Only one worker is created and reused across all OCR operations
 */
export async function getSharedWorker(): Promise<Worker> {
  if (sharedWorker) {
    return sharedWorker;
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = initializeWorker();
  sharedWorker = await workerInitPromise;
  return sharedWorker;
}

async function initializeWorker(): Promise<Worker> {
  console.log('[OCR] Initializing shared Tesseract worker...');
  const startTime = Date.now();
  
  const worker = await Tesseract.createWorker('fra', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // Progress callback can be used by components
      }
    },
  });

  console.log(`[OCR] Worker initialized in ${Date.now() - startTime}ms`);
  return worker;
}

/**
 * Preload the worker on app init to reduce first-use latency
 * Call this after user login
 */
export async function preloadOCRWorker(): Promise<void> {
  try {
    await getSharedWorker();
    console.log('[OCR] Worker preloaded successfully');
  } catch (error) {
    console.warn('[OCR] Worker preload failed:', error);
  }
}

/**
 * Terminate the shared worker to free resources
 * Call on logout or app unmount
 */
export async function terminateWorker(): Promise<void> {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
    workerInitPromise = null;
    console.log('[OCR] Worker terminated');
  }
}

/**
 * OCR with timeout and fallback
 * @param image Image file or blob to process
 * @param timeoutMs Timeout in milliseconds (default 30s)
 */
export async function ocrWithTimeout(
  image: File | Blob,
  timeoutMs: number = 30000
): Promise<{
  text: string;
  confidence: number;
  timedOut: boolean;
}> {
  const worker = await getSharedWorker();
  
  return Promise.race([
    worker.recognize(image).then((result) => ({
      text: result.data.text,
      confidence: result.data.confidence,
      timedOut: false,
    })),
    new Promise<{ text: string; confidence: number; timedOut: boolean }>((_, reject) =>
      setTimeout(() => reject(new Error('OCR_TIMEOUT')), timeoutMs)
    ),
  ]).catch((error) => {
    if (error.message === 'OCR_TIMEOUT') {
      return {
        text: '',
        confidence: 0,
        timedOut: true,
      };
    }
    throw error;
  });
}
