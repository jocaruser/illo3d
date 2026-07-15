/** App semver. `validateShopFolder` compares major to `illo3d.metadata.json` version in each shop. */
export const APP_VERSION = '2.0.0'

export function parseMajorVersion(version: string): number {
  const match = version.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}
