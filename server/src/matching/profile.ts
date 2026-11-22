// NGO profile shaping: pure functions. No I/O and no clock access.
import { mealsFromKg, trustScore, type NgoStats } from "./trust.js";

export type NgoProfile = {
  id: string;
  name: string;
  verified: boolean;
  verificationStatus: "verified" | "pending";
  totalDonationsReceived: number;
  totalMealsDistributed: number;
  successfulDeliveries: number;
  timelyPickups: number;
  proofUploads: number;
  trustScore: number;
};

// An NGO as stored (sample data or ngo_profiles row): what matching needs plus the stats behind the trust score.
export type NgoRecord = {
  id: string;
  name: string;
  verified: boolean;
  latitude: number;
  longitude: number;
  needKg: number;
  stats: NgoStats;
};

export function buildProfile(ngo: { id: string; name: string; verified: boolean }, stats: NgoStats): NgoProfile {
  return {
    id: ngo.id,
    name: ngo.name,
    verified: ngo.verified,
    verificationStatus: ngo.verified ? "verified" : "pending",
    totalDonationsReceived: stats.claimed,
    totalMealsDistributed: mealsFromKg(stats.deliveredKg),
    successfulDeliveries: stats.delivered,
    timelyPickups: stats.timelyPickups,
    proofUploads: stats.proofUploads,
    trustScore: trustScore(stats),
  };
}
