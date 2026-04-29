import { useState, useEffect, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  PageHeader, StepCard, StepBtn,
  FieldGroup, FieldLabel, FieldHint, FieldError, fieldClass,
} from '@/pages/QuestionnairePage';

const SITUATION_KEYS = ['questionnement', 'burnout', 'reorientation', 'indecis'] as const;
type SituationKey = typeof SITUATION_KEYS[number];

interface FormData {
  prenom: string;
  nom: string;
  date_naissance: string;
  entreprise: string;
  role: string;
  loisirs: string;
  situation: SituationKey[];
}

type StepErrors = Partial<Record<keyof FormData, boolean>>;

const DRAFT_KEY = 'brenso_adult_questionnaire_draft';
const TOTAL_STEPS = 3;

export function AdultQuestionnairePage() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  // URL locks the language: /fr/hello/pro = fr, /nl/hello/pro = nl
  const lang: 'fr' | 'nl' = pathname.startsWith('/nl/') ? 'nl' : 'fr';
  useEffect(() => {
    if (i18n.resolvedLanguage !== lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});

  const [form, setForm] = useState<FormData>({
    prenom: '',
    nom: '',
    date_naissance: '',
    entreprise: '',
    role: '',
    loisirs: '',
    situation: [],
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as FormData & { _step?: number };
      const { _step, ...data } = draft;
      setForm((f) => ({ ...f, ...data }));
      if (_step && _step >= 1 && _step <= TOTAL_STEPS) setStep(_step);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, _step: step }));
    } catch {}
  }, [form, step]);

  function setField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  }

  function toggleSituation(key: SituationKey) {
    setForm((f) => ({
      ...f,
      situation: f.situation.includes(key)
        ? f.situation.filter((s) => s !== key)
        : [...f.situation, key],
    }));
  }

  function validateStep(s: number): boolean {
    const required: Array<keyof FormData> = s === 1 ? ['prenom', 'nom', 'date_naissance'] : [];
    const newErrors: StepErrors = {};
    for (const f of required) {
      const v = form[f];
      if (typeof v === 'string' && !v.trim()) newErrors[f] = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goStep(n: number) {
    if (n > step && !validateStep(step)) return;
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: lang, profile_type: 'adult' }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? t('common.error'));
      }
      setSubmittedName(form.prenom);
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex flex-col">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="bg-white border border-[#EAEDEF] rounded-2xl p-14 text-center
                       max-w-md w-full shadow-[0_4px_24px_rgba(32,44,52,0.08)] animate-fade-up"
          >
            <div
              className="w-16 h-16 rounded-full bg-[rgba(76,175,130,0.12)] border-2 border-[#4caf82]
                         flex items-center justify-center text-[#4caf82] text-2xl font-bold mx-auto mb-6"
            >
              ✓
            </div>
            <h2 className="font-[Cormorant_Garamond,serif] text-3xl font-normal text-[#202C34] mb-3">
              {t('questionnaire.successTitle', { name: submittedName })}
            </h2>
            <p className="text-[14px] text-[#6B7580] leading-relaxed">
              {t('questionnaire.adultSuccessBody1')}<br />
              {t('questionnaire.adultSuccessBody2')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col">
      <PageHeader />

      <div className="max-w-xl mx-auto w-full px-4 pb-16 pt-10 flex flex-col gap-6">
        <div className="bg-white border border-[#EAEDEF] rounded-2xl p-8 shadow-[0_1px_4px_rgba(32,44,52,0.04)]">
          <h2 className="font-[Cormorant_Garamond,serif] text-2xl text-[#202C34] font-normal mb-3">
            {t('questionnaire.welcomeTitle')}
          </h2>
          <p className="text-[14px] text-[#6B7580] leading-relaxed">
            {t('questionnaire.adultWelcomeBody')}
          </p>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i < step ? 'bg-[#40A2C0]' : i === step ? 'bg-[#40A2C0] opacity-60' : 'bg-[#EAEDEF]',
              )}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <StepCard
              number="01"
              title={t('questionnaire.step1Title')}
              accent="pink"
              footer={
                <div className="flex justify-end">
                  <StepBtn type="button" onClick={() => goStep(2)} accent="pink">
                    {t('common.next')}
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup error={errors.prenom}>
                <FieldLabel>{t('questionnaire.labelFirstname')}</FieldLabel>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => setField('prenom', e.target.value)}
                  name="given-name"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  placeholder={t('questionnaire.placeholderFirstname')}
                  required
                  className={fieldClass(!!errors.prenom)}
                />
                {errors.prenom && <FieldError />}
              </FieldGroup>

              <FieldGroup error={errors.nom}>
                <FieldLabel>{t('questionnaire.labelLastname')}</FieldLabel>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setField('nom', e.target.value)}
                  name="family-name"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  placeholder={t('questionnaire.placeholderLastname')}
                  required
                  className={fieldClass(!!errors.nom)}
                />
                {errors.nom && <FieldError />}
              </FieldGroup>

              <FieldGroup error={errors.date_naissance}>
                <FieldLabel>{t('questionnaire.labelBirthdate')}</FieldLabel>
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => setField('date_naissance', e.target.value)}
                  required
                  className={fieldClass(!!errors.date_naissance)}
                />
                {errors.date_naissance && <FieldError />}
              </FieldGroup>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard
              number="02"
              title={t('questionnaire.adultStep2Title')}
              accent="teal"
              footer={
                <div className="flex justify-between">
                  <StepBtn type="button" onClick={() => goStep(1)} variant="back">
                    {t('common.back')}
                  </StepBtn>
                  <StepBtn type="button" onClick={() => goStep(3)} accent="teal">
                    {t('common.next')}
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup>
                <FieldLabel>{t('questionnaire.adultLabelCompany')}</FieldLabel>
                <input
                  type="text"
                  value={form.entreprise}
                  onChange={(e) => setField('entreprise', e.target.value)}
                  placeholder={t('questionnaire.adultPlaceholderCompany')}
                  className={fieldClass()}
                />
                <FieldHint>{t('questionnaire.adultLabelCompanyHint')}</FieldHint>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>{t('questionnaire.adultLabelRole')}</FieldLabel>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  placeholder={t('questionnaire.adultPlaceholderRole')}
                  className={fieldClass()}
                />
                <FieldHint>{t('questionnaire.adultLabelRoleHint')}</FieldHint>
              </FieldGroup>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard
              number="03"
              title={t('questionnaire.adultStep3Title')}
              accent="slate"
              footer={
                <div className="flex justify-between">
                  <StepBtn type="button" onClick={() => goStep(2)} variant="back">
                    {t('common.back')}
                  </StepBtn>
                  <StepBtn type="submit" disabled={loading} accent="slate">
                    {loading ? t('questionnaire.submitting') : t('questionnaire.submit')}
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup>
                <FieldLabel>{t('questionnaire.adultLabelHobbies')}</FieldLabel>
                <textarea
                  value={form.loisirs}
                  onChange={(e) => setField('loisirs', e.target.value)}
                  placeholder={t('questionnaire.adultPlaceholderHobbies')}
                  className={cn(fieldClass(), 'min-h-[88px] resize-none')}
                />
                <FieldHint>{t('questionnaire.adultLabelHobbiesHint')}</FieldHint>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>{t('questionnaire.adultLabelSituation')}</FieldLabel>
                <div className="flex flex-col gap-2">
                  {SITUATION_KEYS.map((key) => {
                    const checked = form.situation.includes(key);
                    return (
                      <label
                        key={key}
                        className={cn(
                          'flex items-center gap-3 px-3.5 py-3 bg-white border rounded-xl cursor-pointer transition-all',
                          checked
                            ? 'border-[#6B9DB5] bg-[rgba(107,157,181,0.06)]'
                            : 'border-[#EAEDEF] hover:border-[rgba(107,157,181,0.4)]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSituation(key)}
                          className="w-5 h-5 accent-[#6B9DB5] cursor-pointer flex-shrink-0"
                        />
                        <span className="text-[13px] text-[#202C34]">
                          {t(`enums.situation.${key}`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FieldHint>{t('questionnaire.adultLabelSituationHint')}</FieldHint>
              </FieldGroup>
            </StepCard>
          )}
        </form>
      </div>
    </div>
  );
}
