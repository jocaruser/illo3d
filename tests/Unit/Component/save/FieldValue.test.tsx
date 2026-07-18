import { screen } from '@testing-library/react'
import { FieldValue } from '@/Component/save/FieldValue'
import { referencedEntityName } from '@/Component/save/referencedEntityName'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs } from '../../helpers/workbookTestBed'
import { renderWithProviders } from '../helpers/renderWithProviders'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

beforeEach(() => {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'Acme Ltd' })
  tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Chess set' })
  mocks.em = createTestEm(tabs)
})

describe('referencedEntityName', () => {
  it('maps fixed reference columns', () => {
    expect(referencedEntityName('client_id', {})).toBe('client')
    expect(referencedEntityName('job_id', {})).toBe('job')
    expect(referencedEntityName('piece_id', {})).toBe('piece')
    expect(referencedEntityName('inventory_id', {})).toBe('inventory')
    expect(referencedEntityName('transaction_id', {})).toBe('transaction')
    expect(referencedEntityName('tag_id', {})).toBe('tag')
  })

  it('follows the polymorphic discriminators', () => {
    expect(referencedEntityName('entity_id', { entity_type: 'client' })).toBe('client')
    expect(referencedEntityName('entity_id', { entity_type: 'job' })).toBe('job')
    expect(referencedEntityName('entity_id', { entity_type: 'weird' })).toBeNull()
    expect(referencedEntityName('entity_id', {})).toBeNull()
    expect(referencedEntityName('ref_id', { ref_type: 'job' })).toBe('job')
    expect(referencedEntityName('ref_id', {})).toBeNull()
  })

  it('treats every other column as a plain value', () => {
    expect(referencedEntityName('name', {})).toBeNull()
    expect(referencedEntityName('price', {})).toBeNull()
  })
})

describe('FieldValue', () => {
  it('shows empty values as a dash', () => {
    renderWithProviders(<FieldValue column="name" value="" record={{}} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows plain values as-is', () => {
    renderWithProviders(<FieldValue column="name" value="Acme Ltd" record={{}} />)

    expect(screen.getByText('Acme Ltd')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('links an entity reference to its page under its live name', () => {
    renderWithProviders(<FieldValue column="client_id" value="CL1" record={{}} />)

    const link = screen.getByRole('link', { name: 'Acme Ltd' })
    expect(link).toHaveAttribute('href', '/clients/CL1')
    expect(link).toHaveAttribute('title', 'CL1')
  })

  it('resolves polymorphic references through the row record', () => {
    renderWithProviders(
      <FieldValue column="entity_id" value="J1" record={{ entity_type: 'job' }} />
    )

    expect(screen.getByRole('link', { name: 'Chess set' })).toHaveAttribute(
      'href',
      '/jobs/J1'
    )
  })

  it('shows an unresolvable reference as text, never a dead link', () => {
    renderWithProviders(<FieldValue column="client_id" value="CL9" record={{}} />)

    expect(screen.getByText('CL9')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows a named entity without a detail page as text', () => {
    mocks.em = createTestEm(new FakeTabs().seed('tags', { id: 'TG1', name: 'Vip' }))
    renderWithProviders(<FieldValue column="tag_id" value="TG1" record={{}} />)

    expect(screen.getByText('Vip')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
