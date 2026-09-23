import { supabase } from '@/lib/supabase';

import type { Tenant, TenantInput } from './types';

type TenantRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  aadhaar_number: string | null;
  pan_number: string | null;
  permanent_address: string;
  occupants_count: number;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    aadhaarNumber: row.aadhaar_number,
    panNumber: row.pan_number,
    permanentAddress: row.permanent_address,
    occupantsCount: row.occupants_count,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    photoPath: row.photo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

export async function getTenant(id: string): Promise<Tenant> {
  const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
  if (error) throw error;
  return mapTenant(data as TenantRow);
}

export async function createTenant(input: TenantInput): Promise<Tenant> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      user_id: userId,
      name: input.name,
      phone: input.phone,
      aadhaar_number: input.aadhaarNumber ?? null,
      pan_number: input.panNumber ?? null,
      permanent_address: input.permanentAddress,
      occupants_count: input.occupantsCount,
      emergency_contact_name: input.emergencyContactName ?? null,
      emergency_contact_phone: input.emergencyContactPhone ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTenant(data as TenantRow);
}

export async function updateTenant(id: string, input: TenantInput): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .update({
      name: input.name,
      phone: input.phone,
      aadhaar_number: input.aadhaarNumber ?? null,
      pan_number: input.panNumber ?? null,
      permanent_address: input.permanentAddress,
      occupants_count: input.occupantsCount,
      emergency_contact_name: input.emergencyContactName ?? null,
      emergency_contact_phone: input.emergencyContactPhone ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapTenant(data as TenantRow);
}

export async function setTenantPhotoPath(id: string, photoPath: string | null): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .update({ photo_path: photoPath })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapTenant(data as TenantRow);
}
