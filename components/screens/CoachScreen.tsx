'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Check, ImagePlus, Send, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useHaptic } from '@/hooks/useHaptic'
import { AI_COACH_COST } from '@/convex/lib/constants'
import { PlanEditOperation } from '@/lib/types'

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

interface Proposal {
  planId: string
  summary: string
  operations: PlanEditOperation[]
}

export function CoachScreen({ onBuy }: { onBuy: () => void }) {
  const { askCoach, analyzeBodyImage, uploadImage, coachMessages, plans, proposePlanEdit, applyPlanEdit } =
    useAppData()
  const { t } = useLanguage()
  const { impact } = useHaptic()
  const fileRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [planEditMode, setPlanEditMode] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)

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
    if (!text || loading || proposing) return
    impact('light')
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])

    if (planEditMode) {
      setProposing(true)
      const res = await proposePlanEdit(text)
      setProposing(false)
      if (res.ok) {
        setProposal({
          planId: res.planId,
          summary: res.proposal.summary,
          operations: res.proposal.operations,
        })
        setMessages((m) => [...m, { role: 'assistant', text: res.proposal.summary }])
      } else if (res.reason === 'INSUFFICIENT_POINTS') {
        setMessages((m) => [...m, { role: 'assistant', text: t('coach.needPoints') }])
        toast.error(t('coach.notEnough'))
        onBuy()
      } else if (res.reason === 'NO_PLAN') {
        setMessages((m) => [...m, { role: 'assistant', text: t('coach.noPlan') }])
      } else {
        toast.error(t('coach.proposeFailed'))
      }
      return
    }

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

  const applyProposal = async () => {
    if (!proposal) return
    impact('medium')
    await applyPlanEdit(proposal.planId, proposal.operations)
    toast.success(t('coach.editApplied'))
    setProposal(null)
    setPlanEditMode(false)
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
              {t('coach.title')}
            </p>
            <h1 className="text-2xl font-extrabold text-[var(--c-text)]">{t('coach.askTitle')}</h1>
          </div>
          {plans.length > 0 && (
            <button
              onClick={() => {
                setPlanEditMode((v) => !v)
                setProposal(null)
              }}
              className={
                planEditMode
                  ? 'flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full bg-[var(--c-accent)] text-[var(--c-accent-text)]'
                  : 'flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full bg-[var(--c-surface-2)] text-[var(--c-text)]'
              }
              style={!planEditMode ? { border: '1px solid var(--c-border)' } : undefined}
            >
              <Wand2 size={14} />
              {t('coach.editPlan')}
            </button>
          )}
        </div>
        {planEditMode && (
          <p className="text-xs text-[var(--c-accent)] mt-1">{t('coach.editPlanHint')}</p>
        )}
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

        {(loading || analyzing || proposing) && (
          <div className="text-sm text-[var(--c-muted)] flex items-center gap-2">
            <Bot size={16} className="animate-pulse" />
            {analyzing ? t('coach.analyzing') : t('coach.thinking')}
          </div>
        )}

        {/* Approval card */}
        {proposal && (
          <div className="card p-4 space-y-3" style={{ borderColor: 'var(--c-accent)' }}>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--c-accent)]">
              {t('coach.proposalTitle')}
            </p>
            <ul className="space-y-1 text-sm text-[var(--c-text)]">
              {proposal.operations.map((op, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--c-accent)] mt-0.5">•</span>
                  <span>{describeOp(op)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={applyProposal} className="btn-accent flex-1 flex items-center justify-center gap-1">
                <Check size={16} strokeWidth={3} />
                {t('coach.apply')}
              </button>
              <button
                onClick={() => setProposal(null)}
                className="btn-surface flex items-center justify-center gap-1"
              >
                <X size={16} />
                {t('coach.dismiss')}
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

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
          placeholder={planEditMode ? t('coach.editPlanHint') : t('coach.placeholder')}
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
          style={{ border: '1px solid var(--c-border)' }}
        />
        <button
          onClick={send}
          disabled={loading || proposing || !input.trim()}
          className="btn-accent p-3 rounded-2xl disabled:opacity-40"
        >
          <Send size={18} className="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  )

  function describeOp(op: PlanEditOperation): string {
    const day = op.dayIndex + 1
    switch (op.type) {
      case 'update':
        return `Day ${day} · exercise ${(op.exerciseIndex ?? 0) + 1}: ${op.sets != null ? `${op.sets} sets` : ''} ${op.reps ? op.reps : ''}`.trim()
      case 'replace':
        return `Day ${day} · replace #${(op.exerciseIndex ?? 0) + 1} with ${op.name}`
      case 'add':
        return `Day ${day} · add ${op.name}`
      case 'remove':
        return `Day ${day} · remove #${(op.exerciseIndex ?? 0) + 1}`
      default:
        return ''
    }
  }
}
