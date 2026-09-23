import { supabase } from '@/lib/supabase';

// Private bucket — every object lives at `<user_id>/<tenant_id>.<ext>`, mirroring
// features/properties/image.ts. No public URL; reads always go through a
// short-lived signed URL.
const BUCKET = 'tenant-photos';
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

export async function uploadTenantPhoto(tenantId: string, localUri: string, mimeType?: string | null): Promise<string> {
  const userId = await requireUserId();
  const ext = extensionFor(localUri, mimeType);
  const path = `${userId}/${tenantId}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: mimeType ?? (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`),
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function getTenantPhotoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
