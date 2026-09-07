'use client'

import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAppData } from '@/lib/appDataContext'
import { useHaptic } from '@/hooks/useHaptic'
import { AI_COACH_COST } from '@/convex/lib/constants'

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

export function CoachScreen({ onBuy }: { onBuy: () => void }) {
  const { askCoach } = useAppData()
  const { impact } = useHaptic()
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: `Hey! I'm your AI coach. Ask me about training, nutrition, or recovery — each question costs ${AI_COACH_COST} points.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'You need more points to ask me. Grab a pack to keep going! ⚡' },
      ])
      toast.error('Not enough points')
      onBuy()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)]">
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
          AI Coach
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--c-text)]">Ask the coach</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.map((m, i) => (
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
        {loading && (
          <div className="text-sm text-[var(--c-muted)] flex items-center gap-2">
            <Bot size={16} className="animate-pulse" /> thinking…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask your coach…"
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
          style={{ border: '1px solid var(--c-border)' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-accent p-3 rounded-2xl disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
