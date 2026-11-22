import { randomUUID } from "node:crypto";
import type { FoodListing } from "./repository.js";
import type { FoodListingInput, FoodListingPatch } from "./schema.js";

// Fallback only: used when SUPABASE_URL / SUPABASE_ANON_KEY are unset. Never used when Supabase is configured. In-memory, resets on restart.

export const SAMPLE_DONOR_ID = "00000000-0000-0000-0000-000000000001";

const HOUR_MS = 60 * 60 * 1000;

function seed(): FoodListing[] {
  const now = Date.now();
  const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const created = at(0);

  return [
    {
      id: randomUUID(),
      donorId: SAMPLE_DONOR_ID,
      foodName: "Vegetable Lasagna",
      category: "Prepared meals",
      quantity: 8,
      unit: "portions",
      preparedAt: at(-2 * HOUR_MS),
      pickupBefore: at(6 * HOUR_MS),
      storageMethod: "Refrigerate at 4°C and consume within 24 hours",
      allergens: ["gluten", "dairy"],
      notes: "Contains baked cheese topping",
      latitude: 12.9716,
      longitude: 77.5946,
      pickupAddress: "12 MG Road, Bengaluru",
      status: "Posted",
      claimedBy: null,
      createdAt: created,
      updatedAt: created,
    },
    {
      id: randomUUID(),
      donorId: SAMPLE_DONOR_ID,
      foodName: "Whole Wheat Bread Loaves",
      category: "Bakery",
      quantity: 12,
      unit: "loaves",
      preparedAt: at(-5 * HOUR_MS),
      pickupBefore: at(10 * HOUR_MS),
      storageMethod: "Keep in a sealed bag at room temperature",
      allergens: ["gluten"],
      notes: null,
      latitude: 12.9352,
      longitude: 77.6245,
      pickupAddress: "45 Koramangala 5th Block, Bengaluru",
      status: "Claimed",
      claimedBy: null,
      createdAt: created,
      updatedAt: created,
    },
    {
      id: randomUUID(),
      donorId: SAMPLE_DONOR_ID,
      foodName: "Fresh Fruit Salad Cups",
      category: "Fresh produce",
      quantity: 20,
      unit: "cups",
      preparedAt: at(-30 * HOUR_MS),
      pickupBefore: at(-20 * HOUR_MS),
      storageMethod: "Refrigerate and discard after 24 hours",
      allergens: [],
      notes: null,
      latitude: null,
      longitude: null,
      pickupAddress: "7 Indiranagar 100ft Road, Bengaluru",
      status: "Delivered",
      claimedBy: null,
      createdAt: created,
      updatedAt: created,
    },
  ];
}

let store: FoodListing[] = seed();

export function insertSample(donorId: string, input: FoodListingInput): FoodListing {
  const now = new Date().toISOString();
  const listing: FoodListing = {
    id: randomUUID(),
    donorId,
    foodName: input.foodName,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    preparedAt: input.preparedAt ?? null,
    pickupBefore: input.pickupBefore,
    storageMethod: input.storageMethod,
    allergens: input.allergens,
    notes: input.notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    pickupAddress: input.pickupAddress,
    status: "Posted",
    claimedBy: null,
    createdAt: now,
    updatedAt: now,
  };
  store.push(listing);
  return listing;
}

export function listSample(donorId: string, status?: FoodListing["status"]): FoodListing[] {
  return store
    .filter((l) => l.donorId === donorId && (status === undefined || l.status === status))
    .sort((a, b) => Date.parse(a.pickupBefore) - Date.parse(b.pickupBefore));
}

export function getSample(id: string): FoodListing | null {
  return store.find((l) => l.id === id) ?? null;
}

export function updateSample(id: string, patch: FoodListingPatch): FoodListing | null {
  const index = store.findIndex((l) => l.id === id);
  if (index === -1) {
    return null;
  }
  const current = store[index];
  const next: FoodListing = {
    ...current,
    foodName: patch.foodName ?? current.foodName,
    category: patch.category ?? current.category,
    quantity: patch.quantity ?? current.quantity,
    unit: patch.unit ?? current.unit,
    preparedAt: patch.preparedAt ?? current.preparedAt,
    pickupBefore: patch.pickupBefore ?? current.pickupBefore,
    storageMethod: patch.storageMethod ?? current.storageMethod,
    allergens: patch.allergens ?? current.allergens,
    notes: patch.notes ?? current.notes,
    latitude: patch.latitude ?? current.latitude,
    longitude: patch.longitude ?? current.longitude,
    status: patch.status ?? current.status,
    claimedBy: patch.status === "Posted" ? null : current.claimedBy,
    updatedAt: new Date().toISOString(),
  };
  store[index] = next;
  return next;
}

export function deleteSample(id: string): FoodListing | null {
  const index = store.findIndex((l) => l.id === id);
  if (index === -1) {
    return null;
  }
  const [removed] = store.splice(index, 1);
  return removed;
}

export function listAvailableSample(filters: { category?: string; minQuantity?: number }): FoodListing[] {
  return store
    .filter(
      (l) =>
        l.status === "Posted" &&
        (filters.category === undefined || l.category === filters.category) &&
        (filters.minQuantity === undefined || l.quantity >= filters.minQuantity),
    )
    .sort((a, b) => Date.parse(a.pickupBefore) - Date.parse(b.pickupBefore));
}

export type ClaimResult =
  | { kind: "notFound" }
  | { kind: "notAvailable" }
  | { kind: "ownListing" }
  | { kind: "ok"; listing: FoodListing };

export function claimSample(id: string, claimerId: string): ClaimResult {
  const index = store.findIndex((l) => l.id === id);
  if (index === -1) {
    return { kind: "notFound" };
  }
  const current = store[index];
  if (current.status !== "Posted") {
    return { kind: "notAvailable" };
  }
  if (current.donorId === claimerId) {
    return { kind: "ownListing" };
  }
  const next: FoodListing = {
    ...current,
    status: "Claimed",
    claimedBy: claimerId,
    updatedAt: new Date().toISOString(),
  };
  store[index] = next;
  return { kind: "ok", listing: next };
}

export const deliveryPartners = [
  {
    id: "DP001",
    name: "Ravi Kumar",
    phone: "9876543210",
    available: true,
  },
  {
    id: "DP002",
    name: "Suresh",
    phone: "9876543211",
    available: true,
  },
];
