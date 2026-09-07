'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { AppData, AppPackage, CoachResult, PlanResult, ToggleExerciseArgs } from '@/lib/types'
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
    const toggleExerciseMutation = useMutation(api.workoutLogs.toggleExercise)

    const user = useQuery(api.users.getUser, userId ? { userId } : 'skip')
    const transactions = useQuery(api.transactions.listByUser, userId ? { userId } : 'skip') ?? []
    const plans = useQuery(api.workoutPlans.listByUser, userId ? { userId } : 'skip') ?? []
    const packages = useQuery(api.packages.list, {}) ?? []
    const exerciseLogs = useQuery(api.workoutLogs.listByUser, userId ? { userId } : 'skip') ?? []
    const progress = useQuery(api.workoutLogs.progressStats, userId ? { userId } : 'skip')

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

    const toggleExercise = useCallback(
        async (args: ToggleExerciseArgs) => {
            const initData = webApp?.initData
            if (!initData || !userId) return
            await toggleExerciseMutation({
                initData,
                planId: args.planId as Id<'workoutPlans'>,
                dayIndex: args.dayIndex,
                exerciseIndex: args.exerciseIndex,
                exerciseId: args.exerciseId,
                completed: args.completed,
            })
        },
        [webApp, userId, toggleExerciseMutation],
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
        exerciseLogs,
        progress: progress ?? { today: 0, week: 0, month: 0, all: 0 },
        askCoach,
        generatePlan,
        buyPackage,
        toggleExercise,
    }

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
