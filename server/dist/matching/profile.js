// NGO profile shaping: pure functions. No I/O and no clock access.
import { mealsFromKg, trustScore } from "./trust.js";
export function buildProfile(ngo, stats) {
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
