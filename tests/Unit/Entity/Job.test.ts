import { describe, expect, it } from 'vitest'
import { Job, JOB_STATUSES, parseJobStatus } from '@/Entity/Job'

const record = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Print',
  status: 'in_progress',
  price: '10',
  board_order: '1000',
  created_at: '2026-01-01T00:00:00.000Z',
  archived: '',
  deleted: '',
  due_date: '2026-02-01',
}

describe('Job', () => {
  it('round-trips fromRecord/toRecord', () => {
    const job = Job.fromRecord(record)
    expect(job.status).toBe('in_progress')
    expect(job.price).toBe(10)
    expect(job.boardOrder).toBe(1000)
    expect(job.dueDate).toBe('2026-02-01')
    expect(job.toRecord()).toEqual(record)
  })

  it('defaults missing cells and blanks unset numerics', () => {
    const job = Job.fromRecord({})
    expect(job.status).toBe('draft')
    expect(job.price).toBeUndefined()
    expect(job.boardOrder).toBeUndefined()
    expect(job.toRecord().price).toBe('')
    expect(job.toRecord().board_order).toBe('')
  })

  it('parseJobStatus falls back to draft', () => {
    for (const status of JOB_STATUSES) expect(parseJobStatus(status)).toBe(status)
    expect(parseJobStatus('bogus')).toBe('draft')
    expect(parseJobStatus('')).toBe('draft')
  })

  it('isCompleted / isOpen partition the statuses', () => {
    const job = new Job()
    const expectations: Array<[string, boolean, boolean]> = [
      ['draft', false, true],
      ['in_progress', false, true],
      ['delivered', false, false],
      ['paid', true, false],
      ['cancelled', true, false],
    ]
    for (const [status, completed, open] of expectations) {
      job.status = status as Job['status']
      expect(job.isCompleted()).toBe(completed)
      expect(job.isOpen()).toBe(open)
    }
  })

  it('effectiveDueDate falls back to created_at', () => {
    const job = Job.fromRecord(record)
    expect(job.effectiveDueDate()).toBe('2026-02-01')
    job.dueDate = ''
    expect(job.effectiveDueDate()).toBe('2026-01-01T00:00:00.000Z')
  })
})
