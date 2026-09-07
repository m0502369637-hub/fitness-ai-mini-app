'use client'

import { useEffect, useState } from 'react'
import { useTelegram } from '@/providers/TelegramProvider'
import { useAppData } from '@/lib/appDataContext'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { CoachScreen } from '@/components/screens/CoachScreen'
import { PlanScreen } from '@/components/screens/PlanScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { BottomNav, TabId } from '@/components/ui/BottomNav'
import { PurchaseModal } from '@/components/ui/PurchaseModal'
import { WelcomePopup } from '@/components/ui/WelcomePopup'

export default function Home() {
  const { isReady } = useTelegram()
  const { isNewUser } = useAppData()
  const [tab, setTab] = useState<TabId>('home')
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    if (isNewUser) setWelcomeOpen(true)
  }, [isNewUser])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="w-10 h-10 border-4 border-[var(--c-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const onBuy = () => setPurchaseOpen(true)

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] pb-20">
      <div className="px-4 pt-4 safe-area-top">
        {tab === 'home' && <HomeScreen onNavigate={setTab} onBuy={onBuy} />}
        {tab === 'coach' && <CoachScreen onBuy={onBuy} />}
        {tab === 'plan' && <PlanScreen onBuy={onBuy} />}
        {tab === 'profile' && <ProfileScreen onBuy={onBuy} onNavigate={setTab} />}
      </div>

      <BottomNav tab={tab} onChange={setTab} />
      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
      <WelcomePopup open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </main>
  )
}
