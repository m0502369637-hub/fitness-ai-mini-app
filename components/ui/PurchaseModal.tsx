'use client'

import { useEffect } from 'react'
import { Star, X } from 'lucide-react'
import { useAppData } from '@/lib/appDataContext'
import { AppPackage } from '@/lib/types'
import { formatPoints } from '@/lib/telegram'

export function PurchaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { packages, buyPackage, isDemo } = useAppData()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handleBuy = async (pkg: AppPackage) => {
    await buyPackage(pkg)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[var(--tg-theme-secondary-bg-color)] p-5 pb-8 safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">Get more points</h2>
          <button onClick={onClose} className="p-1 rounded-full bg-black/5 dark:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--tg-theme-hint-color)] mb-4">
          Points are used for AI Coach queries and workout plans.
        </p>

        {isDemo && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Demo mode — purchases are simulated, no real charge.
          </p>
        )}

        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.key}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--tg-theme-bg-color)]"
            >
              <div className="min-w-0">
                <p className="font-semibold">{pkg.title}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color)] truncate">{pkg.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="font-bold flex items-center gap-1">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  {pkg.stars}
                </span>
                <button
                  onClick={() => handleBuy(pkg)}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {formatPoints(pkg.points)} pts
                </button>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
              No packages yet. Seed them with{' '}
              <code className="px-1 py-0.5 bg-[var(--tg-theme-bg-color)] rounded">npx convex run packages:seed</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
