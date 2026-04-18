import { describe, it, expect, beforeEach } from 'vitest'
import { useBackendStore } from './backendStore'

describe('backendStore', () => {
  beforeEach(() => {
    useBackendStore.getState().reset()
  })

  it('reset clears backend and directory handle', () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    useBackendStore.getState().reset()
    const s = useBackendStore.getState()
    expect(s.backend).toBeNull()
    expect(s.localDirectoryHandle).toBeNull()
  })

  it('clearBackend matches reset', () => {
    useBackendStore.setState({ backend: 'local-csv', localDirectoryHandle: null })
    useBackendStore.getState().clearBackend()
    expect(useBackendStore.getState().backend).toBeNull()
    expect(useBackendStore.getState().localDirectoryHandle).toBeNull()
  })
})
