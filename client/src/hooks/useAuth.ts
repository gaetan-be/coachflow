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
          setCoach(me);
          // Coach preference wins over the public-side localStorage value
          if (me.language && i18n.resolvedLanguage !== me.language) {
            i18n.changeLanguage(me.language);
          }
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
