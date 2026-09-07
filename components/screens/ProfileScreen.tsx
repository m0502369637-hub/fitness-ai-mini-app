'use client'

import { Bot, ChevronRight, ClipboardList, Languages, Pencil } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { useTelegram } from '@/providers/TelegramProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Language } from '@/lib/i18n/translations'
import { HistoryList } from '@/components/ui/HistoryList'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { AI_COACH_COST, PLAN_COST } from '@/convex/lib/constants'
import { TabId } from '@/components/ui/BottomNav'
import { AppUserProfile } from '@/lib/types'

export function ProfileScreen({
  onBuy,
  onNavigate,
  onEditProfile,
}: {
  onBuy: () => void
  onNavigate: (t: TabId) => void
  onEditProfile: () => void
}) {
  const { user, transactions, profile } = useAppData()
  const { user: tgUser } = useTelegram()
  const { t, lang, setLang } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
            {t('profile.title')}
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--c-text)]">
            {user?.name ?? tgUser?.first_name ?? 'Athlete'}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-[var(--c-accent)] text-[var(--c-accent-text)] font-extrabold flex items-center justify-center">
          {(user?.name?.[0] ?? tgUser?.first_name?.[0] ?? 'U').toUpperCase()}
        </div>
      </div>

      <BalanceCard balance={user?.pointsBalance ?? 0} onBuy={onBuy} />

      {/* Language */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Languages size={16} className="text-[var(--c-accent)]" />
          <h3 className="font-bold text-[var(--c-text)]">{t('profile.language')}</h3>
        </div>
        <div className="flex gap-2">
          {(['en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={
                lang === l
                  ? 'flex-1 py-2.5 rounded-xl font-bold bg-[var(--c-accent)] text-[var(--c-accent-text)]'
                  : 'flex-1 py-2.5 rounded-xl font-bold bg-[var(--c-surface-2)] text-[var(--c-text)]'
              }
              style={lang !== l ? { border: '1px solid var(--c-border)' } : undefined}
            >
              {l === 'en' ? 'English' : 'العربية'}
            </button>
          ))}
        </div>
      </div>

      {/* Profile summary */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[var(--c-text)]">{t('profile.myProfile')}</h3>
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1 text-xs font-bold text-[var(--c-accent)]"
          >
            <Pencil size={14} />
            {t('profile.editProfile')}
          </button>
        </div>
        {profile ? (
          <ProfileSummary profile={profile} />
        ) : (
          <p className="text-sm text-[var(--c-muted)]">{t('profile.notSet')}</p>
        )}
      </div>

      <div className="space-y-3">
        <FeatureRow
          icon={Bot}
          title={t('profile.aiCoach')}
          desc={t('profile.aiCoachDesc')}
          cost={AI_COACH_COST}
          onClick={() => onNavigate('coach')}
        />
        <FeatureRow
          icon={ClipboardList}
          title={t('profile.plan')}
          desc={t('profile.planDesc')}
          cost={PLAN_COST}
          onClick={() => onNavigate('plan')}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[var(--c-text)]">{t('profile.history')}</h3>
        </div>
        <HistoryList transactions={transactions} />
      </div>
    </div>
  )
}

function ProfileSummary({ profile }: { profile: AppUserProfile }) {
  const { t } = useLanguage()
  const rows: { label: string; value: string }[] = [
    { label: t('profile.goal'), value: goalLabel(profile.goal, t) },
    { label: t('profile.level'), value: levelLabel(profile.level, t) },
    { label: t('profile.experience'), value: experienceLabel(profile.experience, t) },
    { label: t('profile.weeklyDays'), value: String(profile.weeklyDays) },
  ]
  if (profile.equipment.length > 0) {
    rows.push({ label: t('profile.equipment'), value: profile.equipment.map((e) => equipmentLabel(e, t)).join(', ') })
  }
  if (profile.heightCm != null) rows.push({ label: t('profile.height'), value: `${profile.heightCm} cm` })
  if (profile.weightKg != null) rows.push({ label: t('profile.weight'), value: `${profile.weightKg} kg` })
  if (profile.targetWeightKg != null) rows.push({ label: t('profile.targetWeight'), value: `${profile.targetWeightKg} kg` })
  if (profile.age != null) rows.push({ label: t('profile.age'), value: String(profile.age) })
  if (profile.gender) rows.push({ label: t('profile.gender'), value: profile.gender === 'male' ? t('onboarding.genderMale') : t('onboarding.genderFemale') })
  if (profile.limitations) rows.push({ label: t('profile.limitations'), value: profile.limitations })
  if (profile.diet) rows.push({ label: t('profile.diet'), value: profile.diet })

  return (
    <dl className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start justify-between gap-4">
          <dt className="text-xs font-semibold text-[var(--c-muted)] shrink-0">{r.label}</dt>
          <dd className="text-sm font-semibold text-[var(--c-text)] text-end">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function goalLabel(goal: string, t: (k: string) => string): string {
  switch (goal) {
    case 'muscle_gain':
      return t('onboarding.goalMuscle')
    case 'fat_loss':
      return t('onboarding.goalFat')
    case 'endurance':
      return t('onboarding.goalEndurance')
    default:
      return t('onboarding.goalGeneral')
  }
}

function levelLabel(level: string, t: (k: string) => string): string {
  switch (level) {
    case 'beginner':
      return t('onboarding.levelBeginner')
    case 'advanced':
      return t('onboarding.levelAdvanced')
    default:
      return t('onboarding.levelIntermediate')
  }
}

function experienceLabel(experience: string, t: (k: string) => string): string {
  switch (experience) {
    case 'new':
      return t('onboarding.experienceNew')
    case 'experienced':
      return t('onboarding.experienceExperienced')
    default:
      return t('onboarding.experienceSome')
  }
}

function equipmentLabel(e: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    bodyweight: 'onboarding.eqBodyweight',
    dumbbells: 'onboarding.eqDumbbells',
    barbell: 'onboarding.eqBarbell',
    machine: 'onboarding.eqMachine',
    cable: 'onboarding.eqCable',
    bands: 'onboarding.eqBands',
    kettlebell: 'onboarding.eqKettlebell',
  }
  return map[e] ? t(map[e]) : e
}

function FeatureRow({
  icon: Icon,
  title,
  desc,
  cost,
  onClick,
}: {
  icon: typeof Bot
  title: string
  desc: string
  cost: number
  onClick: () => void
}) {
  const { t } = useLanguage()
  return (
    <button
      onClick={onClick}
      className="w-full card p-4 flex items-center gap-4 text-start active:scale-[0.99] transition"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center shrink-0">
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--c-text)]">{title}</p>
        <p className="text-xs text-[var(--c-muted)] truncate">{desc}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-xs font-bold text-[var(--c-accent)]">
          {cost} {t('profile.pts')}
        </span>
        <ChevronRight size={16} className="text-[var(--c-muted)] rtl:rotate-180" />
      </div>
    </button>
  )
}
