const PICKER_SCRIPT = 'https://apis.google.com/js/api.js'

interface PickerCallbackData {
  action?: string
  docs?: Array<{ id: string; name: string }>
}

export interface OpenFolderPickerOptions {
  /** Google Cloud project number (Picker `setAppId`). Optional but recommended for Drive picker. */
  appId?: string
}

type PickerApi = NonNullable<NonNullable<typeof window.google>['picker']>

function readPickerAction(data: unknown, pickerApi: PickerApi): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const rec = data as Record<string, unknown>
  const actionKey = pickerApi.Response?.ACTION ?? 'action'
  const v = rec[actionKey]
  return typeof v === 'string' ? v : undefined
}

function readPickerDocuments(
  data: unknown,
  pickerApi: PickerApi,
): Array<{ id?: string; name?: string }> {
  if (!data || typeof data !== 'object') return []
  const rec = data as Record<string, unknown>
  const docsKey = pickerApi.Response?.DOCUMENTS ?? 'docs'
  const v = rec[docsKey]
  if (!Array.isArray(v)) return []
  return v as Array<{ id?: string; name?: string }>
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existingScript) {
      const loaded = existingScript.dataset.loaded === 'true'
      if (loaded) {
        resolve()
        return
      }
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true }
      )
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export async function loadPickerApi(): Promise<void> {
  await loadScript(PICKER_SCRIPT)
  if (!window.gapi?.load) {
    throw new Error('Google Picker API is not available')
  }
  await new Promise<void>((resolve) => {
    window.gapi?.load('picker', () => {
      resolve()
    })
  })
  if (!window.google?.picker) {
    throw new Error('Google Picker SDK did not initialize')
  }
}

export function openFolderPicker(
  accessToken: string,
  apiKey: string,
  options: OpenFolderPickerOptions = {}
): Promise<{ id: string; name: string } | null> {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (result: { id: string; name: string } | null) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      reject(err)
    }
    try {
      const picker = window.google?.picker
      if (!picker) {
        finish(null)
        return
      }

      const DocsView = picker.DocsView
      const docsView = new DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setSelectFolderEnabled(true)

      interface PickerBuilderInstance {
        addView: (v: unknown) => PickerBuilderInstance
        setOAuthToken: (t: string) => PickerBuilderInstance
        setDeveloperKey: (k: string) => PickerBuilderInstance
        setAppId: (id: string) => PickerBuilderInstance
        setCallback: (cb: (d: PickerCallbackData) => void) => PickerBuilderInstance
        build: () => { setVisible: (v: boolean) => void }
      }
      const builder = new picker.PickerBuilder() as unknown as PickerBuilderInstance
      let chain: PickerBuilderInstance = builder
        .addView(docsView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
      const trimmedAppId = options.appId?.trim()
      if (trimmedAppId) {
        chain = chain.setAppId(trimmedAppId)
      }
      const pickerInstance = chain
        .setCallback((data: PickerCallbackData) => {
          const action = readPickerAction(data, picker)
          const docs = readPickerDocuments(data, picker)
          const picked = picker.Action?.PICKED ?? 'picked'
          const cancel = picker.Action?.CANCEL ?? 'cancel'
          const error = picker.Action?.ERROR ?? 'error'
          const isPicked = action === picked || action === 'picked'
          const isCancel = action === cancel || action === 'cancel'
          const isError = action === error || action === 'error'

          if (isPicked) {
            const first = docs[0]
            const id = first?.id
            if (id) {
              finish({ id, name: first?.name || id })
            } else {
              finish(null)
            }
            return
          }
          if (isCancel) {
            finish(null)
            return
          }
          if (isError) {
            console.error('Google Picker error response:', data)
            fail(new Error('Google Picker reported an error. Check the browser console for details.'))
            return
          }
        })
        .build()
      pickerInstance.setVisible(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Google Picker failed to open'
      fail(new Error(message))
    }
  })
}
