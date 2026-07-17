import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SHEET_NAMES, type SheetName } from '@/Config/schema'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { initI18n } from '@/I18n'
import { EntityManager } from '@/Repository/EntityManager'
import { appendRecord, emptyMatrix } from '@/Repository/Matrix'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'
import type { Clock } from '@/Service/Clock'
import type { TabAccess } from '@/Store/TabAccess'

export const i18n = initI18n('en')

/** An in-memory workbook snapshot: the same contract the Zustand store fulfils. */
export class FakeTabs implements TabAccess {
  private readonly tabs = Object.fromEntries(
    SHEET_NAMES.map((sheet) => [sheet, emptyMatrix(sheet)])
  ) as Record<SheetName, SheetMatrix>

  getTab(sheet: SheetName): SheetMatrix {
    return this.tabs[sheet]
  }

  mutateTab(
    sheet: SheetName,
    mutate: (matrix: SheetMatrix) => SheetMatrix
  ): void {
    this.tabs[sheet] = mutate(this.tabs[sheet])
  }

  /** Append a row without auditing it, the way a hydrated workbook arrives. */
  seed(sheet: SheetName, record: SheetRecord): this {
    this.tabs[sheet] = appendRecord(sheet, this.tabs[sheet], record)
    return this
  }

  rows(sheet: SheetName): SheetMatrix {
    return this.tabs[sheet]
  }
}

class FixedClock implements Clock {
  constructor(private readonly instant: string) {}

  now(): Date {
    return new Date(this.instant)
  }
}

export function createTestEm(
  tabs: TabAccess,
  instant = '2026-07-16T12:00:00.000Z'
): EntityManager {
  return new EntityManager(
    tabs,
    new FixedClock(instant),
    () => 'test@example.com'
  )
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

interface RenderRouteOptions {
  /** Route pattern for pages that read a `:param`. */
  path?: string
  /** Entry the router starts on. */
  entry?: string
}

/**
 * Renders a page under the real i18n catalog and a memory router, exposing the
 * current pathname through `location` so navigation is assertable.
 */
export function renderRoute(
  element: ReactElement,
  options: RenderRouteOptions = {}
) {
  const { path = '/', entry = '/' } = options
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <Routes>
          <Route path={path} element={element} />
          <Route path="*" element={<span data-testid="other-route" />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}
