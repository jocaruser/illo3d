import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecentList } from './RecentList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('RecentList', () => {
  it('renders label as link when labelLink is set', () => {
    render(
      <MemoryRouter>
        <RecentList
          title="Recent"
          viewAllTo="/transactions"
          items={[
            {
              id: 'tx1',
              date: '2025-04-01',
              label: 'Logo job',
              amount: 12,
              labelLink: {
                to: '/jobs/J4',
                testId: 'transaction-concept-job-link-tx1',
              },
            },
          ]}
        />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Logo job' })
    expect(link).toHaveAttribute('href', '/jobs/J4')
    expect(link).toHaveAttribute('data-testid', 'transaction-concept-job-link-tx1')
  })

  it('renders plain label when labelLink is absent', () => {
    render(
      <MemoryRouter>
        <RecentList
          title="Recent"
          viewAllTo="/transactions"
          items={[
            {
              id: 'tx2',
              date: '2025-01-01',
              label: 'Plain concept',
              amount: -5,
            },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Plain concept')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Plain concept' }),
    ).not.toBeInTheDocument()
  })
})
