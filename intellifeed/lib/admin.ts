import { supabase } from './supabase';

export type AISummary = {
  title: string;
  summary: string;
  source: string;
  category: string;
  category_color: string;
  read_time: number;
  image_url: string;
  content_url: string;
  tags: string[];
};

export async function summarizeUrl(url: string): Promise<AISummary> {
  const { data, error } = await supabase.functions.invoke('summarize-url', {
    body: { url },
  });
  if (error) {
    // Supabase's FunctionInvokeError wraps the underlying response; surface its message
    const message = (error as any)?.context?.message ?? error.message;
    throw new Error(message ?? 'Summarization failed.');
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as AISummary;
}

export type NewContentItem = {
  title: string;
  summary: string;
  source: string;
  source_avatar?: string;
  category: string;
  category_color: string;
  read_time: number;
  image_url: string;
  content_url: string;
  content_source?: 'curated' | 'featured' | 'community';
  content_type?: 'article' | 'podcast' | 'research' | 'book' | 'insight';
  tags: string[];
};

export async function createContentItem(item: NewContentItem) {
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      title: item.title,
      summary: item.summary,
      source: item.source,
      source_avatar: item.source_avatar ?? '◆',
      category: item.category,
      category_color: item.category_color,
      read_time: item.read_time,
      image_url: item.image_url,
      content_url: item.content_url,
      content_source: item.content_source ?? 'curated',
      content_type: item.content_type ?? 'article',
      tags: item.tags,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
