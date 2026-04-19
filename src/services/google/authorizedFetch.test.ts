import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  googleFetchWithAuthRetry,
  GoogleSessionError,
} from '@/services/google/authorizedFetch'

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(),
  renew: vi.fn(),
  mark: vi.fn(),
}))

vi.mock('@/services/google/accessToken', () => ({
  ensureGoogleAccessToken: () => mocks.ensure(),
  renewGoogleAccessTokenSingleFlight: () => mocks.renew(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      markGoogleSessionNeedsReauth: mocks.mark,
    }),
  },
}))

describe('googleFetchWithAuthRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    mocks.ensure.mockReset()
    mocks.renew.mockReset()
    mocks.mark.mockReset()
    mocks.ensure.mockResolvedValue('tok1')
    mocks.renew.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns first response when not 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('ok', { status: 200 }))
    const r = await googleFetchWithAuthRetry('https://example.com/api')
    expect(r.status).toBe(200)
    expect(mocks.renew).not.toHaveBeenCalled()
  })

  it('renews and retries once on 401', async () => {
    mocks.ensure.mockResolvedValueOnce('tok1').mockResolvedValue('tok2')
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('unauth', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    const r = await googleFetchWithAuthRetry('https://example.com/api')
    expect(r.status).toBe(200)
    expect(mocks.renew).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('marks session and throws GoogleSessionError when renew fails after 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('unauth', { status: 401 }))
    mocks.renew.mockRejectedValueOnce(new Error('denied'))
    await expect(googleFetchWithAuthRetry('https://example.com/api')).rejects.toThrow(
      GoogleSessionError,
    )
    expect(mocks.mark).toHaveBeenCalled()
  })
})
