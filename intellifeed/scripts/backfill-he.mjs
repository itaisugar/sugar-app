// Re-generate high-quality Hebrew for existing content_items, batch by batch,
// by driving the `backfill-translations` Edge Function until it's done.
//
//   npm run backfill-he            # mode=all  — upgrade EVERY row's Hebrew
//   npm run backfill-he -- --missing   # only rows with no Hebrew yet
//   npm run backfill-he -- --limit=10  # smaller batches
//
// Reads EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY and
// CURATOR_SECRET from intellifeed/.env (CURATOR_SECRET is the same secret set
// on the Supabase functions; add it to .env or pass it inline).
import { loadEnv } from './_loadEnv.mjs';

const env = loadEnv();
const supaUrl = env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const secret = env.CURATOR_SECRET;

const missing = [];
if (!supaUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
if (!anon) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
if (!secret) missing.push('CURATOR_SECRET');
if (missing.length) {
  console.error(`Missing required value(s): ${missing.join(', ')}`);
  console.error('Add them to intellifeed/.env (CURATOR_SECRET is the secret set on the Supabase functions).');
  process.exit(1);
}

const mode = process.argv.includes('--missing') ? 'missing' : 'all';
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Math.min(50, parseInt(limitArg.split('=')[1], 10) || 20)) : 20;
const endpoint = `${supaUrl.replace(/\/$/, '')}/functions/v1/backfill-translations`;

let before;
let total = 0;
let batch = 0;
console.log(`Backfilling Hebrew (mode=${mode}, limit=${limit}) …`);

while (true) {
  const body = { mode, limit, ...(before ? { before } : {}) };
  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'X-Curator-Secret': secret,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error('Network error:', e.message);
    process.exit(1);
  }

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`Bad response (${resp.status}):`, text.slice(0, 300));
    process.exit(1);
  }
  if (!resp.ok || data.error) {
    console.error(`Error (${resp.status}):`, data.error || text.slice(0, 300));
    if (resp.status === 401) {
      console.error('Hint: verify CURATOR_SECRET, or redeploy with:');
      console.error('  npx supabase functions deploy backfill-translations --no-verify-jwt');
    }
    process.exit(1);
  }

  batch++;
  total += data.processed ?? 0;
  console.log(`  batch ${batch}: +${data.processed}/${data.attempted}  (total ${total})`);
  if (!data.nextBefore) break;
  before = data.nextBefore;
}

console.log(`\nDone. Re-translated ${total} item(s).`);
