import { screen } from '@testing-library/react'
import { PageTransition } from '@/Component/layout/PageTransition'
import { renderLayout } from './renderLayout'

describe('PageTransition', () => {
  it('renders its page', () => {
    renderLayout(
      <PageTransition>
        <p>page content</p>
      </PageTransition>
    )

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('uses the shared animation classes, which honour reduced motion in CSS', () => {
    renderLayout(
      <PageTransition>
        <p>page content</p>
      </PageTransition>
    )

    const wrapper = screen.getByText('page content').parentElement
    expect(wrapper).toHaveClass('fade-in')
    expect(wrapper).toHaveClass('slide-up')
  })
})
