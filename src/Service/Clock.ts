/** Injectable time source so services stay deterministic under test. */
export interface Clock {
  now(): Date
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

/** ISO 8601 instant for `created_at`/audit timestamps. */
export function isoInstant(clock: Clock): string {
  return clock.now().toISOString()
}

/** `YYYY-MM-DD` day string for client `created_at` and transaction dates. */
export function isoDay(clock: Clock): string {
  return clock.now().toISOString().slice(0, 10)
}
