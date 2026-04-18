import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
  useGoogleOneTapLogin: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('App', () => {
  it('renders setup wizard on dashboard when no shop', async () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <App />
      </QueryClientProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText('wizard.localFolder')).toBeInTheDocument()
    })
  })
})
