import { screen, within } from '@testing-library/react'
import { AuditTable } from '@/Component/audit/AuditTable'
import { AuditEntry } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import type { EntityManager } from '@/Repository/EntityManager'
import {
  createTestEm,
  FakeTabs,
  renderRoute,
} from '../../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

function entry(record: SheetRecord): AuditEntry {
  return AuditEntry.fromRecord(record)
}

const clientCreate = {
  id: 'AL001',
  timestamp: '2026-01-15T09:00:00.000Z',
  actor: 'local',
  entity_name: 'client',
  entity_id: 'CL1',
  action: 'create',
  after_json: '{"name":"TechStart Solutions"}',
}

function bodyRows(): HTMLElement[] {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

describe('AuditTable', () => {
  beforeEach(() => {
    const tabs = new FakeTabs()
    tabs.seed('clients', { id: 'CL1', name: 'TechStart Solutions' })
    tabs.seed('jobs', {
      id: 'J6',
      client_id: 'CL1',
      description: 'Piece test job',
    })
    tabs.seed('pieces', { id: 'P1', job_id: 'J6', name: 'Alpha bracket' })
    mocks.em = createTestEm(tabs)
  })

  it('lays out one row per entry as id, actor, action, entity, timestamp, parent', () => {
    renderRoute(
      <AuditTable entries={[entry(clientCreate)]} emptyMessage="none" />
    )

    const cells = within(bodyRows()[0]).getAllByRole('cell')
    expect(cells).toHaveLength(6)
    expect(cells[0]).toHaveTextContent('AL001')
    expect(cells[1]).toHaveTextContent('local')
    expect(cells[2]).toHaveTextContent('Create')
    expect(cells[3]).toHaveTextContent('TechStart Solutions')
    expect(within(cells[4]).getByTitle(/2026/)).toBeInTheDocument()
    expect(cells[5]).toHaveTextContent('')
  })

  it('resolves the parent entity of a cascaded write', () => {
    renderRoute(
      <AuditTable
        entries={[
          entry({
            id: 'AL1016',
            timestamp: '2026-01-17T10:00:00.000Z',
            actor: 'local',
            entity_name: 'piece',
            entity_id: 'P1',
            action: 'update',
            parent_entity_name: 'job',
            parent_entity_id: 'J6',
          }),
        ]}
        emptyMessage="none"
      />
    )

    expect(screen.getByRole('link', { name: 'Alpha bracket' })).toHaveAttribute(
      'href',
      '/jobs/J6#piece-P1'
    )
    expect(
      screen.getByRole('link', { name: 'Piece test job' })
    ).toHaveAttribute('href', '/jobs/J6')
  })

  it('marks a row with no timestamp as broken and omits the time element', () => {
    renderRoute(
      <AuditTable
        entries={[entry({ ...clientCreate, id: 'MALFORMED_2', timestamp: '' })]}
        emptyMessage="none"
      />
    )

    const row = bodyRows()[0]
    expect(row).toHaveClass('text-danger')
    expect(within(row).queryByTitle(/2026/)).not.toBeInTheDocument()
  })

  it('marks a row with no id as broken', () => {
    renderRoute(
      <AuditTable
        entries={[entry({ ...clientCreate, id: '' })]}
        emptyMessage="none"
      />
    )

    expect(bodyRows()[0]).toHaveClass('text-danger')
  })

  it('leaves a well-formed row unmarked', () => {
    renderRoute(
      <AuditTable entries={[entry(clientCreate)]} emptyMessage="none" />
    )

    expect(bodyRows()[0]).not.toHaveClass('text-danger')
  })

  it('keeps the table and shows the empty message when there is nothing to read', () => {
    renderRoute(<AuditTable entries={[]} emptyMessage="No audit entries yet" />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByTestId('audit-log-empty-state')).toHaveTextContent(
      'No audit entries yet'
    )
  })
})
