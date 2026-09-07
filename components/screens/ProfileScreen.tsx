'use client'

import { Bot, ChevronRight, ClipboardList } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { useTelegram } from '@/providers/TelegramProvider'
import { HistoryList } from '@/components/ui/HistoryList'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { AI_COACH_COST, PLAN_COST } from '@/convex/lib/constants'
import { TabId } from '@/components/ui/BottomNav'

export function ProfileScreen({
  onBuy,
  onNavigate,
}: {
  onBuy: () => void
  onNavigate: (t: TabId) => void
}) {
  const { user, transactions } = useAppData()
  const { user: tgUser } = useTelegram()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
            Profile
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

      <div className="space-y-3">
        <FeatureRow
          icon={Bot}
          title="AI Coach"
          desc="Ask anything about training & nutrition"
          cost={AI_COACH_COST}
          onClick={() => onNavigate('coach')}
        />
        <FeatureRow
          icon={ClipboardList}
          title="Custom Workout Plan"
          desc="Generate a plan for your goal"
          cost={PLAN_COST}
          onClick={() => onNavigate('plan')}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[var(--c-text)]">Point history</h3>
        </div>
        <HistoryList transactions={transactions} />
      </div>
    </div>
  )
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
  return (
    <button
      onClick={onClick}
      className="w-full card p-4 flex items-center gap-4 text-left active:scale-[0.99] transition"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center shrink-0">
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--c-text)]">{title}</p>
        <p className="text-xs text-[var(--c-muted)] truncate">{desc}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-xs font-bold text-[var(--c-accent)]">{cost} pts</span>
        <ChevronRight size={16} className="text-[var(--c-muted)]" />
      </div>
    </button>
  )
}
