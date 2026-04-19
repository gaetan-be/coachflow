import { useState } from 'react';
import { Link } from 'react-router-dom';

const PACKS = [
  { key: 'apiece', name: 'À la pièce', included: 0, price: 0, suppl: 0, pop: false },
  { key: 'starter', name: 'Pack Starter', included: 3, price: 69, suppl: 35, pop: false },
  { key: 'plus', name: 'Pack Plus', included: 7, price: 129, suppl: 15, pop: true },
  { key: 'super', name: 'Pack Super', included: 15, price: 219, suppl: 10, pop: false },
];

const alcPricePer = (i: number) => (i === 0 ? 29 : 40);

function calcAlc(n: number) {
  let t = 0;
  for (let i = 0; i < n; i++) t += alcPricePer(i);
  return t;
}

function calcPack(p: (typeof PACKS)[0], n: number) {
  return n <= p.included ? p.price : p.price + (n - p.included) * p.suppl;
}

function fmtEur(v: number) {
  return v.toFixed(2).replace('.', ',').replace(',00', '') + ' €';
}

function getBest(n: number) {
  const tierOrder: Record<string, number> = { apiece: 0, starter: 1, plus: 2, super: 3 };
  const alcTotal = calcAlc(n);
  const options = PACKS.map((p) => {
    const total = p.key === 'apiece' ? alcTotal : calcPack(p, n);
    return { ...p, total, perUnit: total / n };
  });
  return [...options].sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    return tierOrder[b.key] - tierOrder[a.key];
  })[0];
}

export function HomePage() {
  const [volume, setVolume] = useState(5);

  const best = getBest(Math.max(1, volume));

  return (
    <div className="bg-white min-h-screen font-[Inter_Tight,system-ui,sans-serif] text-[#202C34]">
      {/* NAV */}
      <nav className="sticky top-0 bg-white/88 backdrop-blur-[12px] border-b border-[#EAEDEF] z-[100]">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between px-6 py-[18px]">
          <div className="flex items-center gap-2.5 font-[Fraunces,serif] text-xl font-medium tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-[#40A2C0]" />
            Rapports AI
          </div>
          <div className="flex gap-8 items-center">
            <a href="#benefice" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">Bénéfice</a>
            <a href="#produits" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">Produits</a>
            <a href="#tarifs" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">Tarifs</a>
            <a href="#cta" className="text-sm no-underline bg-[#202C34] text-white px-[18px] py-2.5 rounded-full hover:bg-[#40A2C0] transition-colors font-medium">
              Réserver une démo
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-[110px] pb-20 relative overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(64,162,192,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(190,166,116,0.1)] border border-[#BEA674] rounded-full text-[#BEA674] text-[12px] font-semibold tracking-[0.05em] uppercase mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BEA674]" />
            Fait pour les coachs
          </div>
          <h1 className="font-[Fraunces,serif] text-[clamp(40px,7vw,76px)] font-normal leading-[1.02] mb-7 max-w-[920px]">
            Des rapports de coaching en{' '}
            <em className="not-italic text-[#40A2C0] italic" style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1' }}>
              4 minutes
            </em>
            , au lieu de{' '}
            <span className="relative inline-block text-[#6B7580] italic">
              1h30
              <span className="absolute left-[-6%] right-[-6%] top-[52%] h-[3px] bg-[#EA226C] rotate-[-7deg] rounded-sm shadow-[0_1px_3px_rgba(234,34,108,0.3)]" />
            </span>
            .
          </h1>
          <p className="text-[clamp(17px,2vw,20px)] text-[#6B7580] max-w-[620px] mb-10 leading-[1.55]">
            Vous cochez quelques cases, ajoutez vos mots-clés, l'IA écrit. Le rapport est propre, structuré, prêt à remettre. Vous avez repris votre après-midi.
          </p>
          <div className="flex gap-3.5 flex-wrap">
            <a href="#tarifs" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#202C34] text-white no-underline transition-all hover:bg-[#40A2C0] hover:-translate-y-px min-h-[52px]">
              Voir les tarifs
            </a>
            <a href="#benefice" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-transparent text-[#202C34] border-[1.5px] border-[#EAEDEF] no-underline transition-all hover:border-[#202C34] min-h-[52px]">
              Découvrir
            </a>
          </div>
        </div>
      </section>

      {/* BENEFICES */}
      <section id="benefice" className="py-[100px] bg-[#FAFBFC]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">
            Pourquoi c'est différent
          </div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            Un rapport mieux fait, en une fraction du temps.
          </h2>
          <div className="grid grid-cols-4 gap-4.5 mt-12 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
            {[
              {
                num: '01', kicker: null,
                title: '4 minutes au lieu de 1h30',
                desc: <>À vous de choisir :<br />1 coaching en plus par rapport.<br />Ou fini les samedis fin d'après-midi à se dire <em>« je dois vite finir ce rapport »</em> au lieu de profiter du jardin avec un bon livre.</>,
              },
              {
                num: '02', kicker: null,
                title: 'Qualité augmentée et constante',
                desc: <>Même niveau de professionnalisme à chaque rapport.<br />Le contenu s'adapte vraiment à la personne, un chapitre répond au suivant.<br />Aucun rapport identique.<br />Totalement personnalisé.</>,
              },
              {
                num: '03', kicker: 'Nouveau',
                title: 'Présenter avec clarté',
                desc: <>En plus du rapport complet, un PowerPoint de 10 slides structuré et clair pour présenter à distance.<br />Vous faites le voice-over en direct, et le Word (ou PDF) part en pj ensuite.<br />Waouw !</>,
              },
              {
                num: '04', kicker: null,
                title: 'Votre personal branding',
                desc: <>Vos couleurs, votre logo, vos informations — discrètement posés pour laisser la place au contenu.<br />Word et PowerPoint portent votre identité visuelle.</>,
              },
            ].map((b) => (
              <div key={b.num} className="pt-8 px-6.5 pb-7 border-t-2 border-[#EAEDEF] flex flex-col transition-all hover:border-t-[#40A2C0]">
                <div className="font-[Fraunces,serif] text-[13px] text-[#BEA674] font-medium tracking-[0.12em] mb-5">{b.num}</div>
                {b.kicker ? (
                  <span className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase text-[#EA226C] bg-[rgba(234,34,108,0.08)] px-2 py-0.5 rounded-full mb-2.5">
                    {b.kicker}
                  </span>
                ) : (
                  <span className="invisible inline-block text-[10px] px-2 py-0.5 mb-2.5">&nbsp;</span>
                )}
                <div className="font-[Fraunces,serif] text-[26px] font-medium mb-3.5 tracking-tight leading-[1.15] min-h-[2.3em]">
                  {b.title}
                </div>
                <div className="text-[#6B7580] text-[14.5px] leading-[1.55]">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS */}
      <section id="produits" className="py-[100px]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">Ce que vous livrez</div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            Trois livrables, un même rapport.
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[640px] mb-10 leading-[1.6]">
            Selon le tarif choisi, le rapport est livré sous une ou plusieurs formes.
          </p>
          <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
            {[
              {
                name: 'Starter', nameColor: '',
                rows: [
                  { label: 'Rapport', text: 'profil, personnalité, intérêts, synthèse, recommandations, contenu personnalisé.' },
                  { label: 'Format', text: 'rapport détaillé de 10-15 pages en PDF.' },
                ],
              },
              {
                name: 'Tous les Packs', nameColor: '',
                rows: [
                  { label: 'Rapport', text: 'profil, personnalité, intérêts, synthèse, recommandations, contenu personnalisé.' },
                  { label: null, plus: true, text: <>rapport détaillé de 10-15 pages en <strong>Word, éditable</strong>.</> },
                  { label: null, plus: true, text: <>rapport synthèse en <strong>PowerPoint (éditable)</strong> pour présentation claire et structurée.</> },
                ],
              },
              {
                name: 'Super Pack', nameColor: 'text-[#EA226C]',
                rows: [
                  { label: 'Rapport', text: 'profil, personnalité, intérêts, synthèse, recommandations, contenu personnalisé.' },
                  { label: null, plus: true, text: <>rapport détaillé de 10-15 pages en <strong>Word, éditable</strong>.</> },
                  { label: null, plus: true, text: <>rapport synthèse en <strong>PowerPoint (éditable)</strong> pour présentation claire et structurée.</> },
                  { label: null, plus: true, highlight: true, text: <><strong>3 minutes de podcast audio</strong>, deux experts virtuels discutent du participant. Un livrable unique qui impressionne.</> },
                ],
              },
            ].map((p) => (
              <div key={p.name} className="bg-white border border-[#EAEDEF] rounded-[20px] p-8 transition-all hover:border-[rgba(64,162,192,0.3)] hover:-translate-y-0.5">
                <div className={`font-[Fraunces,serif] text-[26px] font-medium mb-2.5 tracking-tight ${p.nameColor}`}>{p.name}</div>
                <div className="text-[#6B7580] text-[15px] leading-[1.6] flex flex-col gap-4">
                  {p.rows.map((r, i) => (
                    <div key={i} className={r.highlight ? 'text-[#EA226C]' : ''}>
                      {r.label && <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-[#40A2C0] mb-0.5">{r.label}</span>}
                      {r.plus && <span className="text-[#EA226C] font-bold mr-1">+</span>}
                      {r.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-[100px] bg-[#FAFBFC]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">Tarifs</div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            Un rapport à la pièce, ou trois packs mensuels.
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[640px] mb-10 leading-[1.6]">
            Plus le volume augmente, plus le prix par rapport chute.
          </p>

          {/* Launch banner */}
          <div className="inline-flex items-center gap-3 bg-[rgba(234,34,108,0.08)] border border-[#EA226C] text-[#EA226C] px-5 py-2.5 rounded-full text-sm mb-10 font-medium flex-wrap">
            <span className="w-2 h-2 bg-[#EA226C] rounded-full pulse-dot" />
            <strong className="font-bold tracking-[0.06em] uppercase text-[12px]">Offre de lancement</strong>
            <span className="opacity-40">·</span>
            <span>Setup de 99 € <strong>inclus</strong> dans tous les packs</span>
          </div>

          <div className="grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[540px]:grid-cols-1">
            {[
              {
                key: 'apiece', name: 'À la pièce', tag: 'Sans engagement', badge: null,
                price: '29', unit: '€', range: <><strong>1er rapport</strong> · puis 40 € / rapport</>, period: 'paiement à la commande',
                features: [
                  { ok: true, text: 'Rapport 10-15 pages' },
                  { ok: true, text: 'Livré en PDF' },
                  { ok: false, text: 'Pas brandé (couleurs standard)' },
                  { ok: false, text: 'Pas de PowerPoint' },
                  { ok: false, text: 'Pas de podcast audio' },
                ],
                cta: 'Commander', featured: false, subdued: true,
              },
              {
                key: 'starter', name: 'Starter', tag: 'Pour démarrer', badge: null,
                price: '69', unit: '€ / mois', range: <><strong>3 rapports</strong> inclus · 23 € / rapport</>, period: 'rapport suppl. · 35 €',
                features: [
                  { ok: true, text: 'Rapport Word brandé' },
                  { ok: true, text: 'PowerPoint synthèse' },
                  { ok: true, text: 'Vos couleurs, votre logo' },
                  { ok: false, text: 'Pas de podcast audio' },
                ],
                cta: 'Choisir Starter', featured: false, subdued: false,
              },
              {
                key: 'plus', name: 'Plus', tag: 'Coachs actifs', badge: 'Meilleur deal',
                price: '129', unit: '€ / mois', range: <><strong>7 rapports</strong> inclus · 18,43 € / rapport</>, period: 'rapport suppl. · 15 €',
                features: [
                  { ok: true, text: 'Rapport Word brandé' },
                  { ok: true, text: 'PowerPoint synthèse' },
                  { ok: true, text: 'Vos couleurs, votre logo' },
                  { ok: false, text: 'Pas de podcast audio' },
                ],
                cta: 'Choisir Plus', featured: true, subdued: false,
              },
              {
                key: 'super', name: 'Super', tag: 'Volume élevé', badge: null,
                price: '219', unit: '€ / mois', range: <><strong>15 rapports</strong> inclus · 14,60 € / rapport</>, period: 'rapport suppl. · 10 €',
                features: [
                  { ok: true, text: 'Rapport Word brandé' },
                  { ok: true, text: 'PowerPoint synthèse' },
                  { ok: true, text: 'Vos couleurs, votre logo' },
                  { ok: true, text: 'Podcast audio 3 min', highlight: true },
                ],
                cta: 'Choisir Super', featured: false, subdued: false,
              },
            ].map((card) => (
              <div
                key={card.key}
                className={[
                  'bg-white border rounded-[20px] p-7 relative flex flex-col transition-all hover:border-[rgba(64,162,192,0.3)] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(32,44,52,0.06)]',
                  card.featured ? 'border-2 border-[#EA226C] bg-gradient-to-b from-[rgba(234,34,108,0.03)] to-white scale-[1.02]' : 'border-[#EAEDEF]',
                  card.subdued ? 'bg-[#F4F6F7]' : '',
                ].filter(Boolean).join(' ')}
              >
                {card.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EA226C] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full">
                    {card.badge}
                  </span>
                )}
                <div className="font-[Fraunces,serif] text-[22px] font-medium mb-1 tracking-tight">{card.name}</div>
                <div className="text-[12px] text-[#6B7580] mb-5">{card.tag}</div>
                <div className="flex items-baseline gap-1 mb-1 flex-wrap">
                  <span className={`font-[Fraunces,serif] text-[46px] font-medium tracking-[-0.04em] leading-none ${card.featured ? 'text-[#EA226C]' : ''}`}>
                    {card.price}
                  </span>
                  <span className="text-[17px] text-[#6B7580] font-medium">{card.unit}</span>
                </div>
                <div className="text-[13px] text-[#6B7580] mb-1">{card.range}</div>
                <div className="text-[13px] text-[#6B7580] mb-5">{card.period}</div>
                <ul className="list-none pt-4.5 border-t border-[#EAEDEF] flex-grow mb-5.5">
                  {card.features.map((f, i) => {
                    const feat = f as { ok: boolean; text: string; highlight?: boolean };
                    return (
                    <li key={i} className={`flex items-start gap-2.5 text-[13px] py-1.5 leading-[1.45] ${!feat.ok ? 'text-[#BFC5CC]' : ''} ${feat.highlight ? 'text-[#EA226C] font-semibold' : 'text-[#202C34]'}`}>
                      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5
                        ${feat.highlight ? 'bg-[rgba(234,34,108,0.08)] text-[#EA226C]' : feat.ok ? 'bg-[rgba(64,162,192,0.08)] text-[#40A2C0]' : 'bg-[#E8EBEE] text-[#BFC5CC]'}`}>
                        {feat.ok ? '✓' : '×'}
                      </span>
                      {feat.text}
                    </li>
                  );})}
                </ul>
                <a
                  href="#cta"
                  className={`flex items-center justify-center px-4.5 py-3 rounded-full text-[14px] font-semibold no-underline transition-all min-h-[46px]
                    ${card.featured
                      ? 'bg-[#EA226C] text-white border-[#EA226C] border hover:bg-[#202C34] hover:border-[#202C34]'
                      : 'bg-white text-[#202C34] border-[1.5px] border-[#EAEDEF] hover:border-[#202C34]'
                    }`}
                >
                  {card.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className="mt-8 bg-[#F4F6F7] rounded-[20px] p-6 px-7 grid grid-cols-[auto_1fr_auto] gap-7 items-center max-[900px]:grid-cols-1 max-[900px]:gap-5">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="text-[11px] text-[#6B7580] tracking-[0.1em] uppercase font-semibold">
                Combien par mois ?
              </div>
              <div className="flex items-baseline gap-2.5">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={volume}
                  onChange={(e) => {
                    let n = parseInt(e.target.value, 10);
                    if (isNaN(n)) n = 1;
                    setVolume(Math.min(30, Math.max(1, n)));
                  }}
                  className="font-[Fraunces,serif] text-[44px] font-medium text-[#202C34] border-2 border-[#EAEDEF] rounded-xl px-3.5 py-1 text-center w-[100px] bg-white tracking-tight leading-none outline-none focus:border-[#40A2C0] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Nombre de rapports par mois"
                />
                <span className="text-[14px] text-[#6B7580]">rapports</span>
              </div>
            </div>

            <div className="w-full px-1">
              <input
                type="range"
                min={1}
                max={20}
                value={Math.min(volume, 20)}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#E0E4E7] rounded-full outline-none cursor-pointer appearance-none
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[26px] [&::-webkit-slider-thumb]:h-[26px]
                           [&::-webkit-slider-thumb]:bg-[#40A2C0] [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:shadow-[0_3px_10px_rgba(64,162,192,0.4)]
                           [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white"
                aria-label="Ajuster le volume"
              />
              <div className="flex justify-between text-[11px] text-[#6B7580] mt-1.5">
                <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
              </div>
            </div>

            <div className="min-w-[220px] max-[900px]:text-left">
              <div className="text-[11px] text-[#6B7580] tracking-[0.1em] uppercase font-semibold mb-1">
                Meilleure formule
              </div>
              <div className={`font-[Fraunces,serif] text-[26px] font-medium tracking-tight leading-[1.1] mb-1 ${best.pop ? 'text-[#EA226C]' : 'text-[#202C34]'}`}>
                {best.name}
              </div>
              <div className="text-[14px] text-[#6B7580]">
                <strong className="font-[Fraunces,serif] text-[17px] font-medium text-[#202C34] tracking-tight">
                  {fmtEur(best.perUnit)}
                </strong>{' '}
                / rapport
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ONBOARDING BANNER */}
      <section className="py-0 pb-[100px]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="bg-[#202C34] text-white rounded-[28px] p-16 px-12 relative overflow-hidden mt-0 max-[700px]:p-12 max-[700px]:px-7">
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(234,34,108,0.18)_0%,transparent_70%)]" />
            <div className="relative grid grid-cols-[1.5fr_1fr] gap-12 items-center max-[800px]:grid-cols-1 max-[800px]:gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#EA226C] text-white px-3.5 py-[5px] rounded-full text-[11px] font-bold tracking-[0.1em] uppercase mb-5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full pulse-dot" />
                  Offre de lancement
                </div>
                <h3 className="font-[Fraunces,serif] text-[clamp(28px,4vw,40px)] font-normal leading-[1.1] mb-5">
                  Setup <em className="text-[#40A2C0] italic">offert</em> sur tous les packs.
                </h3>
                <p className="text-white/70 text-base mb-7 max-w-[480px]">
                  Configuration de votre template, intégration de vos fiches, formation rapide. Normalement 99 €, offert pour les premières inscriptions.
                </p>
                <a href="#cta" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#40A2C0] text-[#202C34] no-underline transition-all hover:bg-white min-h-[52px]">
                  Profiter de l'offre
                </a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-8 text-center">
                <div className="font-[Fraunces,serif] text-[26px] font-medium text-white/50 relative inline-block mb-2">
                  99 €
                  <span className="absolute left-[-8%] right-[-8%] top-[52%] h-0.5 bg-[#EA226C] -rotate-6 rounded-sm" />
                </div>
                <div className="font-[Fraunces,serif] text-[64px] font-medium text-[#EA226C] leading-none tracking-[-0.04em]">
                  Offert
                </div>
                <div className="text-white/60 text-[13px] mt-2 tracking-[0.05em]">
                  setup inclus dans tous les packs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="cta" className="py-[120px] text-center">
        <div className="max-w-[1160px] mx-auto px-6">
          <h2 className="font-[Fraunces,serif] text-[clamp(36px,6vw,64px)] font-normal leading-[1.05] mb-6 max-w-[820px] mx-auto tracking-[-0.02em]">
            Et si votre prochain rapport s'écrivait{' '}
            <em className="text-[#40A2C0] italic">pendant que vous prenez un café</em>&nbsp;?
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[560px] mx-auto mb-10">
            15 minutes de démo, aucun engagement. On configure votre template, vous voyez le rapport sortir en direct.
          </p>
          <a href="mailto:hello@rapports.ai" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#202C34] text-white no-underline transition-all hover:bg-[#40A2C0] hover:-translate-y-px min-h-[52px]">
            Réserver une démo
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-[#EAEDEF] text-center text-[13px] text-[#6B7580]">
        <div className="max-w-[1160px] mx-auto px-6">
          Rapports AI
          <span className="inline-block w-1 h-1 bg-[#BEA674] rounded-full mx-3 align-middle" />
          Fait à Bruxelles
          <span className="inline-block w-1 h-1 bg-[#BEA674] rounded-full mx-3 align-middle" />
          © 2026
          <span className="mx-3 text-[#EAEDEF]">|</span>
          <Link to="/terms" className="text-[#6B7580] no-underline hover:text-[#40A2C0] transition-colors">
            Confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
