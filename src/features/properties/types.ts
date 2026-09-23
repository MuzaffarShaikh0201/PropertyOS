export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'independent_house', label: 'Independent house' },
  { value: 'row_house', label: 'Row house' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]['value'];

export const BHK_OPTIONS = [
  { value: '1_rk', label: '1 RK' },
  { value: '1_bhk', label: '1 BHK' },
  { value: '2_bhk', label: '2 BHK' },
  { value: '3_bhk', label: '3 BHK' },
  { value: '4_bhk_plus', label: '4+ BHK' },
  { value: 'other', label: 'Other' },
] as const;

export type Bhk = (typeof BHK_OPTIONS)[number]['value'];

export const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'fully_furnished', label: 'Fully furnished' },
] as const;

export type Furnishing = (typeof FURNISHING_OPTIONS)[number]['value'];

export const OCCUPANCY_STATUSES = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'self_occupied', label: 'Self-occupied' },
  { value: 'rented', label: 'Rented' },
] as const;

export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number]['value'];

export type Property = {
  id: string;
  userId: string;
  ownerId: string;
  name: string;
  propertyType: PropertyType;
  bhk: Bhk;
  areaSqft: number | null;
  furnishing: Furnishing;
  addressLine1: string;
  locality: string;
  city: string;
  pincode: string;
  state: string;
  occupancyStatus: OccupancyStatus;
  /** Path inside the private `property-images` storage bucket, or null for the default placeholder. */
  imagePath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function occupancyStatusLabel(value: string): string {
  return OCCUPANCY_STATUSES.find((option) => option.value === value)?.label ?? value;
}

/** What the form did with the property's photo, resolved by the caller after the property record itself is saved. */
export type PropertyImageChange =
  | { kind: 'unchanged' }
  | { kind: 'upload'; localUri: string; mimeType: string | null }
  | { kind: 'remove' };

export type PropertyInput = {
  ownerId: string;
  name: string;
  propertyType: PropertyType;
  bhk: Bhk;
  areaSqft?: number | null;
  furnishing: Furnishing;
  addressLine1: string;
  locality: string;
  city: string;
  pincode: string;
  notes?: string | null;
};

export function propertyTypeLabel(value: string): string {
  return PROPERTY_TYPES.find((option) => option.value === value)?.label ?? value;
}

export function bhkLabel(value: string): string {
  return BHK_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function furnishingLabel(value: string): string {
  return FURNISHING_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
