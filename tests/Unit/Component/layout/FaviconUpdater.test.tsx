import { render } from '@testing-library/react'
import { FaviconUpdater } from '@/Component/layout/FaviconUpdater'
import { useShopLogoUrl } from '@/Hook/useShopLogoUrl'

vi.mock('@/Hook/useShopLogoUrl', () => ({ useShopLogoUrl: vi.fn() }))

function favicon(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]')
}

describe('FaviconUpdater', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    vi.clearAllMocks()
  })

  it('falls back to the bundled mark when the shop has no logo', () => {
    vi.mocked(useShopLogoUrl).mockReturnValue(null)

    render(<FaviconUpdater />)

    // BASE_URL is '/' under test and '/illo3d/' in production builds.
    expect(favicon()).toHaveAttribute('href', `${import.meta.env.BASE_URL}logo.svg`)
    expect(favicon()).toHaveAttribute('type', 'image/svg+xml')
  })

  it('creates the link element when the document has none', () => {
    vi.mocked(useShopLogoUrl).mockReturnValue('blob:shop-logo')
    expect(favicon()).toBeNull()

    render(<FaviconUpdater />)

    expect(favicon()).toHaveAttribute('href', 'blob:shop-logo')
  })

  it('reuses an existing link element', () => {
    document.head.innerHTML =
      '<link rel="icon" type="image/svg+xml" href="/logo.svg" data-original="yes" />'
    vi.mocked(useShopLogoUrl).mockReturnValue('blob:shop-logo')

    render(<FaviconUpdater />)

    expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(1)
    expect(favicon()).toHaveAttribute('data-original', 'yes')
    expect(favicon()).toHaveAttribute('href', 'blob:shop-logo')
  })

  it('drops the type hint for a shop logo of unknown format', () => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="/logo.svg" />'
    vi.mocked(useShopLogoUrl).mockReturnValue('blob:shop-logo')

    render(<FaviconUpdater />)

    expect(favicon()).not.toHaveAttribute('type')
  })

  it('restores the fallback when the shop logo goes away', () => {
    vi.mocked(useShopLogoUrl).mockReturnValue('blob:shop-logo')
    const { rerender } = render(<FaviconUpdater />)

    vi.mocked(useShopLogoUrl).mockReturnValue(null)
    rerender(<FaviconUpdater />)

    expect(favicon()).toHaveAttribute('href', `${import.meta.env.BASE_URL}logo.svg`)
  })

  it('renders nothing itself', () => {
    vi.mocked(useShopLogoUrl).mockReturnValue(null)

    const { container } = render(<FaviconUpdater />)

    expect(container).toBeEmptyDOMElement()
  })
})
