import { randomUUID } from "node:crypto";
// Fallback only: used when SUPABASE_URL / SUPABASE_ANON_KEY are unset. Never used when Supabase is configured. In-memory, resets on restart.
export const SAMPLE_DONOR_ID = "00000000-0000-0000-0000-000000000001";
const HOUR_MS = 60 * 60 * 1000;
function seed() {
    const now = Date.now();
    const at = (offsetMs) => new Date(now + offsetMs).toISOString();
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
            status: "Available",
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
            status: "Completed",
            claimedBy: null,
            createdAt: created,
            updatedAt: created,
        },
    ];
}
let store = seed();
export function insertSample(donorId, input) {
    const now = new Date().toISOString();
    const listing = {
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
        status: "Available",
        claimedBy: null,
        createdAt: now,
        updatedAt: now,
    };
    store.push(listing);
    return listing;
}
export function listSample(donorId, status) {
    return store
        .filter((l) => l.donorId === donorId && (status === undefined || l.status === status))
        .sort((a, b) => Date.parse(a.pickupBefore) - Date.parse(b.pickupBefore));
}
export function getSample(id) {
    return store.find((l) => l.id === id) ?? null;
}
export function updateSample(id, patch) {
    const index = store.findIndex((l) => l.id === id);
    if (index === -1) {
        return null;
    }
    const current = store[index];
    const next = {
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
        updatedAt: new Date().toISOString(),
    };
    store[index] = next;
    return next;
}
export function deleteSample(id) {
    const index = store.findIndex((l) => l.id === id);
    if (index === -1) {
        return null;
    }
    const [removed] = store.splice(index, 1);
    return removed;
}
export function listAvailableSample(filters) {
    return store
        .filter((l) => l.status === "Available" &&
        (filters.category === undefined || l.category === filters.category) &&
        (filters.minQuantity === undefined || l.quantity >= filters.minQuantity))
        .sort((a, b) => Date.parse(a.pickupBefore) - Date.parse(b.pickupBefore));
}
export function claimSample(id, claimerId) {
    const index = store.findIndex((l) => l.id === id);
    if (index === -1) {
        return { kind: "notFound" };
    }
    const current = store[index];
    if (current.status !== "Available") {
        return { kind: "notAvailable" };
    }
    if (current.donorId === claimerId) {
        return { kind: "ownListing" };
    }
    const next = {
        ...current,
        status: "Claimed",
        claimedBy: claimerId,
        updatedAt: new Date().toISOString(),
    };
    store[index] = next;
    return { kind: "ok", listing: next };
}
