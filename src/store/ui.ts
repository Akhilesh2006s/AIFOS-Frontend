import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  locale: 'IN' | 'GLOBAL';
  toggleSidebar: () => void;
  setLocale: (locale: 'IN' | 'GLOBAL') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      locale: 'IN',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'afios-ui' },
  ),
);
