import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { createFoodListing, updateFoodListing } from './api';
import type { FoodListing, FoodListingInput, Match } from './api';
import { NOTES_MAX_LENGTH, STORAGE_MAX_LENGTH, validateFoodListing } from './validation';
import type { FoodFormValues } from './validation';

const CATEGORIES = ['Cooked meal', 'Bakery', 'Fresh produce', 'Dairy', 'Packaged', 'Other'];
const UNITS = ['portions', 'kg', 'g', 'litres', 'items'];
const ALLERGENS = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Fish', 'Shellfish', 'Sesame'];

const EMPTY_VALUES: FoodFormValues = {
  foodName: '',
  category: '',
  quantity: '',
  unit: '',
  preparedAt: '',
  pickupBefore: '',
  pickupAddress: '',
  storageMethod: '',
  allergens: [],
  notes: '',
  latitude: '',
  longitude: '',
};

/** Converts an ISO timestamp into the local "YYYY-MM-DDTHH:mm" form used by datetime-local inputs. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function valuesFromListing(listing: FoodListing): FoodFormValues {
  return {
    foodName: listing.foodName,
    category: listing.category,
    quantity: String(listing.quantity),
    unit: listing.unit,
    preparedAt: toLocalInput(listing.preparedAt),
    pickupBefore: toLocalInput(listing.pickupBefore),
    pickupAddress: listing.pickupAddress,
    storageMethod: listing.storageMethod,
    allergens: [...listing.allergens],
    notes: listing.notes ?? '',
    latitude: listing.latitude === null ? '' : String(listing.latitude),
    longitude: listing.longitude === null ? '' : String(listing.longitude),
  };
}

interface DonorFormProps {
  token?: string;
  listing?: FoodListing;
  onSaved: (listing: FoodListing, matches: Match[]) => void;
  onCancel?: () => void;
}

export default function DonorForm({ token, listing, onSaved, onCancel }: DonorFormProps) {
  const isEdit = listing !== undefined;
  const [values, setValues] = useState<FoodFormValues>(() =>
    listing ? valuesFromListing(listing) : EMPTY_VALUES,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FoodFormValues>(key: K, value: FoodFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleAllergen(name: string) {
    const current = values.allergens;
    setField(
      'allergens',
      current.includes(name) ? current.filter((a) => a !== name) : [...current, name],
    );
  }

  function errorId(name: keyof FoodFormValues): string | undefined {
    return errors[name] ? `${name}-error` : undefined;
  }

  function fieldError(name: keyof FoodFormValues) {
    if (!errors[name]) return null;
    return (
      <span id={`${name}-error`} className="error">
        {errors[name]}
      </span>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const found: Record<string, string> = { ...validateFoodListing(values) };
    const latText = (values.latitude ?? '').trim();
    const lngText = (values.longitude ?? '').trim();
    if (latText && !lngText) {
      found.longitude = 'Enter both latitude and longitude, or leave both empty';
    } else if (!latText && lngText) {
      found.latitude = 'Enter both latitude and longitude, or leave both empty';
    }
    const pickupAddress = values.pickupAddress.trim();
    if (!pickupAddress) {
      found.pickupAddress = 'Pickup address is required';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const notes = values.notes.trim();
    const input: FoodListingInput = {
      foodName: values.foodName.trim(),
      category: values.category,
      quantity: Number(values.quantity),
      unit: values.unit,
      preparedAt: values.preparedAt ? new Date(values.preparedAt).toISOString() : undefined,
      pickupBefore: new Date(values.pickupBefore).toISOString(),
      pickupAddress,
      storageMethod: values.storageMethod.trim(),
      allergens: values.allergens,
      notes: notes ? notes : undefined,
    };
    if (latText && lngText) {
      const latitude = Number(latText);
      const longitude = Number(lngText);
      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        input.latitude = latitude;
        input.longitude = longitude;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const result = await updateFoodListing(token, listing.id, input);
        onSaved(result.listing, []);
      } else {
        const result = await createFoodListing(token, input);
        onSaved(result.listing, result.matches);
      }
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : isEdit
            ? 'Could not update the listing.'
            : 'Could not create the listing.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form glass-card">
      <div className="form-header">
        <span className="form-header-icon">
          {isEdit ? (
            <Pencil size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
          )}
        </span>
        <h3>{isEdit ? 'Edit listing' : 'Post food'}</h3>
      </div>

      <div className="field">
        <label htmlFor="foodName">Food Name</label>
        <input
          id="foodName"
          name="foodName"
          type="text"
          value={values.foodName}
          onChange={(e) => setField('foodName', e.target.value)}
          aria-invalid={!!errors.foodName}
          aria-describedby={errorId('foodName')}
        />
        {fieldError('foodName')}
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={values.category}
          onChange={(e) => setField('category', e.target.value)}
          aria-invalid={!!errors.category}
          aria-describedby={errorId('category')}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {fieldError('category')}
      </div>

      <div className="field">
        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          step="any"
          value={values.quantity}
          onChange={(e) => setField('quantity', e.target.value)}
          aria-invalid={!!errors.quantity}
          aria-describedby={errorId('quantity')}
        />
        {fieldError('quantity')}
      </div>

      <div className="field">
        <label htmlFor="unit">Unit</label>
        <select
          id="unit"
          name="unit"
          value={values.unit}
          onChange={(e) => setField('unit', e.target.value)}
          aria-invalid={!!errors.unit}
          aria-describedby={errorId('unit')}
        >
          <option value="">Select a unit</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {fieldError('unit')}
      </div>

      <div className="field">
        <label htmlFor="preparedAt">Prepared Time</label>
        <input
          id="preparedAt"
          name="preparedAt"
          type="datetime-local"
          value={values.preparedAt}
          onChange={(e) => setField('preparedAt', e.target.value)}
          aria-invalid={!!errors.preparedAt}
          aria-describedby={errorId('preparedAt')}
        />
        <span className="hint">Optional.</span>
        {fieldError('preparedAt')}
      </div>

      <div className="field">
        <label htmlFor="pickupBefore">Pickup Before Time</label>
        <input
          id="pickupBefore"
          name="pickupBefore"
          type="datetime-local"
          value={values.pickupBefore}
          onChange={(e) => setField('pickupBefore', e.target.value)}
          aria-invalid={!!errors.pickupBefore}
          aria-describedby={errorId('pickupBefore')}
        />
        {fieldError('pickupBefore')}
      </div>

      <div className="field">
        <label htmlFor="storageMethod">Storage Instructions</label>
        <textarea
          id="storageMethod"
          name="storageMethod"
          rows={3}
          maxLength={STORAGE_MAX_LENGTH}
          value={values.storageMethod}
          onChange={(e) => setField('storageMethod', e.target.value)}
          aria-invalid={!!errors.storageMethod}
          aria-describedby={errorId('storageMethod')}
        />
        <span className="hint">
          {values.storageMethod.length}/{STORAGE_MAX_LENGTH}
        </span>
        {fieldError('storageMethod')}
      </div>

      <fieldset className="field">
        <legend>Allergens</legend>
        <div className="checkbox-group">
          {ALLERGENS.map((a) => (
            <label key={a} className="checkbox">
              <input
                type="checkbox"
                name="allergens"
                value={a}
                checked={values.allergens.includes(a)}
                onChange={() => toggleAllergen(a)}
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="pickupAddress">Pickup Address</label>
        <input
          id="pickupAddress"
          name="pickupAddress"
          type="text"
          required
          maxLength={300}
          value={values.pickupAddress}
          onChange={(e) => setField('pickupAddress', e.target.value)}
          aria-invalid={!!errors.pickupAddress}
          aria-describedby={errorId('pickupAddress')}
        />
        {fieldError('pickupAddress')}
      </div>

      <div className="field">
        <label htmlFor="latitude">Latitude</label>
        <input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          placeholder="12.9716"
          value={values.latitude ?? ''}
          onChange={(e) => setField('latitude', e.target.value)}
          aria-invalid={!!errors.latitude}
          aria-describedby={errorId('latitude')}
        />
        <span className="hint">Helps rank nearby NGOs. Optional.</span>
        {fieldError('latitude')}
      </div>

      <div className="field">
        <label htmlFor="longitude">Longitude</label>
        <input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          placeholder="77.5946"
          value={values.longitude ?? ''}
          onChange={(e) => setField('longitude', e.target.value)}
          aria-invalid={!!errors.longitude}
          aria-describedby={errorId('longitude')}
        />
        <span className="hint">Helps rank nearby NGOs. Optional.</span>
        {fieldError('longitude')}
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={NOTES_MAX_LENGTH}
          value={values.notes}
          onChange={(e) => setField('notes', e.target.value)}
          aria-invalid={!!errors.notes}
          aria-describedby={errorId('notes')}
        />
        <span className="hint">
          {values.notes.length}/{NOTES_MAX_LENGTH}
        </span>
        {fieldError('notes')}
      </div>

      <div className="actions">
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>

      {serverError && (
        <p className="error" role="alert">
          {serverError}
        </p>
      )}
    </form>
  );
}
