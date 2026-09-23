import { supabase } from '@/lib/supabase';

import type { Bhk, Furnishing, OccupancyStatus, Property, PropertyInput, PropertyType } from './types';

type PropertyRow = {
  id: string;
  user_id: string;
  owner_id: string;
  name: string;
  property_type: string;
  bhk: string;
  area_sqft: number | null;
  furnishing: string;
  address_line1: string;
  locality: string;
  city: string;
  pincode: string;
  state: string;
  occupancy_status: string;
  image_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    userId: row.user_id,
    ownerId: row.owner_id,
    name: row.name,
    propertyType: row.property_type as PropertyType,
    bhk: row.bhk as Bhk,
    areaSqft: row.area_sqft,
    furnishing: row.furnishing as Furnishing,
    addressLine1: row.address_line1,
    locality: row.locality,
    city: row.city,
    pincode: row.pincode,
    state: row.state,
    occupancyStatus: row.occupancy_status as OccupancyStatus,
    imagePath: row.image_path,
    notes: row.notes,
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

export async function listProperties(): Promise<Property[]> {
  const { data, error } = await supabase.from('properties').select('*').order('name');
  if (error) throw error;
  return (data as PropertyRow[]).map(mapProperty);
}

export async function getProperty(id: string): Promise<Property> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
  if (error) throw error;
  return mapProperty(data as PropertyRow);
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('properties')
    .insert({
      user_id: userId,
      owner_id: input.ownerId,
      name: input.name,
      property_type: input.propertyType,
      bhk: input.bhk,
      area_sqft: input.areaSqft ?? null,
      furnishing: input.furnishing,
      address_line1: input.addressLine1,
      locality: input.locality,
      city: input.city,
      pincode: input.pincode,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProperty(data as PropertyRow);
}

export async function updateProperty(id: string, input: PropertyInput): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      owner_id: input.ownerId,
      name: input.name,
      property_type: input.propertyType,
      bhk: input.bhk,
      area_sqft: input.areaSqft ?? null,
      furnishing: input.furnishing,
      address_line1: input.addressLine1,
      locality: input.locality,
      city: input.city,
      pincode: input.pincode,
      notes: input.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProperty(data as PropertyRow);
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function setPropertyOccupancyStatus(id: string, occupancyStatus: OccupancyStatus): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ occupancy_status: occupancyStatus })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProperty(data as PropertyRow);
}

export async function setPropertyImagePath(id: string, imagePath: string | null): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ image_path: imagePath })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProperty(data as PropertyRow);
}
