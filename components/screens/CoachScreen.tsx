'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, ImagePlus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useHaptic } from '@/hooks/useHaptic'
import { AI_COACH_COST } from '@/convex/lib/constants'

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

export function CoachScreen({ onBuy }: { onBuy: () => void }) {
  const { askCoach, analyzeBodyImage, uploadImage, coachMessages } = useAppData()
  const { t } = useLanguage()
  const { impact } = useHaptic()
  const fileRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // Hydrate from persisted history on first mount (tab remounts each time).
  useEffect(() => {
    if (hydrated || coachMessages.length === 0) return
    setMessages(coachMessages.map((m) => ({ role: m.role, text: m.content })))
    setHydrated(true)
  }, [coachMessages, hydrated])

  const greeting: Msg = {
    role: 'assistant',
    text: t('coach.greeting', { cost: AI_COACH_COST }),
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    impact('light')
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)

    const res = await askCoach(text)
    setLoading(false)

    if (res.ok) {
      setMessages((m) => [...m, { role: 'assistant', text: res.response }])
    } else if (res.reason === 'INSUFFICIENT_POINTS') {
      setMessages((m) => [...m, { role: 'assistant', text: t('coach.needPoints') }])
      toast.error(t('coach.notEnough'))
      onBuy()
    } else if (res.reason === 'LLM_NOT_CONFIGURED') {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'The AI model is not configured yet. Please set DEEPSEEK_API_KEY.' },
      ])
    }
  }

  const onPickPhoto = () => {
    if (analyzing) return
    fileRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    impact('medium')
    setAnalyzing(true)
    try {
      const storageId = await uploadImage(file)
      if (!storageId) {
        toast.error(t('coach.uploadFailed'))
        setAnalyzing(false)
        return
      }
      const res = await analyzeBodyImage(storageId)
      if (res.ok) {
        setMessages((m) => [...m, { role: 'assistant', text: res.response }])
      } else if (res.reason === 'VISION_NOT_CONFIGURED') {
        setMessages((m) => [...m, { role: 'assistant', text: t('coach.visionNotConfigured') }])
      } else if (res.reason === 'INSUFFICIENT_POINTS') {
        toast.error(t('coach.notEnough'))
        onBuy()
      }
    } catch {
      toast.error(t('coach.uploadFailed'))
    } finally {
      setAnalyzing(false)
    }
  }

  const display = messages.length > 0 ? messages : [greeting]

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)]">
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
          {t('coach.title')}
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--c-text)]">{t('coach.askTitle')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {display.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[var(--c-accent)] text-[var(--c-accent-text)] font-medium rounded-br-sm'
                  : 'bg-[var(--c-surface)] text-[var(--c-text)] rounded-bl-sm'
              }`}
              style={m.role === 'assistant' ? { border: '1px solid var(--c-border)' } : undefined}
            >
              {m.text}
            </div>
          </div>
        ))}
        {(loading || analyzing) && (
          <div className="text-sm text-[var(--c-muted)] flex items-center gap-2">
            <Bot size={16} className="animate-pulse" />
            {analyzing ? t('coach.analyzing') : t('coach.thinking')}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={onPickPhoto}
          disabled={analyzing}
          className="p-3 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-text)] disabled:opacity-40"
          style={{ border: '1px solid var(--c-border)' }}
          aria-label={t('coach.attachPhoto')}
          title={t('coach.attachPhoto')}
        >
          <ImagePlus size={18} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('coach.placeholder')}
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
          style={{ border: '1px solid var(--c-border)' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-accent p-3 rounded-2xl disabled:opacity-40"
        >
          <Send size={18} className="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  )
}
