import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ClientsTable } from './ClientsTable'
import type { Client } from '@/types/money'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { list?: string }) => {
      if (key === 'clients.tagsTooltip' && opts?.list) {
        return `Tags: ${opts.list}`
      }
      return key
    },
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

  it('shows tag tooltip on hover without native title delay', async () => {
    const user = userEvent.setup()
    const clients: Client[] = [
      {
        id: 'CL1',
        name: 'Acme',
        created_at: '2025-01-01',
      },
    ]
    const title = new Map([['CL1', 'Vip, Partner']])
    render(
      <MemoryRouter>
        <ClientsTable
          clients={clients}
          tagTitleByClientId={title}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Acme' })
    expect(link).not.toHaveAttribute('title')
    await user.hover(link)

    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveAttribute('aria-label', 'Tags: Vip, Partner')
    expect(tip).toHaveTextContent('Vip')
    expect(tip).toHaveTextContent('Partner')
  })

  it('fuzzy search matches linked tag names', () => {
    const clients: Client[] = [
      { id: 'CL1', name: 'Alpha', created_at: '2025-01-01' },
      { id: 'CL2', name: 'Beta', created_at: '2025-01-02' },
    ]
    const tagSearch = new Map([
      ['CL1', ''],
      ['CL2', 'VIP Member'],
    ])
    render(
      <MemoryRouter>
        <ClientsTable
          clients={clients}
          tagSearchLineByClientId={tagSearch}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByTestId('list-table-search'), {
      target: { value: 'VIP' },
    })

    expect(screen.getByRole('link', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Alpha' })).not.toBeInTheDocument()
  })
})
