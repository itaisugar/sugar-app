import { supabase } from './supabase';
import { cropAvatar } from './avatarCrop';

// Web-only project: pick a file via the browser's native file dialog. No native
// image-picker dependency needed (and supabase-js uploads a File/Blob directly
// on web, so no base64 conversion either).
//
// Robustness notes (this is what kept the avatar "stuck on loading"):
//  - The input is appended to the DOM. Detached inputs can be garbage-collected
//    on some mobile browsers before `change` fires, losing the selection.
//  - Cancellation is handled. If the user backs out of the picker, the `change`
//    event never fires; without this the caller's promise would hang forever and
//    the upload spinner would spin indefinitely. We resolve null on the `cancel`
//    event and via a window-focus fallback for browsers that don't emit it.
function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.left = '-10000px';
    input.style.opacity = '0';

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(file);
    };

    const onFocus = () => {
      // The window regains focus when the native dialog closes. Give `change` a
      // beat to fire; if no file arrived, treat it as a cancel so we don't hang.
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 1500);
    };

    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
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

// Open the file dialog, let the user crop a circle out of the chosen photo, then
// upload it and return the new public avatar URL. Returns null if the user
// cancels at either the picker or the crop step.
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const file = await pickImageFile();
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  // Crop + re-encode to a normalized 512x512 JPEG. Besides letting the user pick
  // the exact circle, this is what makes phone photos work — HEIC/oversized
  // camera files are converted into a clean JPEG the browser and CDN can render.
  const cropped = await cropAvatar(file);
  if (!cropped) return null;
  return uploadAvatar(userId, cropped);
}
