import type { Badge } from './api';

interface BadgeChipProps {
  badge: Badge;
}

export default function BadgeChip({ badge }: BadgeChipProps) {
  if (badge.tier === 'none') {
    return <span className="badge-chip badge-chip--none">No badge yet</span>;
  }
  return (
    <span className={`badge-chip badge-chip--${badge.tier}`}>
      <span aria-hidden="true">{badge.emoji}</span>
      {badge.label}
    </span>
  );
}
