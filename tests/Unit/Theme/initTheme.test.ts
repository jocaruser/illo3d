import { applyTheme, initTheme, readPersistedTheme } from '@/Theme/initTheme'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

function storageWith(value: string | null): Pick<Storage, 'getItem'> {
  return { getItem: () => value }
}

describe('readPersistedTheme', () => {
  it('returns light when nothing is persisted', () => {
    expect(readPersistedTheme(storageWith(null))).toBe('light')
  })

  it('returns light for malformed JSON', () => {
    expect(readPersistedTheme(storageWith('{oops'))).toBe('light')
  })

  it('returns light for a JSON null payload', () => {
    expect(readPersistedTheme(storageWith('null'))).toBe('light')
  })

  it('returns light when state is missing', () => {
    expect(readPersistedTheme(storageWith('{}'))).toBe('light')
  })

  it('returns light when theme is missing', () => {
    expect(readPersistedTheme(storageWith('{"state":{}}'))).toBe('light')
  })

  it('returns light for an unknown theme value', () => {
    expect(readPersistedTheme(storageWith('{"state":{"theme":"solarized"}}'))).toBe('light')
  })

  it('returns dark for the persisted dark theme', () => {
    expect(readPersistedTheme(storageWith('{"state":{"theme":"dark"}}'))).toBe('dark')
  })
})

describe('applyTheme', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('adds the dark class for dark', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the dark class for light', () => {
    document.documentElement.classList.add('dark')
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('initTheme', () => {
  let storage: Storage

  beforeEach(() => {
    storage = installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('applies the persisted theme from localStorage', () => {
    storage.setItem('user-preferences-storage', '{"state":{"theme":"dark"}}')
    initTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to light when storage is empty', () => {
    document.documentElement.classList.add('dark')
    initTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
