import { screen } from '@testing-library/react'
import { ProtectedPage } from '@/Component/layout/ProtectedPage'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderLayout } from './renderLayout'

function Boom(): never {
  throw new Error('page exploded')
}

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

describe('ProtectedPage', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    useShopStore.getState().clearActiveShop()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders nothing until a shop is open, leaving the wizard in charge', () => {
    const { container } = renderLayout(
      <ProtectedPage>
        <p>page content</p>
      </ProtectedPage>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the page once a shop is open', () => {
    openShop()

    renderLayout(
      <ProtectedPage>
        <p>page content</p>
      </ProtectedPage>
    )

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('contains a crashing page behind the error fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    openShop()

    renderLayout(
      <ProtectedPage>
        <Boom />
      </ProtectedPage>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page couldn’t be displayed'
    )
  })
})
