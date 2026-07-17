import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectBrowserLanguage,
  initI18n,
  readPersistedLanguage,
  SUPPORTED_LANGUAGES,
} from '@/I18n'

function storageWith(value: string | null): Pick<Storage, 'getItem'> {
  return { getItem: () => value }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('detectBrowserLanguage', () => {
  it('narrows Spanish locales to es', () => {
    expect(detectBrowserLanguage('es')).toBe('es')
    expect(detectBrowserLanguage('es-MX')).toBe('es')
    expect(detectBrowserLanguage('ES-ES')).toBe('es')
  })

  it('narrows everything else to en', () => {
    expect(detectBrowserLanguage('en-GB')).toBe('en')
    expect(detectBrowserLanguage('fr-FR')).toBe('en')
    expect(detectBrowserLanguage('')).toBe('en')
  })

  it('reads the browser language when no argument is given', () => {
    expect(detectBrowserLanguage()).toBe('en') // jsdom reports en-US
    vi.stubGlobal('navigator', undefined)
    expect(detectBrowserLanguage()).toBe('en')
  })
})

describe('readPersistedLanguage', () => {
  it('falls back to the browser language when nothing is persisted', () => {
    vi.stubGlobal('navigator', { language: 'es-AR' })
    expect(readPersistedLanguage(storageWith(null))).toBe('es')
    vi.unstubAllGlobals()
    expect(readPersistedLanguage(storageWith(null))).toBe('en')
  })

  it('lets a persisted choice win over the browser language', () => {
    vi.stubGlobal('navigator', { language: 'es-ES' })
    const payload = JSON.stringify({ state: { language: 'en' } })
    expect(readPersistedLanguage(storageWith(payload))).toBe('en')
  })

  it('reads es from the persisted preferences payload', () => {
    const payload = JSON.stringify({ state: { language: 'es' } })
    expect(readPersistedLanguage(storageWith(payload))).toBe('es')
  })

  it('falls back to the browser language for unknown or malformed payloads', () => {
    vi.stubGlobal('navigator', { language: 'es' })
    expect(
      readPersistedLanguage(storageWith(JSON.stringify({ state: { language: 'fr' } }))),
    ).toBe('es')
    expect(readPersistedLanguage(storageWith(JSON.stringify({})))).toBe('es')
    expect(readPersistedLanguage(storageWith('not-json'))).toBe('es')
    expect(
      readPersistedLanguage({
        getItem: () => {
          throw new Error('denied')
        },
      }),
    ).toBe('es')
  })
})

describe('initI18n', () => {
  it('initializes with both catalogs and the requested language', () => {
    const i18n = initI18n('es')
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'es'])
    expect(i18n.t('nav.dashboard')).not.toBe('nav.dashboard')
    void i18n.changeLanguage('en')
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
  })
})
