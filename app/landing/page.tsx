import type { Metadata } from 'next'
import { LandingContent } from '@/components/landing/LandingContent'

export const metadata: Metadata = {
  title: 'FitAI — AI Fitness Coach & Workout Planner for Telegram',
  description:
    'FitAI is an AI-powered fitness coach inside a Telegram Mini App: personalized workout plans, DeepSeek AI coaching, body photo analysis, progress tracking and a points economy — in English and Arabic.',
  keywords: [
    'fitness app',
    'AI fitness coach',
    'Telegram Mini App',
    'workout plan generator',
    'DeepSeek fitness',
    'gym tracking',
    'exercise library',
  ],
  alternates: { canonical: '/landing' },
  openGraph: {
    title: 'FitAI — Your AI fitness coach, inside Telegram',
    description:
      'Personalized workout plans, AI coaching, body photo analysis and progress tracking — free to start, in English and Arabic.',
    url: 'https://fitness-ai-mini-app.vercel.app/landing',
    type: 'website',
    siteName: 'FitAI',
  },
  robots: 'index,follow',
}

export default function LandingPage() {
  return <LandingContent />
}
