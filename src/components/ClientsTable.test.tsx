import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientsTable } from './ClientsTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ClientsTable', () => {
  it('renders column headers and client rows', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <MemoryRouter>
        <ClientsTable
          clients={[
            {
              id: 'CL1',
              name: 'Acme',
              email: 'a@x.com',
              phone: '+1',
              notes: 'Note',
              created_at: '2025-01-01',
            },
          ]}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('clients.name')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('a@x.com')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('2025-01-01')).toBeInTheDocument()
  })

  it('calls onEdit and onDelete', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const client = {
      id: 'CL1',
      name: 'Acme',
      created_at: '2025-01-01',
    }
    render(
      <MemoryRouter>
        <ClientsTable clients={[client]} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'clients.edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'clients.delete' }))

    expect(onEdit).toHaveBeenCalledWith(client)
    expect(onDelete).toHaveBeenCalledWith(client)
  })
})
