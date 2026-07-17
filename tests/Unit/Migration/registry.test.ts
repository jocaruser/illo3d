import { describe, expect, it } from 'vitest'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { v1ToV2Plan } from '@/Migration/Plan/V1ToV2'
import { v2ToV3Plan } from '@/Migration/Plan/V2ToV3'
import { registerPlan, resolvePlanChain } from '@/Migration/registry'

describe('pre-seeded plans', () => {
  it('v1ToV2Plan targets 2.0.0 with per-sheet steps then the audit log', () => {
    expect(v1ToV2Plan.fromMajor).toBe(1)
    expect(v1ToV2Plan.toMajor).toBe(2)
    expect(v1ToV2Plan.toVersion).toBe('2.0.0')
    expect(v1ToV2Plan.steps.map((step) => step.id)).toEqual([
      'clients',
      'crm_notes',
      'tags',
      'tag_links',
      'jobs',
      'pieces',
      'piece_items',
      'inventory',
      'lots',
      'transactions',
      'audit_log',
    ])
  })

  it('v2ToV3Plan targets 3.0.0 with the jobs and inventory steps', () => {
    expect(v2ToV3Plan.fromMajor).toBe(2)
    expect(v2ToV3Plan.toMajor).toBe(3)
    expect(v2ToV3Plan.toVersion).toBe('3.0.0')
    expect(v2ToV3Plan.steps.map((step) => step.id)).toEqual([
      'jobs',
      'inventory',
    ])
  })
})

describe('resolvePlanChain', () => {
  it('chains both plans for a v1 shop targeting v3', () => {
    expect(resolvePlanChain(1, 3)).toEqual([v1ToV2Plan, v2ToV3Plan])
  })

  it('resolves the single hop for a v2 shop', () => {
    expect(resolvePlanChain(2, 3)).toEqual([v2ToV3Plan])
  })

  it('resolves an empty chain when the shop is already current', () => {
    expect(resolvePlanChain(3, 3)).toEqual([])
  })

  it('throws on a downgrade', () => {
    expect(() => resolvePlanChain(3, 2)).toThrow(/downward from v3 to v2/)
  })

  it('throws on a missing hop', () => {
    expect(() => resolvePlanChain(3, 4)).toThrow(
      /No migration plan found from v3/
    )
  })

  it('walks through plans registered later', () => {
    const v3ToV4Plan: MigrationPlan = {
      fromMajor: 3,
      toMajor: 4,
      toVersion: '4.0.0',
      steps: [],
    }
    registerPlan(v3ToV4Plan)
    expect(resolvePlanChain(2, 4)).toEqual([v2ToV3Plan, v3ToV4Plan])
  })
})
