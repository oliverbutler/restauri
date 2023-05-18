import { create } from 'zustand';

interface AppState {
  activeRequestId: number | null;
  setActiveRequestId: (id: number) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  activeRequestId: null,
  setActiveRequestId: (id) => set({ activeRequestId: id }),
}));
