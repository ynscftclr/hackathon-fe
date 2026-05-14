import { create } from 'zustand';
import { ApiService } from '@/services/api';
import { useCardStore } from './useCardStore';

interface AiAnalysisResult {
  suggestedTitle: string;
  suggestedDescription: string;
  recommendedAssigneeId: string;
}

interface AiState {
  isGrouping: boolean;
  isAnalyzing: boolean;
  analysisResult: AiAnalysisResult | null;
  
  autoGroup: () => Promise<void>;
  analyzeCard: (cardId: string, content: string, audioUrl?: string) => Promise<void>;
  clearAnalysis: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  isGrouping: false,
  isAnalyzing: false,
  analysisResult: null,

  autoGroup: async () => {
    set({ isGrouping: true });
    try {
      const currentCards = useCardStore.getState().cards;
      const groupedCards = await ApiService.autoGroupCards(currentCards);
      // Update global card store with new groups
      useCardStore.setState({ cards: groupedCards });
    } catch (error) {
      console.error('Auto group failed', error);
    } finally {
      set({ isGrouping: false });
    }
  },

  analyzeCard: async (cardId, content, audioUrl) => {
    set({ isAnalyzing: true, analysisResult: null });
    try {
      const result = await ApiService.analyzeTask(cardId, content, audioUrl);
      set({ analysisResult: result });
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  clearAnalysis: () => set({ analysisResult: null }),
}));
