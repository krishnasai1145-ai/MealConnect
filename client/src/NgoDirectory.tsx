import { useEffect, useState } from 'react';
import { listNgos } from './api';
import type { NgoProfile } from './api';
import NgoCard from './NgoCard';

export default function NgoDirectory() {
  const [ngos, setNgos] = useState<NgoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listNgos()
      .then((result) => {
        if (!cancelled) setNgos(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load NGOs.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="dashboard">
      <h2>NGO directory</h2>
      <p className="page-subtitle">Verified NGOs and their trust scores</p>

      {loading ? (
        <div className="ngo-grid" role="status" aria-label="Loading NGOs">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : ngos.length === 0 ? (
        <div className="empty-state">
          <p>No NGOs registered yet</p>
        </div>
      ) : (
        <div className="ngo-grid">
          {ngos.map((ngo) => (
            <NgoCard key={ngo.id} ngo={ngo} />
          ))}
        </div>
      )}
    </section>
  );
}
