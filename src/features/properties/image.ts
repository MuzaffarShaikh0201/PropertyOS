import { supabase } from '@/lib/supabase';

// Private bucket — every object lives at `<user_id>/<property_id>.<ext>`, and
// storage.objects RLS (see supabase/sql/property_images_storage.sql) only
// lets a user read, write, or delete objects under their own user id. There
// is no public URL for this bucket; reads always go through a short-lived
// signed URL, which itself only succeeds if the requester passes that RLS
// check.
const BUCKET = 'property-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function extensionFor(localUri: string, mimeType?: string | null): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  const match = /\.(\w+)(?:\?.*)?$/.exec(localUri);
  return match ? match[1].toLowerCase() : 'jpg';
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

/** Uploads a locally-picked image for a property, replacing any previous one at that path. */
export async function uploadPropertyImage(
  propertyId: string,
  localUri: string,
  mimeType?: string | null
): Promise<string> {
  const userId = await requireUserId();
  const ext = extensionFor(localUri, mimeType);
  const path = `${userId}/${propertyId}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: mimeType ?? (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`),
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function deletePropertyImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function getPropertyImageSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
