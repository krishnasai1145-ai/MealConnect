import type { NgoRecord } from "./profile.js";

// Sample coordinates only: used in sample mode (no Supabase). All four sit within about 10 km of 12.97, 77.59.
export const SAMPLE_NGOS: readonly NgoRecord[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    name: "Helping Hands NGO",
    latitude: 12.9716,
    longitude: 77.5946,
    needKg: 40,
    verified: true,
    stats: { claimed: 42, delivered: 40, timelyPickups: 38, proofUploads: 36, deliveredKg: 980 },
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    name: "Community Kitchen",
    latitude: 12.9352,
    longitude: 77.6245,
    needKg: 25,
    verified: true,
    stats: { claimed: 30, delivered: 27, timelyPickups: 25, proofUploads: 24, deliveredKg: 640 },
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    name: "Food Rescue Team",
    latitude: 13.0105,
    longitude: 77.551,
    needKg: 60,
    verified: true,
    stats: { claimed: 18, delivered: 14, timelyPickups: 11, proofUploads: 9, deliveredKg: 310 },
  },
  {
    id: "00000000-0000-0000-0000-000000000104",
    name: "Hope Shelter",
    latitude: 12.955,
    longitude: 77.53,
    needKg: 15,
    verified: false,
    stats: { claimed: 4, delivered: 2, timelyPickups: 2, proofUploads: 0, deliveredKg: 40 },
  },
];
