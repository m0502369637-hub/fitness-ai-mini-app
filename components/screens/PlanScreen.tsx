'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import clsx from 'clsx'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useHaptic } from '@/hooks/useHaptic'
import { PLAN_COST } from '@/convex/lib/constants'
import { findCatalogExercise } from '@/convex/lib/exercises'
import { AppExercise, AppExerciseLog, AppPlanDay, GeneratedPlan } from '@/lib/types'

const GOALS = [
  { value: 'Muscle gain', key: 'plan.goals.muscle' },
  { value: 'Fat loss', key: 'plan.goals.fat' },
  { value: 'Endurance', key: 'plan.goals.endurance' },
  { value: 'General fitness', key: 'plan.goals.general' },
]
const LEVELS = [
  { value: 'Beginner', key: 'plan.levels.beginner' },
  { value: 'Intermediate', key: 'plan.levels.intermediate' },
  { value: 'Advanced', key: 'plan.levels.advanced' },
]

function goalFromProfile(goal?: string): string {
  switch (goal) {
    case 'muscle_gain':
      return 'Muscle gain'
    case 'fat_loss':
      return 'Fat loss'
    case 'endurance':
      return 'Endurance'
    default:
      return 'General fitness'
  }
}

function levelFromProfile(level?: string): string {
  if (level === 'beginner' || level === 'advanced') {
    return level[0].toUpperCase() + level.slice(1)
  }
  return 'Intermediate'
}

interface PlanView {
  _id: string
  title: string
  days: AppPlanDay[]
}

export function PlanScreen({ onBuy }: { onBuy: () => void }) {
  const { generatePlan, plans, exerciseLogs, progress, toggleExercise, profile } = useAppData()
  const { t } = useLanguage()
  const { impact } = useHaptic()
  const [goal, setGoal] = useState<string>(() => goalFromProfile(profile?.goal))
  const [level, setLevel] = useState<string>(() => levelFromProfile(profile?.level))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedPlan | null>(null)

  const generate = async () => {
    if (loading) return
    impact('medium')
    setLoading(true)
    const res = await generatePlan(goal, level)
    setLoading(false)
    if (res.ok) {
      setResult(res.plan)
      toast.success(t('plan.generated'))
    } else if (res.reason === 'INSUFFICIENT_POINTS') {
      toast.error(t('plan.notEnough'))
      onBuy()
    }
  }

  const others = plans.filter((p) => p._id !== result?._id)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
          {t('plan.title')}
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--c-text)]">{t('plan.subtitle')}</h1>
      </div>

      {/* Progress rollups */}
      <div className="card p-3 grid grid-cols-4 gap-2">
        <ProgressStat icon={<Flame size={16} />} label={t('plan.today')} value={progress.today} />
        <ProgressStat icon={<CalendarDays size={16} />} label={t('plan.week')} value={progress.week} />
        <ProgressStat icon={<CalendarRange size={16} />} label={t('plan.month')} value={progress.month} />
        <ProgressStat icon={<Trophy size={16} />} label={t('plan.allTime')} value={progress.all} />
      </div>

      {/* Generator */}
      <div className="card p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
            {t('plan.goal')}
          </span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
            style={{ border: '1px solid var(--c-border)' }}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {t(g.key)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
            {t('plan.level')}
          </span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
            style={{ border: '1px solid var(--c-border)' }}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {t(l.key)}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-accent w-full flex items-center justify-center gap-2 py-3"
        >
          <Sparkles size={16} />
          {loading ? t('plan.generating') : t('plan.generate', { cost: PLAN_COST })}
        </button>
      </div>

      {/* Just-generated plan (highlighted) */}
      {result && (
        <PlanCard
          plan={result}
          logs={exerciseLogs}
          onToggle={toggleExercise}
          highlighted
        />
      )}

      {/* Saved plans */}
      {others.map((p) => (
        <PlanCard key={p._id} plan={p} logs={exerciseLogs} onToggle={toggleExercise} />
      ))}

      {!result && plans.length === 0 && (
        <div className="card p-6 text-center" style={{ borderStyle: 'dashed' }}>
          <Dumbbell size={28} className="mx-auto text-[var(--c-muted)]" />
          <p className="font-bold text-[var(--c-text)] mt-2">{t('plan.noPlans')}</p>
          <p className="text-sm text-[var(--c-muted)] mt-1">{t('plan.noPlansSub')}</p>
        </div>
      )}
    </div>
  )
}

function ProgressStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <span className="text-[var(--c-accent)]">{icon}</span>
      <span className="text-lg font-extrabold text-[var(--c-text)] leading-none">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--c-muted)]">
        {label}
      </span>
    </div>
  )
}

function PlanCard({
  plan,
  logs,
  onToggle,
  highlighted,
}: {
  plan: PlanView
  logs: AppExerciseLog[]
  onToggle: (args: {
    planId: string
    dayIndex: number
    exerciseIndex: number
    exerciseId?: string
    completed: boolean
  }) => void
  highlighted?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)

  const { completed, total } = useMemo(() => {
    let total = 0
    let completed = 0
    plan.days.forEach((d, di) =>
      d.exercises.forEach((_, ei) => {
        total += 1
        if (isDone(logs, plan._id, di, ei)) completed += 1
      }),
    )
    return { completed, total }
  }, [plan, logs])

  const pct = total ? Math.round((completed / total) * 100) : 0

  return (
    <div
      className={clsx('card overflow-hidden', highlighted && 'ring-2 ring-[var(--c-accent)]')}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-start"
      >
        <div className="w-11 h-11 rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center shrink-0">
          <Dumbbell size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[var(--c-text)] truncate">{plan.title}</p>
          <p className="text-xs text-[var(--c-muted)]">
            {t('plan.done', { done: completed, total })}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={clsx('text-[var(--c-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-[var(--c-surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--c-accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {plan.days.map((day, di) => (
            <DaySection
              key={di}
              day={day}
              dayIndex={di}
              planId={plan._id}
              logs={logs}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DaySection({
  day,
  dayIndex,
  planId,
  logs,
  onToggle,
}: {
  day: AppPlanDay
  dayIndex: number
  planId: string
  logs: AppExerciseLog[]
  onToggle: (args: {
    planId: string
    dayIndex: number
    exerciseIndex: number
    exerciseId?: string
    completed: boolean
  }) => void
}) {
  const done = day.exercises.filter((_, ei) => isDone(logs, planId, dayIndex, ei)).length
  return (
    <div>
      <div className="flex items-center justify-between px-1 py-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--c-accent)]">
          {day.day}
        </p>
        <span className="text-[11px] font-bold text-[var(--c-muted)]">
          {done}/{day.exercises.length}
        </span>
      </div>
      <div className="space-y-2">
        {day.exercises.map((ex, ei) => (
          <ExerciseRow
            key={ei}
            ex={ex}
            done={isDone(logs, planId, dayIndex, ei)}
            onToggle={(completed) =>
              onToggle({
                planId,
                dayIndex,
                exerciseIndex: ei,
                exerciseId: ex.exerciseId,
                completed,
              })
            }
          />
        ))}
      </div>
    </div>
  )
}

function ExerciseRow({
  ex,
  done,
  onToggle,
}: {
  ex: AppExercise
  done: boolean
  onToggle: (completed: boolean) => void
}) {
  const { t, lang } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  // Resolve rich media for this exercise. New plans carry images/instructions
  // inline; older plans (or demo data) fall back to a catalog lookup by id/name.
  // In Arabic, prefer the catalog's localized name + instructions.
  const cat = findCatalogExercise(ex.exerciseId ?? ex.name)
  const isAr = lang === 'ar'
  const images = ex.images && ex.images.length > 0 ? ex.images : (cat?.images ?? [])
  const name = isAr && cat?.nameAr ? cat.nameAr : ex.name
  const instructions = isAr && cat?.instructionsAr && cat.instructionsAr.length > 0
    ? cat.instructionsAr
    : ex.instructions && ex.instructions.length > 0
      ? ex.instructions
      : (cat?.instructions ?? [])
  const muscles =
    [ex.primaryMuscles?.join(', '), ex.secondaryMuscles?.join(', ')]
      .filter(Boolean)
      .join(' · ') ||
    (cat
      ? [cat.primaryMuscles.join(', '), cat.secondaryMuscles.join(', ')].filter(Boolean).join(' · ')
      : '') ||
    ex.equipment ||
    (cat?.equipment ?? '') ||
    t('plan.exercise')

  return (
    <div className="rounded-xl bg-[var(--c-surface-2)] p-3" style={{ border: '1px solid var(--c-border)' }}>
      <div className="flex items-center gap-3">
        {/* Image (first frame) */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="relative w-16 h-16 shrink-0 rounded-xl bg-[var(--c-surface)] overflow-hidden"
        >
          <Dumbbell size={20} className="absolute inset-0 m-auto text-[var(--c-muted)]" />
          {images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          {images.length > 1 && (
            <span className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px] font-bold bg-black/60 text-white rounded-tl">
              +{images.length - 1}
            </span>
          )}
        </button>

        {/* Details */}
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 min-w-0 text-start">
          <p className={clsx('font-bold text-sm', done ? 'text-[var(--c-muted)] line-through' : 'text-[var(--c-text)]')}>
            {name}
          </p>
          <p className="text-[11px] text-[var(--c-muted)] truncate">{muscles}</p>
          <p className="text-[11px] font-semibold text-[var(--c-accent)]">
            {ex.sets} × {ex.reps}
          </p>
        </button>

        {/* Tick */}
        <button
          onClick={() => onToggle(!done)}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition active:scale-90',
            done
              ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
              : 'bg-transparent text-transparent',
          )}
          style={!done ? { border: '2px solid var(--c-muted)' } : undefined}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      </div>

      {/* How-to: all form frames + numbered instructions */}
      {expanded && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          {images.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)] mb-2">
                {t('plan.howTo')}
              </p>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, minmax(0, 1fr))` }}
              >
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-[var(--c-surface)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${name} — form ${i + 1}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {instructions.length > 0 && (
            <ol className="space-y-1.5 text-xs text-[var(--c-muted)] list-decimal list-inside">
              {instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

function isDone(logs: AppExerciseLog[], planId: string, dayIndex: number, exerciseIndex: number) {
  return logs.some(
    (l) =>
      l.planId === planId &&
      l.dayIndex === dayIndex &&
      l.exerciseIndex === exerciseIndex &&
      l.completed,
  )
}
