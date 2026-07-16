import { getDragJobId, setDragJobId, KANBAN_MIME } from '@/Component/kanban/kanbanDnd'
import { makeDataTransfer } from '../dashboard/harness'

describe('kanbanDnd', () => {
  it('writes the job id under the private mime type and as plain text', () => {
    const dataTransfer = makeDataTransfer()

    setDragJobId(dataTransfer, 'J7')

    expect(dataTransfer.effectAllowed).toBe('move')
    expect(dataTransfer.getData(KANBAN_MIME)).toBe('J7')
    expect(dataTransfer.getData('text/plain')).toBe('J7')
  })

  it('reads back a dragged job id', () => {
    expect(getDragJobId(makeDataTransfer('J7'))).toBe('J7')
  })

  it('ignores a drag that carries no job id', () => {
    expect(getDragJobId(makeDataTransfer())).toBeNull()
  })

  it('ignores a drop with no data transfer at all', () => {
    expect(getDragJobId(null)).toBeNull()
  })
})
