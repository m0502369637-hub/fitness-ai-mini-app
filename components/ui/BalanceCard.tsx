'use client'

import { Plus, Zap } from 'lucide-react'
import { formatPoints } from '@/lib/telegram'

export function BalanceCard({ balance, onBuy }: { balance: number; onBuy: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Your balance</p>
          <p className="text-3xl font-bold mt-1 flex items-center gap-2">
            <Zap size={22} className="fill-white/20" />
            {formatPoints(balance)}
          </p>
          <p className="text-xs text-white/70 mt-0.5">points</p>
        </div>
        <button
          onClick={onBuy}
          className="flex items-center gap-1.5 bg-white text-emerald-600 font-semibold text-sm px-4 py-2.5 rounded-xl active:scale-95 transition"
        >
          <Plus size={16} />
          Buy
        </button>
      </div>
    </div>
  )
}
