import { describe, it, expect } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  it('should start with unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.credentials).toBeNull()
  })

  it('should login with user and credentials', () => {
    const user = { email: 'test@example.com', name: 'Test User' }
    const credentials = { accessToken: 'test-token' }

    useAuthStore.getState().login(user, credentials)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(user)
    expect(state.credentials).toEqual(credentials)
  })

  it('loginAsLocalUser sets synthetic identity without credentials', () => {
    useAuthStore.getState().loginAsLocalUser()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual({
      name: 'Local user',
      email: '',
      picture: undefined,
    })
    expect(state.credentials).toBeNull()
  })

  it('should logout and clear state', () => {
    const user = { email: 'test@example.com', name: 'Test User' }
    const credentials = { accessToken: 'test-token' }
    useAuthStore.getState().login(user, credentials)

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.credentials).toBeNull()
  })
})
