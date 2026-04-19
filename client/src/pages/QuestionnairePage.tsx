import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FormData {
  prenom: string;
  nom: string;
  date_naissance: string;
  ecole_nom: string;
  annee_scolaire: string;
  orientation_actuelle: string;
  loisirs: string;
  choix: string;
}

type StepErrors = Partial<Record<keyof FormData, boolean>>;

const DRAFT_KEY = 'brenso_questionnaire_draft';
const TOTAL_STEPS = 3;

export function QuestionnairePage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});

  const [form, setForm] = useState<FormData>({
    prenom: '',
    nom: '',
    date_naissance: '',
    ecole_nom: '',
    annee_scolaire: '',
    orientation_actuelle: '',
    loisirs: '',
    choix: '',
  });

  // Restore draft on mount
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

  // Save draft on form change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, _step: step }));
    } catch {}
  }, [form, step]);

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  }

  function validateStep(s: number): boolean {
    const required: Array<keyof FormData> =
      s === 1 ? ['prenom', 'nom', 'date_naissance'] : [];
    const newErrors: StepErrors = {};
    for (const f of required) {
      if (!form[f].trim()) newErrors[f] = true;
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
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Erreur');
      }
      setSubmittedName(form.prenom);
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
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
              Merci {submittedName}&nbsp;!
            </h2>
            <p className="text-[14px] text-[#6B7580] leading-relaxed">
              Tes réponses ont bien été enregistrées.<br />
              On se voit bientôt pour la première séance&nbsp;!
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
        {/* Intro card */}
        <div className="bg-white border border-[#EAEDEF] rounded-2xl p-8 shadow-[0_1px_4px_rgba(32,44,52,0.04)]">
          <h2 className="font-[Cormorant_Garamond,serif] text-2xl text-[#202C34] font-normal mb-3">
            Bienvenue&nbsp;!
          </h2>
          <p className="text-[14px] text-[#6B7580] leading-relaxed">
            Avant notre première rencontre, j'aimerais mieux te connaître.
            Remplis ce petit questionnaire — ça prend 2 minutes.
          </p>
        </div>

        {/* Progress */}
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
          {/* Step 1: Identité */}
          {step === 1 && (
            <StepCard
              number="01"
              title="Identité"
              accent="pink"
              footer={
                <div className="flex justify-end">
                  <StepBtn type="button" onClick={() => goStep(2)} accent="pink">
                    Suivant
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup error={errors.prenom}>
                <FieldLabel>Prénom</FieldLabel>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => set('prenom', e.target.value)}
                  name="given-name"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  placeholder="ex. Sofia"
                  required
                  className={fieldClass(!!errors.prenom)}
                />
                {errors.prenom && <FieldError />}
              </FieldGroup>

              <FieldGroup error={errors.nom}>
                <FieldLabel>Nom</FieldLabel>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => set('nom', e.target.value)}
                  name="family-name"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  placeholder="ex. Dupont"
                  required
                  className={fieldClass(!!errors.nom)}
                />
                {errors.nom && <FieldError />}
              </FieldGroup>

              <FieldGroup error={errors.date_naissance}>
                <FieldLabel>Date de naissance</FieldLabel>
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => set('date_naissance', e.target.value)}
                  required
                  className={fieldClass(!!errors.date_naissance)}
                />
                {errors.date_naissance && <FieldError />}
              </FieldGroup>
            </StepCard>
          )}

          {/* Step 2: École */}
          {step === 2 && (
            <StepCard
              number="02"
              title="École & Parcours"
              accent="teal"
              footer={
                <div className="flex justify-between">
                  <StepBtn type="button" onClick={() => goStep(1)} variant="back">
                    Retour
                  </StepBtn>
                  <StepBtn type="button" onClick={() => goStep(3)} accent="teal">
                    Suivant
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup>
                <FieldLabel>École ou Université</FieldLabel>
                <input
                  type="text"
                  value={form.ecole_nom}
                  onChange={(e) => set('ecole_nom', e.target.value)}
                  placeholder="ex. Athénée Royal d'Ixelles"
                  className={fieldClass()}
                />
                <FieldHint>Le nom de ton école, collège ou université</FieldHint>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Année scolaire</FieldLabel>
                <input
                  type="text"
                  value={form.annee_scolaire}
                  onChange={(e) => set('annee_scolaire', e.target.value)}
                  placeholder="ex. 5e secondaire, 1ère bac"
                  className={fieldClass()}
                />
                <FieldHint>En quelle année es-tu actuellement&nbsp;?</FieldHint>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Orientation actuelle</FieldLabel>
                <input
                  type="text"
                  value={form.orientation_actuelle}
                  onChange={(e) => set('orientation_actuelle', e.target.value)}
                  placeholder="ex. Sciences économiques, Latin-Maths"
                  className={fieldClass()}
                />
                <FieldHint>Ta filière, option ou section actuelle</FieldHint>
              </FieldGroup>
            </StepCard>
          )}

          {/* Step 3: Loisirs */}
          {step === 3 && (
            <StepCard
              number="03"
              title="Loisirs & Envies"
              accent="slate"
              footer={
                <div className="flex justify-between">
                  <StepBtn type="button" onClick={() => goStep(2)} variant="back">
                    Retour
                  </StepBtn>
                  <StepBtn type="submit" disabled={loading} accent="slate">
                    {loading ? 'Envoi en cours…' : 'Envoyer au coach'}
                  </StepBtn>
                </div>
              }
            >
              <FieldGroup>
                <FieldLabel>Loisirs et centres d'intérêt</FieldLabel>
                <textarea
                  value={form.loisirs}
                  onChange={(e) => set('loisirs', e.target.value)}
                  placeholder="Sports, musique, jeux vidéo, lecture, bénévolat, voyages..."
                  className={cn(fieldClass(), 'min-h-[88px] resize-none')}
                />
                <FieldHint>Tout ce que tu aimes faire en dehors de l'école</FieldHint>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Choix ou orientations envisagées</FieldLabel>
                <textarea
                  value={form.choix}
                  onChange={(e) => set('choix', e.target.value)}
                  placeholder="Des pistes que tu as déjà en tête ? Des métiers qui t'attirent ?"
                  className={cn(fieldClass(), 'min-h-[88px] resize-none')}
                />
                <FieldHint>
                  Pas d'inquiétude si tu n'as pas encore d'idée — c'est pour ça qu'on se voit&nbsp;!
                </FieldHint>
              </FieldGroup>
            </StepCard>
          )}
        </form>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="sticky top-0 z-[100] bg-white/92 backdrop-blur-[16px] border-b border-[#EAEDEF] shadow-[0_1px_8px_rgba(32,44,52,0.04)]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-12 py-5 max-md:px-5">
        <Link to="/" className="flex items-center gap-2.5 justify-self-start no-underline">
          <div className="w-[34px] h-[34px] rounded-full border-2 border-[#40A2C0] bg-[rgba(64,162,192,0.12)] shadow-[0_0_14px_rgba(64,162,192,0.30)] flex items-center justify-center font-[Cormorant_Garamond,serif] text-base font-semibold text-[#40A2C0]">
            B
          </div>
          <span className="font-[Cormorant_Garamond,serif] text-lg text-[#202C34] tracking-tight">BRENSO</span>
        </Link>
        <div className="text-[14px] text-[#6B7580] whitespace-nowrap">
          <span className="font-[Cormorant_Garamond,serif] text-[17px] font-semibold italic text-[#EA226C]">Questionnaire</span>{' '}
          d'orientation
        </div>
        <div />
      </header>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  accent: 'pink' | 'teal' | 'slate';
  children: React.ReactNode;
  footer: React.ReactNode;
}

const accentBorder: Record<string, string> = {
  pink: 'border-l-[#EA226C]',
  teal: 'border-l-[#40A2C0]',
  slate: 'border-l-[#6B9DB5]',
};
const accentTagBg: Record<string, string> = {
  pink: 'bg-[#EA226C]',
  teal: 'bg-[#40A2C0]',
  slate: 'bg-[#6B9DB5]',
};

function StepCard({ number, title, accent, children, footer }: StepCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#EAEDEF] border-l-4 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(32,44,52,0.04)] animate-fade-up',
        accentBorder[accent],
      )}
    >
      <div className="flex items-center gap-3 px-6 py-4 bg-[#FAFBFC] border-b border-[#EAEDEF]">
        <span
          className={cn(
            'text-[10px] font-bold tracking-[1.5px] uppercase text-white px-3 py-1.5 rounded-full',
            accentTagBg[accent],
          )}
        >
          {number}
        </span>
        <span className="text-[15px] font-semibold text-[#202C34]">{title}</span>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {children}
        <div className="pt-2">{footer}</div>
      </div>
    </div>
  );
}

function FieldGroup({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5', error && 'ring-1 ring-red-300 rounded-xl p-1 -m-1')}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34]">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-[#6B7580] leading-snug">{children}</p>;
}

function FieldError() {
  return <p className="text-[11px] text-[#EA226C]">Ce champ est requis</p>;
}

function fieldClass(hasError = false) {
  return cn(
    'w-full bg-white border rounded-xl px-3.5 py-2.5 text-[13px] text-[#202C34]',
    'outline-none transition-all placeholder:text-[#BFC5CC]',
    hasError
      ? 'border-[#EA226C] focus:border-[#EA226C] focus:shadow-[0_0_0_3px_rgba(234,34,108,0.08)]'
      : 'border-[#EAEDEF] focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]',
  );
}

interface StepBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: 'pink' | 'teal' | 'slate';
  variant?: 'next' | 'back';
}

function StepBtn({ children, accent, variant = 'next', ...props }: StepBtnProps) {
  if (variant === 'back') {
    return (
      <button
        {...props}
        className="px-5 py-2.5 text-xs font-medium text-[#6B7580] border border-[#EAEDEF]
                   rounded-full transition-all hover:border-[#202C34] hover:text-[#202C34] cursor-pointer"
      >
        {children}
      </button>
    );
  }

  const colors: Record<string, string> = {
    pink: 'bg-[#EA226C] hover:bg-[#c91d5d]',
    teal: 'bg-[#40A2C0] hover:bg-[#338BA3]',
    slate: 'bg-[#6B9DB5] hover:bg-[#5a8a9f]',
  };

  return (
    <button
      {...props}
      className={cn(
        'px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-white rounded-full',
        'transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        colors[accent ?? 'teal'],
      )}
    >
      {children}
    </button>
  );
}
