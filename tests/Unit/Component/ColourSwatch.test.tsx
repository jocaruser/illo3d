import { ColourSwatch } from '@/Component/ColourSwatch'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('ColourSwatch', () => {
  it('renders nothing for an empty colour', () => {
    const { container } = renderWithProviders(<ColourSwatch colour="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a small rounded bordered swatch for a colour', () => {
    const { container } = renderWithProviders(<ColourSwatch colour="#ff0000" />)
    const swatch = container.firstElementChild as HTMLElement
    expect(swatch).toHaveClass('rounded-full', 'border-border')
    expect(swatch).toHaveAttribute('title', '#ff0000')
    expect(swatch).toHaveAttribute('aria-hidden', 'true')
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })
})
