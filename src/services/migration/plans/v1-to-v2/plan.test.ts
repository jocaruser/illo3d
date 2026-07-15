import { describe, it, expect } from 'vitest'
import { v1ToV2Plan } from './plan'

describe('v1ToV2Plan', () => {
  it('migrates from major 1 to major 2', () => {
    expect(v1ToV2Plan.fromMajor).toBe(1)
    expect(v1ToV2Plan.toMajor).toBe(2)
    expect(v1ToV2Plan.toVersion).toBe('2.0.0')
  })

  it('orders steps to match the wizard step grid cards', () => {
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
})
