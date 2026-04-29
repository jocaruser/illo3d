import { describe, it, expect, beforeEach } from 'vitest'
import { useUserPreferencesStore } from './userPreferencesStore'
import { clearTestPersistStorage } from './persistStorage'

describe('userPreferencesStore', () => {
  beforeEach(() => {
    clearTestPersistStorage()
    // Reset store to initial state
    const store = useUserPreferencesStore.getState()
    store.setLanguage('en')
    store.setTheme('light')
  })

  it('should have default values', () => {
    const state = useUserPreferencesStore.getState()
    expect(state.language).toBe('en')
    expect(state.theme).toBe('light')
  })

  it('should set language', () => {
    const store = useUserPreferencesStore.getState()
    store.setLanguage('es')
    expect(useUserPreferencesStore.getState().language).toBe('es')
  })

  it('should set theme', () => {
    const store = useUserPreferencesStore.getState()
    store.setTheme('dark')
    expect(useUserPreferencesStore.getState().theme).toBe('dark')
  })

  it('should toggle theme from light to dark', () => {
    const store = useUserPreferencesStore.getState()
    expect(store.theme).toBe('light')
    store.toggleTheme()
    expect(useUserPreferencesStore.getState().theme).toBe('dark')
  })

  it('should toggle theme from dark to light', () => {
    const store = useUserPreferencesStore.getState()
    store.setTheme('dark')
    store.toggleTheme()
    expect(useUserPreferencesStore.getState().theme).toBe('light')
  })
})
