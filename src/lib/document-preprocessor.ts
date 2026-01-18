/**
 * Document Image Preprocessor using OpenCV.js
 * Improves OCR quality by cleaning and normalizing document images
 * 
 * Features:
 * - Automatic document contour detection
 * - Perspective correction (deskewing)
 * - Grayscale conversion and contrast enhancement
 * - Noise reduction
 */

// OpenCV.js CDN URL
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.8.0/opencv.js';

// Global OpenCV instance
declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let opencvLoaded = false;
let opencvLoading = false;
let opencvLoadPromise: Promise<void> | null = null;

/**
 * Load OpenCV.js from CDN
 */
export async function loadOpenCV(): Promise<void> {
  if (opencvLoaded && window.cv) {
    return;
  }
  
  if (opencvLoading && opencvLoadPromise) {
    return opencvLoadPromise;
  }
  
  opencvLoading = true;
  
  opencvLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.cv && window.cv.Mat) {
      opencvLoaded = true;
      opencvLoading = false;
      resolve();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = OPENCV_CDN_URL;
    script.async = true;
    
    // OpenCV.js uses Module pattern
    window.Module = {
      onRuntimeInitialized: () => {
        opencvLoaded = true;
        opencvLoading = false;
        console.log('[DocumentPreprocessor] OpenCV.js loaded successfully');
        resolve();
      },
    };
    
    script.onerror = () => {
      opencvLoading = false;
      reject(new Error('Failed to load OpenCV.js from CDN'));
    };
    
    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      if (!opencvLoaded) {
        opencvLoading = false;
        reject(new Error('OpenCV.js loading timeout'));
      }
    }, 30000);
    
    script.onload = () => {
      // Wait for Module initialization
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          opencvLoaded = true;
          opencvLoading = false;
          resolve();
        }
      }, 100);
    };
    
    document.head.appendChild(script);
  });
  
  return opencvLoadPromise;
}

/**
 * Check if OpenCV is loaded
 */
export function isOpenCVLoaded(): boolean {
  return opencvLoaded && !!window.cv;
}

export interface PreprocessingResult {
  success: boolean;
  processedImageUrl: string | null;
  originalImageUrl: string;
  steps: PreprocessingStep[];
  documentDetected: boolean;
  processingTimeMs: number;
  error?: string;
}

export interface PreprocessingStep {
  name: string;
  description: string;
  applied: boolean;
}

/**
 * Convert File to HTMLImageElement
 */
async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert canvas to blob URL
 */
function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Detect document contours and find the largest rectangular contour
 */
function findDocumentContour(cv: any, src: any): any | null {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  
  try {
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    // Detect edges using Canny
    cv.Canny(blurred, edges, 75, 200);
    
    // Find contours
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let maxArea = 0;
    let maxContour = null;
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      if (area > maxArea) {
        // Approximate contour to polygon
        const peri = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);
        
        // Check if it's a quadrilateral
        if (approx.rows === 4) {
          maxArea = area;
          if (maxContour) maxContour.delete();
          maxContour = approx;
        } else {
          approx.delete();
        }
      }
    }
    
    return maxContour;
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Order points for perspective transform (top-left, top-right, bottom-right, bottom-left)
 */
function orderPoints(points: number[][]): number[][] {
  // Sort by sum (x+y) for top-left and bottom-right
  const sortedBySum = [...points].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const topLeft = sortedBySum[0];
  const bottomRight = sortedBySum[3];
  
  // Sort by difference (y-x) for top-right and bottom-left
  const sortedByDiff = [...points].sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]));
  const topRight = sortedByDiff[0];
  const bottomLeft = sortedByDiff[3];
  
  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Apply perspective transform to correct document orientation
 */
function applyPerspectiveTransform(cv: any, src: any, contour: any): any {
  // Extract corner points
  const points: number[][] = [];
  for (let i = 0; i < 4; i++) {
    points.push([contour.data32S[i * 2], contour.data32S[i * 2 + 1]]);
  }
  
  const ordered = orderPoints(points);
  
  // Calculate output dimensions
  const widthA = Math.sqrt(Math.pow(ordered[2][0] - ordered[3][0], 2) + Math.pow(ordered[2][1] - ordered[3][1], 2));
  const widthB = Math.sqrt(Math.pow(ordered[1][0] - ordered[0][0], 2) + Math.pow(ordered[1][1] - ordered[0][1], 2));
  const maxWidth = Math.max(widthA, widthB);
  
  const heightA = Math.sqrt(Math.pow(ordered[1][0] - ordered[2][0], 2) + Math.pow(ordered[1][1] - ordered[2][1], 2));
  const heightB = Math.sqrt(Math.pow(ordered[0][0] - ordered[3][0], 2) + Math.pow(ordered[0][1] - ordered[3][1], 2));
  const maxHeight = Math.max(heightA, heightB);
  
  // Source points
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ordered[0][0], ordered[0][1],
    ordered[1][0], ordered[1][1],
    ordered[2][0], ordered[2][1],
    ordered[3][0], ordered[3][1],
  ]);
  
  // Destination points
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxWidth - 1, 0,
    maxWidth - 1, maxHeight - 1,
    0, maxHeight - 1,
  ]);
  
  // Get perspective transform matrix
  const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  // Apply transform
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(maxWidth, maxHeight));
  
  // Cleanup
  srcPoints.delete();
  dstPoints.delete();
  M.delete();
  
  return dst;
}

/**
 * Enhance image contrast using CLAHE
 */
function enhanceContrast(cv: any, src: any): any {
  const gray = new cv.Mat();
  const enhanced = new cv.Mat();
  
  try {
    // Convert to grayscale if needed
    if (src.channels() === 4) {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    } else if (src.channels() === 3) {
      cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY);
    } else {
      src.copyTo(gray);
    }
    
    // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(gray, enhanced);
    clahe.delete();
    
    // Convert back to color
    const result = new cv.Mat();
    cv.cvtColor(enhanced, result, cv.COLOR_GRAY2RGBA);
    
    return result;
  } finally {
    gray.delete();
    enhanced.delete();
  }
}

/**
 * Remove noise using bilateral filter
 */
function denoiseImage(cv: any, src: any): any {
  const dst = new cv.Mat();
  
  // Bilateral filter preserves edges while removing noise
  cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);
  
  return dst;
}

/**
 * Main preprocessing pipeline
 */
export async function preprocessDocument(file: File): Promise<PreprocessingResult> {
  const startTime = performance.now();
  const steps: PreprocessingStep[] = [];
  
  // Create original image URL
  const originalImageUrl = URL.createObjectURL(file);
  
  try {
    // Load OpenCV if not already loaded
    await loadOpenCV();
    
    if (!window.cv) {
      throw new Error('OpenCV.js not available');
    }
    
    const cv = window.cv;
    
    // Load image
    const img = await fileToImage(file);
    
    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    
    // Read image into OpenCV Mat
    let src = cv.imread(canvas);
    let current = src.clone();
    
    // Step 1: Document detection and perspective correction
    steps.push({
      name: 'Détection du document',
      description: 'Recherche des contours de la carte/document',
      applied: false,
    });
    
    const contour = findDocumentContour(cv, current);
    let documentDetected = false;
    
    if (contour) {
      try {
        const transformed = applyPerspectiveTransform(cv, current, contour);
        current.delete();
        current = transformed;
        steps[steps.length - 1].applied = true;
        documentDetected = true;
        
        steps.push({
          name: 'Correction de perspective',
          description: 'Redressement du document',
          applied: true,
        });
      } catch (e) {
        console.warn('[DocumentPreprocessor] Perspective transform failed:', e);
      }
      contour.delete();
    }
    
    // Step 2: Contrast enhancement
    steps.push({
      name: 'Amélioration du contraste',
      description: 'Application de CLAHE pour améliorer la lisibilité',
      applied: false,
    });
    
    try {
      const enhanced = enhanceContrast(cv, current);
      current.delete();
      current = enhanced;
      steps[steps.length - 1].applied = true;
    } catch (e) {
      console.warn('[DocumentPreprocessor] Contrast enhancement failed:', e);
    }
    
    // Step 3: Noise reduction
    steps.push({
      name: 'Réduction du bruit',
      description: 'Filtrage bilatéral pour préserver les bords',
      applied: false,
    });
    
    try {
      const denoised = denoiseImage(cv, current);
      current.delete();
      current = denoised;
      steps[steps.length - 1].applied = true;
    } catch (e) {
      console.warn('[DocumentPreprocessor] Denoising failed:', e);
    }
    
    // Write result to canvas
    const outputCanvas = document.createElement('canvas');
    cv.imshow(outputCanvas, current);
    
    // Cleanup
    src.delete();
    current.delete();
    
    const processingTimeMs = performance.now() - startTime;
    
    return {
      success: true,
      processedImageUrl: canvasToDataUrl(outputCanvas),
      originalImageUrl,
      steps,
      documentDetected,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = performance.now() - startTime;
    
    return {
      success: false,
      processedImageUrl: null,
      originalImageUrl,
      steps,
      documentDetected: false,
      processingTimeMs,
      error: error instanceof Error ? error.message : 'Erreur de prétraitement',
    };
  }
}

/**
 * Quick preprocessing without full OpenCV (fallback)
 * Uses Canvas API for basic enhancements
 */
export async function quickPreprocess(file: File): Promise<PreprocessingResult> {
  const startTime = performance.now();
  const originalImageUrl = URL.createObjectURL(file);
  
  try {
    const img = await fileToImage(file);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Contrast enhancement (stretch histogram)
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
      
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const processingTimeMs = performance.now() - startTime;
    
    return {
      success: true,
      processedImageUrl: canvasToDataUrl(canvas),
      originalImageUrl,
      steps: [
        {
          name: 'Conversion en niveaux de gris',
          description: 'Simplification de l\'image pour l\'OCR',
          applied: true,
        },
        {
          name: 'Amélioration du contraste',
          description: 'Étirement de l\'histogramme',
          applied: true,
        },
      ],
      documentDetected: false,
      processingTimeMs,
    };
  } catch (error) {
    return {
      success: false,
      processedImageUrl: null,
      originalImageUrl,
      steps: [],
      documentDetected: false,
      processingTimeMs: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Erreur de prétraitement',
    };
  }
}

/**
 * Smart preprocessing - tries OpenCV first, falls back to quick method
 */
export async function smartPreprocess(file: File): Promise<PreprocessingResult> {
  try {
    // Try full OpenCV preprocessing
    const result = await preprocessDocument(file);
    if (result.success) {
      return result;
    }
  } catch (e) {
    console.warn('[DocumentPreprocessor] OpenCV preprocessing failed, using fallback');
  }
  
  // Fallback to quick preprocessing
  return quickPreprocess(file);
}
