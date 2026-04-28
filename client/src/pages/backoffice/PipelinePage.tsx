import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackofficeHeader } from '@/components/layout/BackofficeHeader';
import { PipelineSection } from '@/components/pipeline/PipelineSection';
import { WordDial } from '@/components/pipeline/WordDial';
import { TagInput } from '@/components/pipeline/TagInput';
import { MetierBlocks } from '@/components/pipeline/MetierBlocks';
import { ReportBadge, type ReportStatus } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PipelineData, Metier } from '@/components/pipeline/types';

const ENNEA_VALS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const RIASEC_VALS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
const MBTI_GROUPS = [
  { group: 'ei', headKey: 'enums.mbti.groupEi', options: ['E', 'I'] as const },
  { group: 'sn', headKey: 'enums.mbti.groupSn', options: ['S', 'N'] as const },
  { group: 'tf', headKey: 'enums.mbti.groupTf', options: ['T', 'F'] as const },
  { group: 'jp', headKey: 'enums.mbti.groupJp', options: ['J', 'P'] as const },
];
const ENNEA_SUBTYPES = ['Social', 'Survie', 'Tete-a-tete'] as const;

const DEFAULT_DATA: PipelineData = {
  profile_type: 'young',
  prenom: '', nom: '', date_naissance: '', ecole_nom: '', code_postal: '',
  date_seance: '', choix: '', loisirs: '',
  entreprise: null, role: null, situation: null,
  ennea_base: null, ennea_sous_type: null, mbti: null, riasec: null,
  words_ennea: 250, words_mbti: 250, words_riasec: 200,
  valeurs: null, competences: null, besoins: null, words_comp_besoins: 250,
  metiers: null, words_metiers: 250,
  plan_action: '', words_plan_action: 200, notes_coach: '',
};

const SITUATION_KEYS = ['questionnement', 'burnout', 'reorientation', 'indecis'] as const;

export function PipelinePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PipelineData>(DEFAULT_DATA);
  const [reportStatus, setReportStatus] = useState<ReportStatus>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [foldSignal, setFoldSignal] = useState(0);

  function toggleAll() {
    setAllOpen((o) => !o);
    setFoldSignal((s) => s + 1);
  }

  // Derived local state for multi-select pickers
  const [enneaOrder, setEnneaOrder] = useState<string[]>([]);
  const [riasecOrder, setRiasecOrder] = useState<string[]>([]);
  const [mbtiSel, setMbtiSel] = useState<Record<string, string>>({ ei: '', sn: '', tf: '', jp: '' });
  const [valeurs, setValeurs] = useState<string[]>([]);
  const [competences, setCompetences] = useState<string[]>([]);
  const [besoins, setBesoins] = useState<string[]>([]);
  const [metiers, setMetiers] = useState<Metier[]>([]);

  function setField<K extends keyof PipelineData>(key: K, value: PipelineData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  useEffect(() => {
    if (!id) return;
    fetch(`/api/coachee/${id}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((d: PipelineData & { report_status?: string }) => {
        setData(d);
        setReportStatus((d.report_status as ReportStatus) ?? null);

        if (d.ennea_base) setEnneaOrder(String(d.ennea_base).split(',').filter(Boolean));
        if (d.ennea_sous_type) {
          /* handled in section render */
        }
        if (d.mbti && d.mbti.length === 4) {
          const groups = ['ei', 'sn', 'tf', 'jp'];
          const sel: Record<string, string> = {};
          groups.forEach((g, i) => { sel[g] = d.mbti![i]; });
          setMbtiSel(sel);
        }
        if (d.riasec) setRiasecOrder(d.riasec.split(',').filter(Boolean));
        if (d.valeurs) setValeurs(d.valeurs.split(',').filter(Boolean));
        if (d.competences) setCompetences(d.competences.split(',').filter(Boolean));
        if (d.besoins) setBesoins(d.besoins.split(',').filter(Boolean));
        if (d.metiers && Array.isArray(d.metiers)) setMetiers(d.metiers);

        if (d.report_status === 'queued' || d.report_status === 'processing') {
          startPolling();
        }
      })
      .catch(() => {
        alert(t('pipeline.errorNotFound'));
        navigate('/backoffice');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mbtiString = (() => {
    const { ei, sn, tf, jp } = mbtiSel;
    return ei && sn && tf && jp ? ei + sn + tf + jp : null;
  })();

  function collectPayload(): PipelineData {
    return {
      ...data,
      ennea_base: enneaOrder.length > 0 ? enneaOrder.join(',') : null,
      ennea_sous_type: data.ennea_sous_type,
      mbti: mbtiString,
      riasec: riasecOrder.length > 0 ? riasecOrder.join(',') : null,
      valeurs: valeurs.length > 0 ? valeurs.join(',') : null,
      competences: competences.length > 0 ? competences.join(',') : null,
      besoins: besoins.length > 0 ? besoins.join(',') : null,
      metiers: metiers.filter((m) => m.nom.trim()).length > 0
        ? metiers.filter((m) => m.nom.trim())
        : null,
    };
  }

  async function saveCoachee() {
    if (saving) return;
    setSaving(true);
    setSaveStatus('');
    try {
      const res = await fetch(`/api/coachee/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(collectPayload()),
      });
      if (!res.ok) throw new Error(t('pipeline.errorSave'));
      setSaveStatus(t('common.saved'));
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  const pollIntervalRef = { current: null as ReturnType<typeof setInterval> | null };

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/coachee/${id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          const s = d.report_status as ReportStatus;
          setReportStatus(s);
          if (s === 'done' || s === 'error') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            setReporting(false);
          }
        });
    }, 3000);
  }, [id]);

  async function makeReport() {
    if (reporting) return;
    setReporting(true);
    try {
      const saveRes = await fetch(`/api/coachee/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(collectPayload()),
      });
      if (!saveRes.ok) throw new Error(t('pipeline.errorSave'));

      const reportRes = await fetch(`/api/coachee/${id}/report`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!reportRes.ok) {
        const j = await reportRes.json();
        throw new Error(j.error ?? t('common.error'));
      }
      setReportStatus('queued');
      startPolling();
    } catch (err) {
      setReporting(false);
      alert(err instanceof Error ? err.message : t('common.error'));
    }
  }

  function toggleEnnea(val: string) {
    setEnneaOrder((prev) => {
      const idx = prev.indexOf(val);
      if (idx >= 0) return prev.filter((v) => v !== val);
      if (prev.length >= 3) return prev;
      return [...prev, val];
    });
  }

  function toggleRiasec(val: string) {
    setRiasecOrder((prev) => {
      const idx = prev.indexOf(val);
      if (idx >= 0) return prev.filter((v) => v !== val);
      if (prev.length >= 3) return prev;
      return [...prev, val];
    });
  }

  function toggleMbti(group: string, val: string) {
    setMbtiSel((prev) => ({ ...prev, [group]: prev[group] === val ? '' : val }));
  }

  const prenom = data.prenom || '...';

  return (
    <div className="min-h-screen bg-[#F6F7F9] pb-8">
      <BackofficeHeader
        title={
          <>
            {t('pipeline.title1')}{' '}
            <span className="font-[Cormorant_Garamond,serif] text-[17px] font-semibold italic text-[#EA226C]">
              {prenom}
            </span>
          </>
        }
        saveStatus={saveStatus}
        showBack
      />

      <div className="max-w-[860px] mx-auto mt-12 px-8 max-md:px-4 max-md:mt-6 relative z-[1]">

        {/* ── Section 01: Identité ── */}
        <PipelineSection
          number="01"
          title={t(data.profile_type === 'adult' ? 'pipeline.section1Adult' : 'pipeline.section1')}
          accent="pink"
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-md:grid-cols-1">
            <FieldGroup label={t('pipeline.labelFirstname')}>
              <input type="text" value={data.prenom} onChange={(e) => { setField('prenom', e.target.value); }}
                placeholder={t('pipeline.placeholderFirstname')} className={inputCls} />
            </FieldGroup>
            <FieldGroup label={t('pipeline.labelSessionDate')}>
              <input type="date" value={data.date_seance ?? ''} onChange={(e) => setField('date_seance', e.target.value)}
                className={inputCls} />
            </FieldGroup>
            <FieldGroup label={t('pipeline.labelLastname')}>
              <input type="text" value={data.nom} onChange={(e) => setField('nom', e.target.value)}
                placeholder={t('pipeline.placeholderLastname')} className={inputCls} />
            </FieldGroup>
            {data.profile_type === 'adult' ? (
              <FieldGroup label={t('pipeline.labelCompany')}>
                <input type="text" value={data.entreprise ?? ''} onChange={(e) => setField('entreprise', e.target.value)}
                  placeholder={t('pipeline.placeholderCompany')} className={inputCls} />
              </FieldGroup>
            ) : (
              <FieldGroup label={t('pipeline.labelSchoolLevel')}>
                <input type="text" value={data.ecole_nom} onChange={(e) => setField('ecole_nom', e.target.value)}
                  placeholder={t('pipeline.placeholderSchoolLevel')} className={inputCls} />
              </FieldGroup>
            )}
            <FieldGroup label={t('pipeline.labelBirthdate')}>
              <input type="date" value={data.date_naissance ?? ''} onChange={(e) => setField('date_naissance', e.target.value)}
                className={inputCls} />
            </FieldGroup>
            {data.profile_type === 'adult' ? (
              <FieldGroup label={t('pipeline.labelRole')}>
                <input type="text" value={data.role ?? ''} onChange={(e) => setField('role', e.target.value)}
                  placeholder={t('pipeline.placeholderRole')} className={inputCls} />
              </FieldGroup>
            ) : (
              <FieldGroup label={t('pipeline.labelChoices')}>
                <textarea value={data.choix ?? ''} onChange={(e) => setField('choix', e.target.value)}
                  placeholder={t('pipeline.placeholderChoices')}
                  className={cn(inputCls, 'min-h-[72px] resize-none')} />
              </FieldGroup>
            )}
            <FieldGroup label={t('pipeline.labelZip')}>
              <input type="text" value={data.code_postal ?? ''} onChange={(e) => setField('code_postal', e.target.value)}
                placeholder={t('pipeline.placeholderZip')} className={inputCls} />
            </FieldGroup>
            <FieldGroup label={t('pipeline.labelHobbies')}>
              <textarea value={data.loisirs ?? ''} onChange={(e) => setField('loisirs', e.target.value)}
                placeholder={t('pipeline.placeholderHobbies')}
                className={cn(inputCls, 'min-h-[72px] resize-none')} />
            </FieldGroup>
          </div>

          {data.profile_type === 'adult' && (
            <div className="mt-5">
              <FieldGroup label={t('pipeline.labelSituation')}>
                <div className="flex flex-wrap gap-2">
                  {SITUATION_KEYS.map((key) => {
                    const current = (data.situation ?? '').split(',').filter(Boolean);
                    const checked = current.includes(key);
                    return (
                      <label
                        key={key}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all text-[13px]',
                          checked
                            ? 'border-[#6B9DB5] bg-[rgba(107,157,181,0.08)] text-[#202C34]'
                            : 'border-[#EAEDEF] bg-white text-[#6B7580] hover:border-[rgba(107,157,181,0.4)]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked ? current.filter((s) => s !== key) : [...current, key];
                            setField('situation', next.length ? next.join(',') : null);
                          }}
                          className="accent-[#6B9DB5] cursor-pointer"
                        />
                        {t(`enums.situation.${key}`)}
                      </label>
                    );
                  })}
                </div>
              </FieldGroup>
            </div>
          )}
        </PipelineSection>

        {/* Toggle all button */}
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3.5 py-1.5 rounded-full border border-[#EAEDEF] bg-white text-[#6B7580]
                       text-[11px] font-medium cursor-pointer transition-all min-h-[30px]
                       hover:border-[#40A2C0] hover:text-[#40A2C0] hover:bg-[rgba(64,162,192,0.04)]"
          >
            {allOpen ? t('pipeline.collapseAll') : t('pipeline.expandAll')}
          </button>
        </div>

        {/* ── Section 02: Enneagramme ── */}
        <PipelineSection number="02" title={t('pipeline.section2')} accent="teal" forceState={allOpen} forceSignal={foldSignal}>
          <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2.5">
            {t('pipeline.enneaInstructions')}
          </label>
          <div className="flex gap-2 flex-wrap mb-4">
            {ENNEA_VALS.map((val) => {
              const rank = enneaOrder.indexOf(val);
              const isSelected = rank >= 0;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleEnnea(val)}
                  className={cn(
                    'w-12 h-12 rounded-xl border-[1.5px] text-[15px] font-semibold cursor-pointer',
                    'relative flex items-center justify-center transition-all',
                    isSelected && rank === 0 && 'border-[#40A2C0] bg-[rgba(64,162,192,0.12)] text-[#40A2C0] shadow-[0_0_16px_rgba(64,162,192,0.3)] scale-105',
                    isSelected && rank === 1 && 'border-[rgba(64,162,192,0.6)] bg-[rgba(64,162,192,0.08)] text-[rgba(64,162,192,0.75)]',
                    isSelected && rank === 2 && 'border-[rgba(64,162,192,0.35)] bg-[rgba(64,162,192,0.04)] text-[rgba(64,162,192,0.5)]',
                    !isSelected && 'border-[#EAEDEF] bg-white text-[#6B7580] hover:border-[#338BA3] hover:text-[#40A2C0] hover:bg-[rgba(64,162,192,0.12)]',
                  )}
                >
                  {val}
                  {isSelected && (
                    <span
                      className={cn(
                        'absolute -top-[7px] -right-[7px] w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold',
                        'flex items-center justify-center',
                        rank === 0 && 'bg-[#40A2C0]',
                        rank === 1 && 'bg-[rgba(64,162,192,0.7)]',
                        rank === 2 && 'bg-[rgba(64,162,192,0.45)]',
                      )}
                    >
                      {rank + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-[#EAEDEF]">
            <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2">
              {t('pipeline.enneaSubtype')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {ENNEA_SUBTYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField('ennea_sous_type', data.ennea_sous_type === s ? null : s)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-[1.5px] text-[11px] font-medium cursor-pointer transition-all min-h-11',
                    data.ennea_sous_type === s
                      ? 'border-[#40A2C0] bg-[rgba(64,162,192,0.12)] text-[#40A2C0]'
                      : 'border-[#EAEDEF] bg-white text-[#6B7580] hover:border-[#40A2C0] hover:text-[#40A2C0] hover:bg-[rgba(64,162,192,0.06)]',
                  )}
                >
                  {t(`enums.enneaSubtype.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterEnnea')}
            value={data.words_ennea}
            onChange={(v) => setField('words_ennea', v)}
          />
        </PipelineSection>

        {/* ── Section 03: MBTI ── */}
        <PipelineSection number="03" title={t('pipeline.section3')} accent="teal" forceState={allOpen} forceSignal={foldSignal}>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
            {MBTI_GROUPS.map(({ group, headKey, options }) => (
              <div key={group} className="flex flex-col gap-1.5">
                <div className="text-[8px] font-semibold tracking-[2px] uppercase text-[#6B7580] pb-1 border-b border-[#EAEDEF] mb-1">
                  {t(headKey)}
                </div>
                {options.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleMbti(group, val)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-2 rounded-md border-[1.5px] cursor-pointer transition-all min-h-11',
                      mbtiSel[group] === val
                        ? 'border-[#7f77dd] bg-[rgba(127,119,221,0.12)]'
                        : 'border-[#EAEDEF] bg-white hover:border-[#7f77dd] hover:bg-[rgba(127,119,221,0.06)]',
                    )}
                  >
                    <div
                      className={cn(
                        'w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center',
                        mbtiSel[group] === val ? 'border-[#7f77dd] bg-[#7f77dd]' : 'border-[#EAEDEF]',
                      )}
                    >
                      {mbtiSel[group] === val && (
                        <div className="w-[5px] h-[5px] rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <div className={cn('text-[15px] font-semibold font-[Cormorant_Garamond,serif]',
                        mbtiSel[group] === val ? 'text-[#7f77dd]' : 'text-[#BFC5CC]')}>
                        {val}
                      </div>
                      <div className="text-[9px] text-[#6B7580]">{t(`enums.mbti.${val}`)}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAEDEF] flex items-center gap-3">
            <span className="text-[9px] font-semibold tracking-[2px] uppercase text-[#6B7580]">
              {t('pipeline.mbtiResultLabel')}
            </span>
            <span className="font-[Cormorant_Garamond,serif] text-[28px] text-[#7f77dd] tracking-[4px]">
              {mbtiString
                ? mbtiString.split('').join(' ')
                : '_ _ _ _'}
            </span>
          </div>

          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterMbti')}
            value={data.words_mbti}
            onChange={(v) => setField('words_mbti', v)}
          />
        </PipelineSection>

        {/* ── Section 04: RIASEC ── */}
        <PipelineSection number="04" title={t('pipeline.section4')} accent="teal" forceState={allOpen} forceSignal={foldSignal}>
          <p className="text-[11px] text-[#6B7580] mb-5 leading-relaxed">
            {t('pipeline.riasecInstructions')}
          </p>
          <div className="flex gap-3 justify-between items-start flex-wrap">
            {RIASEC_VALS.map((val) => {
              const rank = riasecOrder.indexOf(val);
              const isSelected = rank >= 0;
              return (
                <div
                  key={val}
                  onClick={() => toggleRiasec(val)}
                  className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer min-w-[60px]"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full border-2 bg-white flex items-center justify-center relative transition-all',
                      isSelected && rank === 0 && 'border-[#40A2C0] bg-[rgba(64,162,192,0.12)] shadow-[0_0_18px_rgba(64,162,192,0.35)] scale-[1.08]',
                      isSelected && rank === 1 && 'border-[rgba(64,162,192,0.6)] bg-[rgba(64,162,192,0.08)] shadow-[0_0_10px_rgba(64,162,192,0.18)]',
                      isSelected && rank === 2 && 'border-[rgba(64,162,192,0.35)] bg-[rgba(64,162,192,0.04)]',
                      !isSelected && 'border-[#EAEDEF] hover:border-[#338BA3] hover:bg-[rgba(64,162,192,0.06)]',
                    )}
                  >
                    <span
                      className={cn(
                        'font-[Cormorant_Garamond,serif] text-xl absolute',
                        isSelected && rank === 0 && 'text-[#40A2C0] font-bold',
                        isSelected && rank === 1 && 'text-[rgba(64,162,192,0.75)] font-bold',
                        isSelected && rank === 2 && 'text-[rgba(64,162,192,0.5)] font-semibold',
                        !isSelected && 'text-[#BFC5CC]',
                      )}
                    >
                      {val}
                    </span>
                    {isSelected && (
                      <span
                        className={cn(
                          'absolute -top-[6px] -right-[6px] w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center',
                          rank === 0 && 'bg-[#40A2C0]',
                          rank === 1 && 'bg-[rgba(64,162,192,0.7)]',
                          rank === 2 && 'bg-[rgba(64,162,192,0.45)]',
                        )}
                      >
                        {rank + 1}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold tracking-[1px] uppercase text-[#6B7580] text-center">
                    {t(`enums.riasec.${val}`)}
                  </span>
                </div>
              );
            })}
          </div>

          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterRiasec')}
            value={data.words_riasec}
            onChange={(v) => setField('words_riasec', v)}
          />
        </PipelineSection>

        {/* ── Section 05: Valeurs ── */}
        <PipelineSection number="05" title={t('pipeline.section5')} accent="slate" forceState={allOpen} forceSignal={foldSignal}>
          <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2">
            {t('pipeline.valuesInstructions')}
          </label>
          <TagInput
            tags={valeurs}
            onChange={setValeurs}
            placeholder={t('pipeline.valuesPlaceholder')}
            color="green"
          />
        </PipelineSection>

        {/* ── Section 06: Compétences & Besoins ── */}
        <PipelineSection number="06" title={t('pipeline.section6')} accent="slate" forceState={allOpen} forceSignal={foldSignal}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2">
                {t('pipeline.skillsInstructions')}
              </label>
              <TagInput
                tags={competences}
                onChange={setCompetences}
                placeholder={t('pipeline.skillsPlaceholder')}
                color="teal"
              />
            </div>

            <div className="pt-5 mt-1 border-t border-[#EAEDEF]">
              <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B9DB5] mb-3">
                {t('pipeline.needsInstructions')}
              </div>
              <TagInput
                tags={besoins}
                onChange={setBesoins}
                placeholder={t('pipeline.needsPlaceholder')}
                color="slate"
              />
            </div>
          </div>

          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterCompBesoins')}
            value={data.words_comp_besoins}
            onChange={(v) => setField('words_comp_besoins', v)}
          />
        </PipelineSection>

        {/* ── Section 07: Métiers ── */}
        <PipelineSection number="07" title={t('pipeline.section7')} accent="slate" forceState={allOpen} forceSignal={foldSignal}>
          <MetierBlocks metiers={metiers} onChange={setMetiers} />
          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterMetiers')}
            value={data.words_metiers}
            onChange={(v) => setField('words_metiers', v)}
          />
        </PipelineSection>

        {/* ── Section 08: Plan d'action ── */}
        <PipelineSection number="08" title={t('pipeline.section8')} accent="slate" forceState={allOpen} forceSignal={foldSignal}>
          <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2">
            {t('pipeline.planActionLabel')}
          </label>
          <textarea
            value={data.plan_action ?? ''}
            onChange={(e) => setField('plan_action', e.target.value)}
            placeholder={t('pipeline.planActionPlaceholder')}
            className={cn(inputCls, 'min-h-[120px] resize-none')}
          />
          <WordDial
            label={t('pipeline.wordCondensed')}
            sublabel={t('pipeline.chapterPlanAction')}
            value={data.words_plan_action}
            onChange={(v) => setField('words_plan_action', v)}
          />
        </PipelineSection>

        {/* ── Section 09: Notes du coach ── */}
        <PipelineSection number="09" title={t('pipeline.section9')} accent="pink" forceState={allOpen} forceSignal={foldSignal}>
          <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34] block mb-2">
            {t('pipeline.notesLabel')}
          </label>
          <textarea
            value={data.notes_coach ?? ''}
            onChange={(e) => setField('notes_coach', e.target.value)}
            placeholder={t('pipeline.notesPlaceholder')}
            className={cn(inputCls, 'min-h-[120px] resize-none')}
          />
        </PipelineSection>

        {/* ── Make report bar ── */}
        <div className="mt-2 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <div
            className="bg-gradient-to-br from-[rgba(64,162,192,0.05)] to-[rgba(107,157,181,0.04)]
                       border border-[rgba(64,162,192,0.2)] rounded-2xl p-7 flex items-center justify-between gap-6
                       shadow-[0_2px_12px_rgba(64,162,192,0.06)] flex-wrap"
          >
            <div className="text-[12px] text-[#6B7580] leading-relaxed flex-1">
              <strong className="text-[#202C34] font-medium">{t('pipeline.ctaReadyTitle')}</strong><br />
              {t('pipeline.ctaReadyText')}

              {reportStatus && (
                <div className="mt-2">
                  <ReportBadge status={reportStatus} />
                </div>
              )}
              {reportStatus === 'done' && (
                <div className="mt-2">
                  <a
                    href={`/api/coachee/${id}/report/download`}
                    className="inline-flex items-center px-6 py-2.5 bg-[rgba(76,175,130,0.08)]
                               border border-[rgba(76,175,130,0.25)] rounded-full text-[#4caf82] text-xs font-medium
                               no-underline transition-all hover:bg-[rgba(76,175,130,0.15)]"
                  >
                    {t('pipeline.downloadReport')}
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={saveCoachee}
                disabled={saving}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-transparent text-[#40A2C0]
                           border-[1.5px] border-[#40A2C0] rounded-full text-[11px] font-semibold tracking-[1.5px] uppercase
                           cursor-pointer transition-all min-h-12 hover:bg-[rgba(64,162,192,0.08)] hover:-translate-y-0.5
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={makeReport}
                disabled={reporting || reportStatus === 'queued' || reportStatus === 'processing'}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#202C34] text-white
                           border-none rounded-full text-xs font-bold tracking-[2px] uppercase
                           cursor-pointer transition-all min-h-12 flex-shrink-0
                           hover:bg-[#40A2C0] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(64,162,192,0.35)]
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {reporting ? t('pipeline.generating') : t('pipeline.createReport')}
                <span className="w-[18px] h-[18px] rounded-full bg-[rgba(64,162,192,0.15)] flex items-center justify-center text-[11px]">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>

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
