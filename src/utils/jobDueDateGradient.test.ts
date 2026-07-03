import { describe, it, expect } from 'vitest'
import { jobDueDateGradient } from './jobDueDateGradient'

function makeJob(createdAt: string) {
  return {
    id: 'J1',
    client_id: 'C1',
    description: 'test',
    status: 'draft' as const,
    created_at: createdAt,
  }
}

describe('jobDueDateGradient', () => {
  it('returns neutral for today', () => {
    const result = jobDueDateGradient(makeJob(new Date().toISOString()))
    expect(result.days).toBe(0)
    expect(result.bgClass).toContain('gray')
  })

  it('returns yellow at 3 days', () => {
    const date = new Date()
    date.setDate(date.getDate() - 3)
    const result = jobDueDateGradient(makeJob(date.toISOString()))
    expect(result.days).toBe(3)
    expect(result.bgClass).toContain('yellow')
  })

  it('returns orange at 5 days', () => {
    const date = new Date()
    date.setDate(date.getDate() - 5)
    const result = jobDueDateGradient(makeJob(date.toISOString()))
    expect(result.days).toBe(5)
    expect(result.bgClass).toContain('orange')
  })

  it('returns red at 7 days', () => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    const result = jobDueDateGradient(makeJob(date.toISOString()))
    expect(result.days).toBe(7)
    expect(result.bgClass).toContain('red')
  })

  it('returns red beyond 7 days', () => {
    const date = new Date()
    date.setDate(date.getDate() - 10)
    const result = jobDueDateGradient(makeJob(date.toISOString()))
    expect(result.days).toBe(10)
    expect(result.bgClass).toContain('red')
  })
})
