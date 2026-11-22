export interface FoodFormValues {
  foodName: string;
  category: string;
  quantity: string;
  unit: string;
  preparedAt: string;
  pickupBefore: string;
  pickupAddress: string;
  storageMethod: string;
  allergens: string[];
  notes: string;
  latitude?: string;
  longitude?: string;
}

export const NOTES_MAX_LENGTH = 500;
export const STORAGE_MAX_LENGTH = 500;

/**
 * Pure validation for the donor form. Returns a map of field name -> error message.
 * An empty object means the values are valid.
 */
export function validateFoodListing(
  values: FoodFormValues,
  now: Date = new Date(),
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.foodName.trim()) {
    errors.foodName = 'Food name is required.';
  }

  const quantity = values.quantity.trim() === '' ? NaN : Number(values.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be a number greater than 0.';
  }

  if (!values.category) {
    errors.category = 'Category is required.';
  }

  if (!values.unit) {
    errors.unit = 'Unit is required.';
  }

  if (!values.storageMethod.trim()) {
    errors.storageMethod = 'Storage instructions are required.';
  } else if (values.storageMethod.length > STORAGE_MAX_LENGTH) {
    errors.storageMethod = `Storage instructions must be ${STORAGE_MAX_LENGTH} characters or fewer.`;
  }

  let pickupTime = NaN;
  if (!values.pickupBefore) {
    errors.pickupBefore = 'Pickup time is required.';
  } else {
    pickupTime = new Date(values.pickupBefore).getTime();
    if (Number.isNaN(pickupTime)) {
      errors.pickupBefore = 'Pickup time must be a valid date and time.';
    } else if (pickupTime <= now.getTime()) {
      errors.pickupBefore = 'Pickup time must be in the future.';
    }
  }

  if (values.preparedAt) {
    const preparedTime = new Date(values.preparedAt).getTime();
    if (Number.isNaN(preparedTime)) {
      errors.preparedAt = 'Prepared time must be a valid date and time.';
    } else if (!errors.pickupBefore && preparedTime >= pickupTime) {
      errors.preparedAt = 'Prepared time must be before the pickup time.';
    }
  }

  if (values.notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  const latText = (values.latitude ?? '').trim();
  const lngText = (values.longitude ?? '').trim();
  const hasLat = latText !== '';
  const hasLng = lngText !== '';
  if (hasLat !== hasLng) {
    const message = 'Enter both latitude and longitude, or leave both empty.';
    if (hasLat) errors.longitude = message;
    else errors.latitude = message;
  } else if (hasLat) {
    const latitude = Number(latText);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = 'Latitude must be a number between -90 and 90.';
    }
    const longitude = Number(lngText);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = 'Longitude must be a number between -180 and 180.';
    }
  }

  return errors;
}
