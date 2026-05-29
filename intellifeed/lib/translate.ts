import { supabase } from './supabase';

export type Translation = {
  title_he: string;
  hook_he: string | null;
  summary_he: string;
};

export async function translateItem(id: string): Promise<Translation> {
  const { data, error } = await supabase.functions.invoke('translate-item', {
    body: { id },
  });
  if (error) {
    const message = (error as any)?.context?.message ?? error.message;
    throw new Error(message ?? 'Translation failed.');
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as Translation;
}
