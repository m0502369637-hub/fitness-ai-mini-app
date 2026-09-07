'use client'

import { ReactNode } from 'react'
import { isConvexEnabled } from '@/lib/convex'
import { useTelegram } from './TelegramProvider'
import { ConvexAppDataProvider } from './ConvexAppData'
import { DemoAppDataProvider } from './DemoAppData'

/**
 * Chooses between the real Convex data provider and the in-memory demo provider.
 * Demo mode activates outside Telegram, or when Convex isn't configured.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
    const { isMock } = useTelegram()

    if (isMock || !isConvexEnabled) {
        return <DemoAppDataProvider>{children}</DemoAppDataProvider>
    }

    return <ConvexAppDataProvider>{children}</ConvexAppDataProvider>
}
