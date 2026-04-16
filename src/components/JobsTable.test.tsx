import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { JobsTable } from './JobsTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { id?: string; list?: string }) => {
      if (key === 'clients.tagsTooltip' && opts?.list) {
        return `Tags: ${opts.list}`
      }
      if (key === 'jobs.idLinkAria' && opts?.id) {
        return `Open job ${opts.id}`
      }
      return key
    },
  }),
}))

describe('JobsTable', () => {
  it('renders actions column and calls onEdit and onArchive', () => {
    const onEdit = vi.fn()
    const onArchive = vi.fn()
    const onStatusSelect = vi.fn()
    const job = {
      id: 'J1',
      client_id: 'CL1',
      description: 'Widget',
      status: 'draft' as const,
      created_at: '2025-01-01',
    }
    render(
      <MemoryRouter>
        <JobsTable
          jobs={[job]}
          pieces={[]}
          clients={[{ id: 'CL1', name: 'Acme', created_at: '2025-01-01' }]}
          onStatusSelect={onStatusSelect}
          onEdit={onEdit}
          onArchive={onArchive}
          statusUpdatingId={null}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('jobs.actions')).toBeInTheDocument()
    expect(screen.getByTestId('job-client-link-J1')).toHaveAttribute(
      'href',
      '/clients/CL1'
    )
    fireEvent.click(screen.getByTestId('job-edit-J1'))
    fireEvent.click(screen.getByTestId('job-archive-J1'))
    expect(onEdit).toHaveBeenCalledWith(job)
    expect(onArchive).toHaveBeenCalledWith(job)
  })

  it('shows tag tooltip on job id hover when tags are provided', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onArchive = vi.fn()
    const onStatusSelect = vi.fn()
    const job = {
      id: 'J1',
      client_id: 'CL1',
      description: 'Widget',
      status: 'draft' as const,
      created_at: '2025-01-01',
    }
    const tagTitle = new Map([['J1', 'Vip, Partner']])
    render(
      <MemoryRouter>
        <JobsTable
          jobs={[job]}
          pieces={[]}
          clients={[{ id: 'CL1', name: 'Acme', created_at: '2025-01-01' }]}
          tagTitleByJobId={tagTitle}
          onStatusSelect={onStatusSelect}
          onEdit={onEdit}
          onArchive={onArchive}
          statusUpdatingId={null}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Widget' })
    await user.hover(link)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveAttribute('aria-label', 'Tags: Vip, Partner')
    expect(tip).toHaveTextContent('Vip')
    expect(tip).toHaveTextContent('Partner')
  })
})
