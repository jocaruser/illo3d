const PICKER_SCRIPT = 'https://apis.google.com/js/api.js'

interface PickerCallbackData {
  action?: string
  docs?: Array<{ id: string; name: string }>
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
  apiKey: string
): Promise<{ id: string; name: string } | null> {
  return new Promise((resolve) => {
    try {
      const picker = window.google?.picker
      if (!picker) {
        resolve(null)
        return
      }

      const DocsView = picker.DocsView
      const docsView = new DocsView()
        .setIncludeFolders(true) as { setSelectFolderEnabled: (v: boolean) => unknown }
      docsView.setSelectFolderEnabled(true)

      interface PickerBuilderInstance {
        addView: (v: unknown) => PickerBuilderInstance
        setOAuthToken: (t: string) => PickerBuilderInstance
        setDeveloperKey: (k: string) => PickerBuilderInstance
        setCallback: (cb: (d: PickerCallbackData) => void) => PickerBuilderInstance
        build: () => { setVisible: (v: boolean) => void }
      }
      const builder = new picker.PickerBuilder() as unknown as PickerBuilderInstance
      const pickerInstance = builder
        .addView(docsView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data: PickerCallbackData) => {
          if (data.action === picker.Action.PICKED && data.docs?.length) {
            const doc = data.docs[0]
            resolve({ id: doc.id, name: doc.name || doc.id })
          } else {
            resolve(null)
          }
        })
        .build()
      pickerInstance.setVisible(true)
    } catch {
      resolve(null)
    }
  })
}
