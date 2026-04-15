import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CrmNotesSection } from './CrmNotesSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CrmNotesSection', () => {
  const testIds = {
    severityStrip: 't-notes-severity-strip',
    addButton: 't-note-add',
    row: (id: string) => `t-note-row-${id}`,
  }

  const onChanged = vi.fn()
  const onCreateNote = vi.fn()
  const onUpdateNote = vi.fn()
  const onDeleteNote = vi.fn()

  beforeEach(() => {
    onChanged.mockReset()
    onCreateNote.mockReset()
    onUpdateNote.mockReset()
    onDeleteNote.mockReset()
    onCreateNote.mockResolvedValue(undefined)
    onUpdateNote.mockResolvedValue(undefined)
    onDeleteNote.mockResolvedValue(undefined)
    onChanged.mockResolvedValue(undefined)
  })

  it('submits a new note via onCreateNote', async () => {
    render(
      <CrmNotesSection
        spreadsheetId="s1"
        notes={[]}
        i18nScope="jobDetail"
        testIds={testIds}
        onChanged={onChanged}
        onCreateNote={onCreateNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('jobDetail.noteBodyPlaceholder'), {
      target: { value: 'Hello job' },
    })
    fireEvent.click(screen.getByTestId('t-note-add'))

    await waitFor(() => {
      expect(onCreateNote).toHaveBeenCalledWith({
        body: 'Hello job',
        severity: 'info',
      })
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it('shows severity strip for prominent notes', () => {
    render(
      <CrmNotesSection
        spreadsheetId="s1"
        notes={[
          {
            id: 'JN1',
            body: 'Watch out',
            referenced_entity_ids: '',
            severity: 'warning',
            created_at: '2025-01-01',
          },
        ]}
        i18nScope="jobDetail"
        testIds={testIds}
        onChanged={onChanged}
        onCreateNote={onCreateNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
      />,
    )

    expect(screen.getByTestId('t-notes-severity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('t-note-row-JN1')).toBeInTheDocument()
  })
})
