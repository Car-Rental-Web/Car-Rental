import { create } from "zustand";

interface SidebarStore {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openCategory: string | null;
  setOpenCategory: (category: string | null) => void;
}

const useSidebarStore = create<SidebarStore>((set) => ({
  isSidebarOpen: true,
  openCategory: null,

  setSidebarOpen: (open) =>
    set({ isSidebarOpen: open }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setOpenCategory: (category) =>
    set({ openCategory: category }),
}));

export default useSidebarStore;