import { supabase } from './supabase';

// Web-only project: pick a file via the browser's native file dialog. No native
// image-picker dependency needed (and supabase-js uploads a File/Blob directly
// on web, so no base64 conversion either).
function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

// Upload an image File to the public `avatars` bucket under the user's own
// folder (avatars/<uid>/avatar.<ext>) and return a cache-busted public URL.
// The path is stable per user, so re-uploads overwrite the previous photo.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Append a version so the new image shows immediately (defeats CDN/image cache).
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Open the file dialog, upload the chosen image, and return the new public
// avatar URL. Returns null if the user cancels without choosing a file.
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const file = await pickImageFile();
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  return uploadAvatar(userId, file);
}
