/**
 * App semver. Shop compatibility compares the major segment against the
 * `version` in each shop's `illo3d.metadata.json`; a mismatch opens the
 * migration wizard (see src/Migration).
 */
export const APP_VERSION = '3.1.0'

/** Parse the major segment of a semver-ish string. Returns null when unparseable. */
export function parseMajorVersion(version: string): number | null {
  const match = /^(\d+)\./.exec(version.trim())
  if (!match) return null
  return Number(match[1])
}
