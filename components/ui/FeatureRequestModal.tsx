'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppData } from '@/lib/appDataContext'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useHaptic } from '@/hooks/useHaptic'

export function FeatureRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { submitFeatureRequest } = useAppData()
  const { t } = useLanguage()
  const { impact } = useHaptic()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const submit = async () => {
    if (sending) return
    if (!title.trim() || !description.trim()) return
    impact('medium')
    setSending(true)
    try {
      await submitFeatureRequest(title.trim(), description.trim(), contact.trim() || undefined)
      setTitle('')
      setDescription('')
      setContact('')
      toast.success(t('featureRequest.thanks'))
      onClose()
    } catch (e) {
      console.error(e)
      toast.error(t('featureRequest.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[var(--c-surface)] p-5 pb-8 safe-area-bottom"
        style={{ borderTop: '1px solid var(--c-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center">
              <Lightbulb size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-[var(--c-text)]">
              {t('featureRequest.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[var(--c-surface-2)] text-[var(--c-muted)]"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--c-muted)] mt-1 mb-4">{t('featureRequest.sub')}</p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[var(--c-muted)]">
              {t('featureRequest.name')}
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
              style={{ border: '1px solid var(--c-border)' }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--c-muted)]">
              {t('featureRequest.desc')}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={600}
              className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none resize-none"
              style={{ border: '1px solid var(--c-border)' }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--c-muted)]">
              {t('featureRequest.contact')}
            </span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={80}
              className="mt-1 w-full p-3 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm outline-none"
              style={{ border: '1px solid var(--c-border)' }}
            />
          </label>
          <button
            onClick={submit}
            disabled={sending || !title.trim() || !description.trim()}
            className="btn-accent w-full py-3 disabled:opacity-40"
          >
            {sending ? t('featureRequest.sending') : t('featureRequest.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
