import {create} from 'zustand'

interface AuthStore {
    isAuthenticated: boolean;
    user: any | null;
    loading:boolean;
    login: (user:any) => void;
    logout: () => void;
    finishLoading: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated:false,
    user:null,
    loading:true,
    login: (user) => set({ isAuthenticated: true, user, loading: false}),
    logout: () => set({isAuthenticated: false, user: null, loading: false}),
    finishLoading: () => set({loading: false}),
}));
