'use client'

import { useCallback, useMemo, useState } from 'react'
import {
    AppData,
    AppCoachMessage,
    AppExerciseLog,
    AppPackage,
    AppPlan,
    AppTransaction,
    AppUser,
    AppUserProfile,
    CoachResult,
    ImageAnalysisResult,
    PlanEditOperation,
    PlanEditResult,
    PlanResult,
    ProfileAnswers,
    ProgressStats,
    ToggleExerciseArgs,
} from '@/lib/types'
import { AppDataContext } from '@/lib/appDataContext'
import {
    AI_COACH_COST,
    DEFAULT_PACKAGES,
    PLAN_COST,
    WELCOME_POINTS,
} from '@/convex/lib/constants'
import { generateMockPlan, mockCoachResponse } from '@/convex/lib/mock'

const DEMO_USER: AppUser = {
    _id: 'demo_user',
    tgId: '0',
    name: 'Dev User',
    username: 'devuser',
    pointsBalance: WELCOME_POINTS,
    createdAt: Date.now(),
    onboarded: false,
    language: 'en',
}

/**
 * In-memory demo provider. Lets you preview the full UI (layout, flows, points
 * economy) in a normal browser without a Convex deployment or Telegram.
 */
export function DemoAppDataProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser>(DEMO_USER)
    const [transactions, setTransactions] = useState<AppTransaction[]>([
        {
            _id: 'tx_welcome',
            userId: 'demo_user',
            amount: WELCOME_POINTS,
            type: 'welcome',
            description: `+${WELCOME_POINTS} Welcome Reward`,
            pointsAfter: WELCOME_POINTS,
            timestamp: Date.now(),
        },
    ])
    const [plans, setPlans] = useState<AppPlan[]>([])
    const [packages] = useState<AppPackage[]>(
        DEFAULT_PACKAGES.map((p, i) => ({ ...p, _id: `pkg_${i}`, active: true })),
    )
    const [exerciseLogs, setExerciseLogs] = useState<AppExerciseLog[]>([])
    const [profile, setProfile] = useState<AppUserProfile | null>(null)
    const [coachMessages, setCoachMessages] = useState<AppCoachMessage[]>([])

    const askCoach = useCallback(
        async (message: string): Promise<CoachResult> => {
            if (user.pointsBalance < AI_COACH_COST) {
                return {
                    ok: false,
                    reason: 'INSUFFICIENT_POINTS',
                    balance: user.pointsBalance,
                    required: AI_COACH_COST,
                }
            }
            const newBalance = user.pointsBalance - AI_COACH_COST
            setUser((u) => ({ ...u, pointsBalance: newBalance }))
            setTransactions((t) => [
                {
                    _id: `tx_${Date.now()}`,
                    userId: user._id,
                    amount: -AI_COACH_COST,
                    type: 'use_ai',
                    description: `-${AI_COACH_COST} AI Coach`,
                    pointsAfter: newBalance,
                    timestamp: Date.now(),
                },
                ...t,
            ])
            const response = mockCoachResponse(message, user.name)
            setCoachMessages((m) => [
                ...m,
                { _id: `cm_${Date.now()}`, userId: user._id, role: 'user', content: message, createdAt: Date.now() },
                { _id: `cm_${Date.now() + 1}`, userId: user._id, role: 'assistant', content: response, createdAt: Date.now() + 1 },
            ])
            return { ok: true, balance: newBalance, response }
        },
        [user],
    )

    const analyzeBodyImage = useCallback(
        async (storageId: string, note?: string): Promise<ImageAnalysisResult> => {
            const response =
                'Demo mode: photo analysis is available in production once a vision model is configured. Upload a clear photo and I will analyze your posture and suggest plan adjustments.'
            setCoachMessages((m) => [
                ...m,
                { _id: `cm_${Date.now()}`, userId: user._id, role: 'user', content: note ? `[Photo] ${note}` : '[Photo]', createdAt: Date.now() },
                { _id: `cm_${Date.now() + 1}`, userId: user._id, role: 'assistant', content: response, createdAt: Date.now() + 1 },
            ])
            return { ok: true, balance: user.pointsBalance, response }
        },
        [user],
    )

    const uploadImage = useCallback(async (_file: File): Promise<string | null> => null, [])

    const proposePlanEdit = useCallback(
        async (_request: string): Promise<PlanEditResult> => {
            const latest = plans[0]
            if (!latest) {
                return { ok: false, reason: 'NO_PLAN', balance: user.pointsBalance, required: 0 }
            }
            return {
                ok: true,
                balance: user.pointsBalance,
                planId: latest._id,
                proposal: {
                    summary: 'Demo proposal: bump the first exercise to 4 sets.',
                    operations: [{ type: 'update', dayIndex: 0, exerciseIndex: 0, sets: 4 }],
                },
            }
        },
        [plans, user.pointsBalance],
    )

    const submitFeatureRequest = useCallback(
        async (_title: string, _description: string, _contact?: string) => {
            // Demo mode — nothing to persist, the UI still confirms success.
        },
        [],
    )

    const applyPlanEdit = useCallback(async (planId: string, operations: PlanEditOperation[]) => {
        setPlans((prev) =>
            prev.map((p) => {
                if (p._id !== planId) return p
                const days = p.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }))
                for (const op of operations) {
                    const day = days[op.dayIndex]
                    if (!day) continue
                    if (op.type === 'update') {
                        const ex = day.exercises[op.exerciseIndex ?? -1]
                        if (!ex) continue
                        if (op.sets != null) ex.sets = op.sets
                        if (op.reps != null) ex.reps = op.reps
                    } else if (op.type === 'replace') {
                        const i = op.exerciseIndex ?? -1
                        const old = day.exercises[i]
                        if (!old) continue
                        day.exercises[i] = {
                            ...old,
                            name: op.name ?? old.name,
                            exerciseId: op.exerciseId ?? old.exerciseId,
                            sets: op.sets ?? old.sets,
                            reps: op.reps ?? old.reps,
                        }
                    } else if (op.type === 'add') {
                        day.exercises.push({
                            name: op.name ?? 'Exercise',
                            sets: op.sets ?? 3,
                            reps: op.reps ?? '8–12',
                            exerciseId: op.exerciseId,
                        })
                    } else if (op.type === 'remove') {
                        const i = op.exerciseIndex ?? -1
                        if (i >= 0 && i < day.exercises.length) day.exercises.splice(i, 1)
                    }
                }
                return { ...p, days }
            }),
        )
    }, [])

    const saveProfile = useCallback(
        async (answers: ProfileAnswers, language?: string) => {
            setProfile({
                _id: 'profile_demo',
                userId: user._id,
                ...answers,
                updatedAt: Date.now(),
            })
            setUser((u) => ({ ...u, onboarded: true, language: language ?? u.language ?? 'en' }))
        },
        [user._id],
    )

    const setLanguage = useCallback(async (language: string) => {
        setUser((u) => ({ ...u, language }))
    }, [])

    const generatePlan = useCallback(
        async (goal: string, level: string): Promise<PlanResult> => {
            if (user.pointsBalance < PLAN_COST) {
                return {
                    ok: false,
                    reason: 'INSUFFICIENT_POINTS',
                    balance: user.pointsBalance,
                    required: PLAN_COST,
                }
            }
            const newBalance = user.pointsBalance - PLAN_COST
            const g = generateMockPlan(goal, level)
            const plan: AppPlan = {
                _id: `plan_${Date.now()}`,
                userId: user._id,
                title: g.title,
                goal,
                level,
                days: g.days,
                createdAt: Date.now(),
            }
            setUser((u) => ({ ...u, pointsBalance: newBalance }))
            setTransactions((t) => [
                {
                    _id: `tx_${Date.now()}`,
                    userId: user._id,
                    amount: -PLAN_COST,
                    type: 'use_plan',
                    description: `-${PLAN_COST} Workout Plan`,
                    pointsAfter: newBalance,
                    timestamp: Date.now(),
                },
                ...t,
            ])
            setPlans((p) => [plan, ...p])
            return { ok: true, balance: newBalance, plan }
        },
        [user],
    )

    const buyPackage = useCallback(
        async (pkg: AppPackage) => {
            const newBalance = user.pointsBalance + pkg.points
            setUser((u) => ({ ...u, pointsBalance: newBalance }))
            setTransactions((t) => [
                {
                    _id: `tx_${Date.now()}`,
                    userId: user._id,
                    amount: pkg.points,
                    type: 'purchase',
                    description: `+${pkg.points} Purchased (demo)`,
                    pointsAfter: newBalance,
                    timestamp: Date.now(),
                },
                ...t,
            ])
        },
        [user],
    )

    const toggleExercise = useCallback(async (args: ToggleExerciseArgs) => {
        setExerciseLogs((prev) => {
            const key = `${args.planId}:${args.dayIndex}:${args.exerciseIndex}`
            const existing = prev.find(
                (l) => `${l.planId}:${l.dayIndex}:${l.exerciseIndex}` === key,
            )
            if (existing) {
                return prev.map((l) =>
                    l._id === existing._id
                        ? { ...l, completed: args.completed, completedAt: Date.now() }
                        : l,
                )
            }
            return [
                ...prev,
                {
                    _id: `log_${Date.now()}`,
                    userId: user._id,
                    planId: args.planId,
                    dayIndex: args.dayIndex,
                    exerciseIndex: args.exerciseIndex,
                    exerciseId: args.exerciseId,
                    completed: args.completed,
                    completedAt: Date.now(),
                },
            ]
        })
    }, [user._id])

    const progress = useMemo<ProgressStats>(() => {
        const done = exerciseLogs.filter((l) => l.completed)
        const now = new Date()
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
        startOfWeek.setHours(0, 0, 0, 0)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const count = (since: number) => done.filter((l) => l.completedAt >= since).length
        return {
            today: count(startOfDay.getTime()),
            week: count(startOfWeek.getTime()),
            month: count(startOfMonth.getTime()),
            all: done.length,
        }
    }, [exerciseLogs])

    const value: AppData = {
        isDemo: true,
        ready: true,
        userId: user._id,
        isNewUser: !user.onboarded,
        user,
        profile,
        transactions,
        plans,
        packages,
        exerciseLogs,
        coachMessages,
        progress,
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
