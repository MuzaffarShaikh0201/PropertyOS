import { supabase } from '@/lib/supabase';

// Private bucket — every object lives at `<user_id>/<utility_bill_id>.<ext>`,
// mirroring features/properties/image.ts. No public URL; reads always go
// through a short-lived signed URL. Proofs can be PDFs, Word docs or images,
// same acceptance list as agreement documents.
const BUCKET = 'utility-bill-proofs';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  webp: 'image/webp',
};

function extensionFor(localUri: string, mimeType?: string | null): string {
  if (mimeType && EXTENSION_BY_MIME_TYPE[mimeType]) return EXTENSION_BY_MIME_TYPE[mimeType];
  const match = /\.(\w+)(?:\?.*)?$/.exec(localUri);
  return match ? match[1].toLowerCase() : 'jpg';
}

function contentTypeFor(ext: string, mimeType?: string | null): string {
  return mimeType ?? CONTENT_TYPE_BY_EXTENSION[ext] ?? 'image/jpeg';
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

export async function uploadUtilityBillProof(
  billId: string,
  localUri: string,
  mimeType?: string | null
): Promise<string> {
  const userId = await requireUserId();
  const ext = extensionFor(localUri, mimeType);
  const path = `${userId}/${billId}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: contentTypeFor(ext, mimeType),
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function getUtilityBillProofSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
