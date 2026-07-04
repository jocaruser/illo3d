import { nextNumericId } from '@/utils/id'

export function generateAuditId(existingIds: string[]): string {
  return nextNumericId('AL', existingIds)
}
