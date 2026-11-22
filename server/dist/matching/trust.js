// NGO trust score: pure functions. No I/O and no clock access.
const WEIGHT_DELIVERY = 40;
const WEIGHT_TIMELY = 35;
const WEIGHT_PROOF = 25;
// 1 meal = 500 g.
const KG_PER_MEAL = 0.5;
// Fraction of `whole` that `part` covers, capped at 1. Zero when there is no whole to measure against.
function ratio(part, whole) {
    return whole > 0 ? Math.min(1, part / whole) : 0;
}
// Integer 0-100: successful deliveries (40), timely pickups (35) and proof uploads (25).
export function trustScore(stats) {
    const deliveryRate = ratio(stats.delivered, stats.claimed);
    const timelyRate = ratio(stats.timelyPickups, stats.delivered);
    const proofRate = ratio(stats.proofUploads, stats.delivered);
    return Math.round(WEIGHT_DELIVERY * deliveryRate + WEIGHT_TIMELY * timelyRate + WEIGHT_PROOF * proofRate);
}
// Whole meals that a quantity of food in kilograms provides (1 meal = 500 g).
export function mealsFromKg(kg) {
    return Math.floor(kg / KG_PER_MEAL);
}
