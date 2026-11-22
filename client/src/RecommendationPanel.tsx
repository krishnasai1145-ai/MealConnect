import type { Match } from './api';
import VerificationBadge from './VerificationBadge';

interface RecommendationPanelProps {
  foodName: string;
  matches: Match[];
  loading?: boolean;
  onDismiss: () => void;
}

function formatDistance(distanceKm: number | null): string {
  return distanceKm === null ? 'Location unknown' : `${distanceKm.toFixed(1)} km`;
}

function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export default function RecommendationPanel({
  foodName,
  matches,
  loading = false,
  onDismiss,
}: RecommendationPanelProps) {
  return (
    <div className="match-panel glass-card">
      <div className="form-header">
        <div>
          <h2>Smart matches</h2>
          <p className="hint">
            {`Top NGOs for ${foodName}, ranked by distance, quantity fit and pickup urgency`}
          </p>
        </div>
        <button type="button" className="secondary small" onClick={onDismiss}>
          Dismiss
        </button>
      </div>

      {loading ? (
        <div className="match-grid" role="status" aria-label="Loading matches">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <p>No NGO matches yet. Add a location to rank nearby NGOs.</p>
        </div>
      ) : (
        <div className="match-grid">
          {matches.map((match) => (
            <div key={match.ngoId} className="match-card">
              <span className={`match-rank match-rank--${match.rank}`}>
                {`Recommended NGO #${match.rank}`}
              </span>
              <h3>{match.ngoName}</h3>
              <VerificationBadge verified={match.verified} />
              <div className="match-score">{`${match.score}% Match`}</div>
              <div className="match-bar">
                <div className="match-bar-fill" style={{ width: `${match.score}%` }} />
              </div>
              <ul className="match-metrics">
                <li>
                  <span>Distance</span>
                  <span>{formatDistance(match.breakdown.distanceKm)}</span>
                </li>
                <li>
                  <span>Need fit</span>
                  <span>{formatPercent(match.breakdown.quantityScore)}</span>
                </li>
                <li>
                  <span>Urgency</span>
                  <span>{formatPercent(match.breakdown.urgencyScore)}</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
