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
    const job = {
      id: 'J1',
      client_id: 'CL1',
      description: 'Widget',
      created_at: '2025-01-01',
    }
    render(
      <MemoryRouter>
        <JobsTable
          jobs={[job]}
          pieces={[]}
          clients={[{ id: 'CL1', name: 'Acme', created_at: '2025-01-01' }]}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('jobs.colActions')).toBeInTheDocument()
    expect(screen.getByTestId('job-client-link-J1')).toHaveAttribute(
      'href',
      '/clients/CL1'
    )

    fireEvent.click(screen.getByTestId('job-edit-J1'))
    expect(onEdit).toHaveBeenCalledWith(job)

    fireEvent.click(screen.getByTestId('job-archive-J1'))
    expect(onArchive).toHaveBeenCalledWith(job)
  })

  it('shows tag tooltip when tagTitleByJobId is provided', async () => {
    const user = userEvent.setup()
    const job = {
      id: 'J1',
      client_id: 'CL1',
      description: 'Widget',
      created_at: '2025-01-01',
    }
    const tagTitleByJobId = new Map([['J1', 'urgent, printed']])
    render(
      <MemoryRouter>
        <JobsTable
          jobs={[job]}
          pieces={[]}
          clients={[{ id: 'CL1', name: 'Acme', created_at: '2025-01-01' }]}
          tagTitleByJobId={tagTitleByJobId}
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />
      </MemoryRouter>
    )

    const description = screen.getByTestId('job-description-tooltip-J1')
    await user.hover(description)
    expect(await screen.findByText('urgent')).toBeInTheDocument()
    expect(await screen.findByText('printed')).toBeInTheDocument()
  })

  it('renders empty state when no jobs', () => {
    render(
      <MemoryRouter>
        <JobsTable
          jobs={[]}
          pieces={[]}
          clients={[]}
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('jobs.empty')).toBeInTheDocument()
  })
})