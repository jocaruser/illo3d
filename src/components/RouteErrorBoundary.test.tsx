import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { RouteErrorBoundary } from './RouteErrorBoundary'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function ThrowOnClick() {
  const [broken, setBroken] = useState(false)
  if (broken) {
    throw new Error('test error')
  }
  return (
    <button type="button" onClick={() => setBroken(true)}>
      trigger-error
    </button>
  )
}

describe('RouteErrorBoundary', () => {
  it('shows localized fallback and remounts children on retry', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RouteErrorBoundary resetKey="/test">
        <ThrowOnClick />
      </RouteErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: 'trigger-error' }))

    expect(screen.getByText('errors.routeTitle')).toBeInTheDocument()
    expect(screen.getByText('errors.routeDescription')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'errors.retry' }))

    expect(screen.queryByText('errors.routeTitle')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'trigger-error' })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
