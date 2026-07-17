import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryPage } from '@/Controller/InventoryPage'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs, renderRoute } from '../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

function bodyRows(): HTMLElement[] {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

function rowFor(id: string): HTMLElement {
  const row = bodyRows().find(
    (candidate) => within(candidate).queryByText(id) !== null
  )
  if (row === undefined) throw new Error(`No row for ${id}`)
  return row
}

function cells(id: string): HTMLElement[] {
  return within(rowFor(id)).getAllByRole('cell')
}

function seedWorkbook(): FakeTabs {
  const tabs = new FakeTabs()
  tabs.seed('inventory', {
    id: 'INV1',
    type: 'filament',
    name: 'PLA White',
    qty_current: '800',
    created_at: '2026-01-02T00:00:00.000Z',
    colour: '#ff0000',
  })
  tabs.seed('inventory', {
    id: 'INV2',
    type: 'equipment',
    name: 'Ender 3',
    qty_current: '1',
    created_at: '2026-01-01T00:00:00.000Z',
  })
  tabs.seed('inventory', {
    id: 'INV3',
    type: 'consumable',
    name: 'Archived glue',
    qty_current: '5',
    archived: 'true',
  })
  tabs.seed('inventory', {
    id: 'INV4',
    type: 'consumable',
    name: 'Deleted tape',
    qty_current: '5',
    deleted: 'true',
  })
  // Two lots on INV1: 1000g for €20 and 500g for €10 → €0.02/g.
  tabs.seed('lots', {
    id: 'L1',
    inventory_id: 'INV1',
    transaction_id: 'T1',
    quantity: '1000',
    amount: '20',
  })
  tabs.seed('lots', {
    id: 'L2',
    inventory_id: 'INV1',
    transaction_id: 'T2',
    quantity: '500',
    amount: '10',
  })
  return tabs
}

describe('InventoryPage', () => {
  beforeEach(() => {
    mocks.em = createTestEm(seedWorkbook())
  })

  it('lists only active items', () => {
    renderRoute(<InventoryPage />)

    expect(bodyRows()).toHaveLength(2)
    expect(screen.getByText('PLA White')).toBeInTheDocument()
    expect(screen.queryByText('Archived glue')).not.toBeInTheDocument()
    expect(screen.queryByText('Deleted tape')).not.toBeInTheDocument()
  })

  it('offers no way to create an item, because purchases create them', () => {
    renderRoute(<InventoryPage />)

    expect(
      screen.queryByRole('button', { name: /^(add|create|new)\b/i })
    ).not.toBeInTheDocument()
  })

  it('links the id to the detail page and localizes the type', () => {
    renderRoute(<InventoryPage />)

    expect(screen.getByTestId('inventory-table-link-INV1')).toHaveAttribute(
      'href',
      '/inventory/INV1'
    )
    expect(cells('INV1')[2]).toHaveTextContent('Filament')
    expect(cells('INV2')[2]).toHaveTextContent('Equipment')
  })

  it('shows a swatch only for an item that has a colour', () => {
    renderRoute(<InventoryPage />)

    expect(within(rowFor('INV1')).getByTitle('#ff0000')).toBeInTheDocument()
    expect(within(rowFor('INV2')).queryByTitle(/^#/)).not.toBeInTheDocument()
  })

  it('averages unit cost over active lots and dashes items without any', () => {
    renderRoute(<InventoryPage />)

    expect(cells('INV1')[4]).toHaveTextContent('€0.02')
    expect(cells('INV2')[4]).toHaveTextContent('—')
  })

  it('ignores archived lots when averaging', () => {
    const tabs = new FakeTabs()
    tabs.seed('inventory', {
      id: 'INV1',
      type: 'filament',
      name: 'PLA White',
      qty_current: '800',
    })
    tabs.seed('lots', {
      id: 'L1',
      inventory_id: 'INV1',
      transaction_id: 'T1',
      quantity: '1000',
      amount: '20',
      archived: 'true',
    })
    mocks.em = createTestEm(tabs)
    renderRoute(<InventoryPage />)

    expect(cells('INV1')[4]).toHaveTextContent('—')
  })

  describe('low-stock thresholds', () => {
    /** Re-renders from scratch so several tiers can be checked in one test. */
    function withThresholds(
      qty: string,
      red = '10',
      orange = '20',
      yellow = '30'
    ): HTMLElement {
      cleanup()
      const tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
        qty_current: qty,
        warn_red: red,
        warn_orange: orange,
        warn_yellow: yellow,
      })
      mocks.em = createTestEm(tabs)
      renderRoute(<InventoryPage />)
      return cells('INV1')[3]
    }

    it('tints red at or below the red tier, which wins over the others', () => {
      expect(withThresholds('5')).toHaveClass('text-danger')
      expect(withThresholds('10')).toHaveClass('text-danger')
    })

    it('tints orange between the red and orange tiers', () => {
      expect(withThresholds('15')).toHaveClass('text-orange-600')
    })

    it('tints yellow between the orange and yellow tiers', () => {
      expect(withThresholds('25')).toHaveClass('text-yellow-600')
    })

    it('leaves healthy stock untinted', () => {
      const cell = withThresholds('35')
      expect(cell).not.toHaveClass('text-danger')
      expect(cell).not.toHaveClass('text-orange-600')
      expect(cell).not.toHaveClass('text-yellow-600')
    })

    it('treats a zero threshold as disabled', () => {
      expect(withThresholds('5', '0', '0', '30')).toHaveClass('text-yellow-600')
      expect(withThresholds('5', '0', '0', '0')).not.toHaveClass(
        'text-yellow-600'
      )
    })
  })

  describe('sorting', () => {
    it('sorts by id ascending by default and reverses on toggle', async () => {
      const user = userEvent.setup()
      renderRoute(<InventoryPage />)

      expect(
        bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)
      ).toEqual(['INV1', 'INV2'])

      await user.click(
        screen.getByRole('button', { name: /sort by id|id, sorted/i })
      )
      expect(
        bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)
      ).toEqual(['INV2', 'INV1'])
    })

    it('sorts by name, type, quantity, average cost and created date', async () => {
      const user = userEvent.setup()
      renderRoute(<InventoryPage />)
      const names = () =>
        bodyRows().map((row) => within(row).getAllByRole('cell')[1].textContent)

      await user.click(screen.getByRole('button', { name: /sort by name/i }))
      expect(names()).toEqual(['Ender 3', 'PLA White'])

      await user.click(screen.getByRole('button', { name: /sort by type/i }))
      expect(names()).toEqual(['Ender 3', 'PLA White'])

      await user.click(screen.getByRole('button', { name: /sort by qty/i }))
      expect(names()).toEqual(['Ender 3', 'PLA White'])

      // INV2 has no lots, so it has no cost to rank and sinks to the bottom.
      await user.click(
        screen.getByRole('button', { name: /sort by avg unit cost/i })
      )
      expect(names()).toEqual(['PLA White', 'Ender 3'])

      await user.click(screen.getByRole('button', { name: /sort by created/i }))
      expect(names()).toEqual(['Ender 3', 'PLA White'])
    })

    it('breaks ties in the sorted column by id', async () => {
      const user = userEvent.setup()
      const tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV2',
        type: 'consumable',
        name: 'Tape',
        qty_current: '5',
      })
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'consumable',
        name: 'Glue',
        qty_current: '5',
      })
      mocks.em = createTestEm(tabs)
      renderRoute(<InventoryPage />)

      await user.click(screen.getByRole('button', { name: /sort by qty/i }))
      expect(
        bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)
      ).toEqual(['INV1', 'INV2'])
    })
  })

  describe('search', () => {
    it('filters fuzzily by name', async () => {
      const user = userEvent.setup()
      renderRoute(<InventoryPage />)

      await user.type(screen.getByRole('searchbox'), 'Ender')

      expect(bodyRows()).toHaveLength(1)
      expect(screen.getByText('Ender 3')).toBeInTheDocument()
    })

    it('reports no matches rather than an empty inventory', async () => {
      const user = userEvent.setup()
      renderRoute(<InventoryPage />)

      await user.type(screen.getByRole('searchbox'), 'zzzznothing')

      expect(screen.getByText('No rows match your search.')).toBeInTheDocument()
    })
  })

  it('explains how items come into existence when there are none', () => {
    mocks.em = createTestEm(new FakeTabs())
    renderRoute(<InventoryPage />)

    expect(
      screen.getByText(/Record a purchase with .Add to inventory./)
    ).toBeInTheDocument()
  })
})
