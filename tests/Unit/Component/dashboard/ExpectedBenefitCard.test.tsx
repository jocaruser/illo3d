import { screen } from '@testing-library/react'
import { ExpectedBenefitCard } from '@/Component/dashboard/ExpectedBenefitCard'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { renderWithProviders } from '../helpers/renderWithProviders'
import { seedInventory, seedJob, seedLot, seedPiece, seedPieceItem, setupShop } from './harness'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('./harness')
  return { useEntityManager: () => harness.currentEm() }
})

let context: TestContext

const EMPTY_MESSAGE = /Add units, per-unit prices, and material lines/

/** A job whose single piece is priced and fully costable: 2 × (€20 − €5). */
function seedQualifyingJob(jobFields: SheetRecord = {}, pieceFields: SheetRecord = {}): void {
  seedJob(context.tabs, {
    id: 'J1',
    client_id: 'CL1',
    description: 'Vase',
    ...jobFields,
  })
  seedPiece(context.tabs, {
    id: 'P1',
    job_id: 'J1',
    name: 'Body',
    price: '20',
    units: '2',
    ...pieceFields,
  })
  seedPieceItem(context.tabs, {
    id: 'PI1',
    piece_id: 'P1',
    inventory_id: 'INV1',
    quantity: '100',
  })
  seedInventory(context.tabs, { id: 'INV1', name: 'PLA' })
  seedLot(context.tabs, {
    id: 'L1',
    inventory_id: 'INV1',
    quantity: '1000',
    amount: '50',
  })
}

describe('ExpectedBenefitCard', () => {
  beforeEach(() => {
    context = setupShop()
  })

  it('guides the user when nothing qualifies yet', () => {
    renderWithProviders(<ExpectedBenefitCard />)

    expect(screen.getByText('Expected benefit (active jobs)')).toBeInTheDocument()
    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
  })

  it('sums the benefit of qualifying open jobs', () => {
    seedQualifyingJob()

    renderWithProviders(<ExpectedBenefitCard />)

    expect(screen.getByText('€30.00')).toHaveClass('text-success')
  })

  it('colors a negative expectation red', () => {
    seedJob(context.tabs, {
      id: 'J1',
      client_id: 'CL1',
      description: 'Underpriced',
    })
    seedPiece(context.tabs, {
      id: 'P1',
      job_id: 'J1',
      name: 'Body',
      price: '1',
      units: '1',
    })
    seedPieceItem(context.tabs, {
      id: 'PI1',
      piece_id: 'P1',
      inventory_id: 'INV1',
      quantity: '100',
    })
    seedInventory(context.tabs, { id: 'INV1', name: 'PLA' })
    seedLot(context.tabs, {
      id: 'L1',
      inventory_id: 'INV1',
      quantity: '1000',
      amount: '50',
    })

    renderWithProviders(<ExpectedBenefitCard />)

    expect(screen.getByText('-€4.00')).toHaveClass('text-danger')
  })

  describe('does not qualify', () => {
    it('a job that is already paid', () => {
      seedQualifyingJob({ status: 'paid' })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })

    it('an archived job', () => {
      seedQualifyingJob({ archived: 'true' })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })

    it('a piece with no price', () => {
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
      seedPiece(context.tabs, {
        id: 'P1',
        job_id: 'J1',
        name: 'Body',
        units: '2',
      })
      seedPieceItem(context.tabs, {
        id: 'PI1',
        piece_id: 'P1',
        inventory_id: 'INV1',
        quantity: '100',
      })
      seedInventory(context.tabs, { id: 'INV1', name: 'PLA' })
      seedLot(context.tabs, {
        id: 'L1',
        inventory_id: 'INV1',
        quantity: '1000',
        amount: '50',
      })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })

    it('a piece with no material lines', () => {
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
      seedPiece(context.tabs, {
        id: 'P1',
        job_id: 'J1',
        name: 'Body',
        price: '20',
        units: '2',
      })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })

    it('a piece whose material has no lot cost', () => {
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
      seedPiece(context.tabs, {
        id: 'P1',
        job_id: 'J1',
        name: 'Body',
        price: '20',
        units: '2',
      })
      seedPieceItem(context.tabs, {
        id: 'PI1',
        piece_id: 'P1',
        inventory_id: 'INV1',
        quantity: '100',
      })
      seedInventory(context.tabs, { id: 'INV1', name: 'PLA' })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })

    it('a deleted piece of an otherwise fine job', () => {
      seedQualifyingJob({}, { deleted: 'true' })

      renderWithProviders(<ExpectedBenefitCard />)

      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument()
    })
  })

  it('counts the qualifying pieces of a partly-configured job', () => {
    seedQualifyingJob()
    seedPiece(context.tabs, {
      id: 'P2',
      job_id: 'J1',
      name: 'Lid',
      price: '99',
    })

    renderWithProviders(<ExpectedBenefitCard />)

    expect(screen.getByText('€30.00')).toBeInTheDocument()
  })
})
