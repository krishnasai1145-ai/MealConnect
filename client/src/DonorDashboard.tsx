import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Hand,
  Inbox,
  Package,
  Pencil,
  Plus,
  Scale,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { deleteFoodListing, listFoodListings, listFoodMatches, updateFoodListing } from './api';
import type { FoodListing, FoodStatus, Match } from './api';
import DonorForm from './DonorForm';
import RecommendationPanel from './RecommendationPanel';
import CountdownBadge from './CountdownBadge';
import { remainingMs, sortByUrgency, urgencyOf } from './expiry';
import StatusTracker from './StatusTracker';
import { useCountUp } from './useCountUp';

interface DonorDashboardProps {
  token?: string;
}

type FormState = { mode: 'create' } | { mode: 'edit'; listing: FoodListing } | null;

interface MatchPanelState {
  foodName: string;
  matches: Match[];
  loading: boolean;
}

const NEXT_ACTIONS: Record<FoodStatus, { status: FoodStatus; label: string; icon: LucideIcon }[]> = {
  Posted: [{ status: 'Claimed', label: 'Mark claimed', icon: Hand }],
  Claimed: [],
  Collected: [],
  Delivered: [],
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: 'green' | 'orange' | 'blue' | 'purple';
}

function KpiCard({ label, value, icon: Icon, tone }: KpiCardProps) {
  const animated = useCountUp(value);
  return (
    <article className={`kpi-card card--${tone}`}>
      <span className="kpi-icon">
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
      </span>
      <p className="kpi-value">{Math.round(animated).toLocaleString()}</p>
      <p className="kpi-label">{label}</p>
    </article>
  );
}

export default function DonorDashboard({ token }: DonorDashboardProps) {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [panel, setPanel] = useState<MatchPanelState | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const sorted = useMemo(() => sortByUrgency(listings, new Date()), [listings]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listFoodListings(token);
      setListings(result.listings);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load your listings.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSaved(saved: FoodListing, matches: Match[]) {
    setListings((prev) => {
      const exists = prev.some((l) => l.id === saved.id);
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
    });
    if (form?.mode === 'create') {
      setPanel({ foodName: saved.foodName, matches, loading: false });
    }
    setForm(null);
  }

  async function handleMatches(listing: FoodListing) {
    setActionError(null);
    setMatchingId(listing.id);
    setPanel({ foodName: listing.foodName, matches: [], loading: true });
    try {
      const matches = await listFoodMatches(token, listing.id);
      setPanel({ foodName: listing.foodName, matches, loading: false });
    } catch (err) {
      setPanel(null);
      setActionError(errorMessage(err, 'Could not load matches.'));
    } finally {
      setMatchingId(null);
    }
  }

  async function handleDelete(listing: FoodListing) {
    if (!window.confirm(`Delete "${listing.foodName}"? This cannot be undone.`)) return;
    setActionError(null);
    setBusyId(listing.id);
    try {
      await deleteFoodListing(token, listing.id);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      setActionError(errorMessage(err, 'Could not delete the listing.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatus(listing: FoodListing, status: FoodStatus) {
    setActionError(null);
    setBusyId(listing.id);
    try {
      const result = await updateFoodListing(token, listing.id, { status });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? result.listing : l)));
    } catch (err) {
      setActionError(errorMessage(err, 'Could not update the status.'));
    } finally {
      setBusyId(null);
    }
  }

  const showStats = !loading && loadError === null;
  const countPosted = listings.filter((l) => l.status === 'Posted').length;
  const countClaimed = listings.filter((l) => l.status === 'Claimed').length;
  const countDelivered = listings.filter((l) => l.status === 'Delivered').length;

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <h2>My listings</h2>
        <button
          type="button"
          className="primary"
          onClick={() => setForm({ mode: 'create' })}
          disabled={form !== null}
        >
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          <span>Post food</span>
        </button>
      </div>

      <p className="donor-note">We never promise tax or legal benefits to donors.</p>


      {form && (
        <DonorForm
          key={form.mode === 'edit' ? form.listing.id : 'new'}
          token={token}
          listing={form.mode === 'edit' ? form.listing : undefined}
          onSaved={handleSaved}
          onCancel={() => setForm(null)}
        />
      )}

      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}

      {showStats && (
        <div className="kpi-row">
          <KpiCard label="Total listings" value={listings.length} icon={Package} tone="blue" />
          <KpiCard label="Posted" value={countPosted} icon={Inbox} tone="green" />
          <KpiCard label="Claimed" value={countClaimed} icon={Hand} tone="orange" />
          <KpiCard label="Delivered" value={countDelivered} icon={CheckCircle2} tone="purple" />
        </div>
      )}

      {panel && (
        <RecommendationPanel
          foodName={panel.foodName}
          matches={panel.matches}
          loading={panel.loading}
          onDismiss={() => setPanel(null)}
        />
      )}

      {loading ? (
        <div className="listing-grid" role="status" aria-label="Loading listings">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">
            {loadError}
          </p>
          <button type="button" className="secondary" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <Inbox size={18} strokeWidth={2} aria-hidden="true" />
          <p>No listings yet</p>
        </div>
      ) : (
        <div className="listing-grid">
          {sorted.map((listing) => {
            const busy = busyId === listing.id;
            const urgency = urgencyOf(remainingMs(listing.pickupBefore, new Date()));
            const isOpen = listing.status !== 'Delivered';
            const cardClass =
              isOpen && urgency === 'critical'
                ? ' listing-card--critical'
                : isOpen && urgency === 'soon'
                  ? ' listing-card--soon'
                  : '';
            return (
              <article key={listing.id} className={`listing-card glass-card${cardClass}`}>
                <header className="listing-card-header">
                  <div>
                    <h3 className="listing-title">{listing.foodName}</h3>
                    <p className="listing-category">{listing.category}</p>
                  </div>
                  <span className={`status-pill status-pill--${listing.status.toLowerCase()}`}>
                    {listing.status}
                  </span>
                </header>

                <StatusTracker status={listing.status} />

                {isOpen && <CountdownBadge pickupBefore={listing.pickupBefore} />}

                <ul className="listing-meta">
                  <li>
                    <Scale size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{`${listing.quantity} ${listing.unit}`}</span>
                  </li>
                  <li>
                    <Clock size={18} strokeWidth={2} aria-hidden="true" />
                    <span>
                      {`Prepared ${listing.preparedAt ? new Date(listing.preparedAt).toLocaleString() : 'Not recorded'}`}
                    </span>
                  </li>
                  <li>
                    <Clock size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{`Pickup before ${new Date(listing.pickupBefore).toLocaleString()}`}</span>
                  </li>
                </ul>

                <div className="listing-actions">
                  <button
                    type="button"
                    className="small secondary"
                    onClick={() => setForm({ mode: 'edit', listing })}
                    disabled={busy || form !== null}
                  >
                    <Pencil size={18} strokeWidth={2} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="small secondary"
                    onClick={() => void handleMatches(listing)}
                    disabled={busy || matchingId === listing.id}
                  >
                    <span>{matchingId === listing.id ? 'Matching…' : 'Matches'}</span>
                  </button>
                  {NEXT_ACTIONS[listing.status].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.status}
                        type="button"
                        className="small secondary"
                        onClick={() => void handleStatus(listing, action.status)}
                        disabled={busy}
                      >
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                  {listing.status === 'Posted' && (
                    <button
                      type="button"
                      className="small danger"
                      onClick={() => void handleDelete(listing)}
                      disabled={busy}
                    >
                      <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
