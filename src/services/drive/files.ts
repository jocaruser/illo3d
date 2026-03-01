import { driveFetch } from './client'

export async function moveFileToFolder(
  fileId: string,
  folderId: string
): Promise<void> {
  const params = new URLSearchParams({
    addParents: folderId,
    removeParents: 'root',
  })
  const response = await driveFetch(`/files/${fileId}?${params}`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ||
        `Failed to move file: ${response.status}`
    )
  }
}
