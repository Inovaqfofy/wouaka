import { useEffect, useRef, useCallback } from 'react';

export interface BehavioralSignals {
  sessionStartTime: number;
  formStartTime: number | null;
  formCompletionTime: number | null;
  keystrokeCount: number;
  copyPasteCount: number;
  backspaceCount: number;
  focusChanges: number;
  hesitationPatterns: number; // Long pauses between actions
  timezone: string;
  language: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
}

export interface BehavioralRiskAssessment {
  score: number; // 0-100, higher = more suspicious
  flags: string[];
  details: Record<string, number>;
}

const INITIAL_SIGNALS: BehavioralSignals = {
  sessionStartTime: Date.now(),
  formStartTime: null,
  formCompletionTime: null,
  keystrokeCount: 0,
  copyPasteCount: 0,
  backspaceCount: 0,
  focusChanges: 0,
  hesitationPatterns: 0,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  deviceType: 'desktop',
  connectionType: 'unknown',
};

export function useBehavioralSignals() {
  const signalsRef = useRef<BehavioralSignals>({ ...INITIAL_SIGNALS });
  const lastActivityRef = useRef<number>(Date.now());

  // Detect device type
  useEffect(() => {
    const width = window.innerWidth;
    if (width < 768) {
      signalsRef.current.deviceType = 'mobile';
    } else if (width < 1024) {
      signalsRef.current.deviceType = 'tablet';
    } else {
      signalsRef.current.deviceType = 'desktop';
    }

    // Try to get connection type
    const connection = (navigator as any).connection;
    if (connection) {
      signalsRef.current.connectionType = connection.effectiveType || 'unknown';
    }
  }, []);

  // Track keystrokes
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Detect hesitation (pause > 5 seconds)
    if (timeSinceLastActivity > 5000) {
      signalsRef.current.hesitationPatterns++;
    }
    
    lastActivityRef.current = now;
    signalsRef.current.keystrokeCount++;
    
    if (e.key === 'Backspace') {
      signalsRef.current.backspaceCount++;
    }
  }, []);

  // Track copy/paste
  const handlePaste = useCallback(() => {
    signalsRef.current.copyPasteCount++;
  }, []);

  // Track focus changes
  const handleFocusChange = useCallback(() => {
    signalsRef.current.focusChanges++;
  }, []);

  // Start form tracking
  const startFormTracking = useCallback(() => {
    signalsRef.current.formStartTime = Date.now();
  }, []);

  // End form tracking
  const endFormTracking = useCallback(() => {
    if (signalsRef.current.formStartTime) {
      signalsRef.current.formCompletionTime = Date.now() - signalsRef.current.formStartTime;
    }
  }, []);

  // Attach listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('focusin', handleFocusChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [handleKeyDown, handlePaste, handleFocusChange]);

  // Calculate risk assessment
  const assessRisk = useCallback((): BehavioralRiskAssessment => {
    const signals = signalsRef.current;
    const flags: string[] = [];
    let riskScore = 0;
    const details: Record<string, number> = {};

    // Check form completion time (too fast = suspicious)
    if (signals.formCompletionTime) {
      const minutes = signals.formCompletionTime / 60000;
      details.formCompletionMinutes = Math.round(minutes * 10) / 10;
      
      if (minutes < 1) {
        riskScore += 30;
        flags.push('Formulaire rempli trop rapidement');
      } else if (minutes < 2) {
        riskScore += 15;
        flags.push('Remplissage rapide');
      }
    }

    // Check copy/paste ratio
    if (signals.keystrokeCount > 0) {
      const copyPasteRatio = signals.copyPasteCount / signals.keystrokeCount;
      details.copyPasteRatio = Math.round(copyPasteRatio * 100);
      
      if (copyPasteRatio > 0.3) {
        riskScore += 25;
        flags.push('Beaucoup de copier/coller détecté');
      }
    }

    // Check hesitation patterns
    details.hesitationCount = signals.hesitationPatterns;
    if (signals.hesitationPatterns > 10) {
      riskScore += 10;
      flags.push('Nombreuses hésitations');
    }

    // Check backspace ratio (lots of corrections = potential fraud)
    if (signals.keystrokeCount > 0) {
      const backspaceRatio = signals.backspaceCount / signals.keystrokeCount;
      details.backspaceRatio = Math.round(backspaceRatio * 100);
      
      if (backspaceRatio > 0.25) {
        riskScore += 15;
        flags.push('Nombreuses corrections');
      }
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    return {
      score: riskScore,
      flags,
      details,
    };
  }, []);

  // Get current signals
  const getSignals = useCallback((): BehavioralSignals => {
    return { ...signalsRef.current };
  }, []);

  return {
    startFormTracking,
    endFormTracking,
    assessRisk,
    getSignals,
  };
}
