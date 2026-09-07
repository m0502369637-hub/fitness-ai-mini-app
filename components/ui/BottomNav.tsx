'use client'

import { Bot, ClipboardList, Home, User } from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

export type TabId = 'home' | 'coach' | 'plan' | 'profile'

const TABS: { id: TabId; key: string; icon: typeof Home }[] = [
  { id: 'home', key: 'nav.home', icon: Home },
  { id: 'coach', key: 'nav.coach', icon: Bot },
  { id: 'plan', key: 'nav.plan', icon: ClipboardList },
  { id: 'profile', key: 'nav.profile', icon: User },
]

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  const { t } = useLanguage()
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t bg-[var(--c-surface)] safe-area-bottom no-select"
      style={{ borderColor: 'var(--c-border)' }}
    >
      <div className="flex">
        {TABS.map(({ id, key, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors',
                active ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)]',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.6 : 2} />
              {t(key)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
