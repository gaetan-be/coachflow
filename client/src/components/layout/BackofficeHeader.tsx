import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BackofficeHeaderProps {
  /** Center title content */
  title: React.ReactNode;
  /** Optional save status text shown left of back button */
  saveStatus?: string;
  /** Show back-to-list link */
  showBack?: boolean;
}

export function BackofficeHeader({ title, saveStatus, showBack }: BackofficeHeaderProps) {
  const { t } = useTranslation();
  const { coach } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const initial = coach?.name ? coach.name.charAt(0).toUpperCase() : 'B';

  const totalCredits = coach?.allocations?.reduce((s, a) => s + a.amount, 0) ?? 0;
  const usedCredits = coach?.allocations?.reduce((s, a) => s + a.used, 0) ?? 0;
  const creditPct = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    navigate('/coach');
  }

  return (
    <div className="sticky top-0 z-[100] bg-white/92 backdrop-blur-[16px] border-b border-[#EAEDEF] shadow-[0_1px_8px_rgba(32,44,52,0.04)]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-12 py-5 max-md:px-5 max-md:grid-cols-[1fr_auto]">
        {/* Logo */}
        <Link to="/backoffice" className="flex items-center gap-2.5 justify-self-start no-underline">
          <div
            className="w-[34px] h-[34px] rounded-full border-2 border-[#40A2C0] bg-[rgba(64,162,192,0.12)]
                       shadow-[0_0_14px_rgba(64,162,192,0.30)] flex items-center justify-center
                       font-[Cormorant_Garamond,serif] text-base font-semibold text-[#40A2C0] flex-shrink-0"
          >
            B
          </div>
          <span className="font-[Cormorant_Garamond,serif] text-lg text-[#202C34] tracking-tight">
            BRENSO
          </span>
        </Link>

        {/* Center title */}
        <div className="justify-self-center text-[14px] text-[#6B7580] whitespace-nowrap flex items-center gap-1.5 max-md:text-xs max-md:justify-self-end">
          {title}
        </div>

        {/* Right group */}
        <div className="justify-self-end flex items-center gap-3.5 whitespace-nowrap">
          {saveStatus && (
            <span className={cn('text-[11px] tracking-[0.3px]', saveStatus ? 'text-[#4caf82]' : 'text-[#6B7580]')}>
              {saveStatus}
            </span>
          )}

          {showBack && (
            <Link
              to="/backoffice"
              className="text-xs font-medium text-[#40A2C0] no-underline px-3.5 py-1.5
                         border border-[rgba(64,162,192,0.25)] rounded-full transition-all
                         hover:bg-[rgba(64,162,192,0.06)] hover:border-[#40A2C0] inline-flex items-center"
            >
              {t('backofficeHeader.backToList')}
            </Link>
          )}

          {/* Profile avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={t('backofficeHeader.ariaProfile')}
              className="w-[34px] h-[34px] rounded-full border-2 border-[#40A2C0] bg-[rgba(64,162,192,0.12)]
                         shadow-[0_0_14px_rgba(64,162,192,0.30)] flex items-center justify-center
                         font-[Cormorant_Garamond,serif] text-base font-semibold text-[#40A2C0]
                         cursor-pointer transition-all hover:bg-[rgba(64,162,192,0.22)] hover:shadow-[0_0_20px_rgba(64,162,192,0.45)]"
            >
              {initial}
            </button>

            {open && (
              <div
                className="absolute top-[calc(100%+10px)] right-0 min-w-[220px] bg-white
                           border border-[#EAEDEF] rounded-[14px] shadow-[0_8px_32px_rgba(32,44,52,0.10)]
                           py-3.5 z-[200] animate-fade-up"
              >
                {/* Name + plan */}
                <div className="flex items-center justify-between gap-2 px-4 pb-2.5">
                  <span className="text-[13px] font-medium text-[#202C34] truncate">
                    {coach?.name ?? '…'}
                  </span>
                  {coach?.plan_display_name && (
                    <span className="text-[9px] font-bold tracking-[1px] uppercase text-[#40A2C0] bg-[rgba(64,162,192,0.08)] border border-[rgba(64,162,192,0.25)] rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      {coach.plan_display_name}
                    </span>
                  )}
                </div>

                {/* Credits bar */}
                {coach?.plan && (
                  <div className="flex items-center gap-2.5 px-4 pb-2.5">
                    <div className="flex-1 h-[5px] bg-[#EAEDEF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#40A2C0] rounded-full transition-[width] duration-400 min-w-[2px]"
                        style={{ width: `${creditPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B7580] whitespace-nowrap flex-shrink-0">
                      {t('backofficeHeader.creditsRemaining', { count: coach.balance })}
                    </span>
                  </div>
                )}

                <div className="border-t border-[#EAEDEF] my-1" />

                <Link
                  to="/backoffice/profile"
                  className="block w-full px-4 py-2 text-[13px] text-[#202C34] no-underline
                             hover:bg-[rgba(64,162,192,0.06)] hover:text-[#40A2C0] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {t('backofficeHeader.myProfile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-[13px] text-[#6B7580] text-left bg-none border-none
                             cursor-pointer hover:bg-[rgba(234,34,108,0.04)] hover:text-[#EA226C] transition-colors"
                >
                  {t('backofficeHeader.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
