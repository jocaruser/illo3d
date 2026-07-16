import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalSearchBox } from '@/Component/layout/GlobalSearchBox'
import { globalSearch, type GlobalSearchHit } from '@/Service/Search/globalSearch'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderLayout } from './renderLayout'

const navigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

vi.mock('@/Service/Search/globalSearch', () => ({ globalSearch: vi.fn() }))

vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => ({}) }))

const hits: GlobalSearchHit[] = [
  {
    kind: 'client',
    id: 'CL1',
    navigateTo: '/clients/CL1',
    primaryLine: 'Beta LLC',
    secondaryLine: 'CL1 · beta@example.com',
  },
  {
    kind: 'job',
    id: 'J1',
    navigateTo: '/jobs/J1',
    primaryLine: 'Phone case prototype',
    secondaryLine: 'Beta LLC',
  },
  { kind: 'tag', id: 'TG1', navigateTo: '/clients', primaryLine: 'Vip' },
]

function searchBox(): HTMLElement {
  return screen.getByTestId('global-header-search')
}

describe('GlobalSearchBox', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    vi.mocked(globalSearch).mockReturnValue(hits)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is a named search field', () => {
    renderLayout(<GlobalSearchBox />)

    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(searchBox()).toHaveAccessibleName('Search all entities')
    expect(searchBox()).toHaveAttribute('type', 'search')
  })

  it('stays collapsed below two characters', async () => {
    renderLayout(<GlobalSearchBox />)

    await userEvent.type(searchBox(), 'C')

    expect(screen.queryByTestId('global-search-listbox')).not.toBeInTheDocument()
    expect(searchBox()).toHaveAttribute('aria-expanded', 'false')
  })

  it('lists hits with type, label and parent context', async () => {
    renderLayout(<GlobalSearchBox />)

    await userEvent.type(searchBox(), 'CL')

    const option = screen.getByTestId('global-search-option-client-CL1')
    expect(option).toHaveTextContent('Client')
    expect(option).toHaveTextContent('Beta LLC')
    expect(option).toHaveTextContent('CL1 · beta@example.com')
    expect(screen.getByTestId('global-search-listbox')).toHaveAccessibleName('Search results')
  })

  it('reports no matches', async () => {
    vi.mocked(globalSearch).mockReturnValue([])
    renderLayout(<GlobalSearchBox />)

    await userEvent.type(searchBox(), 'zz')

    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('navigates on click', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.click(screen.getByTestId('global-search-option-job-J1'))

    expect(navigate).toHaveBeenCalledWith('/jobs/J1')
    expect(searchBox()).toHaveValue('')
  })

  it('moves the active option with the arrow keys', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')
    const [first, second] = screen.getAllByRole('option')

    await userEvent.keyboard('{ArrowDown}')
    expect(searchBox()).toHaveAttribute('aria-activedescendant', first.id)
    expect(first).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowDown}')
    expect(searchBox()).toHaveAttribute('aria-activedescendant', second.id)
    expect(first).toHaveAttribute('aria-selected', 'false')

    await userEvent.keyboard('{ArrowUp}')
    expect(searchBox()).toHaveAttribute('aria-activedescendant', first.id)
  })

  it('clamps at both ends of the list', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')
    const options = screen.getAllByRole('option')

    await userEvent.keyboard('{ArrowUp}')
    expect(searchBox()).toHaveAttribute('aria-activedescendant', options[0].id)

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(searchBox()).toHaveAttribute('aria-activedescendant', options[2].id)
  })

  it('opens the active hit on Enter', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(navigate).toHaveBeenCalledWith('/jobs/J1')
  })

  it('opens the first hit on Enter when nothing is active', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.keyboard('{Enter}')

    expect(navigate).toHaveBeenCalledWith('/clients/CL1')
  })

  it('ignores Enter with no hits', async () => {
    vi.mocked(globalSearch).mockReturnValue([])
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'zz')

    await userEvent.keyboard('{Enter}')

    expect(navigate).not.toHaveBeenCalled()
  })

  it('ignores Enter while collapsed', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'C')

    await userEvent.keyboard('{Enter}')

    expect(navigate).not.toHaveBeenCalled()
  })

  it('ignores the arrow keys while collapsed', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'C')

    await userEvent.keyboard('{ArrowDown}')

    expect(searchBox()).not.toHaveAttribute('aria-activedescendant')
  })

  it('ignores the arrow keys with no hits', async () => {
    vi.mocked(globalSearch).mockReturnValue([])
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'zz')

    await userEvent.keyboard('{ArrowDown}')

    expect(searchBox()).not.toHaveAttribute('aria-activedescendant')
  })

  it('ignores keys it does not handle', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.keyboard('{ArrowLeft}')

    expect(searchBox()).not.toHaveAttribute('aria-activedescendant')
  })

  it('closes on Escape and reopens when the input is clicked again', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByTestId('global-search-listbox')).not.toBeInTheDocument()

    await userEvent.click(searchBox())
    expect(screen.getByTestId('global-search-listbox')).toBeInTheDocument()
  })

  it('resets the active option when the query changes', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.type(searchBox(), '1')

    expect(searchBox()).not.toHaveAttribute('aria-activedescendant')
  })

  it('activates the option under the pointer', async () => {
    renderLayout(<GlobalSearchBox />)
    await userEvent.type(searchBox(), 'CL')

    await userEvent.hover(screen.getByTestId('global-search-option-tag-TG1'))

    expect(screen.getByTestId('global-search-option-tag-TG1')).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('closes on blur', async () => {
    renderLayout(
      <>
        <GlobalSearchBox />
        <button type="button">elsewhere</button>
      </>
    )
    await userEvent.type(searchBox(), 'CL')

    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(screen.queryByTestId('global-search-listbox')).not.toBeInTheDocument()
  })
})
