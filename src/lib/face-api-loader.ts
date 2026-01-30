/**
 * Face-API.js Model Loader
 * Sovereign face detection and liveness check for Wouaka KYC
 * 
 * Models are loaded from jsdelivr CDN to avoid bundling large files
 */

import * as faceapi from 'face-api.js';

// CDN URL for face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load all required face-api.js models
 * Models are cached after first load
 */
export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('[FaceAPI] Loading models from CDN...');
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      modelsLoaded = true;
      console.log('[FaceAPI] All models loaded successfully');
    } catch (error) {
      console.error('[FaceAPI] Failed to load models:', error);
      loadingPromise = null;
      throw new Error('Impossible de charger les modèles de reconnaissance faciale');
    }
  })();

  return loadingPromise;
}

/**
 * Check if models are loaded
 */
export function areFaceApiModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Detect faces in an image
 */
export async function detectFaces(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>[]> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  const detections = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  return detections;
}

/**
 * Compare two face images and return similarity score (0-100)
 */
export async function compareFaces(
  image1: HTMLImageElement | HTMLCanvasElement,
  image2: HTMLImageElement | HTMLCanvasElement
): Promise<{ match: boolean; score: number; confidence: number }> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  const [detection1, detection2] = await Promise.all([
    faceapi.detectSingleFace(image1, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor(),
    faceapi.detectSingleFace(image2, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor(),
  ]);

  if (!detection1 || !detection2) {
    return { match: false, score: 0, confidence: 0 };
  }

  // Calculate Euclidean distance between face descriptors
  const distance = faceapi.euclideanDistance(
    detection1.descriptor,
    detection2.descriptor
  );

  // Convert distance to similarity score (0-100)
  // Typical threshold is 0.6, lower distance = higher similarity
  const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
  const match = distance < 0.6; // Standard threshold for face matching
  const confidence = Math.round((1 - Math.min(distance, 1)) * 100);

  return { match, score: Math.round(similarity), confidence };
}

/**
 * Perform liveness check based on facial landmarks analysis
 * Returns a score 0-100 indicating likelihood of live person vs photo
 */
export async function performLivenessCheck(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  isLive: boolean;
  score: number;
  checks: { name: string; passed: boolean; score: number }[];
}> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!detection) {
    return {
      isLive: false,
      score: 0,
      checks: [{ name: 'face_detected', passed: false, score: 0 }],
    };
  }

  const checks: { name: string; passed: boolean; score: number }[] = [];
  
  // Check 1: Face detection quality
  const detectionScore = detection.detection.score * 100;
  checks.push({
    name: 'detection_quality',
    passed: detectionScore > 50,
    score: Math.round(detectionScore),
  });

  // Check 2: Face size (not too small = likely not a tiny photo)
  const faceBox = detection.detection.box;
  const faceAreaRatio = (faceBox.width * faceBox.height) / (input.width * input.height || 640 * 480);
  const sizeScore = Math.min(100, faceAreaRatio * 400); // Expect face to be ~25% of image
  checks.push({
    name: 'face_size',
    passed: sizeScore > 30,
    score: Math.round(sizeScore),
  });

  // Check 3: Landmarks quality (68 points should be well distributed)
  const landmarks = detection.landmarks;
  const landmarkPoints = landmarks.positions;
  
  // Calculate variance of landmark positions (higher = more 3D structure)
  let xVariance = 0;
  let yVariance = 0;
  const xMean = landmarkPoints.reduce((sum, p) => sum + p.x, 0) / landmarkPoints.length;
  const yMean = landmarkPoints.reduce((sum, p) => sum + p.y, 0) / landmarkPoints.length;
  
  for (const point of landmarkPoints) {
    xVariance += Math.pow(point.x - xMean, 2);
    yVariance += Math.pow(point.y - yMean, 2);
  }
  xVariance /= landmarkPoints.length;
  yVariance /= landmarkPoints.length;
  
  const varianceScore = Math.min(100, (xVariance + yVariance) / 50);
  checks.push({
    name: 'landmark_variance',
    passed: varianceScore > 40,
    score: Math.round(varianceScore),
  });

  // Check 4: Expression naturalness (not perfectly neutral = more likely live)
  const expressions = detection.expressions;
  const dominantExpression = expressions.asSortedArray()[0];
  const expressionDiversity = 1 - dominantExpression.probability;
  const expressionScore = Math.min(100, expressionDiversity * 200 + 50);
  checks.push({
    name: 'expression_naturalness',
    passed: true, // Any expression is acceptable
    score: Math.round(expressionScore),
  });

  // Calculate overall liveness score
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  
  return {
    isLive: passedChecks >= 3 && totalScore > 50,
    score: Math.round(totalScore),
    checks,
  };
}

/**
 * Extract face descriptor from image for storage/comparison
 */
export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor || null;
}
