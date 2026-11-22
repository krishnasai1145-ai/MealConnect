const BASE = '/api';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
}

export type FoodStatus = 'Posted' | 'Claimed' | 'Collected' | 'Delivered';

export interface FoodListingInput {
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  preparedAt?: string;
  pickupBefore: string;
  storageMethod: string;
  allergens: string[];
  notes?: string;
  pickupAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface MatchBreakdown {
  distanceKm: number | null;
  distanceScore: number;
  quantityScore: number;
  urgencyScore: number;
}

export interface Match {
  rank: 1 | 2 | 3;
  ngoId: string;
  ngoName: string;
  score: number;
  breakdown: MatchBreakdown;
  verified: boolean;
  trustScore: number;
}

export interface NgoProfile {
  id: string;
  name: string;
  verified: boolean;
  verificationStatus: 'verified' | 'pending';
  totalDonationsReceived: number;
  totalMealsDistributed: number;
  successfulDeliveries: number;
  timelyPickups: number;
  proofUploads: number;
  trustScore: number;
}

export interface FoodListing {
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
  pickupAddress: string;
  latitude: number | null;
  longitude: number | null;
  status: FoodStatus;
  claimedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableFoodFilters {
  category?: string;
  minQuantity?: number;
}

interface RequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const serverMessage =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null;
    throw new Error(serverMessage ?? `Request failed with status ${res.status}`);
  }

  return data as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function createFoodListing(
  token: string | undefined,
  input: FoodListingInput,
): Promise<{ listing: FoodListing; matches: Match[] }> {
  return request<{ listing: FoodListing; matches: Match[] }>('/food', {
    method: 'POST',
    token,
    body: input,
  });
}

export function listFoodMatches(token: string | undefined, id: string): Promise<Match[]> {
  return request<{ matches: Match[] }>(`/food/${encodeURIComponent(id)}/matches`, {
    token,
  }).then((result) => result.matches);
}

export function listFoodListings(token: string | undefined): Promise<{ listings: FoodListing[] }> {
  return request<{ listings: FoodListing[] }>('/food', { token });
}

export function updateFoodListing(
  token: string | undefined,
  id: string,
  patch: Partial<FoodListingInput> & { status?: FoodStatus },
): Promise<{ listing: FoodListing }> {
  return request<{ listing: FoodListing }>(`/food/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: patch,
  });
}

export function deleteFoodListing(token: string | undefined, id: string): Promise<void> {
  return request<void>(`/food/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}

export function listAvailableFood(
  token: string | undefined,
  filters: AvailableFoodFilters,
): Promise<{ listings: FoodListing[] }> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.minQuantity !== undefined && Number.isFinite(filters.minQuantity)) {
    params.set('minQuantity', String(filters.minQuantity));
  }
  const query = params.toString();
  return request<{ listings: FoodListing[] }>(`/food/available${query ? `?${query}` : ''}`, {
    token,
  });
}

export function listNgos(): Promise<NgoProfile[]> {
  return request<{ ngos: NgoProfile[] }>('/ngos').then((result) => result.ngos);
}

export function claimFoodListing(token: string | undefined, id: string): Promise<FoodListing> {
  return request<{ listing: FoodListing }>(`/food/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
    token,
  }).then((result) => result.listing);
}

export function updateFoodStatus(
  token: string | undefined,
  id: string,
  status: FoodStatus,
): Promise<FoodListing> {
  return request<{ listing: FoodListing }>(`/food/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  }).then((result) => result.listing);
}

export interface Badge {
  tier: 'none' | 'food-saver' | 'community-hero' | 'hunger-warrior';
  label: string;
  emoji: string;
  threshold: number;
}

export interface Achievement {
  entityId: string;
  name: string;
  kind: 'ngo' | 'volunteer';
  meals: number;
  badge: Badge;
  nextBadge: Badge | null;
  progress: number;
}

export type LeaderboardEntry = Achievement & { rank: number };

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return request<{ leaderboard: LeaderboardEntry[] }>('/gamification/leaderboard').then(
    (result) => result.leaderboard,
  );
}

export function getAchievement(kind: 'ngo' | 'volunteer', id: string): Promise<Achievement> {
  return request<{ achievement: Achievement }>(
    `/gamification/${kind}/${encodeURIComponent(id)}`,
  ).then((result) => result.achievement);
}

