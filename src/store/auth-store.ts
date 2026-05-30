'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'COMPANY_ADMIN' | 'HR_MANAGER' | 'RECRUITER' | 'REVIEWER' | 'CANDIDATE';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  companyId?: string;
  companyName?: string;
  locale: string;
}

// Minimal data persisted to localStorage (XSS risk reduction)
interface PersistedAuthData {
  user: {
    id: string;
    role: UserRole;
    locale: string;
  } | null;
  isAuthenticated: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastValidated: number | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isAppAdmin: () => boolean;
  isCompanyMember: () => boolean;
  isCandidate: () => boolean;
  validateSession: () => Promise<void>;
}

// Session validation interval: 5 minutes
const SESSION_VALIDATION_INTERVAL = 5 * 60 * 1000;
// Session expiry: 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      lastValidated: null,
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          lastValidated: Date.now(),
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false, lastValidated: null });
        if (typeof window !== 'undefined') {
          fetch('/api/auth/signout', { method: 'POST' });
        }
      },
      isAppAdmin: () => {
        const role = get().user?.role;
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MODERATOR';
      },
      isCompanyMember: () => {
        const role = get().user?.role;
        return role === 'COMPANY_ADMIN' || role === 'HR_MANAGER' || role === 'RECRUITER' || role === 'REVIEWER';
      },
      isCandidate: () => {
        return get().user?.role === 'CANDIDATE';
      },
      validateSession: async () => {
        const { lastValidated, isAuthenticated } = get();

        // Check session expiry
        if (lastValidated && Date.now() - lastValidated > SESSION_EXPIRY_MS) {
          get().logout();
          return;
        }

        // Only validate periodically
        if (lastValidated && Date.now() - lastValidated < SESSION_VALIDATION_INTERVAL) {
          return;
        }

        try {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const session = await response.json();
            if (session?.user) {
              // Check for deactivation error
              if (session.error === 'UserDeactivated') {
                get().logout();
                return;
              }
              set({
                isAuthenticated: true,
                lastValidated: Date.now(),
              });
            } else {
              get().logout();
            }
          } else {
            get().logout();
          }
        } catch {
          // Network error - don't logout, just skip validation
          console.warn('Session validation failed - network error');
        }
      },
    }),
    {
      name: 'talentflow-auth',
      partialize: (state): PersistedAuthData => ({
        user: state.user ? {
          id: state.user.id,
          role: state.user.role,
          locale: state.user.locale,
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedData, currentState) => {
        const persisted = persistedData as Partial<PersistedAuthData> | null;
        if (!persisted?.user) {
          return { ...currentState, user: null, isAuthenticated: false };
        }
        // Restore minimal data - full user object will be fetched on session validation
        return {
          ...currentState,
          user: {
            id: persisted.user.id,
            email: '',
            name: '',
            role: persisted.user.role,
            locale: persisted.user.locale,
          },
          isAuthenticated: persisted.isAuthenticated ?? false,
        };
      },
    }
  )
);
