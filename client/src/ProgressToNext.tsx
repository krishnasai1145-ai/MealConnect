import type { Achievement } from './api';

interface ProgressToNextProps {
  achievement: Achievement;
}

export default function ProgressToNext({ achievement }: ProgressToNextProps) {
  const p = Math.min(100, Math.max(0, achievement.progress));
  const next = achievement.nextBadge;
  return (
    <div className="milestone">
      {next === null ? (
        <span>Top tier reached</span>
      ) : (
        <span>
          Next: {next.label} at {next.threshold} meals
        </span>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p}
        aria-label={`Progress to next badge: ${p}%`}
      >
        <div className="milestone-fill" style={{ width: `${p}%` }} />
      </div>
      <span>{p}% there</span>
    </div>
  );
}
