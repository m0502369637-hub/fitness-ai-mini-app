'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
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

function localDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocal(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime()
}

function addDays(dateStr: string, days: number): string {
  return localDateInput(new Date(parseLocal(dateStr) + days * 86400000))
}

function weeksSpan(startStr: string, endStr: string): number {
  return Math.round((parseLocal(endStr) - parseLocal(startStr)) / (7 * 86400000))
}

interface ProgramView {
  _id: string
  title: string
  days: AppPlanDay[]
  durationWeeks?: number
  startDate?: number
  endDate?: number
  createdAt?: number
}

export function PlanScreen({ onBuy }: { onBuy: () => void }) {
  const { generatePlan, plans, exerciseLogs, progress, toggleExercise, profile } = useAppData()
  const { t, lang } = useLanguage()
  const { impact } = useHaptic()
  const [goal, setGoal] = useState<string>(() => goalFromProfile(profile?.goal))
  const [level, setLevel] = useState<string>(() => levelFromProfile(profile?.level))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedPlan | null>(null)

  // Program period: user picks a start + end date, clamped to ≤ 8 weeks per generation.
  const [startDate, setStartDate] = useState(() => localDateInput(new Date()))
  const [endDate, setEndDate] = useState(() => addDays(localDateInput(new Date()), 8 * 7))
  const selectedWeeks = Math.max(1, Math.min(8, weeksSpan(startDate, endDate)))

  // Summary numbers: how many plans, exercises total + done, active plan period.
  const totalExercises = plans.reduce(
    (s, p) => s + p.days.reduce((a, d) => a + d.exercises.length, 0),
    0,
  )
  const doneTotal = exerciseLogs.filter((l) => l.completed).length
  const latest = plans[0]
  const latestWeeks = latest?.durationWeeks ?? 8
  const latestEnd = latest?.endDate ?? (latest ? latest.createdAt + latestWeeks * 7 * 86400000 : undefined)
  const endDateLabel = latestEnd
    ? new Date(latestEnd).toLocaleDateString(lang === 'ar' ? 'ar' : undefined, {
        month: 'short',
        day: 'numeric',
      })
    : ''

  const generate = async () => {
    if (loading) return
    impact('medium')
    setLoading(true)
    const start = parseLocal(startDate)
    let end = parseLocal(endDate)
    const maxEnd = start + 8 * 7 * 86400000
    if (end <= start) end = start + 8 * 7 * 86400000
    else if (end > maxEnd) {
      end = maxEnd
      toast.warning(t('plan.maxPeriod'))
    }
    const res = await generatePlan(goal, level, start, end)
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

      {/* Summary hero: plans · exercises done · period + rollups */}
      <div className="card overflow-hidden">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--c-muted)]">
            <span>{t('plan.plansCount', { count: plans.length })}</span>
            {latest && (
              <span className="truncate">
                {t('plan.period', { weeks: latestWeeks })} · {t('plan.ends', { date: endDateLabel })}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-[var(--c-text)] leading-none">
                {doneTotal}
                <span className="text-base font-bold text-[var(--c-muted)]"> / {totalExercises}</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted)] mt-1">
                {t('plan.exercisesDone')}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 px-4 pb-3 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          <ProgressStat icon={<Flame size={16} />} label={t('plan.today')} value={progress.today} />
          <ProgressStat icon={<CalendarDays size={16} />} label={t('plan.week')} value={progress.week} />
          <ProgressStat icon={<CalendarRange size={16} />} label={t('plan.month')} value={progress.month} />
          <ProgressStat icon={<Trophy size={16} />} label={t('plan.allTime')} value={progress.all} />
        </div>
      </div>

      {/* Generator */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <p className="font-bold text-[var(--c-text)]">{t('plan.generate', { cost: PLAN_COST })}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Program period (start → end, max 8 weeks) */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              {t('plan.startDate')}
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
              style={{ border: '1px solid var(--c-border)', colorScheme: 'dark' }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              {t('plan.endDate')}
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
              style={{ border: '1px solid var(--c-border)', colorScheme: 'dark' }}
            />
          </label>
        </div>

        {/* Quick period presets */}
        <div className="flex items-center gap-2">
          {[4, 6, 8].map((w) => (
            <button
              key={w}
              onClick={() => setEndDate(addDays(startDate, w * 7))}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-bold transition active:scale-95',
                selectedWeeks === w
                  ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
                  : 'bg-[var(--c-surface-2)] text-[var(--c-text)]',
              )}
              style={selectedWeeks !== w ? { border: '1px solid var(--c-border)' } : undefined}
            >
              {w}w
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[var(--c-muted)]">
          {t('plan.periodLabel', { weeks: selectedWeeks })} · {t('plan.maxPeriod')}
        </p>

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
        <ProgramSection
          plan={{ ...result, createdAt: Date.now() }}
          logs={exerciseLogs}
          onToggle={toggleExercise}
          highlighted
          isActive
        />
      )}

      {/* Saved plans */}
      {others.map((p, i) => (
        <ProgramSection
          key={p._id}
          plan={p}
          logs={exerciseLogs}
          onToggle={toggleExercise}
          isActive={i === 0 && !result}
        />
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

function ProgramSection({
  plan,
  logs,
  onToggle,
  highlighted,
  isActive,
}: {
  plan: ProgramView
  logs: AppExerciseLog[]
  onToggle: (args: {
    planId: string
    dayIndex: number
    exerciseIndex: number
    exerciseId?: string
    completed: boolean
  }) => void
  highlighted?: boolean
  isActive?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  const weeks = plan.durationWeeks ?? 8
  const currentWeek = useMemo(() => {
    if (!plan.createdAt) return 1
    const elapsed = Date.now() - plan.createdAt
    const w = Math.floor(elapsed / (7 * 86400000)) + 1
    return Math.min(Math.max(w, 1), weeks)
  }, [plan.createdAt, weeks])

  const { completed, total } = useMemo(() => {
    let t = 0
    let c = 0
    plan.days.forEach((d, di) =>
      d.exercises.forEach((_, ei) => {
        t += 1
        if (isDone(logs, plan._id, di, ei)) c += 1
      }),
    )
    return { completed: c, total: t }
  }, [plan, logs])

  const pct = total ? Math.round((completed / total) * 100) : 0

  // First day (in order) that still has an incomplete exercise.
  const upNextIndex = useMemo(() => {
    for (let di = 0; di < plan.days.length; di++) {
      const d = plan.days[di]
      const incomplete = d.exercises.some((_, ei) => !isDone(logs, plan._id, di, ei))
      if (incomplete) return di
    }
    return -1
  }, [plan, logs])

  return (
    <div
      className={clsx(
        'card overflow-hidden',
        highlighted && 'ring-2 ring-[var(--c-accent)]',
        isActive && 'bg-[var(--c-surface)]',
      )}
    >
      {/* Header */}
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 text-start">
        <div
          className={clsx(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
            isActive ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]' : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)]',
          )}
        >
          <Dumbbell size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--c-accent-soft)] text-[var(--c-accent)] text-[9px] font-bold uppercase tracking-wide">
                {t('plan.activePlan')}
              </span>
            )}
            <p className="font-extrabold text-[var(--c-text)] truncate">{plan.title}</p>
          </div>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">
            {t('plan.done', { done: completed, total })} · {t('plan.period', { weeks })}
          </p>
        </div>
        <ChevronDown size={18} className={clsx('text-[var(--c-muted)] transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-2 rounded-full bg-[var(--c-surface-2)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--c-accent)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Progress chart across the program period */}
          <PlanProgressChart plan={plan} logs={logs} />

          {/* Week strip — visualize the program period */}
          <WeekStrip weeks={weeks} current={currentWeek} />

          {plan.days.map((day, di) => (
            <DayCard
              key={di}
              day={day}
              dayIndex={di}
              planId={plan._id}
              logs={logs}
              onToggle={onToggle}
              upNext={di === upNextIndex}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanProgressChart({ plan, logs }: { plan: ProgramView; logs: AppExerciseLog[] }) {
  const { t } = useLanguage()
  const weeks = plan.durationWeeks ?? 8
  const start = plan.startDate ?? plan.createdAt ?? Date.now()
  const buckets = Array.from({ length: weeks }, () => 0)
  for (const l of logs) {
    if (!l.completed || l.planId !== plan._id) continue
    const w = Math.floor((l.completedAt - start) / (7 * 86400000))
    if (w >= 0 && w < weeks) buckets[w] += 1
  }
  const max = Math.max(...buckets, 1)
  const doneInProgram = buckets.reduce((a, b) => a + b, 0)
  return (
    <div className="rounded-2xl bg-[var(--c-surface-2)] p-3" style={{ border: '1px solid var(--c-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--c-muted)]">
          {t('plan.chartTitle')}
        </p>
        <span className="text-xs font-bold text-[var(--c-accent)]">
          {doneInProgram} {t('plan.exercisesDone')}
        </span>
      </div>
      <div className="flex items-end justify-between gap-1 h-20">
        {buckets.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div
              className="w-full rounded-md"
              style={{
                height: `${Math.max(6, (v / max) * 100)}%`,
                backgroundColor: v > 0 ? 'var(--c-accent)' : 'var(--c-surface)',
              }}
            />
            <span className="text-[9px] font-bold text-[var(--c-muted)]">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekStrip({ weeks, current }: { weeks: number; current: number }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)] mr-1">
        <Clock size={12} className="inline -mt-0.5" /> {t('plan.period', { weeks })}
      </span>
      {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
        <div
          key={w}
          className={clsx(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold',
            w === current
              ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
              : 'bg-[var(--c-surface-2)] text-[var(--c-muted)]',
          )}
          style={w !== current ? { border: '1px solid var(--c-border)' } : undefined}
        >
          {w}
        </div>
      ))}
    </div>
  )
}

function DayCard({
  day,
  dayIndex,
  planId,
  logs,
  onToggle,
  upNext,
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
  upNext?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  const done = day.exercises.filter((_, ei) => isDone(logs, planId, dayIndex, ei)).length
  const pct = day.exercises.length ? Math.round((done / day.exercises.length) * 100) : 0

  return (
    <div className="rounded-2xl bg-[var(--c-surface-2)] p-3" style={{ border: '1px solid var(--c-border)' }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-start">
        <div className="flex items-center gap-2 min-w-0">
          {upNext && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--c-accent)] animate-pulse" />
          )}
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--c-accent)]">
            {day.day}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {upNext && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--c-accent)]">
              {t('plan.upNext')}
            </span>
          )}
          <span className="text-[11px] font-bold text-[var(--c-muted)]">
            {done}/{day.exercises.length}
          </span>
          <ChevronDown size={14} className={clsx('text-[var(--c-muted)] transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Day progress bar */}
      <div className="h-1 mt-2 rounded-full bg-[var(--c-surface)] overflow-hidden">
        <div className="h-full bg-[var(--c-accent)] transition-all" style={{ width: `${pct}%` }} />
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          {day.exercises.map((ex, ei) => (
            <ExerciseCard
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
      )}
    </div>
  )
}

function ExerciseCard({
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

  // Localized rich media: new plans inline, otherwise catalog lookup by id/name.
  const cat = findCatalogExercise(ex.exerciseId ?? ex.name)
  const isAr = lang === 'ar'
  const images = ex.images && ex.images.length > 0 ? ex.images : (cat?.images ?? [])
  const name = isAr && cat?.nameAr ? cat.nameAr : ex.name
  const instructions =
    isAr && cat?.instructionsAr && cat.instructionsAr.length > 0
      ? cat.instructionsAr
      : ex.instructions && ex.instructions.length > 0
        ? ex.instructions
        : (cat?.instructions ?? [])
  const muscles =
    [ex.primaryMuscles?.join(', '), ex.secondaryMuscles?.join(', ')]
      .filter(Boolean)
      .join(' · ') ||
    (cat ? [cat.primaryMuscles.join(', '), cat.secondaryMuscles.join(', ')].filter(Boolean).join(' · ') : '') ||
    ex.equipment ||
    (cat?.equipment ?? '') ||
    t('plan.exercise')

  return (
    <div className="rounded-xl bg-[var(--c-surface)] p-2.5" style={{ border: '1px solid var(--c-border)' }}>
      <div className="flex items-center gap-2.5">
        {/* Image (first frame) — tap to expand how-to */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="relative w-12 h-12 shrink-0 rounded-xl bg-[var(--c-surface-2)] overflow-hidden"
        >
          <Dumbbell size={18} className="absolute inset-0 m-auto text-[var(--c-muted)]" />
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
        </button>

        {/* Details */}
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 min-w-0 text-start">
          <p className={clsx('font-bold text-sm truncate', done ? 'text-[var(--c-muted)] line-through' : 'text-[var(--c-text)]')}>
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
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-90',
            done ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]' : 'bg-transparent text-transparent',
          )}
          style={!done ? { border: '2px solid var(--c-muted)' } : undefined}
          aria-label={done ? 'done' : 'not done'}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      </div>

      {/* How-to: form frames + numbered instructions */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 space-y-2.5" style={{ borderTop: '1px solid var(--c-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)]">
            {t('plan.howTo')}
          </p>
          {images.length > 0 && (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, minmax(0, 1fr))` }}
            >
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--c-surface-2)]">
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
    (l) => l.planId === planId && l.dayIndex === dayIndex && l.exerciseIndex === exerciseIndex && l.completed,
  )
}
