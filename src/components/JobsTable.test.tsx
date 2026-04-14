import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobsTable } from './JobsTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('JobsTable', () => {
  it('renders actions column and calls onEdit and onDelete', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
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
          clients={[{ id: 'CL1', name: 'Acme', created_at: '2025-01-01' }]}
          onStatusSelect={onStatusSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          statusUpdatingId={null}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('jobs.actions')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('job-edit-J1'))
    fireEvent.click(screen.getByTestId('job-delete-J1'))
    expect(onEdit).toHaveBeenCalledWith(job)
    expect(onDelete).toHaveBeenCalledWith(job)
  })
})
