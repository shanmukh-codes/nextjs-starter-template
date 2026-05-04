/**
 * Global Zustand store.
 *
 * Keep only truly global UI state here (theme, sidebar, toasts, auth user).
 * Feature-specific state belongs in the feature's own store or React Query cache.
 *
 * Usage:
 *   import { useAppStore } from "@/store";
 *   const { theme, setTheme } = useAppStore();
 */

import { create } from "zustand";

interface AppStore {
  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
