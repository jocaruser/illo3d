import {
  activeWorkbookMentionResolvers,
  auditEntityNavigationTarget,
  jobPathForPiece,
  mentionTokenTarget,
  resolveEntityNavigationTarget,
  transactionNavigationTarget,
} from '@/Service/Linking/entityLinkTargets'
import { createTestEm, FakeTabs } from '../../helpers/workbookTestBed'

function workbook(): ReturnType<typeof createTestEm> {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'Acme' })
  tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Widget run' })
  tabs.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Bracket' })
  tabs.seed('inventory', { id: 'INV1', name: 'PLA', type: 'filament' })
  tabs.seed('transactions', {
    id: 'T-exp',
    type: 'expense',
    concept: 'Stock buy',
    amount: '-10',
  })
  tabs.seed('transactions', {
    id: 'T-inc',
    type: 'income',
    concept: 'Paid',
    amount: '50',
    ref_type: 'job',
    ref_id: 'J1',
  })
  tabs.seed('lots', { id: 'L1', inventory_id: 'INV1', transaction_id: 'T-exp' })
  return createTestEm(tabs)
}

describe('entityLinkTargets', () => {
  it('resolves workbook entities per the linking table', () => {
    const em = workbook()

    expect(resolveEntityNavigationTarget(em, { kind: 'client', id: 'CL1' })).toBe(
      '/clients/CL1'
    )
    expect(resolveEntityNavigationTarget(em, { kind: 'job', id: 'J1' })).toBe('/jobs/J1')
    expect(resolveEntityNavigationTarget(em, { kind: 'piece', id: 'P1' })).toBe(
      '/jobs/J1#piece-P1'
    )
    expect(resolveEntityNavigationTarget(em, { kind: 'inventory', id: 'INV1' })).toBe(
      '/inventory/INV1'
    )
  })

  it('routes transactions to jobs or purchase detail', () => {
    const em = workbook()

    expect(transactionNavigationTarget(em, 'T-inc')).toBe('/jobs/J1')
    expect(transactionNavigationTarget(em, 'T-exp')).toBe('/transactions/T-exp')
    expect(transactionNavigationTarget(em, 'T-missing')).toBeNull()
  })

  it('returns null for deleted rows but still links archived ones', () => {
    const tabs = new FakeTabs()
    tabs.seed('clients', { id: 'CL2', name: 'Gone', deleted: 'true' })
    tabs.seed('clients', { id: 'CL3', name: 'Frozen', archived: 'true' })
    const em = createTestEm(tabs)

    expect(resolveEntityNavigationTarget(em, { kind: 'client', id: 'CL2' })).toBeNull()
    expect(resolveEntityNavigationTarget(em, { kind: 'client', id: 'CL3' })).toBe(
      '/clients/CL3'
    )
  })

  it('returns null when a piece job is missing or deleted', () => {
    const tabs = new FakeTabs()
    tabs.seed('pieces', { id: 'P9', job_id: '', name: 'Orphan' })
    tabs.seed('pieces', { id: 'P10', job_id: 'J99', name: 'Lost job' })
    const em = createTestEm(tabs)

    expect(jobPathForPiece(em, 'P9')).toBeNull()
    expect(jobPathForPiece(em, 'P10')).toBeNull()
  })

  it('active workbook mention resolvers require active rows', () => {
    const tabs = new FakeTabs()
    tabs.seed('clients', { id: 'CL1', name: 'Live' })
    tabs.seed('clients', { id: 'CL2', name: 'Archived', archived: 'true' })
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Run' })
    tabs.seed('jobs', { id: 'J2', client_id: 'CL1', description: 'Gone', deleted: 'true' })
    const em = createTestEm(tabs)
    const { resolveClientTarget, resolveJobTarget } = activeWorkbookMentionResolvers(em)

    expect(resolveClientTarget('CL1')).toBe('/clients/CL1')
    expect(resolveClientTarget('CL2')).toBeNull()
    expect(resolveClientTarget('CL9')).toBeNull()
    expect(resolveJobTarget('J1')).toBe('/jobs/J1')
    expect(resolveJobTarget('J2')).toBeNull()
  })

  it('maps mention tokens through the same paths', () => {
    const em = workbook()

    expect(mentionTokenTarget(em, 'CL', 'CL1')).toBe('/clients/CL1')
    expect(mentionTokenTarget(em, 'J', 'J1')).toBe('/jobs/J1')
    expect(mentionTokenTarget(em, 'P', 'P1')).toBe('/jobs/J1#piece-P1')
    expect(mentionTokenTarget(em, 'P', 'P-missing')).toBeNull()
  })

  it('maps audit entity names and leaves unlinkable types null', () => {
    const em = workbook()

    expect(auditEntityNavigationTarget(em, 'tag', 'TG1')).toBeNull()
    expect(auditEntityNavigationTarget(em, 'transaction', 'T-inc')).toBe('/jobs/J1')
  })

  it('does not link income without a job reference', () => {
    const tabs = new FakeTabs()
    tabs.seed('transactions', {
      id: 'T1',
      type: 'income',
      concept: 'Misc',
      amount: '1',
    })
    const em = createTestEm(tabs)

    expect(transactionNavigationTarget(em, 'T1')).toBeNull()
  })
})
