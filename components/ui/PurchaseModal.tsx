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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[var(--c-surface)] p-5 pb-8 safe-area-bottom"
        style={{ borderTop: '1px solid var(--c-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold text-[var(--c-text)]">Get more points</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[var(--c-surface-2)] text-[var(--c-muted)]"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--c-muted)] mb-4">
          Points power AI Coach queries and workout plans.
        </p>

        {isDemo && (
          <p className="text-xs text-[var(--c-accent)] mb-3">Demo mode — purchases are simulated.</p>
        )}

        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.key}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--c-surface-2)]"
              style={{ border: '1px solid var(--c-border)' }}
            >
              <div className="min-w-0">
                <p className="font-bold text-[var(--c-text)]">{pkg.title}</p>
                <p className="text-xs text-[var(--c-muted)] truncate">{pkg.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="font-bold text-[var(--c-text)] flex items-center gap-1">
                  <Star size={15} className="text-[var(--c-accent)] fill-[var(--c-accent)]" />
                  {pkg.stars}
                </span>
                <button onClick={() => handleBuy(pkg)} className="btn-accent text-sm px-4 py-2">
                  {formatPoints(pkg.points)}
                </button>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <p className="text-sm text-[var(--c-muted)] text-center py-4">
              No packages yet. Seed them with{' '}
              <code className="px-1 py-0.5 bg-[var(--c-surface-2)] rounded">
                npx convex run packages:seed
              </code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
