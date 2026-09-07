'use client'

export function WeeklyChart({
  title,
  subtitle,
  values,
  labels,
}: {
  title: string
  subtitle?: string
  values: number[]
  labels: string[]
}) {
  const max = Math.max(...values, 1)
  return (
    <div className="card p-4">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-muted)]">
          {title}
        </p>
        <p className="text-lg font-bold text-[var(--c-text)]">{subtitle}</p>
      </div>
      <div className="flex items-end justify-between gap-2 h-28">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div
              className="w-full rounded-md"
              style={{
                height: `${Math.max(8, (v / max) * 100)}%`,
                backgroundColor: v > 0 ? 'var(--c-accent)' : 'var(--c-surface-2)',
              }}
            />
            <span className="text-[10px] font-semibold text-[var(--c-muted)]">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
