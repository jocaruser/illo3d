export function nextNumericId(prefix: string, existingIds: string[]): string {
  const nums = existingIds
    .filter((id) => id != null && id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${max + 1}`
}
