import { describe, it, expect } from 'vitest'
import { jobDueDate, daysSinceDueDate } from './jobDueDate'

function makeJob(createdAt: string) {
  return {
    id: 'J1',
    client_id: 'C1',
    description: 'test',
    status: 'draft' as const,
    created_at: createdAt,
  }
}

describe('jobDueDate', () => {
  it('returns a Date from created_at', () => {
    const job = makeJob('2026-01-15T00:00:00.000Z')
    const result = jobDueDate(job)
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2026-01-15T00:00:00.000Z')
  })
})

describe('daysSinceDueDate', () => {
  it('returns 0 for today', () => {
    const job = makeJob(new Date().toISOString())
    expect(daysSinceDueDate(job)).toBe(0)
  })

  it('returns 6 for 6 days ago', () => {
    const date = new Date()
    date.setDate(date.getDate() - 6)
    const job = makeJob(date.toISOString())
    expect(daysSinceDueDate(job)).toBe(6)
  })

  it('returns 3 for 3 days ago', () => {
    const date = new Date()
    date.setDate(date.getDate() - 3)
    const job = makeJob(date.toISOString())
    expect(daysSinceDueDate(job)).toBe(3)
  })

  it('returns 0 for future dates (clock skew)', () => {
    const date = new Date()
    date.setDate(date.getDate() + 5)
    const job = makeJob(date.toISOString())
    expect(daysSinceDueDate(job)).toBe(0)
  })

  it('returns 0 for invalid created_at', () => {
    const job = makeJob('not-a-date')
    expect(daysSinceDueDate(job)).toBe(0)
  })
})
