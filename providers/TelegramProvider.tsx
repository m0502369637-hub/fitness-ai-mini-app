// providers/TelegramProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTelegramStore } from '@/store/telegram'
import { TelegramWebApp, WebAppUser, ThemeParams } from '@/types/telegram'

interface TelegramContextType {
    webApp: TelegramWebApp | null
    user: WebAppUser | null
    isReady: boolean
    isMock: boolean
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    isReady: false,
    isMock: false,
})

const MOCK_THEME: ThemeParams = {
    bg_color: '#ffffff',
    text_color: '#1c1c1e',
    hint_color: '#8e8e93',
    link_color: '#2481cc',
    button_color: '#2481cc',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f2f2f7',
    header_bg_color: '#ffffff',
    accent_text_color: '#2481cc',
    section_bg_color: '#ffffff',
    section_header_text_color: '#6d6d72',
    subtitle_text_color: '#8e8e93',
    destructive_text_color: '#ff3b30',
}

// A stand-in WebApp so the UI is previewable in a normal browser (outside Telegram).
function createMockWebApp(): TelegramWebApp {
    const mockUser: WebAppUser = {
        id: 42424242,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        is_premium: true,
    }
    const noop = () => {}
    const haptic = { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop }

    return {
        initData: '',
        initDataUnsafe: { user: mockUser },
        version: '8.0',
        platform: 'web',
        colorScheme: 'light',
        themeParams: MOCK_THEME,
        isExpanded: true,
        viewportHeight: 800,
        viewportStableHeight: 800,
        headerColor: '#ffffff',
        backgroundColor: '#ffffff',
        bottomBarColor: '#ffffff',
        isClosingConfirmationEnabled: false,
        isVerticalSwipesEnabled: false,
        isActive: true,
        isFullscreen: false,
        isOrientationLocked: false,
        MainButton: { text: '', color: '#2481cc', textColor: '#ffffff', isVisible: false, isActive: true, isProgressVisible: false, hasShineEffect: false, setText: noop, onClick: noop, offClick: noop, show: noop, hide: noop, enable: noop, disable: noop, showProgress: noop, hideProgress: noop, setParams: noop },
        SecondaryButton: null,
        BackButton: { isVisible: false, onClick: noop, offClick: noop, show: noop, hide: noop },
        SettingsButton: { isVisible: false, onClick: noop, offClick: noop, show: noop, hide: noop },
        HapticFeedback: haptic,
        CloudStorage: { setItem: noop, getItem: noop, getItems: noop, removeItem: noop, removeItems: noop, getKeys: noop },
        BiometricManager: {},
        Accelerometer: {},
        DeviceOrientation: {},
        Gyroscope: {},
        LocationManager: {},
        ready: noop,
        expand: noop,
        close: noop,
        enableClosingConfirmation: noop,
        disableClosingConfirmation: noop,
        enableVerticalSwipes: noop,
        disableVerticalSwipes: noop,
        setHeaderColor: noop,
        setBackgroundColor: noop,
        setBottomBarColor: noop,
        requestFullscreen: noop,
        exitFullscreen: noop,
        lockOrientation: noop,
        unlockOrientation: noop,
        requestWriteAccess: noop,
        requestContact: noop,
        readTextFromClipboard: noop,
        shareToStory: noop,
        downloadFile: noop,
        addToHomeScreen: noop,
        checkHomeScreenStatus: noop,
        openLink: noop,
        openTelegramLink: noop,
        openInvoice: (_url: string, cb?: (status: string) => void) => cb && cb('paid'),
        showPopup: noop,
        showAlert: noop,
        showConfirm: noop,
        showScanQrPopup: noop,
        isVersionAtLeast: () => true,
        setEmojiStatus: noop,
        requestEmojiStatusAccess: noop,
        sendData: noop,
        switchInlineQuery: noop,
        invokeCustomMethod: noop,
        onEvent: noop,
        offEvent: noop,
    } as unknown as TelegramWebApp
}

export function TelegramProvider({ children }: { children: ReactNode }) {
    const [isReady, setIsReady] = useState(false)
    const [isMock, setIsMock] = useState(false)
    const [webApp, setWebAppState] = useState<TelegramWebApp | null>(null)
    const [user, setUserState] = useState<WebAppUser | null>(null)
    const { setWebApp, setUser, setTheme } = useTelegramStore()

    useEffect(() => {
        if (typeof window === 'undefined') return

        const tgWebApp = window.Telegram?.WebApp

        if (tgWebApp) {
            // Real Telegram Mini App environment
            tgWebApp.ready()
            tgWebApp.expand()

            document.documentElement.className = tgWebApp.colorScheme

            setWebAppState(tgWebApp)
            setUserState(tgWebApp.initDataUnsafe.user || null)
            setWebApp(tgWebApp)
            setUser(tgWebApp.initDataUnsafe.user || null)
            setTheme(tgWebApp.themeParams)

            tgWebApp.onEvent('themeChanged', () => {
                document.documentElement.className = tgWebApp.colorScheme
                setTheme(tgWebApp.themeParams)
            })

            setIsMock(false)
            setIsReady(true)
        } else {
            // Browser preview fallback
            const mock = createMockWebApp()
            document.documentElement.className = 'light'

            setWebAppState(mock)
            setUserState(mock.initDataUnsafe.user || null)
            setWebApp(mock)
            setUser(mock.initDataUnsafe.user || null)
            setTheme(MOCK_THEME)

            setIsMock(true)
            setIsReady(true)
        }
    }, [setWebApp, setUser, setTheme])

    return (
        <TelegramContext.Provider value={{ webApp, user, isReady, isMock }}>
            {children}
        </TelegramContext.Provider>
    )
}

export const useTelegram = () => {
    const context = useContext(TelegramContext)
    if (!context) {
        throw new Error('useTelegram must be used within TelegramProvider')
    }
    return context
}
