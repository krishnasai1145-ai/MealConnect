export type UrgencyLevel = 'fresh' | 'soon' | 'critical';

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  fresh: 'Fresh',
  soon: 'Expiring Soon',
  critical: 'Critical',
};

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** Milliseconds until pickupBefore. The caller supplies "now" so this stays pure. */
export function remainingMs(pickupBefore: string, now: Date): number {
  return Date.parse(pickupBefore) - now.getTime();
}

/** More than 4h = fresh; more than 1h up to and including 4h = soon; 1h or less = critical. */
export function urgencyOf(remaining: number): UrgencyLevel {
  if (remaining > 4 * HOUR_MS) return 'fresh';
  if (remaining > HOUR_MS) return 'soon';
  return 'critical';
}

export function formatCountdown(remaining: number): string {
  if (remaining <= 0) return 'Pickup window closed';
  const pad = (n: number) => String(n).padStart(2, '0');
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (remaining >= HOUR_MS) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (remaining >= MINUTE_MS) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

/** Returns a new array: Delivered items last, then earliest pickupBefore first. Ties keep input order. */
export function sortByUrgency<T extends { status: string; pickupBefore: string }>(items: T[], now: Date): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      completed: item.status === 'Delivered' ? 1 : 0,
      remaining: remainingMs(item.pickupBefore, now),
    }))
    .sort((a, b) => a.completed - b.completed || a.remaining - b.remaining || a.index - b.index)
    .map((entry) => entry.item);
}
