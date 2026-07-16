export type Theme = 'light' | 'dark'

/**
 * Reads the persisted theme without importing the preferences store — the
 * theme must apply before React mounts (and before Zustand hydration) to
 * avoid a flash of the wrong theme. Runs from the bundle, never inline,
 * because the CSP forbids inline scripts.
 */
export function readPersistedTheme(storage: Pick<Storage, 'getItem'>): Theme {
  try {
    const raw = storage.getItem('user-preferences-storage')
    if (raw === null) return 'light'
    const parsed = JSON.parse(raw) as { state?: { theme?: string } }
    return parsed.state?.theme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Applies a theme at runtime by toggling the `dark` class on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Applies the persisted theme. Called from the bundle before React mounts. */
export function initTheme(): void {
  applyTheme(readPersistedTheme(window.localStorage))
}
