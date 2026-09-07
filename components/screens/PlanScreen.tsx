'use client'

import { useState } from 'react'
import { Dumbbell, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAppData } from '@/lib/appDataContext'
import { useHaptic } from '@/hooks/useHaptic'
import { PLAN_COST } from '@/convex/lib/constants'
import { AppPlan, GeneratedPlan } from '@/lib/types'

const GOALS = ['Muscle gain', 'Fat loss', 'Endurance', 'General fitness']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export function PlanScreen({ onBuy }: { onBuy: () => void }) {
  const { generatePlan, plans } = useAppData()
  const { impact } = useHaptic()
  const [goal, setGoal] = useState(GOALS[0])
  const [level, setLevel] = useState(LEVELS[1])
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
      toast.success('Plan generated!')
    } else if (res.reason === 'INSUFFICIENT_POINTS') {
      toast.error('Not enough points')
      onBuy()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
          Workout Plans
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--c-text)]">Build your plan</h1>
      </div>

      <div className="card p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
            Goal
          </span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
            style={{ border: '1px solid var(--c-border)' }}
          >
            {GOALS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
            Level
          </span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
            style={{ border: '1px solid var(--c-border)' }}
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>

        <button
          onClick={generate}
          disabled={loading}
          className="btn-accent w-full flex items-center justify-center gap-2 py-3"
        >
          <Sparkles size={16} />
          {loading ? 'Generating…' : `Generate plan (${PLAN_COST} pts)`}
        </button>
      </div>

      {result && <PlanCard plan={result} />}

      {plans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-[var(--c-text)]">Saved plans</h3>
          {plans.map((p) => (
            <PlanCard key={p._id} plan={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan }: { plan: GeneratedPlan | AppPlan }) {
  return (
    <div className="card p-4">
      <h4 className="font-extrabold text-[var(--c-text)] flex items-center gap-2">
        <Dumbbell size={16} className="text-[var(--c-accent)]" />
        {plan.title}
      </h4>
      <div className="mt-3 space-y-3">
        {plan.days.map((d, i) => (
          <div key={i}>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--c-accent)]">
              {d.day}
            </p>
            <ul className="mt-1 space-y-1">
              {d.exercises.map((ex, j) => (
                <li key={j} className="flex justify-between text-sm text-[var(--c-text)]">
                  <span>{ex.name}</span>
                  <span className="text-[var(--c-muted)]">
                    {ex.sets} × {ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
