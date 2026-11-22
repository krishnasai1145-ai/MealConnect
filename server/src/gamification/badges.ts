// Gamification badges: pure functions. No I/O and no clock access.

export type Badge = {
  tier: "none" | "food-saver" | "community-hero" | "hunger-warrior";
  label: string;
  emoji: string;
  threshold: number;
};

export type Achievement = {
  entityId: string;
  name: string;
  kind: "ngo" | "volunteer";
  meals: number;
  badge: Badge;
  nextBadge: Badge | null;
  // Integer 0-100 toward nextBadge; 100 when there is no next badge.
  progress: number;
};

// Ascending by threshold (meals).
export const BADGE_TIERS: readonly Badge[] = [
  { tier: "food-saver", label: "Food Saver", emoji: "🥉", threshold: 100 },
  { tier: "community-hero", label: "Community Hero", emoji: "🥈", threshold: 500 },
  { tier: "hunger-warrior", label: "Hunger Warrior", emoji: "🥇", threshold: 1000 },
];

const NO_BADGE: Badge = { tier: "none", label: "No badge yet", emoji: "", threshold: 0 };

// Highest tier whose threshold has been reached; NO_BADGE when none has.
export function badgeFor(meals: number): Badge {
  let earned = NO_BADGE;
  for (const badge of BADGE_TIERS) {
    if (badge.threshold <= meals) {
      earned = badge;
    }
  }
  return earned;
}

// Lowest tier not yet reached, or null when every tier is earned.
export function nextBadgeFor(meals: number): Badge | null {
  return BADGE_TIERS.find((badge) => badge.threshold > meals) ?? null;
}

export function progressTo(meals: number): number {
  const next = nextBadgeFor(meals);
  if (!next) {
    return 100;
  }
  const lower = badgeFor(meals).threshold;
  const upper = next.threshold;
  const percent = Math.floor((100 * (meals - lower)) / (upper - lower));
  return Math.min(100, Math.max(0, percent));
}

export function buildAchievement(entity: {
  id: string;
  name: string;
  kind: "ngo" | "volunteer";
  meals: number;
}): Achievement {
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
