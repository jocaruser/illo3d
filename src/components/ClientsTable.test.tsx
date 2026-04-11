import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientsTable } from './ClientsTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ClientsTable', () => {
  it('renders column headers and client rows', () => {
    render(
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
      />
    )

    expect(screen.getByText('clients.name')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('a@x.com')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('2025-01-01')).toBeInTheDocument()
  })

  it('does not render edit or delete controls', () => {
    render(
      <ClientsTable
        clients={[{ id: '1', name: 'Solo', created_at: '2025-01-01' }]}
      />
    )

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete|remove/i })
    ).not.toBeInTheDocument()
  })
})
