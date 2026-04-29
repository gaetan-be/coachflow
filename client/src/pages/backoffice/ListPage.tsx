import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackofficeHeader } from '@/components/layout/BackofficeHeader';
import { PipelineSection } from '@/components/pipeline/PipelineSection';
import { ReportBadge, type ReportStatus } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

interface Coachee {
  id: number;
  prenom: string;
  nom: string;
  created_at: string;
  report_status: ReportStatus;
  profile_type: 'young' | 'adult';
}

export function ListPage() {
  const { t } = useTranslation();
  const [coachees, setCoachees] = useState<Coachee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/coachees', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data: Coachee[]) => {
        setCoachees(data);
        setLoading(false);
      })
      .catch(() => {
        setError(t('list.errorLoad'));
        setLoading(false);
      });
  }, [t]);

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <BackofficeHeader
        title={
          <>
            {t('list.title1')}{' '}
            <span className="font-[Cormorant_Garamond,serif] text-[17px] font-semibold italic text-[#EA226C]">
              {t('list.title2')}
            </span>
          </>
        }
      />

      <div className="max-w-[900px] mx-auto mt-12 px-8 pb-16 relative z-[1] max-md:px-4 max-md:mt-6">
        <LinkCreator />

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#40A2C0] border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-[14px] text-[#EA226C]">{error}</div>
        )}

        {!loading && !error && coachees.length === 0 && (
          <div className="text-center py-16 text-[14px] text-[#6B7580] leading-relaxed">
            {t('list.empty1')}<br />
            {t('list.empty2')}
          </div>
        )}

        {!loading && !error && coachees.length > 0 && (
          <div className="bg-white border border-[#EAEDEF] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(32,44,52,0.04)]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[t('list.colName'), t('list.colProfileType'), t('list.colSubmittedAt'), t('list.colReportStatus'), ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-[9px] font-semibold tracking-[2px] uppercase text-[#6B7580]
                                 px-4 py-3 text-left border-b border-[#EAEDEF] bg-[#FAFBFC]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coachees.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => (window.location.href = `/backoffice/coachee/${c.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[rgba(64,162,192,0.03)] border-b border-[#EAEDEF] last:border-b-0"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-medium text-[#202C34]">
                      {c.prenom} {c.nom}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7580]">
                      {c.profile_type === 'adult' ? t('list.profileTypeAdult') : t('list.profileTypeYoung')}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7580]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ReportBadge status={c.report_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {c.report_status === 'done' && (
                        <a
                          href={`/api/coachee/${c.id}/report/download`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium
                                     text-[#4caf82] bg-[rgba(76,175,130,0.08)] border border-[rgba(76,175,130,0.3)]
                                     rounded-full no-underline transition-all
                                     hover:bg-[rgba(76,175,130,0.18)] hover:border-[#4caf82] hover:-translate-y-px"
                        >
                          <img src="/img/word.svg" width="16" height="16" alt="" />
                          {t('list.report')}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkCreator() {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<'fr' | 'nl'>(
    i18n.language.startsWith('nl') ? 'nl' : 'fr'
  );
  const [profileType, setProfileType] = useState<'young' | 'adult'>('young');
  const [copied, setCopied] = useState(false);

  const path = `/${lang}/hello/${profileType === 'adult' ? 'pro' : 'student'}`;
  const url = `${window.location.origin}${path}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const pillBase = 'px-3.5 py-1.5 text-[12px] font-medium rounded-full border transition-all';
  const pillActive = 'bg-[#EA226C] text-white border-[#EA226C]';
  const pillIdle = 'bg-white text-[#6B7580] border-[#EAEDEF] hover:border-[rgba(234,34,108,0.4)] hover:text-[#EA226C]';

  return (
    <PipelineSection accent="pink" title={t('list.linkCreatorTitle')}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-[#6B7580] shrink-0">{t('list.linkLang')}</span>
          <div className="flex gap-1.5">
            {(['fr', 'nl'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)}
                className={cn(pillBase, lang === l ? pillActive : pillIdle)}>
                {l === 'fr' ? t('list.linkLangFr') : t('list.linkLangNl')}
              </button>
            ))}
          </div>

          <span className="text-[#EAEDEF] mx-2">|</span>

          <span className="text-[12px] font-medium text-[#6B7580] shrink-0">{t('list.linkType')}</span>
          <div className="flex gap-1.5">
            {(['young', 'adult'] as const).map((tp) => (
              <button key={tp} type="button" onClick={() => setProfileType(tp)}
                className={cn(pillBase, profileType === tp ? pillActive : pillIdle)}>
                {tp === 'young' ? t('list.profileTypeYoung') : t('list.profileTypeAdult')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex-1 px-4 py-2 bg-[#F6F7F9] border border-[#EAEDEF] rounded-xl text-[13px] font-mono text-[#202C34] select-all truncate min-w-0">
            {url}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all shrink-0',
              copied
                ? 'bg-[rgba(76,175,130,0.10)] text-[#4caf82] border-[rgba(76,175,130,0.40)]'
                : 'bg-[rgba(234,34,108,0.08)] text-[#EA226C] border-[rgba(234,34,108,0.30)] hover:bg-[rgba(234,34,108,0.15)]'
            )}
          >
            {copied ? t('list.linkCopied') : t('list.linkCopy')}
          </button>
        </div>
      </div>
    </PipelineSection>
  );
}
