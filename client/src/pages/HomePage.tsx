import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

const PACK_DEFS = [
  { key: 'apiece', included: 0, price: 0, suppl: 0, pop: false },
  { key: 'starter', included: 3, price: 69, suppl: 35, pop: false },
  { key: 'plus', included: 7, price: 129, suppl: 15, pop: true },
  { key: 'super', included: 15, price: 219, suppl: 10, pop: false },
] as const;

const alcPricePer = (i: number) => (i === 0 ? 29 : 40);

function calcAlc(n: number) {
  let t = 0;
  for (let i = 0; i < n; i++) t += alcPricePer(i);
  return t;
}

function calcPack(p: (typeof PACK_DEFS)[number], n: number) {
  return n <= p.included ? p.price : p.price + (n - p.included) * p.suppl;
}

function fmtEur(v: number) {
  return v.toFixed(2).replace('.', ',').replace(',00', '') + ' €';
}

function getBest(n: number) {
  const tierOrder: Record<string, number> = { apiece: 0, starter: 1, plus: 2, super: 3 };
  const alcTotal = calcAlc(n);
  const options = PACK_DEFS.map((p) => {
    const total = p.key === 'apiece' ? alcTotal : calcPack(p, n);
    return { ...p, total, perUnit: total / n };
  });
  return [...options].sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    return tierOrder[b.key] - tierOrder[a.key];
  })[0];
}

export function HomePage() {
  const { t } = useTranslation();
  const [volume, setVolume] = useState(5);

  const best = getBest(Math.max(1, volume));
  const bestNameKey = `home.pack${best.key.charAt(0).toUpperCase() + best.key.slice(1)}Name`;

  const benefits = [
    {
      num: '01', kicker: null,
      titleKey: 'home.benefit1Title',
      desc: (
        <>
          {t('home.benefit1Desc1')}<br />
          {t('home.benefit1Desc2')}<br />
          {t('home.benefit1Desc3a')}<em>{t('home.benefit1Desc3b')}</em>{t('home.benefit1Desc3c')}
        </>
      ),
    },
    {
      num: '02', kicker: null,
      titleKey: 'home.benefit2Title',
      desc: (
        <>
          {t('home.benefit2Desc1')}<br />
          {t('home.benefit2Desc2')}<br />
          {t('home.benefit2Desc3')}<br />
          {t('home.benefit2Desc4')}
        </>
      ),
    },
    {
      num: '03', kickerKey: 'home.benefit3Kicker',
      titleKey: 'home.benefit3Title',
      desc: (
        <>
          {t('home.benefit3Desc1')}<br />
          {t('home.benefit3Desc2')}<br />
          {t('home.benefit3Desc3')}
        </>
      ),
    },
    {
      num: '04', kicker: null,
      titleKey: 'home.benefit4Title',
      desc: (
        <>
          {t('home.benefit4Desc1')}<br />
          {t('home.benefit4Desc2')}
        </>
      ),
    },
  ];

  const products = [
    {
      nameKey: 'home.productStarterName', nameColor: '',
      rows: [
        { labelKey: 'home.productLabelReport', textKey: 'home.productReportText' },
        { labelKey: 'home.productLabelFormat', textKey: 'home.productStarterFormat' },
      ] as Array<{ labelKey?: string; textKey?: string; plus?: boolean; node?: React.ReactNode; highlight?: boolean }>,
    },
    {
      nameKey: 'home.productAllPacksName', nameColor: '',
      rows: [
        { labelKey: 'home.productLabelReport', textKey: 'home.productReportText' },
        { plus: true, node: <>{t('home.productPlusWord1')}<strong>{t('home.productPlusWord2')}</strong>{t('home.productPlusWord3')}</> },
        { plus: true, node: <>{t('home.productPlusPpt1')}<strong>{t('home.productPlusPpt2')}</strong>{t('home.productPlusPpt3')}</> },
      ] as Array<{ labelKey?: string; textKey?: string; plus?: boolean; node?: React.ReactNode; highlight?: boolean }>,
    },
    {
      nameKey: 'home.productSuperPackName', nameColor: 'text-[#EA226C]',
      rows: [
        { labelKey: 'home.productLabelReport', textKey: 'home.productReportText' },
        { plus: true, node: <>{t('home.productPlusWord1')}<strong>{t('home.productPlusWord2')}</strong>{t('home.productPlusWord3')}</> },
        { plus: true, node: <>{t('home.productPlusPpt1')}<strong>{t('home.productPlusPpt2')}</strong>{t('home.productPlusPpt3')}</> },
        { plus: true, highlight: true, node: <><strong>{t('home.productSuperAudio1')}</strong>{t('home.productSuperAudio2')}</> },
      ] as Array<{ labelKey?: string; textKey?: string; plus?: boolean; node?: React.ReactNode; highlight?: boolean }>,
    },
  ];

  const pricingCards: Array<{
    key: 'apiece' | 'starter' | 'plus' | 'super';
    nameKey: string; tagKey: string; badgeKey?: string;
    priceKey: string; unitKey: string;
    range: React.ReactNode; periodKey: string;
    features: Array<{ ok: boolean; textKey: string; highlight?: boolean }>;
    ctaKey: string; featured: boolean; subdued: boolean;
  }> = [
    {
      key: 'apiece', nameKey: 'home.packApieceName', tagKey: 'home.packApieceTag',
      priceKey: 'home.packApiecePrice', unitKey: 'home.packApieceUnit',
      range: <><strong>{t('home.packApieceRange1')}</strong>{t('home.packApieceRange2')}</>,
      periodKey: 'home.packApiecePeriod',
      features: [
        { ok: true, textKey: 'home.packApieceFeature1' },
        { ok: true, textKey: 'home.packApieceFeature2' },
        { ok: false, textKey: 'home.packApieceFeature3' },
        { ok: false, textKey: 'home.packApieceFeature4' },
        { ok: false, textKey: 'home.packApieceFeature5' },
      ],
      ctaKey: 'home.packApieceCta', featured: false, subdued: true,
    },
    {
      key: 'starter', nameKey: 'home.packStarterName', tagKey: 'home.packStarterTag',
      priceKey: 'home.packStarterPrice', unitKey: 'home.packStarterUnit',
      range: <><strong>{t('home.packStarterRange1')}</strong>{t('home.packStarterRange2')}</>,
      periodKey: 'home.packStarterPeriod',
      features: [
        { ok: true, textKey: 'home.packStarterFeature1' },
        { ok: true, textKey: 'home.packStarterFeature2' },
        { ok: true, textKey: 'home.packStarterFeature3' },
        { ok: false, textKey: 'home.packStarterFeature4' },
      ],
      ctaKey: 'home.packStarterCta', featured: false, subdued: false,
    },
    {
      key: 'plus', nameKey: 'home.packPlusName', tagKey: 'home.packPlusTag', badgeKey: 'home.packPlusBadge',
      priceKey: 'home.packPlusPrice', unitKey: 'home.packPlusUnit',
      range: <><strong>{t('home.packPlusRange1')}</strong>{t('home.packPlusRange2')}</>,
      periodKey: 'home.packPlusPeriod',
      features: [
        { ok: true, textKey: 'home.packPlusFeature1' },
        { ok: true, textKey: 'home.packPlusFeature2' },
        { ok: true, textKey: 'home.packPlusFeature3' },
        { ok: false, textKey: 'home.packPlusFeature4' },
      ],
      ctaKey: 'home.packPlusCta', featured: true, subdued: false,
    },
    {
      key: 'super', nameKey: 'home.packSuperName', tagKey: 'home.packSuperTag',
      priceKey: 'home.packSuperPrice', unitKey: 'home.packSuperUnit',
      range: <><strong>{t('home.packSuperRange1')}</strong>{t('home.packSuperRange2')}</>,
      periodKey: 'home.packSuperPeriod',
      features: [
        { ok: true, textKey: 'home.packSuperFeature1' },
        { ok: true, textKey: 'home.packSuperFeature2' },
        { ok: true, textKey: 'home.packSuperFeature3' },
        { ok: true, textKey: 'home.packSuperFeature4', highlight: true },
      ],
      ctaKey: 'home.packSuperCta', featured: false, subdued: false,
    },
  ];

  return (
    <div className="bg-white min-h-screen font-[Inter_Tight,system-ui,sans-serif] text-[#202C34]">
      {/* NAV */}
      <nav className="sticky top-0 bg-white/88 backdrop-blur-[12px] border-b border-[#EAEDEF] z-[100]">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between px-6 py-[18px]">
          <div className="flex items-center gap-2.5 font-[Fraunces,serif] text-xl font-medium tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-[#40A2C0]" />
            {t('home.brand')}
          </div>
          <div className="flex gap-8 items-center">
            <a href="#benefice" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">{t('home.navBenefit')}</a>
            <a href="#produits" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">{t('home.navProducts')}</a>
            <a href="#tarifs" className="text-[#6B7580] no-underline text-sm font-medium hover:text-[#202C34] transition-colors max-md:hidden">{t('home.navPricing')}</a>
            <LanguageSwitcher />
            <a href="#cta" className="text-sm no-underline bg-[#202C34] text-white px-[18px] py-2.5 rounded-full hover:bg-[#40A2C0] transition-colors font-medium">
              {t('home.navBookDemo')}
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
            {t('home.heroBadge')}
          </div>
          <h1 className="font-[Fraunces,serif] text-[clamp(40px,7vw,76px)] font-normal leading-[1.02] mb-7 max-w-[920px]">
            {t('home.heroTitle1')}{' '}
            <em className="not-italic text-[#40A2C0] italic" style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1' }}>
              {t('home.heroTitle2')}
            </em>
            {t('home.heroTitle3')}{' '}
            <span className="relative inline-block text-[#6B7580] italic">
              {t('home.heroTitle4')}
              <span className="absolute left-[-6%] right-[-6%] top-[52%] h-[3px] bg-[#EA226C] rotate-[-7deg] rounded-sm shadow-[0_1px_3px_rgba(234,34,108,0.3)]" />
            </span>
            .
          </h1>
          <p className="text-[clamp(17px,2vw,20px)] text-[#6B7580] max-w-[620px] mb-10 leading-[1.55]">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex gap-3.5 flex-wrap">
            <a href="#tarifs" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#202C34] text-white no-underline transition-all hover:bg-[#40A2C0] hover:-translate-y-px min-h-[52px]">
              {t('home.heroCtaPricing')}
            </a>
            <a href="#benefice" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-transparent text-[#202C34] border-[1.5px] border-[#EAEDEF] no-underline transition-all hover:border-[#202C34] min-h-[52px]">
              {t('home.heroCtaDiscover')}
            </a>
          </div>
        </div>
      </section>

      {/* BENEFICES */}
      <section id="benefice" className="py-[100px] bg-[#FAFBFC]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">
            {t('home.benefitKicker')}
          </div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            {t('home.benefitTitle')}
          </h2>
          <div className="grid grid-cols-4 gap-4.5 mt-12 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
            {benefits.map((b) => (
              <div key={b.num} className="pt-8 px-6.5 pb-7 border-t-2 border-[#EAEDEF] flex flex-col transition-all hover:border-t-[#40A2C0]">
                <div className="font-[Fraunces,serif] text-[13px] text-[#BEA674] font-medium tracking-[0.12em] mb-5">{b.num}</div>
                {b.kickerKey ? (
                  <span className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase text-[#EA226C] bg-[rgba(234,34,108,0.08)] px-2 py-0.5 rounded-full mb-2.5">
                    {t(b.kickerKey)}
                  </span>
                ) : (
                  <span className="invisible inline-block text-[10px] px-2 py-0.5 mb-2.5">&nbsp;</span>
                )}
                <div className="font-[Fraunces,serif] text-[26px] font-medium mb-3.5 tracking-tight leading-[1.15] min-h-[2.3em]">
                  {t(b.titleKey)}
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
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">{t('home.productsKicker')}</div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            {t('home.productsTitle')}
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[640px] mb-10 leading-[1.6]">
            {t('home.productsSubtitle')}
          </p>
          <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
            {products.map((p) => (
              <div key={p.nameKey} className="bg-white border border-[#EAEDEF] rounded-[20px] p-8 transition-all hover:border-[rgba(64,162,192,0.3)] hover:-translate-y-0.5">
                <div className={`font-[Fraunces,serif] text-[26px] font-medium mb-2.5 tracking-tight ${p.nameColor}`}>{t(p.nameKey)}</div>
                <div className="text-[#6B7580] text-[15px] leading-[1.6] flex flex-col gap-4">
                  {p.rows.map((r, i) => (
                    <div key={i} className={r.highlight ? 'text-[#EA226C]' : ''}>
                      {r.labelKey && <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-[#40A2C0] mb-0.5">{t(r.labelKey)}</span>}
                      {r.plus && <span className="text-[#EA226C] font-bold mr-1">+</span>}
                      {r.textKey ? t(r.textKey) : r.node}
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
          <div className="inline-block text-[#40A2C0] text-[13px] font-semibold tracking-[0.1em] uppercase mb-4">{t('home.pricingKicker')}</div>
          <h2 className="font-[Fraunces,serif] text-[clamp(32px,5vw,52px)] font-normal leading-[1.08] mb-5 max-w-[760px]">
            {t('home.pricingTitle')}
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[640px] mb-10 leading-[1.6]">
            {t('home.pricingSubtitle')}
          </p>

          {/* Launch banner */}
          <div className="inline-flex items-center gap-3 bg-[rgba(234,34,108,0.08)] border border-[#EA226C] text-[#EA226C] px-5 py-2.5 rounded-full text-sm mb-10 font-medium flex-wrap">
            <span className="w-2 h-2 bg-[#EA226C] rounded-full pulse-dot" />
            <strong className="font-bold tracking-[0.06em] uppercase text-[12px]">{t('home.launchOfferLabel')}</strong>
            <span className="opacity-40">·</span>
            <span>{t('home.launchOfferText1')}<strong>{t('home.launchOfferText2')}</strong>{t('home.launchOfferText3')}</span>
          </div>

          <div className="grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[540px]:grid-cols-1">
            {pricingCards.map((card) => (
              <div
                key={card.key}
                className={[
                  'bg-white border rounded-[20px] p-7 relative flex flex-col transition-all hover:border-[rgba(64,162,192,0.3)] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(32,44,52,0.06)]',
                  card.featured ? 'border-2 border-[#EA226C] bg-gradient-to-b from-[rgba(234,34,108,0.03)] to-white scale-[1.02]' : 'border-[#EAEDEF]',
                  card.subdued ? 'bg-[#F4F6F7]' : '',
                ].filter(Boolean).join(' ')}
              >
                {card.badgeKey && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EA226C] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full">
                    {t(card.badgeKey)}
                  </span>
                )}
                <div className="font-[Fraunces,serif] text-[22px] font-medium mb-1 tracking-tight">{t(card.nameKey)}</div>
                <div className="text-[12px] text-[#6B7580] mb-5">{t(card.tagKey)}</div>
                <div className="flex items-baseline gap-1 mb-1 flex-wrap">
                  <span className={`font-[Fraunces,serif] text-[46px] font-medium tracking-[-0.04em] leading-none ${card.featured ? 'text-[#EA226C]' : ''}`}>
                    {t(card.priceKey)}
                  </span>
                  <span className="text-[17px] text-[#6B7580] font-medium">{t(card.unitKey)}</span>
                </div>
                <div className="text-[13px] text-[#6B7580] mb-1">{card.range}</div>
                <div className="text-[13px] text-[#6B7580] mb-5">{t(card.periodKey)}</div>
                <ul className="list-none pt-4.5 border-t border-[#EAEDEF] flex-grow mb-5.5">
                  {card.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-[13px] py-1.5 leading-[1.45] ${!f.ok ? 'text-[#BFC5CC]' : ''} ${f.highlight ? 'text-[#EA226C] font-semibold' : 'text-[#202C34]'}`}>
                      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5
                        ${f.highlight ? 'bg-[rgba(234,34,108,0.08)] text-[#EA226C]' : f.ok ? 'bg-[rgba(64,162,192,0.08)] text-[#40A2C0]' : 'bg-[#E8EBEE] text-[#BFC5CC]'}`}>
                        {f.ok ? '✓' : '×'}
                      </span>
                      {t(f.textKey)}
                    </li>
                  ))}
                </ul>
                <a
                  href="#cta"
                  className={`flex items-center justify-center px-4.5 py-3 rounded-full text-[14px] font-semibold no-underline transition-all min-h-[46px]
                    ${card.featured
                      ? 'bg-[#EA226C] text-white border-[#EA226C] border hover:bg-[#202C34] hover:border-[#202C34]'
                      : 'bg-white text-[#202C34] border-[1.5px] border-[#EAEDEF] hover:border-[#202C34]'
                    }`}
                >
                  {t(card.ctaKey)}
                </a>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className="mt-8 bg-[#F4F6F7] rounded-[20px] p-6 px-7 grid grid-cols-[auto_1fr_auto] gap-7 items-center max-[900px]:grid-cols-1 max-[900px]:gap-5">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="text-[11px] text-[#6B7580] tracking-[0.1em] uppercase font-semibold">
                {t('home.calculatorKicker')}
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
                  aria-label={t('home.calculatorAriaCount')}
                />
                <span className="text-[14px] text-[#6B7580]">{t('home.calculatorReports')}</span>
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
                aria-label={t('home.calculatorAriaSlider')}
              />
              <div className="flex justify-between text-[11px] text-[#6B7580] mt-1.5">
                <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
              </div>
            </div>

            <div className="min-w-[220px] max-[900px]:text-left">
              <div className="text-[11px] text-[#6B7580] tracking-[0.1em] uppercase font-semibold mb-1">
                {t('home.calculatorBest')}
              </div>
              <div className={`font-[Fraunces,serif] text-[26px] font-medium tracking-tight leading-[1.1] mb-1 ${best.pop ? 'text-[#EA226C]' : 'text-[#202C34]'}`}>
                {t(bestNameKey)}
              </div>
              <div className="text-[14px] text-[#6B7580]">
                <strong className="font-[Fraunces,serif] text-[17px] font-medium text-[#202C34] tracking-tight">
                  {fmtEur(best.perUnit)}
                </strong>{' '}
                {t('home.calculatorPerReport')}
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
                  {t('home.ctaBannerKicker')}
                </div>
                <h3 className="font-[Fraunces,serif] text-[clamp(28px,4vw,40px)] font-normal leading-[1.1] mb-5">
                  {t('home.ctaBannerTitle1')}<em className="text-[#40A2C0] italic">{t('home.ctaBannerTitle2')}</em>{t('home.ctaBannerTitle3')}
                </h3>
                <p className="text-white/70 text-base mb-7 max-w-[480px]">
                  {t('home.ctaBannerText')}
                </p>
                <a href="#cta" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#40A2C0] text-[#202C34] no-underline transition-all hover:bg-white min-h-[52px]">
                  {t('home.ctaBannerCta')}
                </a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-8 text-center">
                <div className="font-[Fraunces,serif] text-[26px] font-medium text-white/50 relative inline-block mb-2">
                  {t('home.ctaBannerOriginalPrice')}
                  <span className="absolute left-[-8%] right-[-8%] top-[52%] h-0.5 bg-[#EA226C] -rotate-6 rounded-sm" />
                </div>
                <div className="font-[Fraunces,serif] text-[64px] font-medium text-[#EA226C] leading-none tracking-[-0.04em]">
                  {t('home.ctaBannerNewPrice')}
                </div>
                <div className="text-white/60 text-[13px] mt-2 tracking-[0.05em]">
                  {t('home.ctaBannerNote')}
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
            {t('home.finalCtaTitle1')}
            <em className="text-[#40A2C0] italic">{t('home.finalCtaTitle2')}</em>
            {t('home.finalCtaTitle3')}
          </h2>
          <p className="text-lg text-[#6B7580] max-w-[560px] mx-auto mb-10">
            {t('home.finalCtaText')}
          </p>
          <a href="mailto:hello@rapports.ai" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-semibold bg-[#202C34] text-white no-underline transition-all hover:bg-[#40A2C0] hover:-translate-y-px min-h-[52px]">
            {t('home.finalCtaButton')}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-[#EAEDEF] text-center text-[13px] text-[#6B7580]">
        <div className="max-w-[1160px] mx-auto px-6">
          {t('home.brand')}
          <span className="inline-block w-1 h-1 bg-[#BEA674] rounded-full mx-3 align-middle" />
          {t('home.footerCity')}
          <span className="inline-block w-1 h-1 bg-[#BEA674] rounded-full mx-3 align-middle" />
          {t('home.footerCopyright')}
          <span className="mx-3 text-[#EAEDEF]">|</span>
          <Link to="/terms" className="text-[#6B7580] no-underline hover:text-[#40A2C0] transition-colors">
            {t('home.footerPrivacy')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
