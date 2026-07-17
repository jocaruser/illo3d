import type { SheetRecord } from '@/Entity/SheetEntity'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { UseShopMetadata } from '@/Hook/useShopMetadata'
import type { EntityManager } from '@/Repository/EntityManager'
import { KANBAN_MIME } from '@/Component/kanban/kanbanDnd'
import { FIXED_ISO, makeEm, type FakeTabs, type TestContext } from '../../Service/helpers'

/**
 * Shared fixture for the dashboard, kanban and calendar suites: one
 * EntityManager over in-memory tabs, plus the shop metadata the board reads.
 *
 * Test files mock the hooks through `currentEm` / `currentMetadata` so the
 * components under test see exactly this state.
 */
let context: TestContext | null = null
let metadata: UseShopMetadata = { metadata: null, loading: false, error: null }

export function setupShop(): TestContext {
  context = makeEm(() => 'test@example.com')
  metadata = { metadata: null, loading: false, error: null }
  return context
}

export function currentEm(): EntityManager {
  if (context === null) throw new Error('call setupShop() in beforeEach')
  return context.em
}

export function currentMetadata(): UseShopMetadata {
  return metadata
}

export function setShopMetadata(next: Partial<ShopMetadata>): void {
  metadata = {
    metadata: {
      app: 'illo3d',
      version: '3.0.0',
      spreadsheetId: 'SS1',
      createdAt: FIXED_ISO,
      createdBy: 'test@example.com',
      ...next,
    },
    loading: false,
    error: null,
  }
}

export function seedClient(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('clients', { created_at: '2026-01-01', ...fields })
}

export function seedJob(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('jobs', { status: 'draft', created_at: FIXED_ISO, ...fields })
}

export function seedPiece(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('pieces', { status: 'pending', created_at: FIXED_ISO, ...fields })
}

export function seedPieceItem(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('piece_items', fields)
}

export function seedInventory(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('inventory', { type: 'filament', created_at: FIXED_ISO, ...fields })
}

export function seedLot(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('lots', { created_at: FIXED_ISO, ...fields })
}

export function seedTransaction(tabs: FakeTabs, fields: SheetRecord): void {
  tabs.seed('transactions', { type: 'expense', ...fields })
}

/** A priced piece: the job's pricing becomes complete. */
export function seedPricedPiece(tabs: FakeTabs, fields: SheetRecord): void {
  seedPiece(tabs, { price: '10', units: '3', ...fields })
}

/** Minimal DataTransfer stand-in — jsdom has no drag-and-drop. */
export function makeDataTransfer(jobId?: string): DataTransfer {
  const data = new Map<string, string>()
  if (jobId !== undefined) data.set(KANBAN_MIME, jobId)
  return {
    effectAllowed: 'none',
    setData: (type: string, value: string) => {
      data.set(type, value)
    },
    getData: (type: string) => data.get(type) ?? '',
  } as unknown as DataTransfer
}
