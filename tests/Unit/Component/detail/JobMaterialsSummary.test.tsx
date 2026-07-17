import { screen, within } from '@testing-library/react'
import { JobMaterialsSummary } from '@/Component/detail/JobMaterialsSummary'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderWithProviders, type TestWorld } from './helpers/renderDetail'

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))

/**
 * J1 holds P1 (2 units) and P2 (3 units), both using INV1 filament, plus a
 * consumable and an equipment line so the type ordering is observable.
 */
function seedWorld(): TestWorld {
  return createWorld({
    jobs: [{ id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'draft', created_at: '2024-05-01T09:00:00.000Z' }],
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'pending', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
      { id: 'P2', job_id: 'J1', name: 'Arm', status: 'pending', units: '3', created_at: '2024-05-01T11:00:00.000Z' },
      { id: 'P3', job_id: 'J1', name: 'Gone', status: 'pending', units: '9', created_at: '2024-05-01T12:00:00.000Z', deleted: 'true' },
      { id: 'P4', job_id: 'J2', name: 'Other job', status: 'pending', units: '1', created_at: '2024-05-01T13:00:00.000Z' },
    ],
    piece_items: [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' },
      { id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: '5' },
      { id: 'PI3', piece_id: 'P1', inventory_id: 'INV2', quantity: '1' },
      { id: 'PI4', piece_id: 'P1', inventory_id: 'INV3', quantity: '1' },
      { id: 'PI5', piece_id: 'P3', inventory_id: 'INV1', quantity: '100' },
      { id: 'PI6', piece_id: 'P4', inventory_id: 'INV1', quantity: '50' },
      { id: 'PI7', piece_id: 'P1', inventory_id: 'INV404', quantity: '1' },
    ],
    inventory: [
      { id: 'INV1', type: 'filament', name: 'PLA White', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV2', type: 'consumable', name: 'Nozzle', qty_current: '3', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV3', type: 'equipment', name: 'Ender 3', qty_current: '1', created_at: '2024-01-01T00:00:00.000Z' },
    ],
    lots: [
      { id: 'L1', inventory_id: 'INV1', transaction_id: 'T9', quantity: '1000', amount: '20', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'L2', inventory_id: 'INV2', transaction_id: 'T9', quantity: '2', amount: '10', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

function summaryRows(): string[][] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent ?? ''))
}

beforeEach(() => {
  world = seedWorld()
})

describe('JobMaterialsSummary', () => {
  it('says so when the job uses no material', () => {
    world = createWorld({})
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)

    expect(screen.getByRole('heading', { name: 'Materials summary' })).toBeInTheDocument()
    expect(screen.getByText('No materials used for this job.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('aggregates one row per inventory item, filament first', () => {
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)

    expect(summaryRows()).toEqual([
      // 10g × 2 units + 5g × 3 units = 35g @ €0.02/g; 900g covers 35g 24 times over.
      ['PLA White', '35', '€0.70', '24', '900', 'Shell, Arm'],
      // 1 × 2 units @ €5 each; not filament, so no redo figure.
      ['Nozzle', '2', '€10.00', '—', '3', 'Shell'],
      // No lots, so no cost.
      ['Ender 3', '2', '—', '—', '1', 'Shell'],
    ])
  })

  it('ignores pieces of other jobs, deleted pieces and unknown inventory', () => {
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)

    // P3 (deleted) and P4 (other job) would each add 100g/50g of PLA.
    expect(summaryRows()[0][1]).toBe('35')
    expect(screen.queryByText('INV404')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  it('reports the overall risk from the tightest filament margin', () => {
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)
    expect(screen.getByTestId('job-materials-overall-risk')).toHaveTextContent(
      'Overall risk: Safe (24 redos)'
    )
  })

  it('says there is no filament when the job uses none', () => {
    world.em.pieceItems.remove('PI1')
    world.em.pieceItems.remove('PI2')
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)

    expect(screen.getByTestId('job-materials-overall-risk')).toHaveTextContent(
      'Overall risk: No filament lines'
    )
  })

  it('counts a piece with unset units as a single unit', () => {
    const piece = world.em.pieces.find('P1')
    if (piece !== null) {
      piece.units = undefined
      world.em.pieces.save(piece)
    }
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)

    // 10g × 1 + 5g × 3.
    expect(summaryRows()[0][1]).toBe('25')
  })

  it('recomputes when the revision changes', () => {
    const { rerender } = renderWithProviders(<JobMaterialsSummary jobId="J1" revision={0} />)
    expect(summaryRows()[0][1]).toBe('35')

    const line = world.em.pieceItems.find('PI1')
    if (line !== null) {
      line.quantity = 20
      world.em.pieceItems.save(line)
    }
    rerender(<JobMaterialsSummary jobId="J1" revision={1} />)
    expect(summaryRows()[0][1]).toBe('55')
  })

  it('treats a line with no quantity as zero', () => {
    const line = world.em.pieceItems.find('PI2')
    if (line !== null) {
      line.quantity = undefined
      world.em.pieceItems.save(line)
    }
    renderWithProviders(<JobMaterialsSummary jobId="J1" />)
    expect(summaryRows()[0][1]).toBe('20')
  })
})
