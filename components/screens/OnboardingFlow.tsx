'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Gift,
  Languages,
  Ruler,
  Sparkles,
  StickyNote,
} from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Language } from '@/lib/i18n/translations'
import { useHaptic } from '@/hooks/useHaptic'
import { WELCOME_POINTS } from '@/convex/lib/constants'
import { formatPoints } from '@/lib/telegram'
import { AppUserProfile, ProfileAnswers } from '@/lib/types'

const GOALS = ['muscle_gain', 'fat_loss', 'endurance', 'general'] as const
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
const EXPERIENCES = ['new', 'some', 'experienced'] as const
const EQUIPMENT = ['bodyweight', 'dumbbells', 'barbell', 'machine', 'cable', 'bands', 'kettlebell'] as const
const GENDERS = ['male', 'female'] as const

interface FormState {
  goal: string
  level: string
  experience: string
  weeklyDays: number
  equipment: string[]
  age: string
  gender: string
  heightCm: string
  weightKg: string
  targetWeightKg: string
  limitations: string
  diet: string
}

function initialState(profile: AppUserProfile | null): FormState {
  return {
    goal: profile?.goal ?? '',
    level: profile?.level ?? '',
    experience: profile?.experience ?? '',
    weeklyDays: profile?.weeklyDays ?? 3,
    equipment: profile?.equipment ?? [],
    age: profile?.age != null ? String(profile.age) : '',
    gender: profile?.gender ?? '',
    heightCm: profile?.heightCm != null ? String(profile.heightCm) : '',
    weightKg: profile?.weightKg != null ? String(profile.weightKg) : '',
    targetWeightKg: profile?.targetWeightKg != null ? String(profile.targetWeightKg) : '',
    limitations: profile?.limitations ?? '',
    diet: profile?.diet ?? '',
  }
}

const STEPS = ['language', 'goal', 'level', 'experience', 'schedule', 'equipment', 'body', 'notes'] as const

export function OnboardingFlow({
  mode,
  onClose,
  onComplete,
}: {
  mode: 'onboarding' | 'edit'
  onClose?: () => void
  onComplete: () => void
}) {
  const { saveProfile, profile } = useAppData()
  const { lang, setLang, t } = useLanguage()
  const { impact } = useHaptic()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() => initialState(profile))
  const [saving, setSaving] = useState(false)

  const total = STEPS.length

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const toggleEquipment = (id: string) =>
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(id)
        ? f.equipment.filter((e) => e !== id)
        : [...f.equipment, id],
    }))

  const canAdvance = useMemo(() => {
    switch (STEPS[step]) {
      case 'goal':
        return form.goal !== ''
      case 'level':
        return form.level !== ''
      case 'experience':
        return form.experience !== ''
      default:
        return true
    }
  }, [step, form])

  const next = () => {
    if (!canAdvance) return
    impact('light')
    if (step < total - 1) setStep((s) => s + 1)
    else finish()
  }
  const back = () => {
    impact('light')
    if (step > 0) setStep((s) => s - 1)
  }

  const finish = async () => {
    if (saving) return
    setSaving(true)
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
    const answers: ProfileAnswers = {
      goal: form.goal || 'general',
      level: form.level || 'intermediate',
      experience: form.experience || 'some',
      weeklyDays: form.weeklyDays,
      equipment: form.equipment,
      age: num(form.age),
      gender: form.gender || undefined,
      heightCm: num(form.heightCm),
      weightKg: num(form.weightKg),
      targetWeightKg: num(form.targetWeightKg),
      limitations: form.limitations.trim() || undefined,
      diet: form.diet.trim() || undefined,
    }
    try {
      await saveProfile(answers, lang)
      onComplete()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const pct = Math.round(((step + 1) / total) * 100)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--c-bg)] text-[var(--c-text)] safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        {mode === 'edit' && step === 0 ? (
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--c-surface-2)] text-[var(--c-muted)]"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--c-muted)]">
            {t('onboarding.step', { step: step + 1, total })}
          </span>
        )}
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-[var(--c-surface-2)] overflow-hidden">
          <div className="h-full bg-[var(--c-accent)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {step === 0 && (
          <StepShell icon={<Gift size={22} />}>
            <h1 className="text-2xl font-extrabold">{t('onboarding.welcomeTitle')}</h1>
            <p className="text-sm text-[var(--c-muted)] mt-2">
              {t('onboarding.welcomeSub', { points: formatPoints(WELCOME_POINTS) })}
            </p>
            <LanguagePick lang={lang} setLang={setLang} />
          </StepShell>
        )}

        {step === 1 && (
          <StepShell icon={<Sparkles size={22} />}>
            <StepTitle title={t('onboarding.goalTitle')} sub={t('onboarding.goalSub')} />
            <div className="space-y-2">
              {GOALS.map((g) => (
                <Option
                  key={g}
                  selected={form.goal === g}
                  onClick={() => set({ goal: g })}
                  label={t(`onboarding.goal${cap(g)}`)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell icon={<Dumbbell size={22} />}>
            <StepTitle title={t('onboarding.levelTitle')} sub={t('onboarding.levelSub')} />
            <div className="space-y-2">
              {LEVELS.map((l) => (
                <Option
                  key={l}
                  selected={form.level === l}
                  onClick={() => set({ level: l })}
                  label={t(`onboarding.level${cap(l)}`)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell icon={<Dumbbell size={22} />}>
            <StepTitle title={t('onboarding.levelTitle')} sub={t('onboarding.levelSub')} />
            <div className="space-y-2">
              {EXPERIENCES.map((x) => (
                <Option
                  key={x}
                  selected={form.experience === x}
                  onClick={() => set({ experience: x })}
                  label={t(`onboarding.experience${cap(x)}`)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell icon={<Sparkles size={22} />}>
            <StepTitle title={t('onboarding.scheduleTitle')} sub={t('onboarding.scheduleSub')} />
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => set({ weeklyDays: d })}
                  className={clsx(
                    'flex-1 aspect-square rounded-xl font-extrabold text-lg transition active:scale-95',
                    form.weeklyDays === d
                      ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
                      : 'bg-[var(--c-surface-2)] text-[var(--c-text)]',
                  )}
                  style={form.weeklyDays !== d ? { border: '1px solid var(--c-border)' } : undefined}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-[var(--c-muted)] mt-2">
              {form.weeklyDays} {t('profile.weeklyDays').toLowerCase()}
            </p>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell icon={<Dumbbell size={22} />}>
            <StepTitle title={t('onboarding.equipmentTitle')} sub={t('onboarding.equipmentSub')} />
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((e) => (
                <Chip
                  key={e}
                  selected={form.equipment.includes(e)}
                  onClick={() => toggleEquipment(e)}
                  label={t(`onboarding.eq${cap(e)}`)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell icon={<Ruler size={22} />}>
            <StepTitle title={t('onboarding.bodyTitle')} sub={t('onboarding.bodySub')} />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('onboarding.age')} value={form.age} onChange={(v) => set({ age: v })} type="number" />
                <SelectField
                  label={t('onboarding.gender')}
                  value={form.gender}
                  onChange={(v) => set({ gender: v })}
                  options={GENDERS.map((g) => ({ value: g, label: t(`onboarding.gender${cap(g)}`) }))}
                />
                <Field label={t('onboarding.heightCm')} value={form.heightCm} onChange={(v) => set({ heightCm: v })} type="number" />
                <Field label={t('onboarding.weightKg')} value={form.weightKg} onChange={(v) => set({ weightKg: v })} type="number" />
              </div>
              <Field label={t('onboarding.targetKg')} value={form.targetWeightKg} onChange={(v) => set({ targetWeightKg: v })} type="number" />
            </div>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell icon={<StickyNote size={22} />}>
            <StepTitle title={t('onboarding.notesTitle')} sub={t('onboarding.notesSub')} />
            <div className="space-y-3">
              <TextArea label={t('onboarding.limitations')} value={form.limitations} onChange={(v) => set({ limitations: v })} />
              <TextArea label={t('onboarding.diet')} value={form.diet} onChange={(v) => set({ diet: v })} />
            </div>
          </StepShell>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-6 pt-2 flex gap-3">
        {step > 0 && (
          <button onClick={back} className="btn-surface flex items-center justify-center gap-1">
            <ChevronLeft size={18} className="rtl:rotate-180" />
            {t('onboarding.back')}
          </button>
        )}
        <button
          onClick={next}
          disabled={!canAdvance || saving}
          className="btn-accent flex-1 flex items-center justify-center gap-1 py-3 disabled:opacity-40"
        >
          {saving
            ? t('onboarding.saving')
            : step === total - 1
              ? t('onboarding.finish')
              : step === 0
                ? t('onboarding.start')
                : t('onboarding.next')}
          {!saving && step !== total - 1 && <ChevronRight size={18} className="rtl:rotate-180" />}
        </button>
      </div>
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function StepShell({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="w-12 h-12 rounded-2xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center mb-4">
        {icon}
      </div>
      {children}
    </div>
  )
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <p className="text-sm text-[var(--c-muted)] mt-1">{sub}</p>
    </div>
  )
}

function Option({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center justify-between p-4 rounded-2xl font-semibold transition active:scale-[0.99]',
        selected ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text)]',
      )}
      style={!selected ? { border: '1px solid var(--c-border)' } : undefined}
    >
      {label}
      {selected && <Check size={18} strokeWidth={3} />}
    </button>
  )
}

function Chip({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2.5 rounded-full text-sm font-semibold transition active:scale-95',
        selected ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text)]',
      )}
      style={!selected ? { border: '1px solid var(--c-border)' } : undefined}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--c-muted)]">{label}</span>
      <input
        value={value}
        type={type ?? 'text'}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
        style={{ border: '1px solid var(--c-border)' }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--c-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
        style={{ border: '1px solid var(--c-border)' }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--c-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none resize-none"
        style={{ border: '1px solid var(--c-border)' }}
      />
    </label>
  )
}

function LanguagePick({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const { t } = useLanguage()
  const opts: { id: Language; label: string }[] = [
    { id: 'en', label: t('onboarding.english') },
    { id: 'ar', label: t('onboarding.arabic') },
  ]
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-[var(--c-accent)] mb-2">
        <Languages size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">{t('onboarding.language')}</span>
      </div>
      <div className="space-y-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setLang(o.id)}
            className={clsx(
              'w-full flex items-center justify-between p-4 rounded-2xl font-semibold transition active:scale-[0.99]',
              lang === o.id
                ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
                : 'bg-[var(--c-surface-2)] text-[var(--c-text)]',
            )}
            style={lang !== o.id ? { border: '1px solid var(--c-border)' } : undefined}
          >
            {o.label}
            {lang === o.id && <Check size={18} strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  )
}
