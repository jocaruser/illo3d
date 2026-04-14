import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryError } from './QueryError'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('QueryError', () => {
  it('renders default error message and retry button', () => {
    render(<QueryError onRetry={() => {}} />)
    expect(screen.getByText('errors.fetchFailed')).toBeInTheDocument()
    expect(screen.getByText('errors.retryAction')).toBeInTheDocument()
  })

  it('uses custom messageKey when provided', () => {
    render(<QueryError messageKey="errors.deleteFailed" onRetry={() => {}} />)
    expect(screen.getByText('errors.deleteFailed')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn()
    render(<QueryError onRetry={onRetry} />)
    await userEvent.click(screen.getByText('errors.retryAction'))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
