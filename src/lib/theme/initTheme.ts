export function initTheme(): void {
  try {
    const stored = localStorage.getItem('user-preferences-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.state?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    }
  } catch {
    // Ignore errors (localStorage unavailable, invalid data, etc.)
  }
}
