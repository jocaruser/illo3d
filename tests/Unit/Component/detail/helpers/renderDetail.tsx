import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { SheetName } from '@/Config/schema'
import { EntityManager } from '@/Repository/EntityManager'
import { appendRecord, emptyMatrix } from '@/Repository/Matrix'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'
import type { SheetRecord } from '@/Entity/SheetEntity'
import type { Clock } from '@/Service/Clock'
import type { TabAccess } from '@/Store/TabAccess'
import { i18n } from './i18n'
import { LocationDisplay } from './LocationDisplay'
import { Providers } from './Providers'

export { i18n }

/** A `Clock` frozen at a fixed instant so ids, dates and bands stay stable. */
export class FixedClock implements Clock {
  constructor(private readonly at: Date) {}
  now(): Date {
    return this.at
  }
}

export const TEST_NOW = new Date('2024-05-20T10:00:00.000Z')

/** In-memory `TabAccess`, seeded per sheet with plain records. */
export class MemoryTabs implements TabAccess {
  private readonly matrices = new Map<SheetName, SheetMatrix>()

  getTab(sheet: SheetName): SheetMatrix {
    return this.matrices.get(sheet) ?? emptyMatrix(sheet)
  }

  mutateTab(sheet: SheetName, mutate: (matrix: SheetMatrix) => SheetMatrix): void {
    this.matrices.set(sheet, mutate(this.getTab(sheet)))
  }

  /** Append rows to a sheet, filling absent columns with ''. */
  seed(sheet: SheetName, records: SheetRecord[]): this {
    for (const record of records) {
      this.mutateTab(sheet, (matrix) => appendRecord(sheet, matrix, record))
    }
    return this
  }
}

export interface TestWorld {
  tabs: MemoryTabs
  em: EntityManager
}

/** A workbook seeded sheet by sheet, plus an `EntityManager` over it. */
export function createWorld(
  seed: Partial<Record<SheetName, SheetRecord[]>> = {},
  clock: Clock = new FixedClock(TEST_NOW)
): TestWorld {
  const tabs = new MemoryTabs()
  for (const [sheet, records] of Object.entries(seed)) {
    tabs.seed(sheet as SheetName, records)
  }
  return { tabs, em: new EntityManager(tabs, clock, () => 'test@example.com') }
}

/** Render with i18n + a plain router. `rerender` keeps both providers mounted. */
export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Providers })
}

interface RenderRouteOptions {
  /** Route pattern, e.g. `/clients/:clientId`. */
  path: string
  /** Initial location, e.g. `/clients/CL1`. */
  entry: string
}

/** Render a page behind its real route pattern, with a live location readout. */
export function renderRoute(ui: ReactElement, { path, entry }: RenderRouteOptions) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationDisplay />
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<div data-testid="other-route" />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}
