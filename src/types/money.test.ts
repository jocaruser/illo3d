import { describe, it, expect } from 'vitest'
import type {
  Client,
  Job,
  PieceItem,
  Inventory,
  Transaction,
} from './money'

describe('money types', () => {
  it('Client has required fields', () => {
    const client: Client = {
      id: 'c001',
      name: 'Test Client',
      created_at: '2026-02-28',
    }
    expect(client.id).toBe('c001')
    expect(client.name).toBe('Test Client')
  })

  it('Job has required fields', () => {
    const job: Job = {
      id: 'j001',
      client_id: 'c001',
      description: 'Test job',
      status: 'draft',
      created_at: '2026-02-28',
    }
    expect(job.status).toBe('draft')
  })

  it('Transaction has required fields', () => {
    const tx: Transaction = {
      id: 't001',
      date: '2026-02-28',
      type: 'income',
      amount: 45,
      category: 'job',
      concept: 'Test',
      ref_type: 'job',
      ref_id: 'j001',
    }
    expect(tx.type).toBe('income')
    expect(tx.amount).toBe(45)
  })

  it('PieceItem links piece to inventory', () => {
    const item: PieceItem = {
      id: 'pi001',
      piece_id: 'p001',
      inventory_id: 'inv001',
      quantity: 150,
    }
    expect(item.quantity).toBe(150)
  })

  it('Inventory has thresholds and qty', () => {
    const inv: Inventory = {
      id: 'inv001',
      type: 'filament',
      name: 'PLA',
      qty_current: 750,
      warn_yellow: 300,
      warn_orange: 150,
      warn_red: 50,
      created_at: '2026-02-28',
    }
    expect(inv.qty_current).toBe(750)
  })
})
