import { z } from "zod";
export const STATUSES = ["Available", "Claimed", "Completed"];
export const statusSchema = z.enum(STATUSES);
export const ALLOWED_TRANSITIONS = {
    Available: ["Claimed"],
    Claimed: ["Completed", "Available"],
    Completed: [],
};
function isFuture(iso) {
    return Date.parse(iso) > Date.now();
}
const baseFields = {
    foodName: z.string().trim().min(1, "Food name is required"),
    category: z.string().trim().min(1, "Category is required"),
    quantity: z.number().gt(0, "Quantity must be greater than 0"),
    unit: z.string().trim().min(1, "Unit is required"),
    preparedAt: z.string().datetime({ offset: true }).optional(),
    pickupBefore: z
        .string()
        .datetime({ offset: true, message: "Pickup time must be an ISO datetime" })
        .refine(isFuture, "Pickup time must be in the future"),
    storageMethod: z
        .string()
        .trim()
        .min(1, "Storage instructions are required")
        .max(500, "Storage instructions must be 500 characters or fewer"),
    allergens: z.array(z.string().trim()).default([]),
    notes: z.string().max(500).optional(),
    latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90").optional(),
    longitude: z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
        .optional(),
};
function preparedBeforePickup(v) {
    if (!v.preparedAt || !v.pickupBefore) {
        return true;
    }
    return Date.parse(v.preparedAt) < Date.parse(v.pickupBefore);
}
// Latitude and longitude must be supplied together or both omitted.
function coordinatesPaired(v) {
    return (v.latitude === undefined) === (v.longitude === undefined);
}
const orderMessage = { message: "preparedAt must be before pickupBefore", path: ["preparedAt"] };
const coordinatesMessage = { message: "latitude and longitude must be provided together", path: ["latitude"] };
export const foodListingInput = z
    .object(baseFields)
    .refine(preparedBeforePickup, orderMessage)
    .refine(coordinatesPaired, coordinatesMessage);
export const foodListingUpdate = z
    .object(baseFields)
    .partial()
    .extend({ status: statusSchema.optional() })
    .refine(preparedBeforePickup, orderMessage)
    .refine(coordinatesPaired, coordinatesMessage);
