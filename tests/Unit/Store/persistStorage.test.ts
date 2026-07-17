import { installFakeLocalStorage } from './memoryLocalStorage'

async function freshAppStorage() {
  vi.resetModules()
  const { appStorage } = await import('@/Store/persistStorage')
  return appStorage
}

describe('appStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns localStorage when it is operational, leaving no canary behind', async () => {
    const fake = installFakeLocalStorage()
    const appStorage = await freshAppStorage()

    expect(appStorage()).toBe(fake)
    expect(fake.length).toBe(0)
  })

  it('falls back to in-memory storage when localStorage is undefined', async () => {
    vi.stubGlobal('localStorage', undefined)
    const appStorage = await freshAppStorage()

    const storage = appStorage()

    expect(storage.getItem('missing')).toBeNull()
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
    storage.removeItem('key')
    expect(storage.getItem('key')).toBeNull()
  })

  it('falls back to in-memory storage when localStorage is null', async () => {
    vi.stubGlobal('localStorage', null)
    const appStorage = await freshAppStorage()

    const storage = appStorage()
    storage.setItem('key', 'value')

    expect(storage.getItem('key')).toBe('value')
  })

  it('falls back when localStorage exposes no working methods (Node 25 stub)', async () => {
    vi.stubGlobal('localStorage', {})
    const appStorage = await freshAppStorage()

    const storage = appStorage()
    storage.setItem('key', 'value')

    expect(storage.getItem('key')).toBe('value')
  })

  it('falls back when localStorage writes throw (zero-quota privacy modes)', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    })
    const appStorage = await freshAppStorage()

    const storage = appStorage()
    storage.setItem('key', 'value')

    expect(storage.getItem('key')).toBe('value')
  })

  it('falls back when accessing localStorage throws (SecurityError privacy modes)', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage access denied')
      },
    })
    try {
      const appStorage = await freshAppStorage()

      const storage = appStorage()
      storage.setItem('key', 'value')

      expect(storage.getItem('key')).toBe('value')
    } finally {
      if (original !== undefined) Object.defineProperty(globalThis, 'localStorage', original)
    }
  })

  it('shares a single in-memory fallback across calls', async () => {
    vi.stubGlobal('localStorage', undefined)
    const appStorage = await freshAppStorage()

    appStorage().setItem('shared', 'yes')

    expect(appStorage()).toBe(appStorage())
    expect(appStorage().getItem('shared')).toBe('yes')
  })

  it('keeps fallback writes out of localStorage once it becomes available', async () => {
    vi.stubGlobal('localStorage', undefined)
    const appStorage = await freshAppStorage()
    appStorage().setItem('memory-only', 'yes')

    const fake = installFakeLocalStorage()

    expect(appStorage()).toBe(fake)
    expect(fake.getItem('memory-only')).toBeNull()
  })
})
