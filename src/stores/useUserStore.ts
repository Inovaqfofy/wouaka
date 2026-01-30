import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  is_active?: boolean;
}

type AppRole = 'SUPER_ADMIN' | 'PARTENAIRE' | 'EMPRUNTEUR' | 'ANALYSTE' | 'ENTREPRISE' | 'API_CLIENT';

interface UserState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRole: (role: AppRole | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: true,
      
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, session: null, profile: null, role: null, isLoading: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        profile: state.profile,
        role: state.role 
      }),
    }
  )
);
