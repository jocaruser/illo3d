import { screen } from '@testing-library/react'
import { ClientsTable } from '@/Component/detail/ClientsTable'
import { tableViewportTierClass } from '@/Component/table/tableViewportTier'
import { Client } from '@/Entity/Client'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('ClientsTable viewport tiers', () => {
  const client = Client.fromRecord({
    id: 'C1',
    name: 'Acme',
    email: 'a@example.com',
    phone: '555',
    notes: '',
    created_at: '2024-01-01T00:00:00Z',
    archived: '',
    deleted: '',
  })

  it('applies medium tier to phone and wide tier to created', () => {
    renderWithProviders(
      <ClientsTable
        rows={[client]}
        tagNames={() => []}
        emptyMessage="None"
        onEdit={() => undefined}
        onArchive={() => undefined}
      />
    )

    const phoneHeader = screen.getByRole('columnheader', { name: /phone/i })
    expect(phoneHeader).toHaveClass(...tableViewportTierClass('medium').split(/\s+/))

    const createdHeader = screen.getByRole('columnheader', { name: /created/i })
    expect(createdHeader).toHaveClass(...tableViewportTierClass('wide').split(/\s+/))
  })
})
