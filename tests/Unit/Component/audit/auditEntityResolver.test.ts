import { resolveAuditEntity } from '@/Component/audit/auditEntityResolver'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs } from '../../helpers/workbookTestBed'

function seeded(): { tabs: FakeTabs; em: EntityManager } {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'TechStart Solutions' })
  tabs.seed('jobs', {
    id: 'J1',
    client_id: 'CL1',
    description: 'Prototype batch',
  })
  tabs.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Alpha bracket' })
  tabs.seed('inventory', { id: 'INV1', name: 'PLA White', type: 'filament' })
  tabs.seed('transactions', {
    id: 'T11',
    type: 'expense',
    concept: 'PLA White',
    amount: '-29.99',
  })
  tabs.seed('transactions', {
    id: 'T1',
    type: 'income',
    concept: 'Job J1 paid',
    amount: '120',
  })
  tabs.seed('tags', { id: 'TG2', name: 'VIP' })
  tabs.seed('crm_notes', { id: 'N1', body: 'Called about the deadline' })
  tabs.seed('lots', { id: 'L1', inventory_id: 'INV1', transaction_id: 'T11' })
  return { tabs, em: createTestEm(tabs) }
}

describe('resolveAuditEntity', () => {
  describe('tier 1 — live workbook lookup', () => {
    it('names and links a client, job and inventory item', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'client', 'CL1')).toEqual({
        label: 'TechStart Solutions',
        to: '/clients/CL1',
      })
      expect(resolveAuditEntity(em, 'job', 'J1')).toEqual({
        label: 'Prototype batch',
        to: '/jobs/J1',
      })
      expect(resolveAuditEntity(em, 'inventory', 'INV1')).toEqual({
        label: 'PLA White',
        to: '/inventory/INV1',
      })
    })

    it('links a piece to its job and anchors the piece', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'piece', 'P1')).toEqual({
        label: 'Alpha bracket',
        to: '/jobs/J1#piece-P1',
      })
    })

    it('links an expense transaction but never an income one', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'transaction', 'T11')).toEqual({
        label: 'PLA White',
        to: '/transactions/T11',
      })
      expect(resolveAuditEntity(em, 'transaction', 'T1')).toEqual({
        label: 'Job J1 paid',
        to: null,
      })
    })

    it('names unlinkable types without offering a link', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'tag', 'TG2')).toEqual({
        label: 'VIP',
        to: null,
      })
      expect(resolveAuditEntity(em, 'crm_note', 'N1')).toEqual({
        label: 'Called about the deadline',
        to: null,
      })
    })

    it('falls through when the live row exists but its name is blank', () => {
      const tabs = new FakeTabs()
      tabs.seed('clients', { id: 'CL9', name: '   ' })
      const em = createTestEm(tabs)

      expect(
        resolveAuditEntity(em, 'client', 'CL9', '', '{"name":"Snapshot Ltd"}')
      ).toEqual({
        label: 'Snapshot Ltd',
        to: '/clients/CL9',
      })
    })

    it('does not link a piece whose job reference is empty', () => {
      const tabs = new FakeTabs()
      tabs.seed('pieces', { id: 'P9', job_id: '', name: 'Orphan piece' })
      const em = createTestEm(tabs)

      expect(resolveAuditEntity(em, 'piece', 'P9')).toEqual({
        label: 'Orphan piece',
        to: null,
      })
    })
  })

  describe('tier 2 — audit snapshots', () => {
    it('prefers after_json over before_json', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(
          em,
          'client',
          'CL404',
          '{"name":"Before Co"}',
          '{"name":"After Co"}'
        )
      ).toEqual({ label: 'After Co', to: '/clients/CL404' })
    })

    it('falls back to before_json when the row was hard deleted', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, 'client', 'CL404', '{"name":"Before Co"}', '')
      ).toEqual({
        label: 'Before Co',
        to: '/clients/CL404',
      })
    })

    it('reads description and concept as name-like fields', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, 'job', 'J404', '', '{"description":"Gone job"}')
      ).toEqual({
        label: 'Gone job',
        to: '/jobs/J404',
      })
      expect(
        resolveAuditEntity(
          em,
          'transaction',
          'T404',
          '',
          '{"concept":"Gone expense"}'
        )
      ).toEqual({ label: 'Gone expense', to: null })
    })

    it('names a vanished piece but cannot link it without a job to open', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, 'piece', 'P404', '', '{"name":"Gone piece"}')
      ).toEqual({
        label: 'Gone piece',
        to: null,
      })
    })

    it('resolves a piece_item from its snapshot without a link', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(
          em,
          'piece_item',
          'PI6',
          '',
          '{"name":"Item for Cascade draft piece"}'
        )
      ).toEqual({ label: 'Item for Cascade draft piece', to: null })
    })
  })

  describe('tier 3 — raw id, never linked', () => {
    it('shows the raw id when nothing resolves', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(
          em,
          'tag_link',
          'TL4',
          '{"entity_type":"client"}',
          '{}'
        )
      ).toEqual({
        label: 'TL4',
        to: null,
      })
    })

    it('shows the raw id for a lot, which has no name anywhere', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'lot', 'L1')).toEqual({
        label: 'L1',
        to: null,
      })
    })

    it('does not link a vanished client that has no snapshot to name it', () => {
      const { em } = seeded()

      expect(resolveAuditEntity(em, 'client', 'CL404')).toEqual({
        label: 'CL404',
        to: null,
      })
    })

    it('ignores unparseable, non-object and blank snapshots', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, 'client', 'CL404', '', 'not json{').label
      ).toBe('CL404')
      expect(
        resolveAuditEntity(em, 'client', 'CL404', '', '"a string"').label
      ).toBe('CL404')
      expect(resolveAuditEntity(em, 'client', 'CL404', '', 'null').label).toBe(
        'CL404'
      )
      expect(
        resolveAuditEntity(em, 'client', 'CL404', '   ', '   ').label
      ).toBe('CL404')
    })

    it('ignores snapshot fields that are blank or not strings', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, 'client', 'CL404', '', '{"name":"  "}').label
      ).toBe('CL404')
      expect(
        resolveAuditEntity(em, 'client', 'CL404', '', '{"name":42}').label
      ).toBe('CL404')
    })

    it('renders an unknown entity name as its raw id', () => {
      const { em } = seeded()

      expect(
        resolveAuditEntity(em, '', 'X1', '', '{"name":"Whatever"}')
      ).toEqual({
        label: 'Whatever',
        to: null,
      })
    })
  })

  it('renders nothing at all for an entry with no entity id', () => {
    const { em } = seeded()

    expect(resolveAuditEntity(em, 'client', '')).toEqual({
      label: '',
      to: null,
    })
  })
})
