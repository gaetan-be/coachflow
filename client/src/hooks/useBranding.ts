import { useState, useEffect, createContext, useContext } from 'react';

export interface Branding {
  brand_name: string;
  logo_letter: string;
  accent_color: string;
}

const DEFAULT_BRANDING: Branding = {
  brand_name: 'BRENSO',
  logo_letter: 'B',
  accent_color: '#40A2C0',
};

export const BrandingContext = createContext<Branding>(DEFAULT_BRANDING);

export function useBranding(): Branding {
  return useContext(BrandingContext);
}

export function useBrandingState(): Branding {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/branding', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBranding(data as Branding);
      })
      .catch(() => { /* fall back to defaults */ });
  }, []);

  return branding;
}
