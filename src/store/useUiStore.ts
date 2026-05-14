import { create } from 'zustand';

interface UiState {
  isActionDrawerOpen: boolean;
  selectedCardId: string | null;
  
  setActionDrawerOpen: (isOpen: boolean) => void;
  setSelectedCardId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isActionDrawerOpen: false,
  selectedCardId: null,
  
  setActionDrawerOpen: (isOpen) => set({ isActionDrawerOpen: isOpen }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
}));
