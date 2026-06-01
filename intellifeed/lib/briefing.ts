import { supabase } from './supabase';

export type Briefing = {
  audio_url: string;
  title: string;
  script: string;
  items: { id: string; title: string }[];
};

export async function generateBriefing(ids: string[]): Promise<Briefing> {
  const { data, error } = await supabase.functions.invoke('generate-briefing', {
    body: { ids: ids.slice(0, 3) },
  });
  if (error) {
    const message = (error as any)?.context?.message ?? error.message;
    throw new Error(message ?? 'Briefing generation failed.');
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as Briefing;
}
