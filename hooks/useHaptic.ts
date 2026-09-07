// hooks/useHaptic.ts

import { useTelegram } from '@/providers/TelegramProvider'

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
export type NotificationType = 'error' | 'success' | 'warning'

export function useHaptic() {
  const { webApp } = useTelegram()

  return {
    impact: (style: ImpactStyle = 'light') => {
      webApp?.HapticFeedback.impactOccurred(style)
    },
    notification: (type: NotificationType) => {
      webApp?.HapticFeedback.notificationOccurred(type)
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged()
    },
  }
}
