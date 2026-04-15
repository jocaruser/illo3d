import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EntityTagsSection } from './EntityTagsSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('EntityTagsSection', () => {
  it('shows only tag links for the given job entity', () => {
    render(
      <MemoryRouter>
        <EntityTagsSection
          spreadsheetId="s1"
          entityType="job"
          entityId="J1"
          tags={[{ id: 'TG1', name: 'VIP', created_at: '' }]}
          tagLinks={[
            {
              id: 'TL1',
              tag_id: 'TG1',
              entity_type: 'client',
              entity_id: 'CL1',
              created_at: '',
            },
            {
              id: 'TL2',
              tag_id: 'TG1',
              entity_type: 'job',
              entity_id: 'J1',
              created_at: '',
            },
          ]}
          onChanged={vi.fn()}
          i18nScope="jobDetail"
          sectionTestId="job-tags-section"
          chipTestIdPrefix="job-tag"
          tagComboboxTestIdPrefix="job-tag"
        />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('job-tag-chip-TG1')).toHaveTextContent('Vip')
    expect(screen.getByTestId('job-tags-section')).toBeInTheDocument()
  })
})
