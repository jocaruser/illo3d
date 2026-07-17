import { toast } from '@/Component/Toast'
import { toast as sonnerToast } from 'sonner'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

const mocked = vi.mocked(sonnerToast)

describe('toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards success messages', () => {
    toast.success('Saved')

    expect(mocked.success).toHaveBeenCalledWith('Saved')
  })

  it('forwards errors without options as a bare message', () => {
    toast.error('Broke')

    expect(mocked.error).toHaveBeenCalledWith('Broke', undefined)
  })

  it('maps an action onto sonner and invokes the callback', () => {
    const onClick = vi.fn()

    toast.error('Broke', { action: { label: 'Retry', onClick } })

    const [message, options] = mocked.error.mock.calls[0]
    expect(message).toBe('Broke')
    const action = (
      options as { action: { label: string; onClick: () => void } }
    ).action
    expect(action.label).toBe('Retry')
    action.onClick()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards dismiss', () => {
    toast.dismiss()

    expect(mocked.dismiss).toHaveBeenCalledTimes(1)
  })
})
