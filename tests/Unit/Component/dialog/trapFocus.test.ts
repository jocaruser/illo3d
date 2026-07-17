import { trapFocusKeyDown } from '@/Component/dialog/trapFocus'

function makeEvent(key: string, shiftKey: boolean, currentTarget: HTMLElement) {
  return { key, shiftKey, currentTarget, preventDefault: vi.fn<() => void>() }
}

describe('trapFocusKeyDown', () => {
  let panel: HTMLElement
  let first: HTMLButtonElement
  let middle: HTMLButtonElement
  let last: HTMLButtonElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="panel" tabindex="-1">
        <button id="first">first</button>
        <button id="middle">middle</button>
        <button id="last">last</button>
      </div>
    `
    panel = document.getElementById('panel') as HTMLElement
    first = document.getElementById('first') as HTMLButtonElement
    middle = document.getElementById('middle') as HTMLButtonElement
    last = document.getElementById('last') as HTMLButtonElement
  })

  it('ignores keys other than Tab', () => {
    const event = makeEvent('Enter', false, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('swallows Tab when the panel has nothing focusable', () => {
    document.body.innerHTML = '<div id="empty" tabindex="-1"><p>text</p></div>'
    const empty = document.getElementById('empty') as HTMLElement
    const event = makeEvent('Tab', false, empty)
    trapFocusKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('wraps Tab from the last focusable element to the first', () => {
    last.focus()
    const event = makeEvent('Tab', false, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(first).toHaveFocus()
  })

  it('lets Tab move on from any element before the last', () => {
    middle.focus()
    const event = makeEvent('Tab', false, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    first.focus()
    const event = makeEvent('Tab', true, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(last).toHaveFocus()
  })

  it('wraps Shift+Tab from the panel itself to the last element', () => {
    panel.focus()
    const event = makeEvent('Tab', true, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(last).toHaveFocus()
  })

  it('lets Shift+Tab move back from any element after the first', () => {
    middle.focus()
    const event = makeEvent('Tab', true, panel)
    trapFocusKeyDown(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(middle).toHaveFocus()
  })
})
