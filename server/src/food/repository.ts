import type { SupabaseClient } from "@supabase/supabase-js";
import type { FoodListingInput, FoodListingPatch, FoodStatus } from "./schema.js";
import type { NgoRecord } from "../matching/profile.js";
import * as sample from "./sampleStore.js";

export type FoodListing = {
  id: string;
  donorId: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  preparedAt: string | null;
  pickupBefore: string;
  storageMethod: string;
  allergens: string[];
  notes: string | null;
  pickupAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  status: FoodStatus;
  claimedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type FoodRow = {
  id: string;
  donor_id: string;
  food_name: string;
  category: string;
  quantity: number | string;
  unit: string;
  prepared_at: string | null;
  pickup_before: string;
  storage_method: string;
  allergens: string[];
  notes: string | null;
  pickup_address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: FoodStatus;
  claimed_by: string | null;
  created_at: string;
  updated_at: string;
};

type NgoProfileRow = {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  need_kg: number | string;
  verified: boolean;
  claimed_count: number | string;
  delivered_count: number | string;
  timely_pickups: number | string;
  proof_uploads: number | string;
  delivered_kg: number | string;
};

const TABLE = "food_listings";
const NGO_PROFILES_TABLE = "ngo_profiles";
const NGO_PROFILE_COLUMNS =
  "id, name, latitude, longitude, need_kg, verified, claimed_count, delivered_count, timely_pickups, proof_uploads, delivered_kg";

// A null client means Supabase is not configured: every operation falls back to the in-memory sample store.

function toListing(row: FoodRow): FoodListing {
  return {
    id: row.id,
    donorId: row.donor_id,
    foodName: row.food_name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    preparedAt: row.prepared_at,
    pickupBefore: row.pickup_before,
    storageMethod: row.storage_method,
    allergens: row.allergens ?? [],
    notes: row.notes,
    pickupAddress: row.pickup_address ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    status: row.status,
    claimedBy: row.claimed_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertListing(
  client: SupabaseClient | null,
  donorId: string,
  input: FoodListingInput,
): Promise<FoodListing> {
  if (!client) {
    return sample.insertSample(donorId, input);
  }

  const { data, error } = await client
    .from(TABLE)
    .insert({
      donor_id: donorId,
      food_name: input.foodName,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      prepared_at: input.preparedAt ?? null,
      pickup_before: input.pickupBefore,
      storage_method: input.storageMethod,
      allergens: input.allergens,
      notes: input.notes ?? null,
      pickup_address: input.pickupAddress,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      status: "Posted",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toListing(data as FoodRow);
}

export async function listListings(
  client: SupabaseClient | null,
  donorId: string,
  status?: FoodStatus,
): Promise<FoodListing[]> {
  if (!client) {
    return sample.listSample(donorId, status);
  }

  let query = client
    .from(TABLE)
    .select("*")
    .eq("donor_id", donorId)
    .order("pickup_before", { ascending: true });
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data as FoodRow[]).map(toListing);
}

export async function getListing(client: SupabaseClient | null, id: string): Promise<FoodListing | null> {
  if (!client) {
    return sample.getSample(id);
  }

  const { data, error } = await client.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toListing(data as FoodRow) : null;
}

export async function updateListing(
  client: SupabaseClient | null,
  id: string,
  patch: FoodListingPatch,
): Promise<FoodListing | null> {
  if (!client) {
    return sample.updateSample(id, patch);
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.foodName !== undefined) row.food_name = patch.foodName;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.quantity !== undefined) row.quantity = patch.quantity;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.preparedAt !== undefined) row.prepared_at = patch.preparedAt;
  if (patch.pickupBefore !== undefined) row.pickup_before = patch.pickupBefore;
  if (patch.storageMethod !== undefined) row.storage_method = patch.storageMethod;
  if (patch.allergens !== undefined) row.allergens = patch.allergens;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.pickupAddress !== undefined) row.pickup_address = patch.pickupAddress;
  if (patch.latitude !== undefined) row.latitude = patch.latitude;
  if (patch.longitude !== undefined) row.longitude = patch.longitude;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.status === "Posted") row.claimed_by = null;

  const { data, error } = await client
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? toListing(data as FoodRow) : null;
}

export async function deleteListing(client: SupabaseClient | null, id: string): Promise<FoodListing | null> {
  if (!client) {
    return sample.deleteSample(id);
  }

  const { data, error } = await client.from(TABLE).delete().eq("id", id).select("*").maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toListing(data as FoodRow) : null;
}

export type AvailableFilters = { category?: string; minQuantity?: number };

export async function listAvailableListings(
  client: SupabaseClient | null,
  filters: AvailableFilters,
): Promise<FoodListing[]> {
  if (!client) {
    return sample.listAvailableSample(filters);
  }

  let query = client
    .from(TABLE)
    .select("*")
    .eq("status", "Posted")
    .order("pickup_before", { ascending: true });
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.minQuantity !== undefined) {
    query = query.gte("quantity", filters.minQuantity);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data as FoodRow[]).map(toListing);
}

// Claiming goes through the claim_food_listing() RPC (003), because RLS only lets donors update their own rows.
// The RPC takes the claimant from auth.uid(), so the caller must pass a per-user client. Sample mode uses sampleStore.claimSample directly.
export async function claimListing(client: SupabaseClient, id: string): Promise<FoodListing | null> {
  const { data, error } = await client.rpc("claim_food_listing", { p_id: id });
  if (error) {
    throw new Error(error.message);
  }
  const row = data as FoodRow | null;
  if (!row || !row.id) {
    return null;
  }
  return toListing(row);
}

export type AdvanceResult =
  | { kind: "ok"; listing: FoodListing }
  | { kind: "illegal" }
  | { kind: "not_found" };

// Moves a claimed listing to the next status through advance_food_status() (007). The RPC checks the claimant and the allowed transition.
export async function advanceStatus(client: SupabaseClient, id: string, to: FoodStatus): Promise<AdvanceResult> {
  const { data, error } = await client.rpc("advance_food_status", { p_id: id, p_to: to });
  if (error) {
    if (error.message.includes("Illegal status transition")) {
      return { kind: "illegal" };
    }
    if (error.message.includes("not found")) {
      return { kind: "not_found" };
    }
    throw new Error(error.message);
  }
  const row = data as FoodRow | null;
  if (!row || !row.id) {
    return { kind: "not_found" };
  }
  return { kind: "ok", listing: toListing(row) };
}


// Reads NGO profiles through the per-user client so RLS applies (ngo_profiles_select_authenticated in 004).
export async function listNgoProfiles(client: SupabaseClient): Promise<NgoRecord[]> {
  const { data, error } = await client.from(NGO_PROFILES_TABLE).select(NGO_PROFILE_COLUMNS);
  if (error) {
    throw new Error(error.message);
  }
  return (data as NgoProfileRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    verified: row.verified,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    needKg: Number(row.need_kg),
    stats: {
      claimed: Number(row.claimed_count),
      delivered: Number(row.delivered_count),
      timelyPickups: Number(row.timely_pickups),
      proofUploads: Number(row.proof_uploads),
      deliveredKg: Number(row.delivered_kg),
    },
  }));
}
