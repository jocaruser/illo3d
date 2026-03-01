import { driveFetch } from './client'

export async function createFolder(
  name: string
): Promise<{ id: string; name: string }> {
  const response = await driveFetch('/files', {
    method: 'POST',
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ||
        `Failed to create folder: ${response.status}`
    )
  }

  const result = (await response.json()) as { id: string; name: string }
  return { id: result.id, name: result.name || name }
}
