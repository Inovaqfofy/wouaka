import { useState, useCallback, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels, areFaceApiModelsLoaded } from '@/lib/face-api-loader';

export interface LivenessChallenge {
  type: 'turn_left' | 'turn_right' | 'smile' | 'blink' | 'nod';
  label: string;
  instruction: string;
  completed: boolean;
}

export interface LivenessResult {
  passed: boolean;
  score: number;
  challenges: LivenessChallenge[];
  timestamp: Date;
}

export interface FaceComparisonResult {
  matched: boolean;
  distance: number;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: Date;
}

const LIVENESS_CHALLENGES: Omit<LivenessChallenge, 'completed'>[] = [
  { type: 'turn_left', label: 'Tourner à gauche', instruction: 'Tournez lentement la tête vers la gauche' },
  { type: 'turn_right', label: 'Tourner à droite', instruction: 'Tournez lentement la tête vers la droite' },
  { type: 'smile', label: 'Sourire', instruction: 'Souriez naturellement' },
];

export function useFaceVerification() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api.js models from CDN (sovereign loader)
  const loadModels = useCallback(async () => {
    // Check if already loaded via the shared loader
    if (modelsLoaded || areFaceApiModelsLoaded()) {
      setModelsLoaded(true);
      return true;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the sovereign CDN-based loader
      await loadFaceApiModels();
      
      setModelsLoaded(true);
      return true;
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setError('Impossible de charger les modèles de détection faciale');
      return false;
    } finally {
      setLoading(false);
    }
  }, [modelsLoaded]);

  // Start webcam
  const startCamera = useCallback(async (video: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      
      video.srcObject = stream;
      videoRef.current = video;
      streamRef.current = stream;
      
      return new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra');
      throw err;
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
  }, []);

  // Detect face in video frame
  const detectFace = useCallback(async (video: HTMLVideoElement) => {
    if (!modelsLoaded) {
      await loadModels();
    }
    
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    
    return detection;
  }, [modelsLoaded, loadModels]);

  // Check liveness challenge
  const checkLivenessChallenge = useCallback(async (
    video: HTMLVideoElement,
    challenge: LivenessChallenge,
    previousLandmarks?: faceapi.FaceLandmarks68
  ): Promise<{ passed: boolean; landmarks?: faceapi.FaceLandmarks68 }> => {
    const detection = await detectFace(video);
    
    if (!detection) {
      return { passed: false };
    }
    
    const landmarks = detection.landmarks;
    const expressions = detection.expressions;
    
    switch (challenge.type) {
      case 'turn_left': {
        // Check if nose is shifted to the left
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        const noseX = nose[3].x;
        const eyeCenter = (leftEye[0].x + rightEye[3].x) / 2;
        const headTurn = noseX - eyeCenter;
        
        return { passed: headTurn < -15, landmarks };
      }
      
      case 'turn_right': {
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        const noseX = nose[3].x;
        const eyeCenter = (leftEye[0].x + rightEye[3].x) / 2;
        const headTurn = noseX - eyeCenter;
        
        return { passed: headTurn > 15, landmarks };
      }
      
      case 'smile': {
        return { passed: expressions.happy > 0.7, landmarks };
      }
      
      case 'blink': {
        // Check if eyes are closed
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        const leftEyeHeight = Math.abs(leftEye[1].y - leftEye[5].y);
        const rightEyeHeight = Math.abs(rightEye[1].y - rightEye[5].y);
        
        return { passed: leftEyeHeight < 5 && rightEyeHeight < 5, landmarks };
      }
      
      case 'nod': {
        if (!previousLandmarks) return { passed: false, landmarks };
        
        const currentNoseY = landmarks.getNose()[3].y;
        const previousNoseY = previousLandmarks.getNose()[3].y;
        
        return { passed: Math.abs(currentNoseY - previousNoseY) > 20, landmarks };
      }
      
      default:
        return { passed: false, landmarks };
    }
  }, [detectFace]);

  // Run full liveness check
  const runLivenessCheck = useCallback(async (
    video: HTMLVideoElement,
    onChallengeUpdate: (challenge: LivenessChallenge, index: number) => void
  ): Promise<LivenessResult> => {
    const challenges: LivenessChallenge[] = LIVENESS_CHALLENGES.map(c => ({
      ...c,
      completed: false,
    }));
    
    let completedCount = 0;
    let previousLandmarks: faceapi.FaceLandmarks68 | undefined;
    
    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];
      onChallengeUpdate(challenge, i);
      
      // Give user time to complete challenge
      let attempts = 0;
      const maxAttempts = 50; // ~5 seconds at 100ms intervals
      
      while (attempts < maxAttempts && !challenge.completed) {
        const result = await checkLivenessChallenge(video, challenge, previousLandmarks);
        
        if (result.passed) {
          challenge.completed = true;
          completedCount++;
          previousLandmarks = result.landmarks;
          onChallengeUpdate({ ...challenge, completed: true }, i);
          break;
        }
        
        previousLandmarks = result.landmarks;
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Small delay between challenges
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const score = (completedCount / challenges.length) * 100;
    
    return {
      passed: score >= 66, // At least 2/3 challenges passed
      score,
      challenges,
      timestamp: new Date(),
    };
  }, [checkLivenessChallenge]);

  // Compare two faces
  const compareFaces = useCallback(async (
    selfieImage: HTMLImageElement | HTMLCanvasElement,
    documentImage: HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceComparisonResult> => {
    if (!modelsLoaded) {
      await loadModels();
    }
    
    // Detect faces in both images
    const [selfieDetection, documentDetection] = await Promise.all([
      faceapi
        .detectSingleFace(selfieImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor(),
      faceapi
        .detectSingleFace(documentImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor(),
    ]);
    
    if (!selfieDetection || !documentDetection) {
      return {
        matched: false,
        distance: 1,
        similarity: 0,
        confidence: 'low',
        timestamp: new Date(),
      };
    }
    
    // Calculate Euclidean distance between face descriptors
    const distance = faceapi.euclideanDistance(
      selfieDetection.descriptor,
      documentDetection.descriptor
    );
    
    // Convert distance to similarity percentage
    // Distance of 0 = 100% match, distance of 1 = 0% match
    const similarity = Math.max(0, (1 - distance) * 100);
    
    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (distance < 0.4) {
      confidence = 'high';
    } else if (distance < 0.6) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    return {
      matched: distance < 0.6, // Threshold for match
      distance,
      similarity,
      confidence,
      timestamp: new Date(),
    };
  }, [modelsLoaded, loadModels]);

  // Capture frame from video
  const captureFrame = useCallback((video: HTMLVideoElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    
    return canvas;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    modelsLoaded,
    loading,
    error,
    loadModels,
    startCamera,
    stopCamera,
    detectFace,
    runLivenessCheck,
    compareFaces,
    captureFrame,
  };
}
