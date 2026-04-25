import { useTranslation } from 'react-i18next';
import type { Metier, Formation } from './types';

interface MetierBlocksProps {
  metiers: Metier[];
  onChange: (metiers: Metier[]) => void;
}

export function MetierBlocks({ metiers, onChange }: MetierBlocksProps) {
  const { t } = useTranslation();

  function addMetier() {
    onChange([
      ...metiers,
      { nom: '', motscles: '', formations: [{ ecole: '', ville: '' }] },
    ]);
  }

  function removeMetier(i: number) {
    onChange(metiers.filter((_, idx) => idx !== i));
  }

  function updateMetier(i: number, patch: Partial<Metier>) {
    onChange(metiers.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function addFormation(metierIdx: number) {
    const m = metiers[metierIdx];
    updateMetier(metierIdx, {
      formations: [...m.formations, { ecole: '', ville: '' }],
    });
  }

  function removeFormation(metierIdx: number, fi: number) {
    const m = metiers[metierIdx];
    updateMetier(metierIdx, {
      formations: m.formations.filter((_, idx) => idx !== fi),
    });
  }

  function updateFormation(metierIdx: number, fi: number, patch: Partial<Formation>) {
    const m = metiers[metierIdx];
    updateMetier(metierIdx, {
      formations: m.formations.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {metiers.map((m, i) => (
        <div
          key={i}
          className="bg-white border border-[#EAEDEF] rounded-xl p-5 transition-colors hover:border-[rgba(107,157,181,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-7 h-7 rounded-full bg-[rgba(107,157,181,0.12)] border border-[rgba(107,157,181,0.3)]
                         text-[#6B9DB5] text-xs font-bold flex items-center justify-center flex-shrink-0"
            >
              {i + 1}
            </div>
            <label className="flex-1 m-0 text-[11px] font-normal text-[#6B7580]">{t('pipeline.metierLabel')}</label>
            <button
              type="button"
              onClick={() => removeMetier(i)}
              className="border border-[#EAEDEF] rounded-md text-[#6B7580] text-base cursor-pointer
                         px-2.5 py-1 transition-all hover:border-red-300 hover:text-red-400 hover:bg-red-50 min-h-9"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <FieldGroup label={t('pipeline.metierName')}>
              <input
                type="text"
                value={m.nom}
                onChange={(e) => updateMetier(i, { nom: e.target.value })}
                placeholder={t('pipeline.metierNamePlaceholder')}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t('pipeline.metierKeywords')}>
              <textarea
                value={m.motscles}
                onChange={(e) => updateMetier(i, { motscles: e.target.value })}
                placeholder={t('pipeline.metierKeywordsPlaceholder')}
                className={cn(inputCls, 'min-h-[72px] resize-none')}
              />
            </FieldGroup>

            <FieldGroup label={t('pipeline.metierFormations')}>
              <div className="flex flex-col gap-2">
                {m.formations.map((f, fi) => (
                  <div key={fi} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={f.ecole}
                      onChange={(e) => updateFormation(i, fi, { ecole: e.target.value })}
                      placeholder={t('pipeline.metierSchoolPlaceholder')}
                      className={cn(inputCls, 'flex-1')}
                    />
                    <input
                      type="text"
                      value={f.ville}
                      onChange={(e) => updateFormation(i, fi, { ville: e.target.value })}
                      placeholder={t('pipeline.metierCityPlaceholder')}
                      className={cn(inputCls, 'max-w-[140px]')}
                    />
                    <button
                      type="button"
                      onClick={() => removeFormation(i, fi)}
                      className="text-[#6B7580] text-base cursor-pointer px-2 py-1 transition-colors hover:text-red-400 min-h-9 flex-shrink-0"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addFormation(i)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5
                           border border-dashed border-[rgba(107,157,181,0.3)] rounded-lg
                           bg-transparent text-[rgba(107,157,181,0.6)] text-[11px] cursor-pointer
                           transition-all hover:border-[#6B9DB5] hover:text-[#6B9DB5] hover:bg-[rgba(107,157,181,0.05)]
                           min-h-9"
              >
                {t('pipeline.metierAddFormation')}
              </button>
            </FieldGroup>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMetier}
        className="flex items-center justify-center gap-2 py-3.5 w-full
                   border-[1.5px] border-dashed border-[rgba(107,157,181,0.3)] rounded-xl
                   bg-transparent text-[#6B9DB5] text-xs font-medium cursor-pointer
                   transition-all hover:border-[#6B9DB5] hover:bg-[rgba(107,157,181,0.06)] hover:-translate-y-px
                   min-h-12"
      >
        {t('pipeline.metierAdd')}
      </button>
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
