import { describe, expect, it } from 'vitest'
import { initI18n, readPersistedLanguage, SUPPORTED_LANGUAGES } from '@/I18n'

function storageWith(value: string | null): Pick<Storage, 'getItem'> {
  return { getItem: () => value }
}

describe('readPersistedLanguage', () => {
  it('defaults to en when nothing is persisted', () => {
    expect(readPersistedLanguage(storageWith(null))).toBe('en')
  })

  it('reads es from the persisted preferences payload', () => {
    const payload = JSON.stringify({ state: { language: 'es' } })
    expect(readPersistedLanguage(storageWith(payload))).toBe('es')
  })

  it('falls back to en for other languages or malformed payloads', () => {
    expect(readPersistedLanguage(storageWith(JSON.stringify({ state: { language: 'fr' } })))).toBe(
      'en',
    )
    expect(readPersistedLanguage(storageWith(JSON.stringify({})))).toBe('en')
    expect(readPersistedLanguage(storageWith('not-json'))).toBe('en')
    expect(
      readPersistedLanguage({
        getItem: () => {
          throw new Error('denied')
        },
      }),
    ).toBe('en')
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
