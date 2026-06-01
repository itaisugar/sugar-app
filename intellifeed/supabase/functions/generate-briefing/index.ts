// Supabase Edge Function: generate-briefing
//
// Takes 3 content_item IDs, builds a short editorial briefing script
// (intro + each headline+hook + outro), narrates it via OpenAI TTS, uploads
// the MP3 to Supabase Storage, and returns { audio_url, title, script }.
//
// Auth: any signed-in user (no admin flag required).

// @ts-ignore — Deno globals
declare const Deno: { env: { get(key: string): string | undefined } };

const OPENAI_API_KEY            = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUMMARIES_BUCKET          = 'summaries';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type Item = {
  id: string;
  title: string;
  hook: string | null;
  summary: string;
  source: string;
  category: string;
};

async function fetchItems(ids: string[]): Promise<Item[]> {
  if (ids.length === 0) return [];
  const list = ids.map(id => `"${id}"`).join(',');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/content_items?id=in.(${list})&select=id,title,hook,summary,source,category`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!res.ok) return [];
  const rows = await res.json() as Item[];
  // Preserve caller-provided order
  return ids.map(id => rows.find(r => r.id === id)).filter(Boolean) as Item[];
}

function ordinal(i: number): string {
  return ['First', 'Second', 'Third', 'Fourth', 'Fifth'][i] ?? `Number ${i + 1}`;
}

function buildScript(items: Item[]): string {
  const intro =
    "Welcome to your Sapience briefing. Three pieces, distilled — chosen for the depth and clarity they bring to today's reading.";

  const body = items.map((it, i) => {
    const headline = it.title.replace(/\s+—\s*/g, ', ');
    const dek = (it.hook ?? it.summary)
      .replace(/\s+/g, ' ')
      .trim();
    return `${ordinal(i)}, from ${it.source}, on ${it.category}. ${headline}. ${dek}`;
  }).join('\n\n');

  const outro =
    "That concludes today's briefing. The full pieces, and more like them, await in your feed.";

  return [intro, body, outro].join('\n\n');
}

async function tts(text: string): Promise<ArrayBuffer | null> {
  const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'onyx',
      input: text.slice(0, 4000),
      response_format: 'mp3',
      speed: 0.95,
    }),
  });
  if (!ttsRes.ok) return null;
  return await ttsRes.arrayBuffer();
}

async function upload(bytes: ArrayBuffer): Promise<string | null> {
  const filename = `briefing-${crypto.randomUUID()}.mp3`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUMMARIES_BUCKET}/${filename}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/mpeg',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'x-upsert': 'true',
      },
      body: bytes,
    },
  );
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUMMARIES_BUCKET}/${filename}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured. Set it via supabase secrets.' }, 500);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server missing Supabase credentials.' }, 500);

  let body: { ids?: string[] };
  try { body = await req.json(); } catch { return json({ error: 'Body must be JSON.' }, 400); }
  const ids = (body.ids ?? []).filter(Boolean).slice(0, 3);
  if (ids.length < 1) return json({ error: 'Provide 1-3 content_item ids.' }, 400);

  const items = await fetchItems(ids);
  if (items.length === 0) return json({ error: 'No items found for those ids.' }, 404);

  const script = buildScript(items);

  const audioBytes = await tts(script);
  if (!audioBytes) return json({ error: 'TTS generation failed (check OPENAI_API_KEY).' }, 502);

  const audioUrl = await upload(audioBytes);
  if (!audioUrl) return json({ error: 'Audio upload failed.' }, 502);

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const title = `Sapience Briefing — ${date}`;

  return json({
    audio_url: audioUrl,
    title,
    script,
    items: items.map(i => ({ id: i.id, title: i.title })),
  });
});
