import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { useBackendStore } from '@/stores/backendStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import i18n from '@/i18n'

export function ProfileMenu() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { user, isAuthenticated, logout } = useAuthStore()
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const resetBackend = useBackendStore((s) => s.reset)
  const resetWorkbook = useWorkbookStore((s) => s.reset)
  const { language, theme, setLanguage, toggleTheme } = useUserPreferencesStore()

  // Apply theme class on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const handleSignOut = () => {
    clearActiveShop()
    resetBackend()
    resetWorkbook()
    logout()
    setIsOpen(false)
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('profileMenu.toggleMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
          {/* User Info */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          {/* Language Selector */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('profileMenu.language')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                disabled={language === 'en'}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:cursor-not-allowed`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                disabled={language === 'es'}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:cursor-not-allowed`}
              >
                Español
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('profileMenu.theme')}
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <span>{theme === 'light' ? t('profileMenu.lightMode') : t('profileMenu.darkMode')}</span>
              {theme === 'light' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
