'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
    AppData,
    AppPackage,
    CoachResult,
    ImageAnalysisResult,
    PlanEditOperation,
    PlanEditResult,
    PlanResult,
    ProfileAnswers,
    ToggleExerciseArgs,
} from '@/lib/types'
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
    const askCoachAction = useAction(api.coach.askCoach)
    const analyzeBodyImageAction = useAction(api.coach.analyzeBodyImage)
    const proposePlanEditAction = useAction(api.coach.proposePlanEdit)
    const applyPlanEditMutation = useMutation(api.coach.applyPlanEdit)
    const submitFeatureRequestMutation = useMutation(api.feedback.submit)
    const generateUploadUrlMutation = useMutation(api.coach.generateUploadUrl)
    const saveProfileMutation = useMutation(api.users.saveProfile)
    const setLanguageMutation = useMutation(api.users.setLanguage)
    const generatePlanMutation = useMutation(api.points.generatePlan)
    const toggleExerciseMutation = useMutation(api.workoutLogs.toggleExercise)

    const user = useQuery(api.users.getUser, userId ? { userId } : 'skip')
    const profile = useQuery(api.users.getProfile, userId ? { userId } : 'skip')
    const transactions = useQuery(api.transactions.listByUser, userId ? { userId } : 'skip') ?? []
    const plans = useQuery(api.workoutPlans.listByUser, userId ? { userId } : 'skip') ?? []
    const packages = useQuery(api.packages.list, {}) ?? []
    const exerciseLogs = useQuery(api.workoutLogs.listByUser, userId ? { userId } : 'skip') ?? []
    const coachMessages = useQuery(api.coach.listMessages, userId ? { userId } : 'skip') ?? []
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
            return askCoachAction({ initData, message })
        },
        [webApp, userId, askCoachAction],
    )

    const analyzeBodyImage = useCallback(
        async (storageId: string, note?: string): Promise<ImageAnalysisResult> => {
            const initData = webApp?.initData
            if (!initData || !userId) {
                return { ok: false, reason: 'VISION_NOT_CONFIGURED', balance: 0, required: 0 }
            }
            return analyzeBodyImageAction({ initData, storageId: storageId as Id<'_storage'>, note })
        },
        [webApp, userId, analyzeBodyImageAction],
    )

    const proposePlanEdit = useCallback(
        async (request: string): Promise<PlanEditResult> => {
            const initData = webApp?.initData
            if (!initData || !userId) {
                return { ok: false, reason: 'NO_PLAN', balance: 0, required: 0 }
            }
            const res = await proposePlanEditAction({ initData, request })
            if (res.ok) {
                return {
                    ok: true,
                    balance: res.balance,
                    planId: res.planId,
                    proposal: {
                        summary: res.proposal.summary,
                        operations: res.proposal.operations as PlanEditOperation[],
                    },
                }
            }
            return res
        },
        [webApp, userId, proposePlanEditAction],
    )

    const applyPlanEdit = useCallback(
        async (planId: string, operations: PlanEditOperation[]) => {
            const initData = webApp?.initData
            if (!initData || !userId) return
            await applyPlanEditMutation({
                initData,
                planId: planId as Id<'workoutPlans'>,
                operations,
            })
        },
        [webApp, userId, applyPlanEditMutation],
    )

    const submitFeatureRequest = useCallback(
        async (title: string, description: string, contact?: string) => {
            const initData = webApp?.initData
            if (!initData || !userId) return
            await submitFeatureRequestMutation({ initData, title, description, contact })
        },
        [webApp, userId, submitFeatureRequestMutation],
    )

    const uploadImage = useCallback(
        async (file: File): Promise<string | null> => {
            const initData = webApp?.initData
            if (!initData || !userId) return null
            const { uploadUrl } = await generateUploadUrlMutation({ initData })
            const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                body: file,
            })
            if (!res.ok) throw new Error('Image upload failed')
            const { storageId } = await res.json()
            return storageId as string
        },
        [webApp, userId, generateUploadUrlMutation],
    )

    const saveProfile = useCallback(
        async (answers: ProfileAnswers, language?: string) => {
            const initData = webApp?.initData
            if (!initData || !userId) return
            await saveProfileMutation({ initData, ...answers, language })
        },
        [webApp, userId, saveProfileMutation],
    )

    const setLanguage = useCallback(
        async (language: string) => {
            const initData = webApp?.initData
            if (!initData || !userId) return
            await setLanguageMutation({ initData, language })
        },
        [webApp, userId, setLanguageMutation],
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
        profile: profile ?? null,
        transactions,
        plans,
        packages,
        exerciseLogs,
        coachMessages,
        progress: progress ?? { today: 0, week: 0, month: 0, all: 0 },
        askCoach,
        analyzeBodyImage,
        uploadImage,
        proposePlanEdit,
        applyPlanEdit,
        submitFeatureRequest,
        saveProfile,
        setLanguage,
        generatePlan,
        buyPackage,
        toggleExercise,
    }

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
