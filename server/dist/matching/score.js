// Smart food matching: pure scoring functions. No I/O and no clock access; callers pass `now`.
const WEIGHT_DISTANCE = 0.4;
const WEIGHT_QUANTITY = 0.3;
const WEIGHT_URGENCY = 0.3;
const MAX_DISTANCE_KM = 25;
const NEUTRAL_DISTANCE_SCORE = 0.5;
const URGENT_HOURS = 2;
const RELAXED_HOURS = 48;
const EARTH_RADIUS_KM = 6371;
const HOUR_MS = 60 * 60 * 1000;
const KG_FACTORS = {
    kg: 1,
    g: 0.001,
    litres: 1,
    portions: 0.5,
    items: 0.5,
};
function round2(value) {
    return Math.round(value * 100) / 100;
}
// Great-circle distance between two points in kilometres.
export function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
// Converts a listing quantity to kilograms. Units not in the table count as 1 kg per unit.
export function kgOf(quantity, unit) {
    const factor = KG_FACTORS[unit.trim().toLowerCase()] ?? 1;
    return quantity * factor;
}
function distanceFor(listing, ngo) {
    if (listing.latitude === null || listing.longitude === null) {
        return { distanceKm: null, distanceScore: NEUTRAL_DISTANCE_SCORE };
    }
    const km = haversineKm(listing.latitude, listing.longitude, ngo.latitude, ngo.longitude);
    return { distanceKm: km, distanceScore: Math.max(0, 1 - km / MAX_DISTANCE_KM) };
}
function quantityScoreFor(listing, ngo) {
    const listingKg = kgOf(listing.quantity, listing.unit);
    const larger = Math.max(listingKg, ngo.needKg);
    if (larger <= 0) {
        return 0;
    }
    return Math.min(listingKg, ngo.needKg) / larger;
}
function urgencyScoreFor(pickupBefore, now) {
    const hoursLeft = (Date.parse(pickupBefore) - now.getTime()) / HOUR_MS;
    if (hoursLeft <= URGENT_HOURS) {
        return 1;
    }
    if (hoursLeft >= RELAXED_HOURS) {
        return 0;
    }
    return (RELAXED_HOURS - hoursLeft) / (RELAXED_HOURS - URGENT_HOURS);
}
export function scoreNgo(listing, ngo, now) {
    const { distanceKm, distanceScore } = distanceFor(listing, ngo);
    const quantityScore = quantityScoreFor(listing, ngo);
    const urgencyScore = urgencyScoreFor(listing.pickupBefore, now);
    const weighted = WEIGHT_DISTANCE * distanceScore + WEIGHT_QUANTITY * quantityScore + WEIGHT_URGENCY * urgencyScore;
    return {
        ngoId: ngo.id,
        ngoName: ngo.name,
        score: Math.round(100 * weighted),
        breakdown: {
            distanceKm: distanceKm === null ? null : round2(distanceKm),
            distanceScore: round2(distanceScore),
            quantityScore: round2(quantityScore),
            urgencyScore: round2(urgencyScore),
        },
    };
}
// Scores every NGO, sorts by score descending then ngoId ascending, and returns the top `limit` with rank 1..limit.
export function rankNgos(listing, ngos, now, limit = 3) {
    return ngos
        .map((ngo) => ({
        ...scoreNgo(listing, ngo, now),
        verified: ngo.verified ?? false,
        trustScore: ngo.trustScore ?? 0,
    }))
        .sort((a, b) => b.score - a.score || (a.ngoId < b.ngoId ? -1 : a.ngoId > b.ngoId ? 1 : 0))
        .slice(0, limit)
        .map((match, index) => ({ ...match, rank: index + 1 }));
}
