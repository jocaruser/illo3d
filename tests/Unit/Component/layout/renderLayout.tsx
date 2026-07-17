import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { initI18n } from '@/I18n'

export const i18n = initI18n('en')

/** Layout chrome needs both i18n and a router; most of it also needs a route. */
export function renderLayout(
  ui: ReactElement,
  initialEntries: string[] = ['/dashboard']
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </I18nextProvider>
  )
}
