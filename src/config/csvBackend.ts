export function isCsvBackendEnabled(): boolean {
  return !!import.meta.env.DEV
}

/** Only allow alphanumeric, hyphen, underscore. Prevents path traversal when building fixture URLs. */
export function sanitizeFixtureFolderId(folderId: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(folderId) ? folderId : null
}
