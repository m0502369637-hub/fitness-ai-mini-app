'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { AppData, AppPackage, CoachResult, PlanResult } from '@/lib/types'
import { AppDataContext } from '@/lib/appDataContext'
import { useTelegram } from './TelegramProvider'

/**
 * Real Convex-backed data provider. Requires a valid Telegram initData (so the
 * user is authenticated) and a configured Convex deployment.
 */
export function ConvexAppDataProvider({ children }: { children: React.ReactNode }) {
    const { webApp } = useTelegram()

    const [userId, setUserId] = useState<Id<'users'> | null>(null)
    const [isNewUser, setIsNewUser] = useState(false)
    const [ready, setReady] = useState(false)
    const ranRef = useRef(false)

    const ensureUser = useMutation(api.users.ensureUser)
    const askCoachMutation = useMutation(api.points.askCoach)
    const generatePlanMutation = useMutation(api.points.generatePlan)

    const user = useQuery(api.users.getUser, userId ? { userId } : 'skip')
    const transactions = useQuery(api.transactions.listByUser, userId ? { userId } : 'skip') ?? []
    const plans = useQuery(api.workoutPlans.listByUser, userId ? { userId } : 'skip') ?? []
    const packages = useQuery(api.packages.list, {}) ?? []

    useEffect(() => {
        if (ranRef.current) return
        const initData = webApp?.initData
        if (!initData) return
        ranRef.current = true
        ensureUser({ initData })
            .then((r) => {
                setUserId(r.userId)
                setIsNewUser(r.isNew)
                setReady(true)
            })
            .catch((e) => {
                console.error('ensureUser failed', e)
                toast.error('Could not load your profile')
                setReady(true)
            })
    }, [webApp, ensureUser])

    const askCoach = useCallback(
        async (message: string): Promise<CoachResult> => {
            const initData = webApp?.initData
            if (!initData || !userId) {
                return { ok: false, reason: 'INSUFFICIENT_POINTS', balance: 0, required: 0 }
            }
            return askCoachMutation({ initData, message })
        },
        [webApp, userId, askCoachMutation],
    )

    const generatePlan = useCallback(
        async (goal: string, level: string): Promise<PlanResult> => {
            const initData = webApp?.initData
            if (!initData || !userId) {
                return { ok: false, reason: 'INSUFFICIENT_POINTS', balance: 0, required: 0 }
            }
            return generatePlanMutation({ initData, goal, level })
        },
        [webApp, userId, generatePlanMutation],
    )

    const buyPackage = useCallback(
        async (pkg: AppPackage) => {
            const initData = webApp?.initData
            if (!webApp || !initData) return

            const res = await fetch('/api/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': initData,
                },
                body: JSON.stringify({ packageKey: pkg.key }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                toast.error(data.error ?? 'Failed to create invoice')
                return
            }

            const { invoiceLink } = await res.json()
            webApp.openInvoice(invoiceLink, (status) => {
                if (status === 'paid') {
                    toast.success('Payment received — points credited!')
                }
                // NOTE: the client callback is never used to grant points — the
                // authoritative credit happens via the successful_payment webhook.
            })
        },
        [webApp],
    )

    const value: AppData = {
        isDemo: false,
        ready,
        userId,
        isNewUser,
        user: user ?? null,
        transactions,
        plans,
        packages,
        askCoach,
        generatePlan,
        buyPackage,
    }

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
