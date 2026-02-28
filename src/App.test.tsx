import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

vi.mock('@react-oauth/google', () => ({
  useGoogleOneTapLogin: vi.fn(),
  GoogleLogin: () => null,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('App', () => {
  it('renders illo3d title', () => {
    render(<App />)
    expect(screen.getByText('illo3d')).toBeInTheDocument()
  })
})
