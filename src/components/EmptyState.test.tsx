import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('EmptyState', () => {
  it('defaults to transactions.empty message key', () => {
    render(<EmptyState />)
    expect(screen.getByText('transactions.empty')).toBeInTheDocument()
  })

  it('uses custom messageKey when provided', () => {
    render(<EmptyState messageKey="clients.empty" />)
    expect(screen.getByText('clients.empty')).toBeInTheDocument()
  })
})
