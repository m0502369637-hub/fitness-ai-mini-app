'use client'

import { Bot, ChevronRight, ClipboardList } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { HistoryList } from '@/components/ui/HistoryList'
import { AI_COACH_COST, PLAN_COST } from '@/convex/lib/constants'
import { TabId } from '@/components/ui/BottomNav'

export function HomeScreen({
  onNavigate,
  onBuy,
}: {
  onNavigate: (t: TabId) => void
  onBuy: () => void
}) {
  const { user, transactions } = useAppData()
  const recent = transactions.slice(0, 5)

  return (
    <div className="space-y-4">
      <BalanceCard balance={user?.pointsBalance ?? 0} onBuy={onBuy} />

      <div className="space-y-3">
        <FeatureCard
          icon={Bot}
          title="AI Coach"
          desc="Ask anything about training & nutrition"
          cost={AI_COACH_COST}
          onClick={() => onNavigate('coach')}
        />
        <FeatureCard
          icon={ClipboardList}
          title="Custom Workout Plan"
          desc="Generate a plan for your goal"
          cost={PLAN_COST}
          onClick={() => onNavigate('plan')}
        />
      </div>

      <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">Recent activity</h3>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs text-[var(--tg-theme-link-color)]"
          >
            See all
          </button>
        </div>
        <HistoryList transactions={recent} />
      </div>
    </div>
  )
}

function FeatureCard({
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
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] text-left active:scale-[0.99] transition w-full"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center shrink-0">
        <Icon size={24} className="text-[var(--tg-theme-button-color)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-[var(--tg-theme-hint-color)] truncate">{desc}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-xs font-semibold text-[var(--tg-theme-button-color)]">{cost} pts</span>
        <ChevronRight size={16} className="text-[var(--tg-theme-hint-color)]" />
      </div>
    </button>
  )
}
