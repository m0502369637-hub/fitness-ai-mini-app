'use client'

import { Plus, Zap } from 'lucide-react'
import { formatPoints } from '@/lib/telegram'

export function BalanceCard({ balance, onBuy }: { balance: number; onBuy: () => void }) {
  return (
    <div className="rounded-2xl p-5 bg-[var(--c-accent)] text-[var(--c-accent-text)] shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Your balance</p>
      <p className="text-3xl font-extrabold mt-1 flex items-center gap-2">
        <Zap size={22} className="opacity-70" />
        {formatPoints(balance)}
        <span className="text-sm font-bold opacity-70">pts</span>
      </p>
      <button
        onClick={onBuy}
        className="mt-3 flex items-center gap-1.5 bg-[var(--c-accent-text)] text-[var(--c-accent)] font-bold text-sm px-4 py-2.5 rounded-xl active:scale-95 transition"
      >
        <Plus size={16} />
        Add points
      </button>
    </div>
  )
}
