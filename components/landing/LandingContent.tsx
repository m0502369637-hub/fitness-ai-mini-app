'use client'

import {
  Bot,
  Camera,
  CheckCircle2,
  ClipboardList,
  Languages,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Language } from '@/lib/i18n/translations'

const BOT_LINK = 'https://t.me/FitAI_Training_bot'

export function LandingContent() {
  const { t, lang, setLang } = useLanguage()

  const features = [
    { icon: Bot, t: t('landing.f1t'), d: t('landing.f1d') },
    { icon: ClipboardList, t: t('landing.f2t'), d: t('landing.f2d') },
    { icon: TrendingUp, t: t('landing.f3t'), d: t('landing.f3d') },
    { icon: Camera, t: t('landing.f4t'), d: t('landing.f4d') },
    { icon: Zap, t: t('landing.f5t'), d: t('landing.f5d') },
    { icon: Languages, t: t('landing.f6t'), d: t('landing.f6d') },
  ]

  const steps = [
    { n: '1', t: t('landing.how1t'), d: t('landing.how1d') },
    { n: '2', t: t('landing.how2t'), d: t('landing.how2d') },
    { n: '3', t: t('landing.how3t'), d: t('landing.how3d') },
    { n: '4', t: t('landing.how4t'), d: t('landing.how4d') },
  ]

  const stats = [
    { icon: Zap, label: t('landing.statPoints') },
    { icon: ClipboardList, label: t('landing.statLibrary') },
    { icon: Languages, label: t('landing.statBilingual') },
    { icon: Camera, label: t('landing.statVision') },
  ]

  return (
    <main className="min-h-screen bg-[#0c0c0f] text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d7f26d] text-[#0b0c0e] font-black flex items-center justify-center">
              F
            </div>
            <span className="font-extrabold text-lg tracking-tight">FitAI</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-white/70">
              <a href="#features">{t('landing.navFeatures')}</a>
              <a href="#how">{t('landing.navHow')}</a>
              <a href="#pricing">{t('landing.navPricing')}</a>
            </nav>
            <div className="flex items-center rounded-full bg-white/5 border border-white/10 p-1">
              {(['en', 'ar'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={
                    lang === l
                      ? 'px-3 py-1 rounded-full text-xs font-bold bg-[#d7f26d] text-[#0b0c0e]'
                      : 'px-3 py-1 rounded-full text-xs font-bold text-white/70'
                  }
                >
                  {l === 'en' ? 'EN' : 'عربي'}
                </button>
              ))}
            </div>
            <a
              href={BOT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#d7f26d] text-[#0b0c0e] font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              <Send size={15} />
              {t('landing.navOpen')}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#d7f26d] bg-[#d7f26d]/10 border border-[#d7f26d]/30 rounded-full px-4 py-1.5">
          <Sparkles size={14} />
          {t('landing.badge')}
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
          {t('landing.title')}
        </h1>
        <p className="mt-6 text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
          {t('landing.sub')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={BOT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#d7f26d] text-[#0b0c0e] font-extrabold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition active:scale-95"
          >
            <Send size={18} />
            {t('landing.cta')}
          </a>
          <span className="text-xs text-white/50">{t('landing.ctaSub')}</span>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-2"
            >
              <s.icon size={20} className="text-[#d7f26d]" />
              <span className="text-xs font-bold text-white/80 text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center">{t('landing.featuresTitle')}</h2>
          <p className="mt-3 text-center text-white/60">{t('landing.featuresSub')}</p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#17171c] border border-white/10 p-6 hover:border-[#d7f26d]/50 transition"
              >
                <div className="w-11 h-11 rounded-xl bg-[#d7f26d]/10 text-[#d7f26d] flex items-center justify-center">
                  <f.icon size={22} />
                </div>
                <h3 className="mt-4 font-extrabold">{f.t}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/10 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center">{t('landing.howTitle')}</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="relative rounded-2xl bg-[#17171c] border border-white/10 p-6">
                <div className="w-9 h-9 rounded-full bg-[#d7f26d] text-[#0b0c0e] font-black flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="mt-4 font-extrabold">{s.t}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center">{t('landing.pricingTitle')}</h2>
          <p className="mt-3 text-center text-white/60">{t('landing.pricingSub')}</p>
          <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="rounded-3xl bg-[#17171c] border border-white/10 p-8 text-center">
              <p className="text-lg font-extrabold">{t('landing.pack50')}</p>
              <p className="mt-1 text-sm text-white/60">{t('landing.pack50d')}</p>
              <p className="mt-5 text-4xl font-black flex items-center justify-center gap-2">
                <Star size={28} className="text-[#d7f26d] fill-[#d7f26d]" />
                10
              </p>
            </div>
            <div className="rounded-3xl bg-[#d7f26d] text-[#0b0c0e] p-8 text-center">
              <p className="text-lg font-extrabold">{t('landing.pack150')}</p>
              <p className="mt-1 text-sm opacity-70">{t('landing.pack150d')}</p>
              <p className="mt-5 text-4xl font-black flex items-center justify-center gap-2">
                <Star size={28} className="fill-[#0b0c0e]" />
                25
              </p>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/60">
            <CheckCircle2 size={16} className="text-[#d7f26d]" />
            {t('landing.statPoints')}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Target size={36} className="mx-auto text-[#d7f26d]" />
          <h2 className="mt-4 text-3xl font-black">{t('landing.ctaTitle')}</h2>
          <p className="mt-3 text-white/60">{t('landing.ctaSub2')}</p>
          <a
            href={BOT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 bg-[#d7f26d] text-[#0b0c0e] font-extrabold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition active:scale-95"
          >
            <MessageCircle size={18} />
            {t('landing.navOpen')}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/50">
          <span>{t('landing.footer')}</span>
          <a href="/privacy" className="underline underline-offset-2 hover:text-white/80">
            {t('landing.privacy')}
          </a>
        </div>
      </footer>
    </main>
  )
}
