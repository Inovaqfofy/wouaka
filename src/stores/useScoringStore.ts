import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScoringResult, ScoringInputData } from '@/lib/scoring-types';

interface ScoringHistoryItem {
  id: string;
  input: ScoringInputData;
  result: ScoringResult;
  timestamp: string;
}

interface ScoringState {
  // Current scoring session
  currentInput: Partial<ScoringInputData> | null;
  currentResult: ScoringResult | null;
  isCalculating: boolean;
  
  // History cache
  history: ScoringHistoryItem[];
  
  // Actions
  setCurrentInput: (input: Partial<ScoringInputData> | null) => void;
  updateCurrentInput: (partial: Partial<ScoringInputData>) => void;
  setCurrentResult: (result: ScoringResult | null) => void;
  setCalculating: (calculating: boolean) => void;
  addToHistory: (item: ScoringHistoryItem) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const useScoringStore = create<ScoringState>()(
  persist(
    (set, get) => ({
      currentInput: null,
      currentResult: null,
      isCalculating: false,
      history: [],
      
      setCurrentInput: (currentInput) => set({ currentInput }),
      
      updateCurrentInput: (partial) => {
        const { currentInput } = get();
        set({ currentInput: { ...currentInput, ...partial } });
      },
      
      setCurrentResult: (currentResult) => set({ currentResult }),
      
      setCalculating: (isCalculating) => set({ isCalculating }),
      
      addToHistory: (item) => {
        const { history } = get();
        // Keep last 50 items
        const newHistory = [item, ...history].slice(0, 50);
        set({ history: newHistory });
      },
      
      clearHistory: () => set({ history: [] }),
      
      reset: () => set({ 
        currentInput: null, 
        currentResult: null, 
        isCalculating: false 
      }),
    }),
    {
      name: 'scoring-storage',
      partialize: (state) => ({ 
        history: state.history,
        currentInput: state.currentInput
      }),
    }
  )
);
