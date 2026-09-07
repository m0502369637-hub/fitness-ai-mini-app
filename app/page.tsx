'use client'

import { useState } from 'react'
import { useTelegram } from '@/providers/TelegramProvider'
import { useAppData } from '@/lib/appDataContext'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { CoachScreen } from '@/components/screens/CoachScreen'
import { PlanScreen } from '@/components/screens/PlanScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { OnboardingFlow } from '@/components/screens/OnboardingFlow'
import { BottomNav, TabId } from '@/components/ui/BottomNav'
import { PurchaseModal } from '@/components/ui/PurchaseModal'

export default function Home() {
  const { isReady } = useTelegram()
  const { user } = useAppData()
  const [tab, setTab] = useState<TabId>('home')
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  // First-time (or not-yet-onboarded) users see the questionnaire first.
  const showOnboarding = !!user && !user.onboarded

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
        {tab === 'profile' && (
          <ProfileScreen
            onBuy={onBuy}
            onNavigate={setTab}
            onEditProfile={() => setEditProfileOpen(true)}
          />
        )}
      </div>

      <BottomNav tab={tab} onChange={setTab} />
      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />

      {showOnboarding && <OnboardingFlow mode="onboarding" onComplete={() => {}} />}
      {!showOnboarding && editProfileOpen && (
        <OnboardingFlow
          mode="edit"
          onClose={() => setEditProfileOpen(false)}
          onComplete={() => setEditProfileOpen(false)}
        />
      )}
    </main>
  )
}
