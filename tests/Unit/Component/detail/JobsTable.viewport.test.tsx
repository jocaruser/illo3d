import { screen } from '@testing-library/react'
import { JobsTable } from '@/Component/detail/JobsTable'
import { tableViewportTierClass } from '@/Component/table/tableViewportTier'
import { Job } from '@/Entity/Job'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('JobsTable viewport tiers', () => {
  const job = Job.fromRecord({
    id: 'J1',
    client_id: 'C1',
    description: 'Test job',
    status: 'draft',
    created_at: '2024-01-01T00:00:00Z',
    archived: '',
    deleted: '',
  })

  it('keeps the id column always visible and applies wide tier to total', () => {
    renderWithProviders(
      <JobsTable
        rows={[job]}
        clientName={() => 'Acme'}
        tagNames={() => []}
        pricingOf={() => ({ complete: true, total: 10 })}
        emptyMessage="None"
        onStatusChange={() => undefined}
        onEdit={() => undefined}
        onArchive={() => undefined}
      />
    )

    const idHeader = screen.getByRole('columnheader', { name: /id/i })
    expect(idHeader).not.toHaveClass('hidden')

    const totalHeader = screen.getByRole('columnheader', { name: /total/i })
    expect(totalHeader).toHaveClass(...tableViewportTierClass('wide').split(/\s+/))
  })
})
