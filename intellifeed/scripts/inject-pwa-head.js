// Post-export step: inject the home-screen / PWA <head> tags into the built
// dist/index.html. Expo's `output: "single"` mode ignores app/+html.tsx (that
// file only applies to static rendering), so this is the reliable place to add
// the apple-touch-icon, web manifest and apple-* meta tags. Runs after
// `expo export` (see vercel.json buildCommand) and is idempotent.
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'dist', 'index.html');

const TAGS = [
  '<link rel="icon" href="/icons/icon-192.png" type="image/png" />',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Sapience" />',
  '<meta name="theme-color" content="#0A090B" />',
].join('\n    ');

let html = fs.readFileSync(file, 'utf8');

if (html.includes('apple-touch-icon')) {
  console.log('inject-pwa-head: tags already present, skipping');
} else if (!html.includes('</head>')) {
  console.error('inject-pwa-head: no </head> found in dist/index.html');
  process.exit(1);
} else {
  html = html.replace('</head>', `    ${TAGS}\n  </head>`);
  fs.writeFileSync(file, html);
  console.log('inject-pwa-head: injected home-screen/PWA tags');
}
