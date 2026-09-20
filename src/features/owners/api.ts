import { supabase } from '@/lib/supabase';

import type { Owner, OwnerInput } from './types';

type OwnerRow = {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  created_at: string;
  updated_at: string;
};

function mapOwner(row: OwnerRow): Owner {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relation: row.relation,
    phone: row.phone,
    email: row.email,
    aadhaarNumber: row.aadhaar_number,
    panNumber: row.pan_number,
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

export async function listOwners(): Promise<Owner[]> {
  const { data, error } = await supabase.from('owners').select('*').order('name');
  if (error) throw error;
  return (data as OwnerRow[]).map(mapOwner);
}

export async function getOwner(id: string): Promise<Owner> {
  const { data, error } = await supabase.from('owners').select('*').eq('id', id).single();
  if (error) throw error;
  return mapOwner(data as OwnerRow);
}

export async function createOwner(input: OwnerInput): Promise<Owner> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('owners')
    .insert({
      user_id: userId,
      name: input.name,
      relation: input.relation,
      phone: input.phone,
      email: input.email ?? null,
      aadhaar_number: input.aadhaarNumber ?? null,
      pan_number: input.panNumber ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapOwner(data as OwnerRow);
}

export async function updateOwner(id: string, input: OwnerInput): Promise<Owner> {
  const { data, error } = await supabase
    .from('owners')
    .update({
      name: input.name,
      relation: input.relation,
      phone: input.phone,
      email: input.email ?? null,
      aadhaar_number: input.aadhaarNumber ?? null,
      pan_number: input.panNumber ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapOwner(data as OwnerRow);
}

export async function deleteOwner(id: string): Promise<void> {
  const { error } = await supabase.from('owners').delete().eq('id', id);
  if (error) throw error;
}
