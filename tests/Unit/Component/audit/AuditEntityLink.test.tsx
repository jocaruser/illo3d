import { screen } from '@testing-library/react'
import { AuditEntityLink } from '@/Component/audit/AuditEntityLink'
import type { EntityManager } from '@/Repository/EntityManager'
import {
  createTestEm,
  FakeTabs,
  renderRoute,
} from '../../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

describe('AuditEntityLink', () => {
  beforeEach(() => {
    const tabs = new FakeTabs()
    tabs.seed('clients', { id: 'CL1', name: 'TechStart Solutions' })
    tabs.seed('tags', { id: 'TG2', name: 'VIP' })
    mocks.em = createTestEm(tabs)
  })

  it('links a resolved entity to its detail page', () => {
    renderRoute(<AuditEntityLink entityName="client" entityId="CL1" />)

    const link = screen.getByRole('link', { name: 'TechStart Solutions' })
    expect(link).toHaveAttribute('href', '/clients/CL1')
    expect(link).toHaveAttribute('title', 'TechStart Solutions')
  })

  it('renders a resolved but unlinkable entity as plain text', () => {
    renderRoute(<AuditEntityLink entityName="tag" entityId="TG2" />)

    expect(screen.getByText('VIP')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders the raw id, unlinked, when nothing resolves', () => {
    renderRoute(<AuditEntityLink entityName="lot" entityId="L1" />)

    expect(screen.getByText('L1')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('resolves from the audit snapshots when the row is gone', () => {
    renderRoute(
      <AuditEntityLink
        entityName="client"
        entityId="CL404"
        afterJson='{"name":"Vanished Co"}'
      />
    )

    expect(screen.getByRole('link', { name: 'Vanished Co' })).toHaveAttribute(
      'href',
      '/clients/CL404'
    )
  })
})
