import { create } from "zustand";
import { supabase } from "../utils/supabase";

interface AuthStore {
  isAuthenticated: boolean;
  user: unknown | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  logout: () => Promise<{ error: any | null }>;
  finishLoading: () => void;
  setUser: (user: any) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  finishLoading: () => set({ loading: false }),

  login: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      return { error };
    }

    set({
      isAuthenticated: true,
      user: data.user,
      loading: false,
    });
    return { data };
  },

  logout: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ loading: false });
      return { error };
    }
    set({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
    return { error: null };
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      set({ loading: false });
      return { error };
    }

    set({
      isAuthenticated: true,
      user: data.user,
      loading: false,
    });
    return { data };
  },
  setUser: (user: any) => {
    set({ user, isAuthenticated: true, loading: false });
  },
}));
