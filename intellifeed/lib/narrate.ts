import { supabase } from './supabase';

// Asks the edge function to narrate a single article's summary via OpenAI TTS
// and return a playable MP3 URL. The result is cached on the row server-side,
// so repeat calls for the same item are instant.
export async function narrateItem(id: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('narrate-item', {
    body: { id },
  });
  if (error) {
    const message = (error as any)?.context?.message ?? error.message;
    throw new Error(message ?? 'Narration failed.');
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  const url = (data as any)?.audio_url as string | undefined;
  if (!url) throw new Error('Narration returned no audio.');
  return url;
}
