import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('App', () => {
  it('renders login page when unauthenticated', () => {
    render(<App />)
    expect(screen.getByText('login.title')).toBeInTheDocument()
  })
})
