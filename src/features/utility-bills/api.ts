import { supabase } from '@/lib/supabase';

import type { BillStatus, BillType, ResponsibleParty, UtilityBill, UtilityBillInput } from './types';

type UtilityBillRow = {
  id: string;
  user_id: string;
  property_id: string;
  agreement_id: string | null;
  bill_type: string;
  responsible_party: string;
  bill_date: string;
  due_date: string;
  amount: number;
  status: string;
  amount_paid: number | null;
  paid_at: string | null;
  proof_document_path: string | null;
  created_at: string;
  updated_at: string;
};

function mapBill(row: UtilityBillRow): UtilityBill {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id,
    agreementId: row.agreement_id,
    billType: row.bill_type as BillType,
    responsibleParty: row.responsible_party as ResponsibleParty,
    billDate: row.bill_date,
    dueDate: row.due_date,
    amount: row.amount,
    status: row.status as BillStatus,
    amountPaid: row.amount_paid,
    paidAt: row.paid_at,
    proofDocumentPath: row.proof_document_path,
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

export async function listUtilityBills(propertyId?: string): Promise<UtilityBill[]> {
  let query = supabase.from('utility_bills').select('*').order('due_date', { ascending: false });
  if (propertyId) query = query.eq('property_id', propertyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as UtilityBillRow[]).map(mapBill);
}

export async function getUtilityBill(id: string): Promise<UtilityBill> {
  const { data, error } = await supabase.from('utility_bills').select('*').eq('id', id).single();
  if (error) throw error;
  return mapBill(data as UtilityBillRow);
}

function rowFromInput(input: UtilityBillInput) {
  return {
    property_id: input.propertyId,
    agreement_id: input.agreementId,
    bill_type: input.billType,
    responsible_party: input.responsibleParty,
    bill_date: input.billDate,
    due_date: input.dueDate,
    amount: input.amount,
    status: input.status,
    amount_paid: input.amountPaid,
    paid_at: input.paidAt,
  };
}

export async function createUtilityBill(input: UtilityBillInput): Promise<UtilityBill> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('utility_bills')
    .insert({ user_id: userId, ...rowFromInput(input) })
    .select()
    .single();
  if (error) throw error;
  return mapBill(data as UtilityBillRow);
}

export async function updateUtilityBill(id: string, input: UtilityBillInput): Promise<UtilityBill> {
  const { data, error } = await supabase
    .from('utility_bills')
    .update(rowFromInput(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapBill(data as UtilityBillRow);
}

export async function setUtilityBillProofPath(id: string, proofDocumentPath: string | null): Promise<UtilityBill> {
  const { data, error } = await supabase
    .from('utility_bills')
    .update({ proof_document_path: proofDocumentPath })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapBill(data as UtilityBillRow);
}

export async function deleteUtilityBill(id: string): Promise<void> {
  const { error } = await supabase.from('utility_bills').delete().eq('id', id);
  if (error) throw error;
}
