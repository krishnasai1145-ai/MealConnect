import { useEffect, useState } from 'react';
import { getLeaderboard } from './api';
import type { LeaderboardEntry } from './api';
import BadgeChip from './BadgeChip';
import Celebration from './Celebration';

// Last-seen badge tier per entity, kept in memory for the lifetime of the page.
const lastSeenTiers = new Map<string, string>();
let hasPrimed = false;

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard()
      .then((result) => {
        if (cancelled) return;
        const newlyReached = hasPrimed
          ? result.filter(
              (entry) =>
                entry.badge.tier === 'hunger-warrior' &&
                lastSeenTiers.get(entry.entityId) !== 'hunger-warrior',
            )
          : [];
        for (const entry of result) {
          lastSeenTiers.set(entry.entityId, entry.badge.tier);
        }
        hasPrimed = true;
        setEntries(result);
        if (newlyReached.length > 0) {
          const names = newlyReached.map((entry) => entry.name).join(', ');
          setCelebration(`${names} reached Hunger Warrior`);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the leaderboard.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top3 = entries.slice(0, 3);

  return (
    <section className="dashboard">
      <h2>Leaderboard</h2>
      <p className="page-subtitle">NGOs and volunteers ranked by meals distributed</p>

      {loading ? (
        <div role="status" aria-label="Loading leaderboard">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <p>No achievements yet</p>
        </div>
      ) : (
        <>
          <div className="podium">
            {top3.map((entry) => (
              <div key={entry.entityId} className="glass-card">
                <strong>{entry.name}</strong>
                <BadgeChip badge={entry.badge} />
                <span>{entry.meals.toLocaleString()} meals</span>
              </div>
            ))}
          </div>

          <ol className="leaderboard">
            {entries.map((entry) => {
              const p = Math.min(100, Math.max(0, entry.progress));
              return (
                <li key={entry.entityId} className="leaderboard-row glass-card">
                  <span className="leaderboard-rank">{entry.rank}</span>
                  <div>
                    <strong>{entry.name}</strong>
                    <span className="leaderboard-kind">
                      {entry.kind === 'ngo' ? 'NGO' : 'Volunteer'}
                    </span>
                  </div>
                  <div>
                    <BadgeChip badge={entry.badge} />
                    <span> {entry.meals.toLocaleString()} meals</span>
                  </div>
                  <div
                    role="progressbar"
                    className="leaderboard-bar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={p}
                    aria-label={`${entry.name} progress to next badge: ${p}%`}
                  >
                    <div className="leaderboard-bar-fill" style={{ width: `${p}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <Celebration
        show={celebration !== null}
        message={celebration ?? ''}
        onDone={() => setCelebration(null)}
      />
    </section>
  );
}
