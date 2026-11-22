import { useEffect, useMemo, useState } from 'react';
import { Clock, Filter, Hand, Inbox, Scale, Store } from 'lucide-react';
import { claimFoodListing, listAvailableFood, updateFoodStatus } from './api';
import type { FoodListing, FoodStatus } from './api';
import CountdownBadge from './CountdownBadge';
import DiscoveryControls from './DiscoveryControls';
import { applyDiscovery, DEFAULT_REFERENCE } from './discovery';
import type { RadiusKm, SortKey } from './discovery';
import { remainingMs, sortByUrgency, urgencyOf } from './expiry';
import StatusTracker from './StatusTracker';

interface NgoDashboardProps {
  token?: string;
}

const CATEGORIES = ['Cooked meal', 'Bakery', 'Fresh produce', 'Dairy', 'Packaged', 'Other'];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

const DELIVERY_PARTNER_NAMES = ["Sai", "Krishna", "Arjun", "Ananya", "Rahul", "Priya", "Vikram", "Meera"];
const DELIVERY_VEHICLES = ["Bike", "Scooter", "Bicycle"];

function pickDeliveryPartner(): { name: string; vehicle: string } {
  return {
    name: DELIVERY_PARTNER_NAMES[Math.floor(Math.random() * DELIVERY_PARTNER_NAMES.length)],
    vehicle: DELIVERY_VEHICLES[Math.floor(Math.random() * DELIVERY_VEHICLES.length)],
  };
}

export default function NgoDashboard({ token }: NgoDashboardProps) {
  const [category, setCategory] = useState('');
  const [minQuantityInput, setMinQuantityInput] = useState('');
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState<RadiusKm>(null);
  const [sort, setSort] = useState<SortKey>('nearest');
  const [from, setFrom] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_REFERENCE.latitude,
    longitude: DEFAULT_REFERENCE.longitude,
  });
  const [locationLabel, setLocationLabel] = useState<string>(DEFAULT_REFERENCE.label);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Record<string, { name: string; vehicle: string }>>({});
  const sorted = useMemo(() => sortByUrgency(listings, new Date()), [listings]);
  const visible = useMemo(
    () => applyDiscovery(sorted, { from, radius, sort, query, now: new Date() }),
    [sorted, from, radius, sort, query],
  );

  const trimmedMin = minQuantityInput.trim();
  const parsedMin = trimmedMin === '' ? undefined : Number(trimmedMin);
  const minQuantityValid = parsedMin === undefined || (Number.isFinite(parsedMin) && parsedMin > 0);
  const minQuantity = minQuantityValid ? parsedMin : undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listAvailableFood(token, {
      category: category || undefined,
      minQuantity,
    })
      .then((result) => {
        if (!cancelled) setListings(result.listings);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorMessage(err, 'Could not load available food.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, category, minQuantity, reloadKey]);

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocateError('Location is not available in this browser');
      return;
    }
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFrom({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationLabel('your location');
        setLocating(false);
      },
      () => {
        setLocateError('Could not read your location. Using Bengaluru centre.');
        setFrom({ latitude: DEFAULT_REFERENCE.latitude, longitude: DEFAULT_REFERENCE.longitude });
        setLocationLabel(DEFAULT_REFERENCE.label);
        setLocating(false);
      },
    );
  }

  async function handleClaim(listing: FoodListing) {
  setClaimError(null);
  setSuccessMessage(null);
  setClaimingId(listing.id);

  try {
    await claimFoodListing(token, listing.id);

setListings((prev: FoodListing[]): FoodListing[] =>
  prev.map((item) =>
    item.id === listing.id
      ? {
          ...item,
          status: 'Claimed' as const,
        }
      : item
  )
);
    setPartners(prev => ({ ...prev, [listing.id]: pickDeliveryPartner() }));

    setSuccessMessage(`${listing.foodName} claimed.`);
  } catch (err) {
    setClaimError(errorMessage(err, "Could not claim this listing."));
  } finally {
    setClaimingId(null);
  }
}

  async function handleAdvance(listing: FoodListing, status: FoodStatus) {
    setClaimError(null);
    setSuccessMessage(null);
    setStatusBusyId(listing.id);
    try {
      const updated = await updateFoodStatus(token, listing.id, status);
      setListings((prev) => prev.map((item) => (item.id === listing.id ? updated : item)));
    } catch (err) {
      setClaimError(errorMessage(err, 'Could not update the status.'));
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <section className="dashboard">
      <div className="discover glass-card">
        <DiscoveryControls
          query={query}
          onQuery={setQuery}
          radius={radius}
          onRadius={setRadius}
          sort={sort}
          onSort={setSort}
          locationLabel={locationLabel}
          locating={locating}
          onLocate={handleLocate}
          locateError={locateError}
          resultCount={visible.length}
        />
      </div>

      <div className="filters glass-card">
        <div className="card-heading">
          <Filter size={18} strokeWidth={2} aria-hidden="true" />
          <h2>Filters</h2>
        </div>

        <div className="filters-fields">
          <div className="field">
            <label htmlFor="ngo-category">Food category</label>
            <select
              id="ngo-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="ngo-min-quantity">Minimum quantity</label>
            <input
              id="ngo-min-quantity"
              type="number"
              min="1"
              step="any"
              value={minQuantityInput}
              aria-invalid={!minQuantityValid}
              onChange={(e) => setMinQuantityInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!minQuantityValid && (
        <p className="error" role="alert">
          Minimum quantity must be greater than 0. The quantity filter is not applied.
        </p>
      )}

      {successMessage && (
        <p className="success" role="status">
          {successMessage}
        </p>
      )}

      {claimError && (
        <p className="error" role="alert">
          {claimError}
        </p>
      )}

      {loading ? (
        <div className="listing-grid" role="status" aria-label="Loading available food">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <Inbox size={18} strokeWidth={2} aria-hidden="true" />
          <p>No available food matches these filters</p>
        </div>
      ) : (
        <div className="listing-grid">
          {visible.map((listing) => {
            const claiming = claimingId === listing.id;
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

                {partners[listing.id] && (
                  <div className="partner-assigned" role="status">
                    <p>{`Order assigned to delivery partner ${partners[listing.id].name}`}</p>
                    <p>{`${partners[listing.id].vehicle === 'Bicycle' ? '🚲' : '🛵'} Vehicle: ${partners[listing.id].vehicle}`}</p>
                  </div>
                )}

                {isOpen && <CountdownBadge pickupBefore={listing.pickupBefore} />}

                <ul className="listing-meta">
                  <li title={listing.donorId}>
                    <Store size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{`${listing.donorId.slice(0, 8)}…`}</span>
                  </li>
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

                <div className="discover-stats">
                  <div className="discover-stat">
                    <span className="discover-label">Distance</span>
                    <span className="discover-value">
                      {listing.distanceKm === null
                        ? 'Location unknown'
                        : `${listing.distanceKm.toFixed(1)} km`}
                    </span>
                  </div>
                  <div className="discover-stat">
                    <span className="discover-label">Pickup deadline</span>
                    <span className="discover-value">
                      {new Date(listing.pickupBefore).toLocaleString()}
                    </span>
                  </div>
                  <div className="discover-stat">
                    <span className="discover-label">Quantity available</span>
                    <span className="discover-value">{`${listing.quantity} ${listing.unit}`}</span>
                  </div>
                </div>

                <div className="listing-actions">
                  {listing.status === 'Posted' && (
                    <button
                      type="button"
                      className="small primary claim-button"
                      onClick={() => void handleClaim(listing)}
                      disabled={claimingId !== null}
                    >
                      <Hand size={18} strokeWidth={2} aria-hidden="true" />
                      <span>{claiming ? 'Claiming…' : 'Claim food'}</span>
                    </button>
                  )}
                  {listing.status === 'Claimed' && (
                    <button
                      type="button"
                      className="small primary"
                      onClick={() => void handleAdvance(listing, 'Collected')}
                      disabled={statusBusyId !== null}
                    >
                      <span>{statusBusyId === listing.id ? 'Updating…' : 'Mark collected'}</span>
                    </button>
                  )}
                  {listing.status === 'Collected' && (
                    <button
                      type="button"
                      className="small primary"
                      onClick={() => void handleAdvance(listing, 'Delivered')}
                      disabled={statusBusyId !== null}
                    >
                      <span>{statusBusyId === listing.id ? 'Updating…' : 'Mark delivered'}</span>
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
