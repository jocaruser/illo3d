import { screen } from '@testing-library/react'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('MentionLinkify', () => {
  it('links client, job, and resolvable piece mentions', () => {
    renderWithProviders(
      <p>
        <MentionLinkify
          text="Ask @CL1 about @J2 and @P3 today"
          resolvePieceJob={(pieceId) => (pieceId === 'P3' ? 'J9' : null)}
        />
      </p>
    )

    expect(screen.getByRole('link', { name: '@CL1' })).toHaveAttribute('href', '/clients/CL1')
    expect(screen.getByRole('link', { name: '@J2' })).toHaveAttribute('href', '/jobs/J2')
    expect(screen.getByRole('link', { name: '@P3' })).toHaveAttribute('href', '/jobs/J9#piece-P3')
    expect(screen.getByText(/today/)).toBeInTheDocument()
  })

  it('renders unresolvable piece mentions as plain text', () => {
    renderWithProviders(
      <p>
        <MentionLinkify text="Check @P7 status" resolvePieceJob={() => null} />
      </p>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/@P7/)).toBeInTheDocument()
  })

  it('handles text that starts and ends with mentions', () => {
    renderWithProviders(
      <p data-testid="body">
        <MentionLinkify text="@CL1 called @J2" resolvePieceJob={() => null} />
      </p>
    )

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByTestId('body')).toHaveTextContent('@CL1 called @J2')
  })

  it('leaves text without mentions untouched', () => {
    renderWithProviders(
      <p>
        <MentionLinkify text="Nothing to see here" resolvePieceJob={() => null} />
      </p>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
  })
})
