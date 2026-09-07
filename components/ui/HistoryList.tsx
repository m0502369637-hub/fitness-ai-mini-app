'use client'

import { AppTransaction } from '@/lib/types'
import { formatPoints, formatTimestamp } from '@/lib/telegram'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

const TYPE_META: Record<string, { icon: string; key: string }> = {
  welcome: { icon: '🎁', key: 'history.welcome' },
  purchase: { icon: '💳', key: 'history.purchase' },
  use_ai: { icon: '🤖', key: 'history.use_ai' },
  use_plan: { icon: '📋', key: 'history.use_plan' },
  refund: { icon: '↩️', key: 'history.refund' },
}

export function HistoryList({ transactions }: { transactions: AppTransaction[] }) {
  const { t } = useLanguage()
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-[var(--c-muted)] text-center py-6">{t('history.empty')}</p>
    )
  }

  return (
    <ul className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
      {transactions.map((tx) => {
        const meta = TYPE_META[tx.type] ?? { icon: '•', key: tx.type }
        const positive = tx.amount > 0
        return (
          <li key={tx._id} className="flex items-center gap-3 py-3">
            <span className="text-lg w-7 text-center">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--c-text)] truncate">
                {tx.description ?? t(meta.key)}
              </p>
              <p className="text-xs text-[var(--c-muted)]">{formatTimestamp(tx.timestamp)}</p>
            </div>
            <span
              className={
                positive
                  ? 'text-[var(--c-accent)] font-bold'
                  : 'text-[var(--c-text)] font-bold'
              }
            >
              {positive ? '+' : ''}
              {formatPoints(tx.amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
