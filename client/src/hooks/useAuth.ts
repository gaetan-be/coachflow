import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import i18n from '@/i18n';

export interface CoachMe {
  name: string;
  email: string;
  telephone: string | null;
  website: string | null;
  language: 'fr' | 'nl';
  plan: string | null;
  plan_display_name: string | null;
  features: Record<string, boolean>;
  balance: number;
  allocations: Array<{
    id: number;
    source: string;
    note: string | null;
    amount: number;
    used: number;
    valid_until: string | null;
  }>;
}

interface AuthState {
  coach: CoachMe | null;
  loading: boolean;
  refetch: () => Promise<CoachMe | null>;
}

export const AuthContext = createContext<AuthState>({
  coach: null,
  loading: true,
  refetch: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthState(): AuthState {
  const [coach, setCoach] = useState<CoachMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (): Promise<CoachMe | null> => {
    setLoading(true);
    try {
      const r = await fetch('/api/coach/me', { credentials: 'include' });
      if (!r.ok) {
        setCoach(null);
        return null;
      }
      const me = (await r.json()) as CoachMe;

      // The user's most recent localStorage choice wins: if it differs from the
      // coach's stored language, push it to the server so the profile reflects
      // the language they're actually using right now.
      const stored = localStorage.getItem('brenso_lang');
      if ((stored === 'fr' || stored === 'nl') && stored !== me.language) {
        fetch('/api/coach/profile', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: stored }),
        }).catch(() => { /* best-effort */ });
        me.language = stored;
      } else if (me.language && i18n.resolvedLanguage !== me.language) {
        i18n.changeLanguage(me.language);
      }

      setCoach(me);
      return me;
    } catch {
      setCoach(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { coach, loading, refetch };
}
