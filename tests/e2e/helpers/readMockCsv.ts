import type { Page } from '@playwright/test'

/**
 * Read a CSV file's current contents from the in-memory mock directory handle
 * installed by `mockDirectoryPicker`. This is the real write surface of the
 * LocalCsv backend under e2e, so specs can assert what actually got persisted.
 */
export async function readMockCsv(page: Page, fileName: string): Promise<string> {
  return page.evaluate(async (name) => {
    const handle = (
      window as unknown as { __e2eMockDirectoryHandle: FileSystemDirectoryHandle }
    ).__e2eMockDirectoryHandle
    const fileHandle = await handle.getFileHandle(name)
    const file = await fileHandle.getFile()
    return file.text()
  }, fileName)
}
