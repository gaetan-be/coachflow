import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col items-center px-5 py-16">
      <div className="w-full max-w-[760px] flex justify-end pb-4">
        <LanguageSwitcher />
      </div>
      <div
        className="bg-white border border-[#EAEDEF] rounded-2xl p-14 w-full max-w-[760px] text-left
                   shadow-[0_1px_4px_rgba(32,44,52,0.04)] animate-fade-up
                   max-md:p-9 max-sm:p-7"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full border-[1.5px] border-[#40A2C0] flex items-center justify-center font-[Fraunces,serif] text-base text-[#40A2C0] font-medium">
            B
          </div>
          <span className="text-xs font-medium tracking-[3px] uppercase">BRENSO</span>
        </div>

        <h1 className="font-[Fraunces,serif] text-[32px] font-normal text-[#202C34] mb-2 leading-snug max-sm:text-[26px]">
          {t('terms.title')}
        </h1>
        <div className="text-[12px] tracking-[2px] uppercase text-[#6B7580] mb-10">
          {t('terms.lastUpdated')}
        </div>

        <div className="bg-[rgba(64,162,192,0.08)] border border-[rgba(64,162,192,0.2)] rounded-[10px] px-5 py-4 mb-8">
          <p className="text-[14px] leading-[1.7] text-[#6B7580] m-0">
            <strong className="text-[#202C34] font-semibold">{t('terms.summaryLabel')}</strong>
            {t('terms.summaryText1')}
            <strong className="text-[#202C34] font-semibold">{t('terms.summaryStrong')}</strong>
            {t('terms.summaryText2')}
          </p>
        </div>

        <Section title={t('terms.section1Title')}>
          <p>{t('terms.section1Body')}</p>
        </Section>

        <Section title={t('terms.section2Title')}>
          <p>
            {t('terms.section2Intro1')}<strong>{t('terms.section2IntroStrong')}</strong>{t('terms.section2Intro2')}
          </p>
          <ul>
            <li>{t('terms.section2Item1')}</li>
            <li>{t('terms.section2Item2')}</li>
            <li>{t('terms.section2Item3')}</li>
            <li>{t('terms.section2Item4')}</li>
            <li>{t('terms.section2Item5')}</li>
          </ul>
          <p>{t('terms.section2Outro')}</p>
        </Section>

        <Section title={t('terms.section3Title')}>
          <p>{t('terms.section3Intro1')}<strong>{t('terms.section3IntroStrong')}</strong>{t('terms.section3Intro2')}</p>
          <ul>
            <li>{t('terms.section3Item1')}</li>
            <li>{t('terms.section3Item2')}</li>
          </ul>
          <p>
            {t('terms.section3Outro1')}<strong>{t('terms.section3OutroStrong')}</strong>{t('terms.section3Outro2')}
          </p>
        </Section>

        <Section title={t('terms.section4Title')}>
          <p>{t('terms.section4Intro')}</p>
          <ul>
            <li>
              <strong>{t('terms.section4Item1Strong')}</strong>{t('terms.section4Item1')}
            </li>
            <li>
              <strong>{t('terms.section4Item2Strong')}</strong>{t('terms.section4Item2')}
            </li>
          </ul>
          <p>
            <strong>{t('terms.section4OutroStrong')}</strong>{t('terms.section4OutroA')}
            <em>{t('terms.section4OutroEm')}</em>{t('terms.section4OutroB')}
          </p>
        </Section>

        <Section title={t('terms.section5Title')}>
          <p>
            {t('terms.section5P1A')}<strong>{t('terms.section5P1Strong1')}</strong>{t('terms.section5P1B')}<strong>{t('terms.section5P1Strong2')}</strong>{t('terms.section5P1C')}
          </p>
          <p>
            <strong>{t('terms.section5P2Strong')}</strong>{t('terms.section5P2A')}<strong>{t('terms.section5P2Strong2')}</strong>{t('terms.section5P2B')}<strong>{t('terms.section5P2Strong3')}</strong>{t('terms.section5P2C')}
          </p>
          <p>{t('terms.section5P3')}</p>
          <ul>
            <li>{t('terms.section5Item1A')}<strong>{t('terms.section5Item1Strong')}</strong>{t('terms.section5Item1B')}</li>
            <li>{t('terms.section5Item2')}</li>
            <li>{t('terms.section5Item3')}</li>
            <li>{t('terms.section5Item4')}</li>
            <li>{t('terms.section5Item5')}</li>
          </ul>
          <p>
            {t('terms.section5P4A')}<strong>{t('terms.section5P4Strong')}</strong>{t('terms.section5P4B')}
          </p>
          <p>
            {t('terms.section5P5A')}<strong>{t('terms.section5P5Strong')}</strong>{t('terms.section5P5B')}
          </p>
        </Section>

        <Section title={t('terms.section6Title')}>
          <p>
            {t('terms.section6P1A')}<strong>{t('terms.section6P1Strong')}</strong>{t('terms.section6P1B')}
          </p>
          <p>{t('terms.section6P2')}</p>
        </Section>

        <Section title={t('terms.section7Title')}>
          <p><strong>{t('terms.section7Controller')}</strong></p>
          <ul><li>{t('terms.section7ControllerName')}</li></ul>
          <p><strong>{t('terms.section7Processors')}</strong></p>
          <ul>
            <li><strong>{t('terms.section7Processor1A')}</strong>{t('terms.section7Processor1B')}</li>
            <li><strong>{t('terms.section7Processor2A')}</strong>{t('terms.section7Processor2B')}</li>
            <li><strong>{t('terms.section7Processor3A')}</strong>{t('terms.section7Processor3B')}</li>
          </ul>
        </Section>

        <Section title={t('terms.section8Title')}>
          <p>{t('terms.section8Body')}</p>
        </Section>

        <Section title={t('terms.section9Title')}>
          <p>{t('terms.section9Intro')}</p>
          <ul>
            <li><strong>{t('terms.section9Item1Strong')}</strong>{t('terms.section9Item1')}</li>
            <li><strong>{t('terms.section9Item2Strong')}</strong>{t('terms.section9Item2')}</li>
            <li><strong>{t('terms.section9Item3Strong')}</strong>{t('terms.section9Item3')}</li>
            <li><strong>{t('terms.section9Item4Strong')}</strong>{t('terms.section9Item4')}</li>
            <li><strong>{t('terms.section9Item5Strong')}</strong>{t('terms.section9Item5')}</li>
            <li><strong>{t('terms.section9Item6Strong')}</strong>{t('terms.section9Item6')}</li>
          </ul>
          <p>
            {t('terms.section9Outro')}
            <a href="mailto:contact@narido.eu" className="text-[#40A2C0] no-underline border-b border-[rgba(64,162,192,0.3)] hover:text-[#202C34]">
              contact@narido.eu
            </a>.
          </p>
        </Section>

        <Section title={t('terms.section10Title')}>
          <p>{t('terms.section10Body')}</p>
        </Section>

        <Section title={t('terms.section11Title')}>
          <p>
            {t('terms.section11Body')}
            <a href="mailto:contact@narido.eu" className="text-[#40A2C0] no-underline border-b border-[rgba(64,162,192,0.3)] hover:text-[#202C34]">
              contact@narido.eu
            </a>
          </p>
        </Section>

        <Link
          to="/"
          className="inline-block mt-8 text-[12px] tracking-[2px] uppercase text-[#6B7580] no-underline hover:text-[#40A2C0] transition-colors"
        >
          {t('terms.backHome')}
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-[Fraunces,serif] text-[22px] font-normal text-[#40A2C0] mb-3.5">{title}</h2>
      <div className="[&_p]:text-[14px] [&_p]:leading-[1.7] [&_p]:text-[#6B7580] [&_p]:mb-3
                      [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-[14px] [&_li]:leading-[1.7] [&_li]:text-[#6B7580] [&_li]:mb-1.5
                      [&_strong]:text-[#202C34] [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
