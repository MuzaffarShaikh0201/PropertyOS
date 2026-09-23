import { supabase } from '@/lib/supabase';

import type {
  Agreement,
  AgreementDocuments,
  AgreementInput,
  AgreementStatus,
  EscalationFrequency,
  GiveNoticeInput,
  NoticeRaisedBy,
} from './types';

type AgreementRow = {
  id: string;
  user_id: string;
  property_id: string;
  tenant_id: string;
  status: string;
  start_date: string;
  end_date: string;
  lock_in_months: number | null;
  notice_period_days: number;
  monthly_rent: number;
  security_deposit: number;
  escalation_percent: number | null;
  escalation_frequency: string | null;
  auto_renewal: boolean;
  witness1_name: string | null;
  witness1_phone: string | null;
  witness2_name: string | null;
  witness2_phone: string | null;
  police_verification_done: boolean;
  legal_config_version: string;
  legal_config_snapshot: Agreement['legalConfigSnapshot'];
  stamp_duty_estimate: number | null;
  registered_at: string | null;
  notice_raised_by: string | null;
  notice_date: string | null;
  expected_vacate_date: string | null;
  notice_note: string | null;
  previous_agreement_id: string | null;
  documents: AgreementDocuments;
  created_at: string;
  updated_at: string;
};

function mapAgreement(row: AgreementRow): Agreement {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id,
    tenantId: row.tenant_id,
    status: row.status as AgreementStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    lockInMonths: row.lock_in_months,
    noticePeriodDays: row.notice_period_days,
    monthlyRent: row.monthly_rent,
    securityDeposit: row.security_deposit,
    escalationPercent: row.escalation_percent,
    escalationFrequency: row.escalation_frequency as EscalationFrequency | null,
    autoRenewal: row.auto_renewal,
    witness1Name: row.witness1_name,
    witness1Phone: row.witness1_phone,
    witness2Name: row.witness2_name,
    witness2Phone: row.witness2_phone,
    policeVerificationDone: row.police_verification_done,
    legalConfigVersion: row.legal_config_version,
    legalConfigSnapshot: row.legal_config_snapshot,
    stampDutyEstimate: row.stamp_duty_estimate,
    registeredAt: row.registered_at,
    noticeRaisedBy: row.notice_raised_by as NoticeRaisedBy | null,
    noticeDate: row.notice_date,
    expectedVacateDate: row.expected_vacate_date,
    noticeNote: row.notice_note,
    previousAgreementId: row.previous_agreement_id,
    documents: row.documents ?? {},
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

export async function getAgreement(id: string): Promise<Agreement> {
  const { data, error } = await supabase.from('agreements').select('*').eq('id', id).single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

/** Most recent agreement on a property — a good proxy for "the current one," since a renewal always inserts a fresh, newer row rather than editing the old one. */
export async function getLatestAgreementForProperty(propertyId: string): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAgreement(data as AgreementRow) : null;
}

/** Every not-yet-registered agreement across the account — the Dashboard's compliance-deadline candidates. Terminal (ended/renewed) rows are excluded at the DB level since they can never need registering. */
export async function listUnregisteredAgreements(): Promise<Agreement[]> {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .is('registered_at', null)
    .in('status', ['active', 'on_notice'])
    .order('start_date');
  if (error) throw error;
  return (data as AgreementRow[]).map(mapAgreement);
}

/** The agreement that superseded this one, if it's been renewed — looked up by the new row's `previous_agreement_id`, never stored on the old row itself. */
export async function getRenewedIntoAgreement(agreementId: string): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('previous_agreement_id', agreementId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAgreement(data as AgreementRow) : null;
}

export async function createAgreement(input: AgreementInput): Promise<Agreement> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('agreements')
    .insert({
      user_id: userId,
      property_id: input.propertyId,
      tenant_id: input.tenantId,
      start_date: input.startDate,
      end_date: input.endDate,
      lock_in_months: input.lockInMonths,
      notice_period_days: input.noticePeriodDays,
      monthly_rent: input.monthlyRent,
      security_deposit: input.securityDeposit,
      escalation_percent: input.escalationPercent,
      escalation_frequency: input.escalationFrequency,
      auto_renewal: input.autoRenewal,
      witness1_name: input.witness1Name,
      witness1_phone: input.witness1Phone,
      witness2_name: input.witness2Name,
      witness2_phone: input.witness2Phone,
      police_verification_done: input.policeVerificationDone,
      legal_config_version: input.legalConfigVersion,
      legal_config_snapshot: input.legalConfigSnapshot,
      stamp_duty_estimate: input.stampDutyEstimate,
      previous_agreement_id: input.previousAgreementId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

export async function updateAgreementDocuments(id: string, documents: AgreementDocuments): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ documents })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

export async function markAgreementRegistered(id: string): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ registered_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

export async function giveNotice(id: string, input: GiveNoticeInput): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({
      status: 'on_notice',
      notice_raised_by: input.raisedBy,
      notice_date: input.noticeDate,
      expected_vacate_date: input.expectedVacateDate,
      notice_note: input.note,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

export async function withdrawNotice(id: string): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({
      status: 'active',
      notice_raised_by: null,
      notice_date: null,
      expected_vacate_date: null,
      notice_note: null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

/** Explicitly ends the agreement — from "Mark vacated" (On Notice) or "Mark property vacant" (Ended). Does not touch the property's occupancy; the caller (see hooks.ts) also does that in the same action. */
export async function markAgreementEnded(id: string): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ status: 'ended' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}

export async function deleteAgreement(id: string): Promise<void> {
  const { error } = await supabase.from('agreements').delete().eq('id', id);
  if (error) throw error;
}

export async function markAgreementRenewed(id: string): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ status: 'renewed' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAgreement(data as AgreementRow);
}
