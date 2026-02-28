import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      credentials: null,
      isAuthenticated: false,
    })
  })

  it('should start with unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.credentials).toBeNull()
  })

  it('should login with user and credentials', () => {
    const user = { email: 'test@example.com', name: 'Test User' }
    const credentials = { credential: 'test-token' }

    useAuthStore.getState().login(user, credentials)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(user)
    expect(state.credentials).toEqual(credentials)
  })

  it('should logout and clear state', () => {
    const user = { email: 'test@example.com', name: 'Test User' }
    const credentials = { credential: 'test-token' }
    useAuthStore.getState().login(user, credentials)

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.credentials).toBeNull()
  })
})
