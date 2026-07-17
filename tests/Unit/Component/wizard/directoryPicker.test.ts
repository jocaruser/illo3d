import {
  isDirectoryPickerSupported,
  isPickerAbort,
  pickDirectory,
} from '@/Component/wizard/directoryPicker'

describe('directoryPicker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.showDirectoryPicker
  })

  describe('isDirectoryPickerSupported', () => {
    it('is false on a browser without the File System Access API', () => {
      expect(isDirectoryPickerSupported()).toBe(false)
    })

    it('is true once the API is present', () => {
      window.showDirectoryPicker = vi.fn()
      expect(isDirectoryPickerSupported()).toBe(true)
    })
  })

  describe('isPickerAbort', () => {
    it('recognises the dismissal DOMException by name', () => {
      const abort = new Error('The user aborted a request.')
      abort.name = 'AbortError'
      expect(isPickerAbort(abort)).toBe(true)
    })

    it('rejects other errors and non-errors', () => {
      expect(isPickerAbort(new Error('disk on fire'))).toBe(false)
      expect(isPickerAbort('AbortError')).toBe(false)
    })
  })

  describe('pickDirectory', () => {
    it('requests readwrite access and returns the handle', async () => {
      const handle = { name: 'shop' } as unknown as FileSystemDirectoryHandle
      const picker = vi.fn(async () => handle)
      window.showDirectoryPicker = picker

      await expect(pickDirectory()).resolves.toBe(handle)
      expect(picker).toHaveBeenCalledWith({ mode: 'readwrite' })
    })

    it('rejects rather than throwing synchronously when the API is absent', async () => {
      await expect(pickDirectory()).rejects.toThrow(
        'showDirectoryPicker is unavailable'
      )
    })
  })
})
