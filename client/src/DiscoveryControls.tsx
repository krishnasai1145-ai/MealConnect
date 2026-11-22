import { SORT_LABELS } from './discovery';
import type { RadiusKm, SortKey } from './discovery';

interface DiscoveryControlsProps {
  query: string;
  onQuery: (q: string) => void;
  radius: RadiusKm;
  onRadius: (r: RadiusKm) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  locationLabel: string;
  locating: boolean;
  onLocate: () => void;
  locateError?: string | null;
  resultCount: number;
}

const RADIUS_OPTIONS: Array<{ value: RadiusKm; label: string }> = [
  { value: null, label: 'Any distance' },
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
];

const SORT_OPTIONS: SortKey[] = ['nearest', 'urgent', 'quantity'];

export default function DiscoveryControls({
  query,
  onQuery,
  radius,
  onRadius,
  sort,
  onSort,
  locationLabel,
  locating,
  onLocate,
  locateError,
  resultCount,
}: DiscoveryControlsProps) {
  return (
    <>
      <label>
        <div className="discover-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            className="discover-search"
            placeholder="Search food, category, allergen or storage"
            aria-label="Search food listings"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      </label>

      <div>
        <div className="discover-group-label">Distance</div>
        <div className="chip-row" role="radiogroup" aria-label="Distance">
          {RADIUS_OPTIONS.map((option) => {
            const selected = radius === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={selected}
                className={'chip' + (selected ? ' chip--active' : '')}
                onClick={() => onRadius(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="discover-group-label">Sort by</div>
        <div className="chip-row" role="radiogroup" aria-label="Sort by">
          {SORT_OPTIONS.map((key) => {
            const selected = sort === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                className={'chip' + (selected ? ' chip--active' : '')}
                onClick={() => onSort(key)}
              >
                {SORT_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="chip-row">
        <span>Searching near {locationLabel}</span>
        <button
          type="button"
          className="chip chip--action"
          onClick={onLocate}
          disabled={locating}
        >
          {locating ? 'Locating…' : 'Use my location'}
        </button>
      </div>
      {locateError && (
        <div className="error" role="alert">
          {locateError}
        </div>
      )}

      <div className="discover-count" aria-live="polite">
        <strong>{resultCount}</strong>{' '}
        {resultCount === 1 ? 'listing' : 'listings'}
      </div>
    </>
  );
}
