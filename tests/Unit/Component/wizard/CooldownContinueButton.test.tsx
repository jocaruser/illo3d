import { act, render, screen } from '@testing-library/react'
import {
  COOLDOWN_MS,
  CooldownContinueButton,
} from '@/Component/wizard/CooldownContinueButton'

const button = () => screen.getByTestId('wizard-migration-continue')
const ring = () => screen.queryByTestId('wizard-cooldown-ring')
const check = () => screen.queryByTestId('wizard-cooldown-check')

/** The cooldown is wall-clock driven, so time must be faked wholesale. */
function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('CooldownContinueButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays disabled with no ring while there is nothing to run', () => {
    render(
      <CooldownContinueButton label="Continue" onClick={null} resetKey="null" />
    )

    expect(button()).toBeDisabled()
    expect(button()).toHaveTextContent('Continue')
    expect(ring()).not.toBeInTheDocument()
    expect(check()).not.toBeInTheDocument()
  })

  it('shows the ring and stays disabled for the whole cooldown', () => {
    render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )

    expect(ring()).toBeInTheDocument()
    expect(button()).toBeDisabled()

    tick(COOLDOWN_MS - 100)
    expect(button()).toBeDisabled()
    expect(ring()).toBeInTheDocument()
  })

  it('advances the ring as the cooldown elapses', () => {
    render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )

    const offsetAt = () =>
      ring()?.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset')
    const initial = Number(offsetAt())

    tick(COOLDOWN_MS / 2)
    const halfway = Number(offsetAt())

    expect(halfway).toBeLessThan(initial)
    expect(halfway).toBeGreaterThan(0)
  })

  it('swaps the ring for a checkmark and enables once the cooldown elapses', () => {
    render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )

    tick(COOLDOWN_MS)

    expect(ring()).not.toBeInTheDocument()
    expect(check()).toBeInTheDocument()
    expect(button()).toBeEnabled()
  })

  it('restarts the cooldown when the answer changes', () => {
    const { rerender } = render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )
    tick(COOLDOWN_MS)
    expect(button()).toBeEnabled()

    rerender(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="false"
      />
    )

    expect(button()).toBeDisabled()
    expect(ring()).toBeInTheDocument()
    expect(check()).not.toBeInTheDocument()

    tick(COOLDOWN_MS)
    expect(button()).toBeEnabled()
  })

  it('restarts the cooldown when the answer is cleared and given again', () => {
    const { rerender } = render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )
    tick(COOLDOWN_MS)

    rerender(
      <CooldownContinueButton label="Continue" onClick={null} resetKey="null" />
    )
    expect(button()).toBeDisabled()
    expect(ring()).not.toBeInTheDocument()

    rerender(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )
    expect(ring()).toBeInTheDocument()
    expect(button()).toBeDisabled()
  })

  it('fires once cooled down', () => {
    const onClick = vi.fn()
    render(
      <CooldownContinueButton
        label="Continue"
        onClick={onClick}
        resetKey="true"
      />
    )
    tick(COOLDOWN_MS)

    act(() => {
      button().click()
    })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('stays disabled while busy even after the cooldown', () => {
    render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
        busy
      />
    )
    tick(COOLDOWN_MS)

    expect(button()).toBeDisabled()
    expect(check()).toBeInTheDocument()
  })

  it('stops ticking once unmounted', () => {
    const { unmount } = render(
      <CooldownContinueButton
        label="Continue"
        onClick={vi.fn()}
        resetKey="true"
      />
    )
    unmount()

    expect(() => tick(COOLDOWN_MS)).not.toThrow()
  })
})
