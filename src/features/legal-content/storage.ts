import { supabase } from '@/lib/supabase';

// Public, versioned legal content lives in Supabase Storage, not in the
// codebase. Every read here fetches one exact, known path via the bucket's
// public URL — never lists a folder's contents. Listing would need a
// storage.objects SELECT policy broad enough to also permit enumerating the
// bucket (Postgres RLS can't tell "fetch this known file" apart from "list
// everything matching this prefix" — they're both just a SELECT). Fetching
// known paths through the public URL bypasses RLS entirely for a public
// bucket, so no policy is needed at all. See supabase/sql/legal_docs_storage.sql.
const BUCKET = 'legal-docs';

type Manifest = {
  /** The version (dated filename, without extension) currently in effect. */
  current: string;
  /** Full history, oldest first — used only to render a changelog. */
  versions: string[];
};

async function fetchJson<T>(path: string): Promise<T> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const response = await fetch(data.publicUrl);
  if (!response.ok) {
    throw new Error(`Could not load "${path}" from Supabase Storage (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

async function fetchManifest(prefix: string): Promise<Manifest> {
  return fetchJson<Manifest>(`${prefix}/manifest.json`);
}

export async function fetchContentVersion<T>(prefix: string, version: string): Promise<T> {
  return fetchJson<T>(`${prefix}/${version}.json`);
}

export async function fetchLatestContent<T>(prefix: string): Promise<T> {
  const manifest = await fetchManifest(prefix);
  return fetchContentVersion<T>(prefix, manifest.current);
}

/** Full version history for a changelog — read from the manifest, not a live listing. */
export async function listContentVersions(prefix: string): Promise<string[]> {
  const manifest = await fetchManifest(prefix);
  return manifest.versions;
}
