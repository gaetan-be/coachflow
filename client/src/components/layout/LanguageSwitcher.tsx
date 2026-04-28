import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n';

interface LanguageSwitcherProps {
  /** "coach" persists the choice to the backend; "public" only changes UI locally. */
  mode?: 'public' | 'coach';
  className?: string;
}

export function LanguageSwitcher({ mode = 'public', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const { refetch } = useAuth();
  const current = (SUPPORTED_LANGS as readonly string[]).includes(i18n.resolvedLanguage ?? '')
    ? (i18n.resolvedLanguage as AppLang)
    : 'fr';

  async function pick(lang: AppLang) {
    if (lang === current) return;
    await i18n.changeLanguage(lang);
    if (mode === 'coach') {
      try {
        await fetch('/api/coach/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ language: lang }),
        });
        refetch();
      } catch {
        // best-effort; UI already switched
      }
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center bg-white border border-[#EAEDEF] rounded-full p-0.5 text-[11px] font-semibold tracking-[1px] uppercase',
        className,
      )}
    >
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => pick(lang)}
          aria-pressed={current === lang}
          className={cn(
            'px-3 py-1.5 rounded-full transition-colors min-h-7 cursor-pointer',
            current === lang
              ? 'bg-[#202C34] text-white'
              : 'bg-transparent text-[#6B7580] hover:text-[#202C34]',
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
