'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'
import { useAppData } from '@/lib/appDataContext'
import { Language, translate } from './translations'

interface LanguageContextValue {
  lang: Language
  dir: 'ltr' | 'rtl'
  setLang: (l: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'fitai.lang'

function detectInitial(): Language {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  // Fall back to Telegram's locale hint when available.
  const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } })
    .Telegram?.WebApp
  const code = tg?.initDataUnsafe?.user?.language_code
  if (code && code.toLowerCase().startsWith('ar')) return 'ar'
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, setLanguage } = useAppData()
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    setLangState(detectInitial())
  }, [])

  // Once the profile loads, prefer the server-persisted language.
  useEffect(() => {
    if (user?.language === 'ar' || user?.language === 'en') {
      setLangState(user.language)
    }
  }, [user?.language])

  const setLang = useCallback(
    (l: Language) => {
      setLangState(l)
      try {
        window.localStorage.setItem(STORAGE_KEY, l)
      } catch {
        /* ignore */
      }
      setLanguage(l).catch(() => {
        /* offline / demo — local state already updated */
      })
    },
    [setLanguage],
  )

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = dir
  }, [lang, dir])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  )

  const value = useMemo(
    () => ({ lang, dir, setLang, t }),
    [lang, dir, setLang, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
