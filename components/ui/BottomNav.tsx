'use client'

import { Bot, ClipboardList, Home, User } from 'lucide-react'
import clsx from 'clsx'

export type TabId = 'home' | 'coach' | 'plan' | 'profile'

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'coach', label: 'Coach', icon: Bot },
  { id: 'plan', label: 'Plan', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: User },
]

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-black/10 dark:border-white/10 bg-[var(--tg-theme-secondary-bg-color)] safe-area-bottom no-select">
      <div className="flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
              tab === id
                ? 'text-[var(--tg-theme-button-color)]'
                : 'text-[var(--tg-theme-hint-color)]',
            )}
          >
            <Icon size={20} strokeWidth={tab === id ? 2.4 : 2} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
