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
    <div className="flex flex-col">
      <div className="max-h-[55vh] overflow-y-auto space-y-3 pb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-br-sm'
                  : 'bg-[var(--tg-theme-secondary-bg-color)] rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-[var(--tg-theme-hint-color)] flex items-center gap-2">
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
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary p-3 rounded-2xl disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
