import {
  findDataRowIndexById,
  removeDataRowAt,
} from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'

export async function deleteTagLink(
  spreadsheetId: string,
  linkId: string
): Promise<void> {
  void spreadsheetId
  patchWorkbookTab('tag_links', (m) => {
    const i = findDataRowIndexById(m, 'tag_links', linkId)
    if (i === -1) {
      throw new Error(`Tag link ${linkId} not found`)
    }
    return removeDataRowAt(m, i)
  })
}
