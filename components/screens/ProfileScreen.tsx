'use client'

import { Plus } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { useTelegram } from '@/providers/TelegramProvider'
import { HistoryList } from '@/components/ui/HistoryList'
import { formatPoints } from '@/lib/telegram'

export function ProfileScreen({ onBuy }: { onBuy: () => void }) {
  const { user, transactions } = useAppData()
  const { user: tgUser } = useTelegram()

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color)]/15 flex items-center justify-center text-lg font-bold text-[var(--tg-theme-button-color)]">
          {(user?.name?.[0] ?? tgUser?.first_name?.[0] ?? 'U').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.name ?? tgUser?.first_name ?? 'Athlete'}</p>
          {user?.username && (
            <p className="text-xs text-[var(--tg-theme-hint-color)]">@{user.username}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Balance</p>
          <p className="font-bold text-lg">⚡ {formatPoints(user?.pointsBalance ?? 0)}</p>
        </div>
      </div>

      <button
        onClick={onBuy}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <Plus size={18} /> Buy more points
      </button>

      <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
        <h3 className="font-semibold mb-1">Point history</h3>
        <HistoryList transactions={transactions} />
      </div>
    </div>
  )
}
