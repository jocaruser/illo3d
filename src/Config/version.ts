/**
 * App semver. Shop compatibility compares the major segment against the
 * `version` in each shop's `illo3d.metadata.json`; a mismatch opens the
 * migration wizard (see src/Migration).
 */
<<<<<<< HEAD
export const APP_VERSION = '3.0.3'
=======
export const APP_VERSION = '3.1.0'
>>>>>>> 300e591 ([9hqUdqVH5oRX] chore: bump APP_VERSION to 3.1.0 (minor: new e2e capability))

/** Parse the major segment of a semver-ish string. Returns null when unparseable. */
export function parseMajorVersion(version: string): number | null {
  const match = /^(\d+)\./.exec(version.trim())
  if (!match) return null
  return Number(match[1])
}
