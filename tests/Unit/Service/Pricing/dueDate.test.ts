import { afterEach, describe, expect, it, vi } from 'vitest'
import { Job } from '@/Entity/Job'
import {
  daysSinceDueDate,
  DEFAULT_KANBAN_STALE_DAYS,
  dueDateBand,
  jobDueDate,
  shouldHideJobOnKanban,
} from '@/Service/Pricing/dueDate'
import { FixedClock } from '../helpers'

const clock = new FixedClock('2026-07-16T12:00:00.000Z')

function job(fields: Record<string, string>): Job {
  return Job.fromRecord({ id: 'J1', client_id: 'CL1', ...fields })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('jobDueDate', () => {
  it('uses due_date when set, created_at otherwise', () => {
    expect(
      jobDueDate(job({ due_date: '2026-07-10', created_at: '2026-01-01T00:00:00.000Z' })),
    ).toEqual(new Date('2026-07-10'))
    expect(jobDueDate(job({ created_at: '2026-01-01T00:00:00.000Z' }))).toEqual(
      new Date('2026-01-01T00:00:00.000Z'),
    )
  })
})

describe('daysSinceDueDate', () => {
  it('returns whole elapsed days', () => {
    expect(daysSinceDueDate(job({ due_date: '2026-07-10' }), clock)).toBe(6)
    expect(daysSinceDueDate(job({ due_date: '2026-07-16' }), clock)).toBe(0)
    expect(daysSinceDueDate(job({ created_at: '2026-07-14T00:00:00.000Z' }), clock)).toBe(2)
  })

  it('floors future and invalid dates at 0', () => {
    expect(daysSinceDueDate(job({ due_date: '2026-08-01' }), clock)).toBe(0)
    expect(daysSinceDueDate(job({ created_at: 'garbage' }), clock)).toBe(0)
  })
})

describe('dueDateBand', () => {
  it('bands ≥7 red, ≥5 orange, ≥3 yellow, else none', () => {
    expect(dueDateBand(10)).toBe('red')
    expect(dueDateBand(7)).toBe('red')
    expect(dueDateBand(6)).toBe('orange')
    expect(dueDateBand(5)).toBe('orange')
    expect(dueDateBand(4)).toBe('yellow')
    expect(dueDateBand(3)).toBe('yellow')
    expect(dueDateBand(2)).toBe('none')
    expect(dueDateBand(0)).toBe('none')
  })
})

describe('shouldHideJobOnKanban', () => {
  it('hides active paid/cancelled jobs staler than the threshold', () => {
    expect(shouldHideJobOnKanban(job({ status: 'paid', due_date: '2026-07-10' }), 5, clock)).toBe(
      true,
    )
    expect(
      shouldHideJobOnKanban(job({ status: 'cancelled', due_date: '2026-07-10' }), 5, clock),
    ).toBe(true)
  })

  it('keeps jobs at exactly the threshold', () => {
    expect(shouldHideJobOnKanban(job({ status: 'paid', due_date: '2026-07-11' }), 5, clock)).toBe(
      false,
    )
  })

  it('never hides open or inactive jobs', () => {
    expect(shouldHideJobOnKanban(job({ status: 'draft', due_date: '2026-01-01' }), 5, clock)).toBe(
      false,
    )
    expect(
      shouldHideJobOnKanban(
        job({ status: 'paid', due_date: '2026-01-01', archived: 'true' }),
        5,
        clock,
      ),
    ).toBe(false)
  })

  it('defaults to 5 stale days and the system clock', () => {
    expect(DEFAULT_KANBAN_STALE_DAYS).toBe(5)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T12:00:00.000Z'))
    expect(shouldHideJobOnKanban(job({ status: 'paid', due_date: '2026-07-10' }))).toBe(true)
    expect(shouldHideJobOnKanban(job({ status: 'paid', due_date: '2026-07-11' }))).toBe(false)
  })
})
