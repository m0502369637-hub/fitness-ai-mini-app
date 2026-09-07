'use client'

import { ArrowRight, Bot, ClipboardList, Flame, HeartPulse, Trophy, Zap } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { formatPoints } from '@/lib/telegram'
import { TabId } from '@/components/ui/BottomNav'
import { StatCard } from '@/components/ui/StatCard'
import { WeeklyChart } from '@/components/ui/WeeklyChart'

export function HomeScreen({
  onNavigate,
  onBuy,
}: {
  onNavigate: (t: TabId) => void
  onBuy: () => void
}) {
  const { user, plans, transactions } = useAppData()
  const { t, lang } = useLanguage()
  const firstName = (user?.name ?? 'Athlete').split(' ')[0]
  const coachCount = transactions.filter((t) => t.type === 'use_ai').length
  const planCount = plans.length
  const sessionCount = transactions.filter((t) => t.amount < 0).length
  const latest = plans[0]

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
  const values = days.map((d) => {
    const s = new Date(d)
    s.setHours(0, 0, 0, 0)
    const e = new Date(d)
    e.setHours(23, 59, 59, 999)
    return transactions.filter((t) => t.timestamp >= s.getTime() && t.timestamp <= e.getTime()).length
  })
  const labels = days.map((d) =>
    d
      .toLocaleDateString(lang === 'ar' ? 'ar' : undefined, { weekday: 'short' })
      .slice(0, 3)
      .toUpperCase(),
  )

  return (
    <div className="space-y-4">
      {/* Greeting + points pill */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
            {t('home.welcome')}
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--c-text)]">{firstName}</h1>
        </div>
        <button
          onClick={onBuy}
          className="flex items-center gap-1.5 bg-[var(--c-accent)] text-[var(--c-accent-text)] font-bold text-sm px-3 py-1.5 rounded-full active:scale-95 transition"
        >
          <Zap size={15} className="opacity-70" />
          {formatPoints(user?.pointsBalance ?? 0)}
        </button>
      </div>

      {/* Hero */}
      <h2 className="text-[26px] font-extrabold leading-tight text-[var(--c-text)] uppercase">
        {t('home.heroA')}
        <br />
        {t('home.heroB')}
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Zap size={18} />} label={t('home.points')} value={formatPoints(user?.pointsBalance ?? 0)} accent />
        <StatCard icon={<Trophy size={18} />} label={t('home.plans')} value={String(planCount)} />
        <StatCard icon={<ClipboardList size={18} />} label={t('home.workouts')} value={String(sessionCount)} />
        <StatCard icon={<Bot size={18} />} label={t('home.coachCalls')} value={String(coachCount)} />
      </div>

      {/* Weekly activity */}
      <WeeklyChart title={t('home.weekly')} subtitle={t('home.thisWeek')} values={values} labels={labels} />

      {/* Create plan CTA */}
      <button
        onClick={() => onNavigate('plan')}
        className="w-full rounded-2xl bg-[var(--c-accent)] text-[var(--c-accent-text)] p-4 flex items-center justify-between active:scale-[0.98] transition"
      >
        <div className="text-start">
          <p className="text-base font-extrabold uppercase">{t('home.createPlan')}</p>
          <p className="text-xs font-semibold opacity-70">{t('home.createPlanSub')}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--c-accent-text)] text-[var(--c-accent)] flex items-center justify-center shrink-0 rtl:rotate-180">
          <ArrowRight size={20} />
        </div>
      </button>

      {/* Current plan */}
      {latest && (
        <button
          onClick={() => onNavigate('plan')}
          className="w-full card p-4 flex items-center gap-3 text-start active:scale-[0.99] transition"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center shrink-0">
            <HeartPulse size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[var(--c-muted)] font-semibold">
              {t('home.currentPlan')}
            </p>
            <p className="font-bold text-[var(--c-text)] truncate">{latest.title}</p>
          </div>
          <span className="text-xs font-bold text-[var(--c-muted)] shrink-0">
            {latest.days.length} {t('home.days')}
          </span>
        </button>
      )}

      {!latest && (
        <button
          onClick={() => onNavigate('plan')}
          className="w-full card p-4 flex items-center gap-3 text-start active:scale-[0.99] transition"
          style={{ borderStyle: 'dashed' }}
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-muted)] flex items-center justify-center shrink-0">
            <Flame size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[var(--c-muted)] font-semibold">
              {t('home.noPlan')}
            </p>
            <p className="font-bold text-[var(--c-text)]">{t('home.noPlanSub')}</p>
          </div>
        </button>
      )}
    </div>
  )
}
