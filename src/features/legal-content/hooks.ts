import { useQuery } from '@tanstack/react-query';

import { fetchLatestContent, listContentVersions } from './storage';
import type { LegalConfig, LegalDocumentContent } from './types';

const LEGAL_CONFIG_PREFIX = 'legal-config/maharashtra';
const TERMS_PREFIX = 'terms';
const PRIVACY_PREFIX = 'privacy';

// Static reference content — safe to cache for a while, no need to refetch
// on every screen focus.
const STALE_TIME = 60 * 60 * 1000;

export function useLegalConfig() {
  return useQuery({
    queryKey: ['legal-config', 'maharashtra'],
    queryFn: () => fetchLatestContent<LegalConfig>(LEGAL_CONFIG_PREFIX),
    staleTime: STALE_TIME,
  });
}

export function useLegalConfigVersions() {
  return useQuery({
    queryKey: ['legal-config', 'maharashtra', 'versions'],
    queryFn: () => listContentVersions(LEGAL_CONFIG_PREFIX),
    staleTime: STALE_TIME,
  });
}

export function useTerms() {
  return useQuery({
    queryKey: ['legal-doc', 'terms'],
    queryFn: () => fetchLatestContent<LegalDocumentContent>(TERMS_PREFIX),
    staleTime: STALE_TIME,
  });
}

export function usePrivacy() {
  return useQuery({
    queryKey: ['legal-doc', 'privacy'],
    queryFn: () => fetchLatestContent<LegalDocumentContent>(PRIVACY_PREFIX),
    staleTime: STALE_TIME,
  });
}
