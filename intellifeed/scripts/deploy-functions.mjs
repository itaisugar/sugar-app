// Deploy the Supabase Edge Functions involved in Hebrew translation.
// One-time auth first: `npx supabase login`.
//
//   npm run deploy:functions
//
// Project ref is read from EXPO_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co)
// in intellifeed/.env, or from SUPABASE_PROJECT_REF.
import { spawnSync } from 'node:child_process';
import { loadEnv, refFromUrl } from './_loadEnv.mjs';

const env = loadEnv();
const ref = env.SUPABASE_PROJECT_REF || refFromUrl(env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '');
if (!ref) {
  console.error('Could not determine the project ref.');
  console.error('Set EXPO_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co) in intellifeed/.env, or SUPABASE_PROJECT_REF.');
  process.exit(1);
}

// translate-item keeps JWT verification (it reads the row with the caller's
// token); the others authenticate themselves with X-Curator-Secret.
const fns = ['translate-item', 'curate-daily', 'backfill-translations'];
console.log(`Deploying ${fns.length} function(s) to project ${ref} …`);

for (const fn of fns) {
  console.log(`\n→ ${fn}`);
  const r = spawnSync('npx', ['supabase', 'functions', 'deploy', fn, '--project-ref', ref], {
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    console.error(`\nDeploy failed for ${fn}.`);
    console.error('If you are not logged in, run:  npx supabase login');
    process.exit(r.status || 1);
  }
}

console.log('\nAll functions deployed. Next: npm run backfill-he');
