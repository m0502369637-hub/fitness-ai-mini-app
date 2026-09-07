'use client'

import { useEffect, useState } from 'react'
import { useTelegram } from '@/providers/TelegramProvider'
import { useAppData } from '@/lib/appDataContext'
import { formatPoints } from '@/lib/telegram'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { CoachScreen } from '@/components/screens/CoachScreen'
import { PlanScreen } from '@/components/screens/PlanScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { BottomNav, TabId } from '@/components/ui/BottomNav'
import { PurchaseModal } from '@/components/ui/PurchaseModal'
import { WelcomePopup } from '@/components/ui/WelcomePopup'

export default function Home() {
  const { isReady, user: tgUser } = useTelegram()
  const { isNewUser, user } = useAppData()
  const [tab, setTab] = useState<TabId>('home')
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    if (isNewUser) setWelcomeOpen(true)
  }, [isNewUser])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <div className="w-10 h-10 border-4 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 pt-4 pb-8 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">FitAI</h1>
            <p className="text-xs text-white/75">
              {tgUser?.first_name ? `Hi, ${tgUser.first_name}` : 'Fitness, powered by AI'}
            </p>
          </div>
          <button
            onClick={() => setPurchaseOpen(true)}
            className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 text-sm font-semibold active:scale-95 transition"
          >
            <span>⚡</span>
            <span>{formatPoints(user?.pointsBalance ?? 0)}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {tab === 'home' && (
          <HomeScreen onNavigate={setTab} onBuy={() => setPurchaseOpen(true)} />
        )}
        {tab === 'coach' && <CoachScreen onBuy={() => setPurchaseOpen(true)} />}
        {tab === 'plan' && <PlanScreen onBuy={() => setPurchaseOpen(true)} />}
        {tab === 'profile' && <ProfileScreen onBuy={() => setPurchaseOpen(true)} />}
      </div>

      <BottomNav tab={tab} onChange={setTab} />
      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
      <WelcomePopup open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </main>
  )
}
