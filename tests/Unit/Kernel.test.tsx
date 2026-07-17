import { render, screen, waitFor } from '@testing-library/react'
import { Kernel } from '@/Kernel'
import { restoreDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useBackendStore } from '@/Store/backendStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from './Store/memoryLocalStorage'

vi.mock('@/Repository/LocalCsv/persistDirectoryHandle', () => ({
  restoreDirectoryHandle: vi.fn(),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({
    children,
    clientId,
  }: {
    children: React.ReactNode
    clientId: string
  }) => (
    <div data-testid="google-provider" data-client-id={clientId}>
      {children}
    </div>
  ),
}))

vi.mock('@/Config/routes', () => ({
  routes: [{ path: '*', element: <p>routed content</p> }],
}))

const handle = { name: 'shop' } as FileSystemDirectoryHandle

describe('Kernel', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    vi.mocked(restoreDirectoryHandle).mockResolvedValue(null)
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
    window.location.hash = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mounts the router inside the providers', async () => {
    render(<Kernel />)

    expect(await screen.findByText('routed content')).toBeInTheDocument()
  })

  it('passes the build-time client id to the Google provider', () => {
    // Injected by Vite from repo secrets at build time — there is no server.
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-from-secrets')

    render(<Kernel />)

    expect(screen.getByTestId('google-provider')).toHaveAttribute(
      'data-client-id',
      'client-id-from-secrets'
    )
  })

  it('starts in the persisted language', async () => {
    localStorage.setItem(
      'user-preferences-storage',
      JSON.stringify({ state: { language: 'es' } })
    )

    render(<Kernel />)

    await waitFor(() =>
      expect(screen.getByText('routed content')).toBeInTheDocument()
    )
  })

  it('restores a persisted local directory handle', async () => {
    vi.mocked(restoreDirectoryHandle).mockResolvedValue(handle)

    render(<Kernel />)

    await waitFor(() =>
      expect(useBackendStore.getState().localDirectoryHandle).toBe(handle)
    )
  })

  it('leaves the backend alone when nothing was persisted', async () => {
    render(<Kernel />)

    await waitFor(() => expect(restoreDirectoryHandle).toHaveBeenCalled())
    expect(useBackendStore.getState().localDirectoryHandle).toBeNull()
  })

  it('survives an unreadable handle store', async () => {
    vi.mocked(restoreDirectoryHandle).mockRejectedValue(
      new Error('IndexedDB blocked')
    )

    render(<Kernel />)

    await waitFor(() => expect(restoreDirectoryHandle).toHaveBeenCalled())
    expect(await screen.findByText('routed content')).toBeInTheDocument()
  })

  it('guards unsaved work against a tab close', async () => {
    render(<Kernel />)
    await screen.findByText('routed content')

    useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)

    await waitFor(() => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })
  })
})
