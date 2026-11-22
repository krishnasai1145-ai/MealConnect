// Gamification badges: pure functions. No I/O and no clock access.
// Ascending by threshold (meals).
export const BADGE_TIERS = [
    { tier: "food-saver", label: "Food Saver", emoji: "🥉", threshold: 100 },
    { tier: "community-hero", label: "Community Hero", emoji: "🥈", threshold: 500 },
    { tier: "hunger-warrior", label: "Hunger Warrior", emoji: "🥇", threshold: 1000 },
];
const NO_BADGE = { tier: "none", label: "No badge yet", emoji: "", threshold: 0 };
// Highest tier whose threshold has been reached; NO_BADGE when none has.
export function badgeFor(meals) {
    let earned = NO_BADGE;
    for (const badge of BADGE_TIERS) {
        if (badge.threshold <= meals) {
            earned = badge;
        }
    }
    return earned;
}
// Lowest tier not yet reached, or null when every tier is earned.
export function nextBadgeFor(meals) {
    return BADGE_TIERS.find((badge) => badge.threshold > meals) ?? null;
}
export function progressTo(meals) {
    const next = nextBadgeFor(meals);
    if (!next) {
        return 100;
    }
    const lower = badgeFor(meals).threshold;
    const upper = next.threshold;
    const percent = Math.floor((100 * (meals - lower)) / (upper - lower));
    return Math.min(100, Math.max(0, percent));
}
export function buildAchievement(entity) {
    return {
        entityId: entity.id,
        name: entity.name,
        kind: entity.kind,
        meals: entity.meals,
        badge: badgeFor(entity.meals),
        nextBadge: nextBadgeFor(entity.meals),
        progress: progressTo(entity.meals),
    };
}
