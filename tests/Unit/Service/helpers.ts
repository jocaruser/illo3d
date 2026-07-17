import { SHEET_NAMES, type SheetName } from '@/Config/schema'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { EntityManager } from '@/Repository/EntityManager'
import { appendRecord, emptyMatrix } from '@/Repository/Matrix'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'
import type { Clock } from '@/Service/Clock'
import type { TabAccess } from '@/Store/TabAccess'

export const FIXED_ISO = '2026-07-16T12:00:00.000Z'

export class FixedClock implements Clock {
  constructor(private iso: string = FIXED_ISO) {}

  now(): Date {
    return new Date(this.iso)
  }

  set(iso: string): void {
    this.iso = iso
  }
}

export interface FakeTabs extends TabAccess {
  seed(sheet: SheetName, record: SheetRecord): void
  matrix(sheet: SheetName): SheetMatrix
}

/** Tiny in-memory TabAccess over empty canonical matrices. */
export function makeTabs(): FakeTabs {
  const state = Object.fromEntries(
    SHEET_NAMES.map((sheet) => [sheet, emptyMatrix(sheet)]),
  ) as Record<SheetName, SheetMatrix>
  return {
    getTab: (sheet) => state[sheet],
    mutateTab: (sheet, mutate) => {
      state[sheet] = mutate(state[sheet])
    },
    seed: (sheet, record) => {
      state[sheet] = appendRecord(sheet, state[sheet], record)
    },
    matrix: (sheet) => state[sheet],
  }
}

export interface TestContext {
  em: EntityManager
  tabs: FakeTabs
  clock: FixedClock
}

export function makeEm(actor: () => string = () => 'tester'): TestContext {
  const tabs = makeTabs()
  const clock = new FixedClock()
  return { em: new EntityManager(tabs, clock, actor), tabs, clock }
}

/** Data rows (no header) of a sheet — convenient for assertions. */
export function dataRows(tabs: FakeTabs, sheet: SheetName): string[][] {
  return tabs.matrix(sheet).slice(1)
}

/** Audit rows as `entity_name/action/entity_id` strings for compact assertions. */
export function auditTrail(tabs: FakeTabs): string[] {
  return dataRows(tabs, 'audit_log').map((row) => `${row[3]}/${row[5]}/${row[4]}`)
}
