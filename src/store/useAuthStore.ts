/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { supabase } from "../utils/supabase";
import { signInToAll, signOutAll } from "../auth/authall";

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
    password: string,
  ) => Promise<{ data?: any; error?: any }>;
  signIn: (
    email: string,
    password: string,
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

  // sign in: rental is the main login, then laundry and water use the same credentials
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await signInToAll(email, password);

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

  // sign out of all three projects
  signOut: async () => {
    set({ loading: true });
    try {
      await signOutAll();
    } catch (err) {
      console.error("Signout unexpected error:", err);
    } finally {
      // ALWAYS clear the local state no matter what
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      // Also clears the saved laundry and water sessions
      localStorage.clear();
    }
    return { error: null };
  },

  // sign up (rental only)
  signUp: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/overview`,
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