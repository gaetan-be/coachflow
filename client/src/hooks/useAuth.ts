import { useState, useEffect, createContext, useContext } from 'react';
import i18n from '@/i18n';

export interface CoachMe {
  name: string;
  email: string;
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
  refetch: () => void;
}

export const AuthContext = createContext<AuthState>({
  coach: null,
  loading: true,
  refetch: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthState(): AuthState {
  const [coach, setCoach] = useState<CoachMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/coach/me', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) {
          setCoach(null);
          setLoading(false);
          return;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          const me = data as CoachMe;
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
            // No localStorage override — apply the server preference
            i18n.changeLanguage(me.language);
          }
          setCoach(me);
        }
        setLoading(false);
      })
      .catch(() => {
        setCoach(null);
        setLoading(false);
      });
  }, [tick]);

  return {
    coach,
    loading,
    refetch: () => setTick((t) => t + 1),
  };
}
