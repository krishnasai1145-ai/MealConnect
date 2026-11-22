/** Pure helpers for nearby discovery: distance, search, radius filter and sorting. No clock reads here. */

export const DEFAULT_REFERENCE = { latitude: 12.9716, longitude: 77.5946, label: 'Bengaluru centre' } as const;

/** null means any distance. */
export type RadiusKm = 2 | 5 | 10 | null;

export type SortKey = 'nearest' | 'urgent' | 'quantity';

export const SORT_LABELS: Record<SortKey, string> = {
  nearest: 'Nearest first',
  urgent: 'Most urgent',
  quantity: 'Largest quantity',
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in kilometres. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Distance from a reference point to a listing, or null when the listing has no coordinates. */
export function distanceKm(
  listing: { latitude: number | null; longitude: number | null },
  from: { latitude: number; longitude: number },
): number | null {
  if (listing.latitude === null || listing.longitude === null) return null;
  return haversineKm(from.latitude, from.longitude, listing.latitude, listing.longitude);
}

/** Converts a listed quantity to an approximate weight in kilograms, for sorting. */
export function quantityKg(quantity: number, unit: string): number {
  switch (unit.trim().toLowerCase()) {
    case 'kg':
      return quantity * 1;
    case 'g':
      return quantity * 0.001;
    case 'litres':
    case 'liters':
      return quantity * 1;
    case 'portions':
    case 'items':
      return quantity * 0.5;
    default:
      return quantity * 0.5;
  }
}

/** Blank query matches everything. Otherwise a case-insensitive substring match on name, category, storage or any allergen. */
export function matchesSearch(
  listing: { foodName: string; category: string; storageMethod: string; allergens: string[] },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  const fields = [listing.foodName, listing.category, listing.storageMethod, ...listing.allergens];
  return fields.some((field) => field.toLowerCase().includes(needle));
}

function compareDistance(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

export function applyDiscovery<
  T extends {
    latitude: number | null;
    longitude: number | null;
    quantity: number;
    unit: string;
    pickupBefore: string;
    foodName: string;
    category: string;
    storageMethod: string;
    allergens: string[];
  },
>(
  items: T[],
  opts: {
    from: { latitude: number; longitude: number };
    radius: RadiusKm;
    sort: SortKey;
    query: string;
    now: Date;
  },
): Array<T & { distanceKm: number | null }> {
  const { from, radius, sort, query, now } = opts;
  const nowMs = now.getTime();

  const enriched = items.map((item) => ({ ...item, distanceKm: distanceKm(item, from) }));

  const visible = enriched.filter((item) => {
    if (!matchesSearch(item, query)) return false;
    if (radius === null) return true;
    return item.distanceKm !== null && item.distanceKm <= radius;
  });

  const remainingOf = (item: { pickupBefore: string }) => Date.parse(item.pickupBefore) - nowMs;

  visible.sort((a, b) => {
    if (sort === 'urgent') {
      return remainingOf(a) - remainingOf(b) || compareDistance(a.distanceKm, b.distanceKm);
    }
    if (sort === 'quantity') {
      return (
        quantityKg(b.quantity, b.unit) - quantityKg(a.quantity, a.unit) ||
        compareDistance(a.distanceKm, b.distanceKm)
      );
    }
    return (
      compareDistance(a.distanceKm, b.distanceKm) ||
      Date.parse(a.pickupBefore) - Date.parse(b.pickupBefore)
    );
  });

  return visible;
}
