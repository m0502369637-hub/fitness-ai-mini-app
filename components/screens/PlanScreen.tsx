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
      <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-[var(--tg-theme-hint-color)]">Goal</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--tg-theme-bg-color)] text-sm outline-none"
          >
            {GOALS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[var(--tg-theme-hint-color)]">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[var(--tg-theme-bg-color)] text-sm outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>

        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <Sparkles size={16} />
          {loading ? 'Generating…' : `Generate plan (${PLAN_COST} pts)`}
        </button>
      </div>

      {result && <PlanCard plan={result} />}

      {plans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Saved plans</h3>
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
    <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Dumbbell size={16} className="text-[var(--tg-theme-button-color)]" />
        {plan.title}
      </h4>
      <div className="mt-3 space-y-3">
        {plan.days.map((d, i) => (
          <div key={i}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-theme-hint-color)]">
              {d.day}
            </p>
            <ul className="mt-1 space-y-1">
              {d.exercises.map((ex, j) => (
                <li key={j} className="flex justify-between text-sm">
                  <span>{ex.name}</span>
                  <span className="text-[var(--tg-theme-hint-color)]">
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
