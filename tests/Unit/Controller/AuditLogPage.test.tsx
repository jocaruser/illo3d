import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditLogPage } from '@/Controller/AuditLogPage'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs, renderRoute } from '../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

function seedWorkbook(): FakeTabs {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'TechStart Solutions' })
  tabs.seed('inventory', { id: 'INV1', name: 'PLA White', type: 'filament' })
  tabs.seed('audit_log', {
    id: 'AL001',
    timestamp: '2026-01-15T09:00:00.000Z',
    actor: 'ana@example.com',
    entity_name: 'client',
    entity_id: 'CL1',
    action: 'create',
  })
  tabs.seed('audit_log', {
    id: 'AL002',
    timestamp: '2026-01-16T09:00:00.000Z',
    actor: 'local',
    entity_name: 'inventory',
    entity_id: 'INV1',
    action: 'update',
  })
  tabs.seed('audit_log', {
    id: 'AL003',
    timestamp: '2026-01-17T09:00:00.000Z',
    actor: 'migration',
    entity_name: 'lot',
    entity_id: 'L1',
    action: 'migration',
  })
  return tabs
}

function rowIds(): string[] {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    mocks.em = createTestEm(seedWorkbook())
  })

  it('reads the log newest first', () => {
    renderRoute(<AuditLogPage />)

    expect(screen.getByTestId('audit-log-page')).toBeInTheDocument()
    expect(rowIds()).toEqual(['AL003', 'AL002', 'AL001'])
  })

  it('shows the empty state when nothing has been audited', () => {
    mocks.em = createTestEm(new FakeTabs())
    renderRoute(<AuditLogPage />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByTestId('audit-log-empty-state')).toHaveTextContent(
      'No audit entries yet'
    )
  })

  it('filters by action', async () => {
    const user = userEvent.setup()
    renderRoute(<AuditLogPage />)

    await user.selectOptions(
      screen.getByLabelText('Filter by action'),
      'update'
    )
    expect(rowIds()).toEqual(['AL002'])

    await user.selectOptions(screen.getByLabelText('Filter by action'), '')
    expect(rowIds()).toEqual(['AL003', 'AL002', 'AL001'])
  })

  it('filters by entity type', async () => {
    const user = userEvent.setup()
    renderRoute(<AuditLogPage />)

    await user.selectOptions(
      screen.getByLabelText('Filter by entity type'),
      'client'
    )
    expect(rowIds()).toEqual(['AL001'])
  })

  it('combines both filters', async () => {
    const user = userEvent.setup()
    renderRoute(<AuditLogPage />)

    await user.selectOptions(
      screen.getByLabelText('Filter by action'),
      'create'
    )
    await user.selectOptions(
      screen.getByLabelText('Filter by entity type'),
      'inventory'
    )

    expect(screen.getByTestId('audit-log-empty-state')).toHaveTextContent(
      'No rows match your search.'
    )
  })

  it('searches across actor, entity and id', async () => {
    const user = userEvent.setup()
    renderRoute(<AuditLogPage />)

    await user.type(screen.getByRole('searchbox'), 'ana@example.com')
    expect(rowIds()).toEqual(['AL001'])
  })

  it('tells the user a search matched nothing, not that the log is empty', async () => {
    const user = userEvent.setup()
    renderRoute(<AuditLogPage />)

    await user.type(screen.getByRole('searchbox'), 'zzzznothing')

    expect(screen.getByTestId('audit-log-empty-state')).toHaveTextContent(
      'No rows match your search.'
    )
  })
})
