import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeHeader } from '@/components/layout/BackofficeHeader';
import { PipelineSection } from '@/components/pipeline/PipelineSection';
import { ReportBadge, type ReportStatus } from '@/components/ui/badge';
import { formatDateLong } from '@/lib/utils';
import type { CoachMe } from '@/hooks/useAuth';

interface Report {
  report_id: number;
  coachee_id: number;
  prenom: string;
  nom: string;
  status: ReportStatus;
  created_at: string;
  error_message?: string;
}

export function ProfilePage() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [coachMe, setCoachMe] = useState<CoachMe | null>(null);

  useEffect(() => {
    fetch('/api/coach/reports', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: Report[]) => {
        setReports(data);
        setReportsLoading(false);
      })
      .catch(() => setReportsLoading(false));

    fetch('/api/coach/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: CoachMe) => setCoachMe(d));
  }, []);

  async function changePassword() {
    setPwFeedback(null);
    if (!currentPw || !newPw) {
      setPwFeedback({ msg: 'Veuillez remplir les deux champs.', ok: false });
      return;
    }
    if (newPw.length < 8) {
      setPwFeedback({ msg: 'Le nouveau mot de passe doit contenir au moins 8 caractères.', ok: false });
      return;
    }
    const res = await fetch('/api/coach/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
    });
    const d = await res.json();
    if (!res.ok) {
      setPwFeedback({ msg: d.error ?? 'Une erreur est survenue.', ok: false });
    } else {
      setPwFeedback({ msg: 'Mot de passe mis à jour avec succès.', ok: true });
      setCurrentPw('');
      setNewPw('');
    }
  }

  const totalCredits = coachMe?.allocations?.reduce((s, a) => s + a.amount, 0) ?? 0;
  const usedCredits = coachMe?.allocations?.reduce((s, a) => s + a.used, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#F6F7F9] pb-16">
      <BackofficeHeader
        title={
          <>
            Mon{' '}
            <span className="font-[Cormorant_Garamond,serif] text-[17px] font-semibold italic text-[#EA226C]">
              profil
            </span>
          </>
        }
        showBack
      />

      <div className="max-w-[860px] mx-auto mt-12 px-8 max-md:px-4 max-md:mt-6 relative z-[1]">

        {/* 1 — Mes crédits */}
        <PipelineSection title="Mes crédits" accent="teal" defaultOpen>
          {!coachMe ? (
            <p className="text-[13px] text-[#6B7580]">Chargement…</p>
          ) : !coachMe.plan ? (
            <div className="bg-[rgba(64,162,192,0.03)] border border-[rgba(64,162,192,0.25)] rounded-[14px] p-5">
              <div className="text-[13px] font-medium text-[#202C34]">Accès illimité</div>
              <p className="text-[12px] text-[#6B7580] mt-2">Ce compte n'est pas soumis aux crédits.</p>
            </div>
          ) : coachMe.allocations.length === 0 ? (
            <p className="text-[13px] text-[#6B7580]">Aucune allocation de crédits.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {coachMe.allocations.map((a) => {
                const bal = a.amount - a.used;
                const pct = a.amount > 0 ? Math.round((a.used / a.amount) * 100) : 0;
                const srcLabel: Record<string, string> = {
                  subscription: 'Abonnement',
                  promo: 'Promotion',
                  manual: 'Attribution manuelle',
                  purchase: 'Achat',
                };
                return (
                  <div key={a.id} className="bg-white border border-[#EAEDEF] rounded-[14px] p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-[13px] font-medium text-[#202C34]">
                        {srcLabel[a.source] ?? a.source}
                        {a.note ? ` — ${a.note}` : ''}
                      </span>
                      {a.valid_until ? (
                        <span className="text-[11px] text-[#6B7580] whitespace-nowrap">
                          expire le {formatDateLong(a.valid_until)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#4caf82] whitespace-nowrap">sans expiration</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="flex-1 h-1.5 bg-[#EAEDEF] rounded-full overflow-hidden">
                        <div className="h-full bg-[#40A2C0] rounded-full transition-[width] duration-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[12px] text-[#6B7580] whitespace-nowrap min-w-[120px] text-right">
                        {bal} / {a.amount} restant{bal !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="text-[12px] text-[#6B7580] mt-1">
                Total : <strong className="text-[#202C34]">{coachMe.balance}</strong> crédit{coachMe.balance !== 1 ? 's' : ''} restant{coachMe.balance !== 1 ? 's' : ''}
                {' '}sur {totalCredits} au total ({usedCredits} utilisé{usedCredits !== 1 ? 's' : ''})
              </div>
            </div>
          )}
        </PipelineSection>

        {/* 2 — Historique des rapports */}
        <PipelineSection title="Historique des rapports" accent="teal">
          {reportsLoading ? (
            <p className="text-[13px] text-[#6B7580]">Chargement…</p>
          ) : reports.length === 0 ? (
            <p className="text-[13px] text-[#6B7580]">Aucun rapport généré pour le moment.</p>
          ) : (
            <div className="bg-white border border-[#EAEDEF] rounded-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Coachée', 'Date', 'Statut', ''].map((h) => (
                      <th key={h} className="text-[9px] font-semibold tracking-[2px] uppercase text-[#6B7580] px-4 py-3 text-left border-b border-[#EAEDEF] bg-[#FAFBFC]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.report_id} className="border-b border-[#EAEDEF] last:border-b-0">
                      <td className="px-4 py-3.5 text-[13px]">
                        <Link to={`/backoffice/coachee/${r.coachee_id}`} className="text-[#202C34] no-underline font-medium hover:text-[#40A2C0]">
                          {r.prenom} {r.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#6B7580]">{formatDateLong(r.created_at)}</td>
                      <td className="px-4 py-3.5"><ReportBadge status={r.status} /></td>
                      <td className="px-4 py-3.5">
                        {r.status === 'done' ? (
                          <a
                            href={`/api/coachee/${r.coachee_id}/report/download`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#4caf82] bg-[rgba(76,175,130,0.08)] border border-[rgba(76,175,130,0.3)] rounded-full no-underline hover:bg-[rgba(76,175,130,0.18)]"
                          >
                            <img src="/img/word.svg" width="16" height="16" alt="" />
                            Rapport
                          </a>
                        ) : r.status === 'error' && r.error_message ? (
                          <span className="text-[11px] text-[#EA226C]" title={r.error_message}>
                            ⚠ détail
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PipelineSection>

        {/* 3 — Changer le mot de passe */}
        <PipelineSection title="Changer le mot de passe" accent="teal">
          <div className="grid grid-cols-2 gap-5 max-w-[480px] max-md:grid-cols-1">
            <FieldGroup label="Mot de passe actuel">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Votre mot de passe actuel"
                autoComplete="current-password"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Nouveau mot de passe">
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                className={inputCls}
              />
            </FieldGroup>
          </div>
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={changePassword}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-transparent text-[#40A2C0]
                         border-[1.5px] border-[#40A2C0] rounded-full text-[11px] font-semibold tracking-[1.5px] uppercase
                         cursor-pointer transition-all min-h-12 hover:bg-[rgba(64,162,192,0.08)] hover:-translate-y-0.5"
            >
              Mettre à jour
            </button>
            {pwFeedback && (
              <span className={`text-[12px] font-medium ${pwFeedback.ok ? 'text-[#4caf82]' : 'text-[#EA226C]'}`}>
                {pwFeedback.msg}
              </span>
            )}
          </div>
        </PipelineSection>

      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-white border border-[#EAEDEF] rounded-xl px-3.5 py-2.5 text-[13px] text-[#202C34] outline-none transition-all placeholder:text-[#BFC5CC] focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]';
