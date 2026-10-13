/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { supabase } from "../utils/supabase";

interface SupabaseUser {
  id: string;
  email: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<{ error: any | null }>;
  finishLoading: () => void;
  setUser: (user: any) => void;
  getDisplayName: () => string;
  isRecoveringPassword: boolean;
  setRecoveringPassword: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  isRecoveringPassword: false,
  finishLoading: () => set({ loading: false }),
  setRecoveringPassword: (value) => set({ isRecoveringPassword: value }),

  //sign in
  signIn: async (email: string, password: string) => {
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
      user: data.user as SupabaseUser,
      loading: false,
    });
    return { data };
  },
  //signout
  signOut: async () => {
    set({ loading: true });
    try {
      // We call sign out, but we don't 'return' if it fails
      const { error } = await supabase.auth.signOut();
      if (error) console.warn("Supabase signout warning:", error.message);
    } catch (err) {
      console.error("Signout unexpected error:", err);
    } finally {
      // ALWAYS clear the local state no matter what
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      // Clear storage to be 100% sure
      localStorage.clear();
    }
    return { error: null };
  },
  //signup
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
      user: data.user as SupabaseUser,
      loading: false,
    });
    return { data };
  },

  setUser: (user: any) => {
    set({ user, isAuthenticated: true, loading: false });
  },

  getDisplayName: () => {
    const user = get().user;
    return user?.email || "User";
  },
}));
