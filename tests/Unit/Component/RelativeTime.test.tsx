import { screen } from '@testing-library/react'
import { RelativeTime } from '@/Component/RelativeTime'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-09T14:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders relative text with the absolute timestamp as title', () => {
    renderWithProviders(<RelativeTime value="2026-07-09T14:25:00Z" />)

    const time = screen.getByText('5 minutes ago')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('title', expect.stringContaining('Jul 9, 2026'))
  })

  it('echoes invalid input as both text and title', () => {
    renderWithProviders(<RelativeTime value="garbage" />)

    const time = screen.getByText('garbage')
    expect(time).toHaveAttribute('title', 'garbage')
  })
})
