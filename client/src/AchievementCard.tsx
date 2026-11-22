import type { Achievement } from './api';
import BadgeChip from './BadgeChip';
import ProgressToNext from './ProgressToNext';

interface AchievementCardProps {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <article className="achievement-card glass-card">
      <h3>{achievement.name}</h3>
      <p className="hint">{achievement.kind === 'ngo' ? 'NGO' : 'Volunteer'}</p>
      <BadgeChip badge={achievement.badge} />
      <p>
        <strong>{achievement.meals.toLocaleString()}</strong> meals distributed
      </p>
      <ProgressToNext achievement={achievement} />
    </article>
  );
}
