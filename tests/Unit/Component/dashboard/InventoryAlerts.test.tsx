import { screen } from '@testing-library/react'
import { InventoryAlerts } from '@/Component/dashboard/InventoryAlerts'
import { renderWithProviders } from '../helpers/renderWithProviders'
import { seedInventory, setupShop } from './harness'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('./harness')
  return { useEntityManager: () => harness.currentEm() }
})

let context: TestContext

function alertRows(): HTMLElement[] {
  return screen.getAllByRole('link').filter((node) => node.dataset.level !== undefined)
}

describe('InventoryAlerts', () => {
  beforeEach(() => {
    context = setupShop()
  })

  it('reassures when every level is healthy', () => {
    seedInventory(context.tabs, {
      id: 'INV1',
      name: 'PLA',
      qty_current: '900',
      warn_red: '100',
    })

    renderWithProviders(<InventoryAlerts />)

    expect(screen.getByText('All stock levels look healthy.')).toBeInTheDocument()
    expect(alertRows()).toHaveLength(0)
  })

  it('links to the whole inventory', () => {
    renderWithProviders(<InventoryAlerts />)

    expect(screen.getByRole('link', { name: 'View inventory' })).toHaveAttribute(
      'href',
      '/inventory'
    )
  })

  it.each([
    ['red', '100', 'border-l-danger'],
    ['orange', '200', 'border-l-warning'],
    ['yellow', '300', 'border-l-warning/50'],
  ])('borders a %s item', (level, qty, expectedClass) => {
    seedInventory(context.tabs, {
      id: 'INV1',
      name: 'PLA',
      qty_current: qty,
      warn_red: '100',
      warn_orange: '200',
      warn_yellow: '300',
    })

    renderWithProviders(<InventoryAlerts />)

    const row = screen.getByRole('link', { name: /PLA/ })
    expect(row).toHaveAttribute('href', '/inventory/INV1')
    expect(row).toHaveAttribute('data-level', level)
    expect(row).toHaveClass(expectedClass)
    expect(row).toHaveTextContent(qty)
  })

  it('lists the worst tier first', () => {
    seedInventory(context.tabs, {
      id: 'INV1',
      name: 'Mild',
      qty_current: '300',
      warn_yellow: '300',
    })
    seedInventory(context.tabs, {
      id: 'INV2',
      name: 'Critical',
      qty_current: '10',
      warn_red: '100',
    })
    seedInventory(context.tabs, {
      id: 'INV3',
      name: 'Low',
      qty_current: '150',
      warn_orange: '200',
    })

    renderWithProviders(<InventoryAlerts />)

    expect(alertRows().map((node) => node.textContent)).toEqual([
      'Critical10',
      'Low150',
      'Mild300',
    ])
  })

  it('alerts at the threshold, not only below it', () => {
    seedInventory(context.tabs, { id: 'INV1', name: 'PLA', qty_current: '100', warn_red: '100' })

    renderWithProviders(<InventoryAlerts />)

    expect(screen.getByRole('link', { name: /PLA/ })).toHaveAttribute('data-level', 'red')
  })

  it('ignores archived and deleted items', () => {
    seedInventory(context.tabs, {
      id: 'INV1',
      name: 'Archived',
      qty_current: '0',
      warn_red: '100',
      archived: 'true',
    })
    seedInventory(context.tabs, {
      id: 'INV2',
      name: 'Deleted',
      qty_current: '0',
      warn_red: '100',
      deleted: 'true',
    })

    renderWithProviders(<InventoryAlerts />)

    expect(screen.getByText('All stock levels look healthy.')).toBeInTheDocument()
  })

  it('treats a zero threshold as disabled', () => {
    seedInventory(context.tabs, { id: 'INV1', name: 'PLA', qty_current: '0', warn_red: '0' })

    renderWithProviders(<InventoryAlerts />)

    expect(screen.getByText('All stock levels look healthy.')).toBeInTheDocument()
  })
})
