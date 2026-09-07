'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

export function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="card p-3.5">
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          accent
            ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)]'
            : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)]',
        )}
      >
        {icon}
      </div>
      <p className="mt-2.5 text-xl font-extrabold text-[var(--c-text)]">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted)]">
        {label}
      </p>
    </div>
  )
}
