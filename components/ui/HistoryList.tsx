'use client'

import { AppTransaction } from '@/lib/types'
import { formatPoints, formatTimestamp } from '@/lib/telegram'

const TYPE_META: Record<string, { icon: string; label: string }> = {
  welcome: { icon: '🎁', label: 'Welcome' },
  purchase: { icon: '💳', label: 'Purchase' },
  use_ai: { icon: '🤖', label: 'AI Coach' },
  use_plan: { icon: '📋', label: 'Workout Plan' },
  refund: { icon: '↩️', label: 'Refund' },
}

export function HistoryList({ transactions }: { transactions: AppTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-6">No activity yet.</p>
    )
  }

  return (
    <ul className="divide-y divide-black/5 dark:divide-white/5">
      {transactions.map((t) => {
        const meta = TYPE_META[t.type] ?? { icon: '•', label: t.type }
        const positive = t.amount > 0
        return (
          <li key={t._id} className="flex items-center gap-3 py-3">
            <span className="text-lg w-7 text-center">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.description ?? meta.label}</p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">{formatTimestamp(t.timestamp)}</p>
            </div>
            <span
              className={
                positive
                  ? 'text-emerald-500 font-semibold'
                  : 'text-[var(--tg-theme-text-color)] font-semibold'
              }
            >
              {positive ? '+' : ''}
              {formatPoints(t.amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
