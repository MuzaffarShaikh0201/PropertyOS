export type Tenant = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  aadhaarNumber: string | null;
  panNumber: string | null;
  permanentAddress: string;
  occupantsCount: number;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  /** Path inside the private `tenant-photos` storage bucket, or null — photo capture is optional. */
  photoPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantInput = {
  name: string;
  phone: string;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  permanentAddress: string;
  occupantsCount: number;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

/** What the form did with the tenant's photo, resolved by the caller after the tenant record itself is saved. */
export type TenantPhotoChange = { kind: 'unchanged' } | { kind: 'upload'; localUri: string; mimeType: string | null };
