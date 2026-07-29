'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'RECRUITER'
  | 'REVIEWER'
  | 'CANDIDATE';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  companyId?: string;
  companyName?: string;
  locale: string;
}

interface PersistedAuthData {
  user: Pick<AuthUser, 'id' | 'role' | 'locale'> | null;
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
  validateSession: (force?: boolean) => Promise<void>;
}

const SESSION_VALIDATION_INTERVAL = 5 * 60 * 1000;
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
          isAuthenticated: Boolean(user),
          isLoading: false,
          lastValidated: user ? Date.now() : null,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          lastValidated: null,
        });

        if (typeof window !== 'undefined') {
          void import('next-auth/react').then(({ signOut }) =>
            signOut({ callbackUrl: '/auth/login' }),
          );
        }
      },
      isAppAdmin: () => {
        const role = get().user?.role;
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MODERATOR';
      },
      isCompanyMember: () => {
        const role = get().user?.role;
        return (
          role === 'COMPANY_ADMIN' ||
          role === 'HR_MANAGER' ||
          role === 'RECRUITER' ||
          role === 'REVIEWER'
        );
      },
      isCandidate: () => get().user?.role === 'CANDIDATE',
      validateSession: async (force = false) => {
        const { lastValidated, user } = get();

        if (lastValidated && Date.now() - lastValidated > SESSION_EXPIRY_MS) {
          get().logout();
          return;
        }

        const hasCompleteUser = Boolean(user?.name && user?.email);
        if (
          !force &&
          hasCompleteUser &&
          lastValidated &&
          Date.now() - lastValidated < SESSION_VALIDATION_INTERVAL
        ) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch('/api/auth/session', {
            cache: 'no-store',
            credentials: 'same-origin',
          });

          if (!response.ok) {
            get().logout();
            return;
          }

          const session = (await response.json()) as {
            error?: string;
            user?: {
              id?: string;
              email?: string | null;
              name?: string | null;
              role?: UserRole;
              image?: string | null;
              companyId?: string | null;
              companyName?: string | null;
              locale?: string | null;
            };
          };

          if (session.error === 'UserDeactivated' || !session.user?.id || !session.user.role) {
            get().logout();
            return;
          }

          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.name || '',
              role: session.user.role,
              image: session.user.image || undefined,
              companyId: session.user.companyId || undefined,
              companyName: session.user.companyName || undefined,
              locale: session.user.locale || 'en',
            },
            isAuthenticated: true,
            isLoading: false,
            lastValidated: Date.now(),
          });
        } catch {
          // Preserve the current session during temporary network failures.
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'talentflow-auth',
      partialize: (state): PersistedAuthData => ({
        user: state.user
          ? {
              id: state.user.id,
              role: state.user.role,
              locale: state.user.locale,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedData, currentState) => {
        const persisted = persistedData as Partial<PersistedAuthData> | null;
        if (!persisted?.user) {
          return {
            ...currentState,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          };
        }

        return {
          ...currentState,
          user: {
            id: persisted.user.id,
            email: '',
            name: '',
            role: persisted.user.role,
            locale: persisted.user.locale,
          },
          isAuthenticated: persisted.isAuthenticated ?? true,
          isLoading: true,
          lastValidated: null,
        };
      },
    },
  ),
);
