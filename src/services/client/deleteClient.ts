import { archiveClient } from '@/services/lifecycle/lifecycle'

/** @deprecated Use archiveClient; kept for call-site compatibility. */
export async function deleteClient(
  spreadsheetId: string,
  clientId: string
): Promise<void> {
  void spreadsheetId
  archiveClient(clientId)
}
