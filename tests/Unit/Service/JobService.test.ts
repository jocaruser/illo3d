import { describe, expect, it } from 'vitest'
import { Job } from '@/Entity/Job'
import { compareJobsForKanban, JobService } from '@/Service/JobService'
import { auditTrail, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new JobService(context.em) }
}

function pricedPiece(tabs: ReturnType<typeof makeEm>['tabs'], id: string, jobId: string) {
  tabs.seed('pieces', { id, job_id: jobId, name: id, price: '10', units: '2' })
}

describe('createJob', () => {
  it('creates a draft with boardOrder after the last draft and instant createdAt', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', status: 'draft', board_order: '3000' })
    tabs.seed('jobs', { id: 'J2', status: 'paid', board_order: '9000' })
    const result = service.createJob({ clientId: 'CL1', description: ' Print ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.id).toBe('J3')
    expect(result.job.status).toBe('draft')
    expect(result.job.boardOrder).toBe(4000)
    expect(result.job.createdAt).toBe('2026-07-16T12:00:00.000Z')
    expect(result.job.description).toBe('Print')
    expect(em.jobs.find('J3')).not.toBeNull()
  })

  it('starts boardOrder at 1000 on an empty board', () => {
    const { service } = makeService()
    const result = service.createJob({ clientId: 'CL1', description: 'First' })
    expect(result.ok && result.job.boardOrder).toBe(1000)
  })

  it('treats drafts without a board order as order 0', () => {
    const { service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', status: 'draft' })
    const result = service.createJob({ clientId: 'CL1', description: 'Next' })
    expect(result.ok && result.job.boardOrder).toBe(1000)
  })

  it('uses the explicit due date over the shop default', () => {
    const { service } = makeService()
    const result = service.createJob({
      clientId: 'CL1',
      description: 'D',
      dueDate: '2026-09-01',
      defaultDueDateDays: 3,
    })
    expect(result.ok && result.job.dueDate).toBe('2026-09-01')
  })

  it('derives the due date from defaultDueDateDays via the clock', () => {
    const { service } = makeService()
    const result = service.createJob({ clientId: 'CL1', description: 'D', defaultDueDateDays: 5 })
    expect(result.ok && result.job.dueDate).toBe('2026-07-21')
  })

  it('leaves the due date empty without a default', () => {
    const { service } = makeService()
    const result = service.createJob({ clientId: 'CL1', description: 'D' })
    expect(result.ok && result.job.dueDate).toBe('')
  })

  it('validates client and description', () => {
    const { service } = makeService()
    expect(service.createJob({ clientId: ' ', description: 'D' })).toEqual({
      ok: false,
      error: 'jobs.validation.clientRequired',
    })
    expect(service.createJob({ clientId: 'CL1', description: '  ' })).toEqual({
      ok: false,
      error: 'jobs.validation.required',
    })
  })
})

describe('updateJob', () => {
  it('updates fields preserving status, createdAt and boardOrder', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', {
      id: 'J1',
      client_id: 'CL1',
      description: 'Old',
      status: 'in_progress',
      board_order: '2000',
      created_at: '2025-01-01T00:00:00.000Z',
    })
    const result = service.updateJob('J1', {
      clientId: 'CL2',
      description: 'New',
      dueDate: '2026-08-01',
    })
    expect(result.ok).toBe(true)
    const job = em.jobs.find('J1')
    expect(job?.clientId).toBe('CL2')
    expect(job?.description).toBe('New')
    expect(job?.dueDate).toBe('2026-08-01')
    expect(job?.status).toBe('in_progress')
    expect(job?.createdAt).toBe('2025-01-01T00:00:00.000Z')
    expect(job?.boardOrder).toBe(2000)
  })

  it('clears the due date when omitted', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Old', due_date: '2026-08-01' })
    service.updateJob('J1', { clientId: 'CL1', description: 'Old' })
    expect(em.jobs.find('J1')?.dueDate).toBe('')
  })

  it('rejects unknown ids and invalid input', () => {
    const { service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Old' })
    expect(service.updateJob('J9', { clientId: 'CL1', description: 'D' })).toEqual({
      ok: false,
      error: 'jobs.jobNotFound',
    })
    expect(service.updateJob('J1', { clientId: '', description: 'D' })).toEqual({
      ok: false,
      error: 'jobs.validation.clientRequired',
    })
  })
})

describe('updateJobStatus', () => {
  it('moves a job between non-terminal statuses without gating', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'draft' })
    const job = em.jobs.find('J1') as Job
    const result = service.updateJobStatus(job, 'in_progress')
    expect(result.ok).toBe(true)
    expect(em.jobs.find('J1')?.status).toBe('in_progress')
  })

  it('rejects unknown jobs', () => {
    const { service } = makeService()
    const ghost = new Job()
    ghost.id = 'J9'
    expect(service.updateJobStatus(ghost, 'paid')).toEqual({
      ok: false,
      error: 'jobs.jobNotFound',
    })
  })

  it('gates paid and cancelled on complete pricing over counting pieces', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'delivered' })
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', price: '10', units: '2' })
    tabs.seed('pieces', { id: 'P2', job_id: 'J1', archived: 'true' })
    const job = em.jobs.find('J1') as Job
    expect(service.updateJobStatus(job, 'paid')).toEqual({
      ok: false,
      error: 'jobs.paidPiecesIncomplete',
    })
    expect(service.updateJobStatus(job, 'cancelled')).toEqual({
      ok: false,
      error: 'jobs.paidPiecesIncomplete',
    })
    expect(em.jobs.find('J1')?.status).toBe('delivered')
  })

  it('ignores deleted pieces in the gate and creates the income transaction', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'delivered', description: 'Lamp' })
    pricedPiece(tabs, 'P1', 'J1')
    tabs.seed('pieces', { id: 'P2', job_id: 'J1', deleted: 'true' })
    const job = em.jobs.find('J1') as Job
    const result = service.updateJobStatus(job, 'paid', { createIncomeTransaction: true })
    expect(result.ok).toBe(true)
    expect(em.jobs.find('J1')?.status).toBe('paid')
    const transaction = em.transactions.find('T1')
    expect(transaction?.type).toBe('income')
    expect(transaction?.amount).toBe(20)
    expect(transaction?.category).toBe('job')
    expect(transaction?.concept).toBe('Lamp')
    expect(transaction?.refType).toBe('job')
    expect(transaction?.refId).toBe('J1')
    expect(transaction?.clientId).toBe('CL1')
    expect(transaction?.date).toBe('2026-07-16')
  })

  it('honours an explicit income amount', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'delivered' })
    pricedPiece(tabs, 'P1', 'J1')
    const job = em.jobs.find('J1') as Job
    service.updateJobStatus(job, 'paid', { createIncomeTransaction: true, incomeAmount: 55 })
    expect(em.transactions.find('T1')?.amount).toBe(55)
  })

  it('does not create a transaction without the flag or when already paid', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'delivered' })
    pricedPiece(tabs, 'P1', 'J1')
    const job = em.jobs.find('J1') as Job
    service.updateJobStatus(job, 'paid')
    expect(em.transactions.findAll()).toEqual([])
    // Already paid → no second income transaction even with the flag.
    service.updateJobStatus(em.jobs.find('J1') as Job, 'paid', { createIncomeTransaction: true })
    expect(em.transactions.findAll()).toEqual([])
  })
})

describe('applyKanbanDrop', () => {
  function seedBoard(tabs: ReturnType<typeof makeEm>['tabs']) {
    tabs.seed('jobs', { id: 'J1', status: 'draft', board_order: '1000' })
    tabs.seed('jobs', { id: 'J2', status: 'draft', board_order: '2000' })
    tabs.seed('jobs', { id: 'J3', status: 'draft', board_order: '3000' })
    tabs.seed('jobs', { id: 'J4', status: 'in_progress', board_order: '1000' })
  }

  it('ignores unknown, inactive and self-target drops', () => {
    const { service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', status: 'draft', deleted: 'true' })
    expect(service.applyKanbanDrop('J9', 'draft')).toEqual({ kind: 'ok' })
    expect(service.applyKanbanDrop('J1', 'draft')).toEqual({ kind: 'ok' })
    expect(service.applyKanbanDrop('J1', 'draft', 'J1')).toEqual({ kind: 'ok' })
  })

  it('reorders within a column in 1000 spacing', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    const result = service.applyKanbanDrop('J3', 'draft', 'J1')
    expect(result).toEqual({ kind: 'ok' })
    const orders = em.jobs
      .findAll()
      .filter((job) => job.status === 'draft')
      .sort(compareJobsForKanban)
      .map((job) => job.id)
    expect(orders).toEqual(['J3', 'J1', 'J2'])
    expect(em.jobs.find('J3')?.boardOrder).toBe(1000)
    expect(em.jobs.find('J1')?.boardOrder).toBe(2000)
    expect(em.jobs.find('J2')?.boardOrder).toBe(3000)
  })

  it('appends to the end when no insert target is given', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    service.applyKanbanDrop('J1', 'draft')
    expect(em.jobs.find('J1')?.boardOrder).toBe(3000)
    expect(em.jobs.find('J2')?.boardOrder).toBe(1000)
  })

  it('appends when the insert target is not in the column', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    service.applyKanbanDrop('J1', 'draft', 'J4')
    expect(em.jobs.find('J1')?.boardOrder).toBe(3000)
  })

  it('skips writes for jobs whose order is unchanged', () => {
    const { service, tabs } = makeService()
    seedBoard(tabs)
    service.applyKanbanDrop('J3', 'draft')
    // J1/J2/J3 already sit at 1000/2000/3000 — no audit entries at all.
    expect(auditTrail(tabs)).toEqual([])
  })

  it('assigns fresh orders to column members without one', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', status: 'draft' })
    tabs.seed('jobs', { id: 'J2', status: 'draft', board_order: '1000' })
    service.applyKanbanDrop('J2', 'draft', 'J1')
    expect(em.jobs.find('J2')?.boardOrder).toBe(1000)
    expect(em.jobs.find('J1')?.boardOrder).toBe(2000)
  })

  it('commits a cross-column move without an insert target', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    expect(service.applyKanbanDrop('J2', 'delivered')).toEqual({ kind: 'ok' })
    expect(em.jobs.find('J2')?.status).toBe('delivered')
    expect(em.jobs.find('J2')?.boardOrder).toBe(1000)
  })

  it('commits a cross-column move and renumbers both columns', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    const result = service.applyKanbanDrop('J2', 'in_progress', 'J4')
    expect(result).toEqual({ kind: 'ok' })
    expect(em.jobs.find('J2')?.status).toBe('in_progress')
    expect(em.jobs.find('J2')?.boardOrder).toBe(1000)
    expect(em.jobs.find('J4')?.boardOrder).toBe(2000)
    // Source column compacted.
    expect(em.jobs.find('J1')?.boardOrder).toBe(1000)
    expect(em.jobs.find('J3')?.boardOrder).toBe(2000)
  })

  it('asks for the paid dialog when dropping into paid', () => {
    const { em, service, tabs } = makeService()
    seedBoard(tabs)
    expect(service.applyKanbanDrop('J1', 'paid')).toEqual({
      kind: 'needs-dialog',
      dialog: 'paid',
    })
    expect(em.jobs.find('J1')?.status).toBe('draft')
  })

  it('asks for the cancelled dialog when dropping into cancelled', () => {
    const { service, tabs } = makeService()
    seedBoard(tabs)
    expect(service.applyKanbanDrop('J1', 'cancelled')).toEqual({
      kind: 'needs-dialog',
      dialog: 'cancelled',
    })
  })

  it('asks for the leave-paid dialog when dragging a paid job out', () => {
    const { service, tabs } = makeService()
    tabs.seed('jobs', { id: 'J1', status: 'paid', board_order: '1000' })
    expect(service.applyKanbanDrop('J1', 'draft')).toEqual({
      kind: 'needs-dialog',
      dialog: 'leave-paid',
    })
    expect(service.applyKanbanDrop('J1', 'cancelled')).toEqual({
      kind: 'needs-dialog',
      dialog: 'leave-paid',
    })
  })
})

describe('compareJobsForKanban', () => {
  it('orders by boardOrder, then newest createdAt, then id', () => {
    const a = new Job()
    a.id = 'J1'
    a.boardOrder = 1000
    const b = new Job()
    b.id = 'J2'
    b.boardOrder = 2000
    expect(compareJobsForKanban(a, b)).toBeLessThan(0)

    b.boardOrder = 1000
    a.createdAt = '2026-01-01T00:00:00.000Z'
    b.createdAt = '2026-01-02T00:00:00.000Z'
    expect(compareJobsForKanban(a, b)).toBeGreaterThan(0)
    expect(compareJobsForKanban(b, a)).toBeLessThan(0)

    b.createdAt = a.createdAt
    expect(compareJobsForKanban(a, b)).toBeLessThan(0)
  })

  it('treats a missing boardOrder as 0 on either side', () => {
    const withOrder = new Job()
    withOrder.id = 'J1'
    withOrder.boardOrder = 1000
    const without = new Job()
    without.id = 'J2'
    expect(compareJobsForKanban(withOrder, without)).toBeGreaterThan(0)
    expect(compareJobsForKanban(without, withOrder)).toBeLessThan(0)

    const alsoWithout = new Job()
    alsoWithout.id = 'J3'
    expect(compareJobsForKanban(without, alsoWithout)).toBeLessThan(0)
  })
})
