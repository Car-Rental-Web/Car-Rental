import { create } from "zustand";

interface SidebarStore {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const useSidebarStore = create<SidebarStore>((set) => ({
  isSidebarOpen: true,

  setSidebarOpen: (open) =>
    set({ isSidebarOpen: open }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

export default useSidebarStore;
