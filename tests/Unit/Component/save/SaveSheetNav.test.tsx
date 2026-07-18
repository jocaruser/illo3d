import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveSheetNav, type SaveSheetNavItem } from '@/Component/save/SaveSheetNav'
import { renderWithProviders } from '../helpers/renderWithProviders'

const items: SaveSheetNavItem[] = [
  { sheet: 'clients', status: 'changed', detail: '2 rows changed' },
  { sheet: 'tags', status: 'clean' },
  { sheet: 'audit_log', status: 'changed', detail: '3 new entries' },
]

describe('SaveSheetNav', () => {
  it('renders one selectable card per sheet with its detail', () => {
    renderWithProviders(
      <SaveSheetNav items={items} selected="clients" onSelect={() => {}} />
    )

    expect(screen.getByTestId('save-nav-clients')).toHaveTextContent('Clients')
    expect(screen.getByTestId('save-nav-clients')).toHaveTextContent('2 rows changed')
    expect(screen.getByTestId('save-nav-tags')).toHaveTextContent('Tags')
    expect(screen.getByTestId('save-nav-audit_log')).toHaveTextContent('3 new entries')
  })

  it('marks only the selected sheet as current', () => {
    renderWithProviders(
      <SaveSheetNav items={items} selected="tags" onSelect={() => {}} />
    )

    expect(screen.getByTestId('save-nav-tags')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('save-nav-clients')).not.toHaveAttribute('aria-current')
  })

  it('reports the clicked sheet', async () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <SaveSheetNav items={items} selected="clients" onSelect={onSelect} />
    )

    await userEvent.click(screen.getByTestId('save-nav-audit_log'))

    expect(onSelect).toHaveBeenCalledWith('audit_log')
  })

  it('describes each card status for assistive tech', () => {
    renderWithProviders(
      <SaveSheetNav items={items} selected="clients" onSelect={() => {}} />
    )

    expect(screen.getByTestId('save-nav-clients')).toHaveAccessibleName('Clients: Changed')
    expect(screen.getByTestId('save-nav-tags')).toHaveAccessibleName('Tags: No changes')
  })
})
