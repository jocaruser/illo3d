import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import {
  registerGoogleOAuthClientId,
  renewGoogleAccessTokenSingleFlight,
} from '@/services/google/accessToken'

describe('renewGoogleAccessTokenSingleFlight', () => {
  beforeEach(() => {
    registerGoogleOAuthClientId('test-client-id')
    useAuthStore.getState().logout()
    useAuthStore.getState().login(
      { email: 'a@b.com', name: 'A' },
      { accessToken: 'old-token', accessTokenExpiresAtMs: Date.now() },
    )
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'google')
  })

  it('merges concurrent renewals into one token client', async () => {
    let initCount = 0
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            callback: (r: { access_token?: string; expires_in?: number }) => void
          }) => {
            initCount += 1
            return {
              requestAccessToken: () => {
                config.callback({ access_token: 'shared-new', expires_in: 3600 })
              },
            }
          },
        },
      },
    } as typeof window.google

    await Promise.all([
      renewGoogleAccessTokenSingleFlight(),
      renewGoogleAccessTokenSingleFlight(),
    ])

    expect(initCount).toBe(1)
    expect(useAuthStore.getState().credentials?.accessToken).toBe('shared-new')
  })
})
