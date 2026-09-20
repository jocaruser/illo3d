import { screen } from '@testing-library/react'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { createTestEm, FakeTabs } from '../helpers/workbookTestBed'
import { renderWithProviders } from './helpers/renderWithProviders'

function emWithPieceJob() {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'Acme' })
  tabs.seed('jobs', { id: 'J2', client_id: 'CL1', description: 'Run' })
  tabs.seed('pieces', { id: 'P3', job_id: 'J9', name: 'Part' })
  tabs.seed('jobs', { id: 'J9', client_id: 'CL1', description: 'Other' })
  return createTestEm(tabs)
}

describe('MentionLinkify', () => {
  it('links client, job, and resolvable piece mentions', () => {
    const em = emWithPieceJob()
    renderWithProviders(
      <p>
        <MentionLinkify text="Ask @CL1 about @J2 and @P3 today" em={em} />
      </p>
    )

    expect(screen.getByRole('link', { name: '@CL1' })).toHaveAttribute('href', '/clients/CL1')
    expect(screen.getByRole('link', { name: '@J2' })).toHaveAttribute('href', '/jobs/J2')
    expect(screen.getByRole('link', { name: '@P3' })).toHaveAttribute('href', '/jobs/J9#piece-P3')
    expect(screen.getByText(/today/)).toBeInTheDocument()
  })

  it('renders unresolvable piece mentions as plain text', () => {
    const tabs = new FakeTabs()
    const em = createTestEm(tabs)
    renderWithProviders(
      <p>
        <MentionLinkify text="Check @P7 status" em={em} />
      </p>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/@P7/)).toBeInTheDocument()
  })

  it('handles text that starts and ends with mentions', () => {
    const tabs = new FakeTabs()
    tabs.seed('clients', { id: 'CL1', name: 'Acme' })
    tabs.seed('jobs', { id: 'J2', client_id: 'CL1', description: 'Run' })
    const em = createTestEm(tabs)
    renderWithProviders(
      <p data-testid="body">
        <MentionLinkify text="@CL1 called @J2" em={em} />
      </p>
    )

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByTestId('body')).toHaveTextContent('@CL1 called @J2')
  })

  it('leaves text without mentions untouched', () => {
    const em = createTestEm(new FakeTabs())
    renderWithProviders(
      <p>
        <MentionLinkify text="Nothing to see here" em={em} />
      </p>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
  })
})
