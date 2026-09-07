'use client'

import { Gift } from 'lucide-react'
import { WELCOME_POINTS } from '@/convex/lib/constants'
import { formatPoints } from '@/lib/telegram'

export function WelcomePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-3xl bg-[var(--c-surface)] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--c-accent-soft)] flex items-center justify-center mb-4">
          <Gift size={32} className="text-[var(--c-accent)]" />
        </div>
        <h2 className="text-xl font-extrabold text-[var(--c-text)]">Welcome aboard! 🎉</h2>
        <p className="text-sm text-[var(--c-muted)] mt-2">
          You&apos;ve received{' '}
          <span className="font-bold text-[var(--c-accent)]">
            +{formatPoints(WELCOME_POINTS)} points
          </span>{' '}
          as a welcome gift to get started.
        </p>
        <button onClick={onClose} className="btn-accent w-full mt-5 py-3">
          Let&apos;s go
        </button>
      </div>
    </div>
  )
}
