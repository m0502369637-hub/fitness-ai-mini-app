'use client'

import { ConvexProvider } from 'convex/react'
import { convex } from '@/lib/convex'

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    if (!convex) return <>{children}</>
    return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
