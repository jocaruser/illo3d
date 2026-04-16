import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateJobPopup } from './CreateJobPopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockCreateJob = vi.fn()
const mockUpdateJob = vi.fn()

vi.mock('@/services/job/createJob', () => ({
  createJob: (...args: unknown[]) => mockCreateJob(...args),
}))

vi.mock('@/services/job/updateJob', () => ({
  updateJob: (...args: unknown[]) => mockUpdateJob(...args),
}))

describe('CreateJobPopup', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const clients = [
    { id: 'CL1', name: 'Alice', created_at: '2025-01-01' },
    { id: 'CL2', name: 'Bob', created_at: '2025-01-02' },
  ]

  beforeEach(() => {
    mockCreateJob.mockReset()
    mockUpdateJob.mockReset()
    onClose.mockClear()
    onSuccess.mockClear()
  })

  it('submits create when no initialJob', async () => {
    mockCreateJob.mockResolvedValue(undefined)
    render(
      <CreateJobPopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="s1"
        clients={clients}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('jobs.clientSearchPlaceholder'), {
      target: { value: 'Alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }))
    fireEvent.change(screen.getByPlaceholderText('jobs.descriptionPlaceholder'), {
      target: { value: 'New print' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'jobs.submit' }))

    await waitFor(() => expect(mockCreateJob).toHaveBeenCalled())
    expect(mockCreateJob).toHaveBeenCalledWith('s1', {
      client_id: 'CL1',
      description: 'New print',
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows edit title and calls updateJob when initialJob is set', async () => {
    mockUpdateJob.mockResolvedValue(undefined)
    render(
      <CreateJobPopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="s1"
        clients={clients}
        initialJob={{
          id: 'J9',
          client_id: 'CL1',
          description: 'Old',
          status: 'draft',
          price: 12,
          created_at: '2025-01-01',
        }}
      />
    )

    expect(screen.getByText('jobs.editTitle')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Old')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('jobs.descriptionPlaceholder'), {
      target: { value: 'Updated desc' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'jobs.save' }))

    await waitFor(() => expect(mockUpdateJob).toHaveBeenCalled())
    expect(mockUpdateJob).toHaveBeenCalledWith('s1', 'J9', {
      client_id: 'CL1',
      description: 'Updated desc',
    })
    expect(onSuccess).toHaveBeenCalled()
  })
})
