'use client'

import { useCallback, useState } from 'react'
import {
    AppData,
    AppPackage,
    AppPlan,
    AppTransaction,
    AppUser,
    CoachResult,
    PlanResult,
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
            return { ok: true, balance: newBalance, response: mockCoachResponse(message, user.name) }
        },
        [user],
    )

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

    const value: AppData = {
        isDemo: true,
        ready: true,
        userId: user._id,
        isNewUser: true,
        user,
        transactions,
        plans,
        packages,
        askCoach,
        generatePlan,
        buyPackage,
    }

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
