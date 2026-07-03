import { describe, it, expect } from 'vitest'
import { shouldHideJobOnKanban, DEFAULT_KANBAN_STALE_DAYS } from './jobKanbanVisibility'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

import type { JobStatus } from '@/types/money'

function makeJob(overrides: Partial<{
  id: string
  status: JobStatus
  createdAt: string
  archived: string
  deleted: string
}> = {}) {
  return {
    id: overrides.id ?? 'J1',
    client_id: 'C1',
    description: 'test',
    status: overrides.status ?? 'draft',
    created_at: overrides.createdAt ?? daysAgo(0),
    archived: overrides.archived,
    deleted: overrides.deleted,
  }
}

describe('shouldHideJobOnKanban', () => {
  describe('draft status', () => {
    it('is never hidden regardless of age', () => {
      expect(shouldHideJobOnKanban(makeJob({ status: 'draft', createdAt: daysAgo(30) }))).toBe(false)
      expect(shouldHideJobOnKanban(makeJob({ status: 'draft', createdAt: daysAgo(0) }))).toBe(false)
    })
  })

  describe('in_progress status', () => {
    it('is never hidden regardless of age', () => {
      expect(shouldHideJobOnKanban(makeJob({ status: 'in_progress', createdAt: daysAgo(30) }))).toBe(false)
      expect(shouldHideJobOnKanban(makeJob({ status: 'in_progress', createdAt: daysAgo(0) }))).toBe(false)
    })
  })

  describe('delivered status', () => {
    it('is never hidden regardless of age', () => {
      expect(shouldHideJobOnKanban(makeJob({ status: 'delivered', createdAt: daysAgo(30) }))).toBe(false)
      expect(shouldHideJobOnKanban(makeJob({ status: 'delivered', createdAt: daysAgo(0) }))).toBe(false)
    })
  })

  describe('paid status', () => {
    function paidJob(daysOld: number) {
      return makeJob({ status: 'paid', createdAt: daysAgo(daysOld) })
    }

    it('is visible within threshold (0, 3, 5 days)', () => {
      expect(shouldHideJobOnKanban(paidJob(0))).toBe(false)
      expect(shouldHideJobOnKanban(paidJob(3))).toBe(false)
      expect(shouldHideJobOnKanban(paidJob(5))).toBe(false)
    })

    it('is hidden past threshold (6, 30 days)', () => {
      expect(shouldHideJobOnKanban(paidJob(6))).toBe(true)
      expect(shouldHideJobOnKanban(paidJob(30))).toBe(true)
    })

    it('respects custom staleDays threshold', () => {
      expect(shouldHideJobOnKanban(paidJob(4), 3)).toBe(true)
      expect(shouldHideJobOnKanban(paidJob(4), 7)).toBe(false)
    })

    it('uses default when staleDays is undefined', () => {
      expect(shouldHideJobOnKanban(paidJob(6), undefined)).toBe(true)
    })
  })

  describe('cancelled status', () => {
    function cancelledJob(daysOld: number) {
      return makeJob({ status: 'cancelled', createdAt: daysAgo(daysOld) })
    }

    it('is visible within threshold (0, 3, 5 days)', () => {
      expect(shouldHideJobOnKanban(cancelledJob(0))).toBe(false)
      expect(shouldHideJobOnKanban(cancelledJob(3))).toBe(false)
      expect(shouldHideJobOnKanban(cancelledJob(5))).toBe(false)
    })

    it('is hidden past threshold (6, 30 days)', () => {
      expect(shouldHideJobOnKanban(cancelledJob(6))).toBe(true)
      expect(shouldHideJobOnKanban(cancelledJob(30))).toBe(true)
    })
  })

  describe('lifecycle handling', () => {
    it('archived paid job is still evaluated by status and age', () => {
      const job = { ...makeJob({ status: 'paid', createdAt: daysAgo(30) }), archived: 'true' }
      expect(shouldHideJobOnKanban(job)).toBe(true)
    })

    it('archived paid job within threshold returns false', () => {
      const job = { ...makeJob({ status: 'paid', createdAt: daysAgo(1) }), archived: 'true' }
      expect(shouldHideJobOnKanban(job)).toBe(false)
    })
  })

  describe('DEFAULT_KANBAN_STALE_DAYS', () => {
    it('is 5', () => {
      expect(DEFAULT_KANBAN_STALE_DAYS).toBe(5)
    })
  })
})
