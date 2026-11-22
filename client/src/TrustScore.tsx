interface TrustScoreProps {
  score: number;
}

function toneClass(score: number): string {
  if (score >= 80) return 'rating-bar-fill--high';
  if (score >= 60) return 'rating-bar-fill--mid';
  return 'rating-bar-fill--low';
}

export default function TrustScore({ score: rawScore }: TrustScoreProps) {
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  return (
    <div className="trust-score-block">
      <p className="trust-score">
        <span className="trust-score-label">Trust Score: </span>
        <strong>{`${score}/100`}</strong>
      </p>
      <div
        className="rating-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`Trust score ${score} out of 100`}
      >
        <div className={`rating-bar-fill ${toneClass(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
