import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MentionLinkify } from './MentionLinkify'

describe('MentionLinkify', () => {
  it('renders @P2 as link to job with piece hash when piece is in context', () => {
    render(
      <MemoryRouter>
        <MentionLinkify
          text="See @P2"
          pieces={[
            {
              id: 'P2',
              job_id: 'J1',
              name: 'Phone case bottom shell',
              status: 'pending',
              created_at: '2025-02-05',
            },
          ]}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Phone case bottom shell' })
    expect(link).toHaveAttribute('href', '/jobs/J1#piece-P2')
  })
})
