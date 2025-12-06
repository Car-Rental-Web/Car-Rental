import { create } from "zustand";

interface AuthStore {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  signUp: () => void;
  login: (user: any) => void;
  logout: () => void;  
  finishLoading: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  signUp: () => set({isAuthenticated:true, loading:false}),
  login: (user) => set({ isAuthenticated: true, user, loading: false }),
  logout: () => set({ isAuthenticated: false, user: null, loading: false }),
  finishLoading: () => set({ loading: false }),
}));
