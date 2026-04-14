import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('LoadingSpinner', () => {
  it('exposes status semantics and loading label', () => {
    render(<LoadingSpinner />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).toHaveAttribute('aria-label', 'common.loading')
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })
})
