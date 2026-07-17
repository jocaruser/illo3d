import { screen } from '@testing-library/react'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('SectionHeading', () => {
  it('renders a display-font level-2 heading with merged classes', () => {
    renderWithProviders(<SectionHeading className="mt-6">Notes</SectionHeading>)

    const heading = screen.getByRole('heading', { level: 2, name: 'Notes' })
    expect(heading).toHaveClass('font-display', 'mt-6')
  })
})
