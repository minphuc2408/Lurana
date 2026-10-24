import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { homeFaqs } from '../home-faq';
import { useLandingReveal } from '../hooks/useLandingReveal';
import { faqReveal } from '../landing-motion';
import './home-faq.css';

export function HomeFAQ() {
  const { t } = useLocale('landing');
  const motionRef = useLandingReveal(faqReveal);
  return <section ref={motionRef} id="faq" data-home-faq tabIndex={-1} aria-labelledby="home-faq-title" className="scroll-mt-[calc(var(--lunara-storefront-header-height,0px)_+_24px)] py-16 sm:py-24">
    <div className="mx-auto grid max-w-[var(--lunara-content-max-width)] grid-cols-1 items-start gap-10 px-5 sm:gap-12 sm:px-8 lg:grid-cols-12 lg:gap-16">
      <div data-faq-intro className="min-w-0 lg:col-span-5">
        <p className="mb-4 text-[11px] font-medium tracking-[0.18em] text-lunara-body uppercase">{t('Frequently asked questions')}</p>
        <h2 id="home-faq-title" className="mb-6 font-display text-3xl leading-[1.2] tracking-tight text-lunara-ink sm:text-4xl">{t('A Few Things You May Wonder')}</h2>
        <p className="max-w-md text-base leading-7 text-lunara-body">{t('FAQ introduction')}</p>
      </div>
      <Accordion.Root data-faq-list type="single" collapsible className="min-w-0 border-t border-lunara-border lg:col-span-7">
        {homeFaqs.map(item => <Accordion.Item key={item.id} value={item.id} data-faq-item={item.id} className="border-b border-lunara-border">
          <Accordion.Header>
            <Accordion.Trigger data-faq-question className="group flex min-h-16 w-full items-center justify-between gap-6 rounded-[2px] py-5 text-left text-base leading-7 font-medium text-lunara-ink underline-offset-4 hover:underline">
              <span>{t(item.question)}</span>
              <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
                <Plus size={18} strokeWidth={1.5} className="group-data-[state=open]:hidden" />
                <Minus size={18} strokeWidth={1.5} className="hidden group-data-[state=open]:block" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-faq-panel>
            <p className="pb-5 pr-8 text-sm leading-7 text-lunara-body sm:pr-10 sm:text-base">{t(item.answer)}</p>
          </Accordion.Content>
        </Accordion.Item>)}
      </Accordion.Root>
    </div>
  </section>;
}
